

// @ts-nocheck

import { ContractAnalysisResult, BillAnalysisResult, PamAnalysisResult } from '../types';

// Add TypeScript declarations for the jsPDF libraries loaded from CDN
declare global {
  interface Window {
    jspdf: any;
  }
}

// --- PDF GENERATION ENGINE USING JSPDF + AUTOTABLE ---

const createPdf = (options = {}) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape', // Cambiado a horizontal para que quepan todas las columnas del contrato
    unit: 'px',
    format: 'letter',
    ...options,
  });
  return doc;
};

// Helper function to sanitize text for PDF
const cleanTextForPdf = (text) => {
    if (!text) return '';
    return text.toString()
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/`/g, '')    // Remove code blocks
        .replace(/#/g, '')    // Remove header hashes
        .replace(/\[|\]/g, '') // Remove brackets
        .replace(/_/g, '')    // Remove underscores
        .trim();
};

const addHeader = (doc, title, subtitle) => {
  doc.setFontSize(18);
  doc.setTextColor('#1B263B');
  doc.text(cleanTextForPdf(title), 30, 40);
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor('#415A77');
    doc.text(cleanTextForPdf(subtitle), 30, 55);
  }
  return doc.autoTable.previous.finalY || 65;
};

const addSectionTitle = (doc, title, y) => {
    doc.setFontSize(14);
    doc.setTextColor('#0D1B2A');
    doc.text(cleanTextForPdf(title), 30, y);
    return y + 15;
};

const addFooterToAllPages = (doc, timestamp) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(timestamp, 30, pageHeight - 15);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, pageHeight - 15, { align: 'right' });
    }
};

const defaultTableStyles = {
    styles: {
        fontSize: 7, // Fuente más pequeña para que quepa todo
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle'
    },
    headStyles: {
        fillColor: '#1B263B',
        textColor: '#E0E1DD',
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
    },
    alternateRowStyles: {
        fillColor: '#f8fafc'
    },
    margin: { bottom: 30, left: 20, right: 20 }, 
};

// --- EXPORTED GENERATOR FUNCTIONS ---

export const generateContractPdf = (result: ContractAnalysisResult, filename: string) => {
    const doc = createPdf(); // Landscape mode
    const timestamp = `Generado el: ${new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })}`;
    let y = addHeader(doc, result.diseno_ux.titulo_plan, result.diseno_ux.nombre_isapre);

    // Reglas Table
    if (result.reglas && result.reglas.length > 0) {
        y = addSectionTitle(doc, 'Análisis Forense de Reglas', y + 10);
        doc.autoTable({
            startY: y,
            head: [['Página', 'Sección', 'Subcategoría', 'Extracto']],
            body: result.reglas.map(r => [
                cleanTextForPdf(r['PÁGINA ORIGEN']),
                cleanTextForPdf(r['CÓDIGO/SECCIÓN']),
                cleanTextForPdf(r['SUBCATEGORÍA']),
                cleanTextForPdf(r['VALOR EXTRACTO LITERAL DETALLADO'])
            ]),
            ...defaultTableStyles,
            columnStyles: { 
                0: { cellWidth: 30 },
                1: { cellWidth: 50 },
                2: { cellWidth: 80 },
                3: { cellWidth: 'auto' } 
            }
        });
        y = doc.autoTable.previous.finalY;
    }

    // Coberturas Table - SINCRONIZADA CON LA UI WEB
    if (result.coberturas && result.coberturas.length > 0) {
        doc.addPage(); // Nueva página para la tabla grande
        y = 40;
        y = addSectionTitle(doc, 'Clarificación de Cobertura (Análisis Imperativo)', y);
        
        doc.autoTable({
            startY: y,
            head: [
                ['Prestación Clave', 'Modalidad', '% Bonif.', 'Copago Fijo', 'Tope Local 1', 'Tope Local 2', 'Restricciones']
            ],
            body: result.coberturas.map(c => [
                cleanTextForPdf(c['PRESTACIÓN CLAVE']),
                cleanTextForPdf(c['MODALIDAD/RED']),
                cleanTextForPdf(c['% BONIFICACIÓN']),
                cleanTextForPdf(c['COPAGO FIJO']),
                cleanTextForPdf(c['TOPE LOCAL 1 (VAM/EVENTO)']),
                cleanTextForPdf(c['TOPE LOCAL 2 (ANUAL/UF)']),
                cleanTextForPdf(c['RESTRICCIÓN Y CONDICIONAMIENTO'])
            ]),
            ...defaultTableStyles,
            styles: { fontSize: 7, cellPadding: 2 },
            columnStyles: { 
                0: { cellWidth: 80, fontStyle: 'bold' }, // Prestación
                1: { cellWidth: 40, halign: 'center' }, // Modalidad
                2: { cellWidth: 30, halign: 'center' }, // % Bonif
                3: { cellWidth: 30, halign: 'center' }, // Copago Fijo
                4: { cellWidth: 50, halign: 'center' }, // Tope 1
                5: { cellWidth: 50, halign: 'center' }, // Tope 2
                6: { cellWidth: 'auto' } // Restricciones
            }
        });
    }

    addFooterToAllPages(doc, timestamp);
    doc.save(filename);
};

export const generateBillPdf = (result: BillAnalysisResult, filename: string) => {
    // Usar Landscape para tener más espacio horizontal (cuentas tienen muchas columnas)
    const docBill = createPdf({ orientation: 'landscape' });

    const timestamp = `Generado el: ${new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })}`;
    let y = addHeader(docBill, 'Resumen de la Cuenta', result.encabezado?.empresaEmisora);

    // Encabezado Details
    const headerDetails = [
        { label: 'Paciente', value: result.encabezado?.paciente },
        { label: 'RUT Paciente', value: result.encabezado?.rutPaciente },
        { label: 'Titular', value: result.encabezado?.titular },
        { label: 'RUT Titular', value: result.encabezado?.rutTitular },
    ].filter(d => d.value);
    
    docBill.autoTable({
        startY: y,
        body: headerDetails.map(d => [d.label, cleanTextForPdf(d.value)]),
        theme: 'plain',
        styles: { fontSize: 9 }
    });
    y = docBill.autoTable.previous.finalY;
    
    // Secciones
    result.secciones?.forEach(seccion => {
        y = addSectionTitle(docBill, seccion.titulo, y + 15);
        
        // Check page break manually if close to bottom
        const pageHeight = docBill.internal.pageSize.getHeight();
        if (y > pageHeight - 40) {
            docBill.addPage();
            y = 40;
            y = addSectionTitle(docBill, seccion.titulo, y);
        }

        docBill.autoTable({
            startY: y,
            head: [seccion.headers.map(cleanTextForPdf)],
            body: seccion.items.map(row => row.map(cleanTextForPdf)),
            ...defaultTableStyles,
            styles: { 
                fontSize: 5.5, // Fuente MUY pequeña para asegurar que todos los dígitos quepan
                cellPadding: 1.5, // Padding reducido
                valign: 'middle',
                overflow: 'linebreak'
            },
            theme: 'grid', // Grid ayuda a leer filas densas
        });
        y = docBill.autoTable.previous.finalY;
    });

    addFooterToAllPages(docBill, timestamp);
    docBill.save(filename);
};

export const generatePamPdf = (result: PamAnalysisResult[], filename: string) => {
    const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'px', format: 'letter' });
    const timestamp = `Generado el: ${new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })}`;
    let y = 30;

    result.forEach((pam, index) => {
        if (index > 0) doc.addPage();
        y = addHeader(doc, `Folio PAM: ${cleanTextForPdf(pam.folioPAM)}`, pam.prestadorPrincipal);

        pam.desglosePorPrestador?.forEach(desglose => {
            y = addSectionTitle(doc, `Desglose para: ${cleanTextForPdf(desglose.nombrePrestador)}`, y + 10);
            doc.autoTable({
                startY: y,
                head: [['Código/G/C', 'Descripción', 'Cant.', 'Valor Total', 'Bonificación', 'Copago']],
                body: desglose.items.map(i => [
                    cleanTextForPdf(i.codigoGC),
                    cleanTextForPdf(i.descripcion),
                    cleanTextForPdf(i.cantidad),
                    cleanTextForPdf(i.valorTotal),
                    cleanTextForPdf(i.bonificacion),
                    cleanTextForPdf(i.copago)
                ]),
                ...defaultTableStyles,
                columnStyles: { 1: { cellWidth: 150 } }
            });
            y = doc.autoTable.previous.finalY;
        });

        y = addSectionTitle(doc, 'Resumen del PAM', y + 20);
        const resumenData = [
            ['Total Copago', cleanTextForPdf(pam.resumen?.totalCopago || 'N/A')],
            ['Revisión Duplicados', cleanTextForPdf(pam.resumen?.revisionCobrosDuplicados || 'N/A')]
        ];
        doc.autoTable({ startY: y, body: resumenData, theme: 'plain' });
        y = doc.autoTable.previous.finalY;
    });

    addFooterToAllPages(doc, timestamp);
    doc.save(filename);
};

export const generateAuditPdf = (reportMarkdown: string, filename: string) => {
  const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'px', format: 'letter' });
  const timestamp = `Generado el: ${new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })}`;
  const margin = 30;
  const maxWidth = doc.internal.pageSize.getWidth() - (margin * 2);
  let y = 40;

  // Title
  doc.setFontSize(16);
  doc.setTextColor('#1B263B');
  doc.setFont('helvetica', 'bold');
  doc.text("Reporte de Auditoría Cruzada", margin, y);
  y += 20;

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const lines = reportMarkdown.split('\n');
  let table = { head: [], body: [] };
  let inTable = false;

  const processAndRenderTable = () => {
     if (table.head.length > 0 && table.body.length > 0) {
        // Remove _metadata column if exists
        const originalHead = table.head[0];
        const metadataIdx = originalHead.findIndex(h => h.toLowerCase().includes('metadata'));
        
        const finalHead = metadataIdx > -1 
            ? [originalHead.filter((_, i) => i !== metadataIdx).map(cleanTextForPdf)]
            : [originalHead.map(cleanTextForPdf)];
            
        const finalBody = table.body.map(row => 
            (metadataIdx > -1 ? row.filter((_, i) => i !== metadataIdx) : row).map(cleanTextForPdf)
        );

        // Identify Amount column for right alignment (look for 'Monto' or '$')
        const amountIdx = finalHead[0].findIndex(h => h.toLowerCase().includes('monto') || h.includes('$'));

        checkPageBreak(50);

        doc.autoTable({
            startY: y,
            head: finalHead,
            body: finalBody,
            ...defaultTableStyles,
            styles: { ...defaultTableStyles.styles, fontSize: 8, valign: 'top' },
            columnStyles: {
                0: { cellWidth: 50, fontStyle: 'bold' }, // Código often first
                [amountIdx]: { halign: 'right', fontStyle: 'bold' }, // Monto column
            },
            didParseCell: (data) => {
                // Highlight TOTAL row
                 if (data.section === 'body' && data.row.raw[0]?.toString().toUpperCase().includes('TOTAL')) {
                     data.cell.styles.fontStyle = 'bold';
                     data.cell.styles.fillColor = [220, 220, 220];
                 }
            }
        });
        y = doc.autoTable.previous.finalY + 20;
     }
     table = { head: [], body: [] };
  };

  lines.forEach(line => {
    // Detect table rows using pipes
    if (line.trim().startsWith('|')) {
        inTable = true;
        // Split by pipe and clean whitespace
        const cells = line.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
        
        // Skip separator lines (e.g. |---|---|)
        if (cells.some(cell => /^-+$/.test(cell))) return;

        if (table.head.length === 0) {
            table.head.push(cells);
        } else {
            table.body.push(cells);
        }
    } else {
        if (inTable) {
            processAndRenderTable();
            inTable = false;
        }
        
        // Render text content
        const cleanLine = cleanTextForPdf(line); 
        if (cleanLine.trim()) {
             doc.setFont('helvetica', line.startsWith('#') ? 'bold' : 'normal');
             doc.setFontSize(line.startsWith('#') ? 12 : 10);
             doc.setTextColor(line.startsWith('#') ? '#0D1B2A' : '#1B263B');
             
             const textLines = doc.splitTextToSize(cleanLine, maxWidth);
             checkPageBreak(textLines.length * 12);
             doc.text(textLines, margin, y);
             y += (textLines.length * 12) + 5;
        }
    }
  });

  if (inTable) processAndRenderTable(); // Catch table at the very end

  addFooterToAllPages(doc, timestamp);
  doc.save(filename);
};
