
import React from 'react';

// Define a more specific type for clarity
interface PamItem {
  codigoGC: string;
  descripcion: string;
  cantidad: string;
  valorTotal: string;
  bonificacion: string;
  copago: string;
}

interface DesglosePrestador {
  nombrePrestador: string;
  items: PamItem[];
}

interface Pam {
  folioPAM: string;
  prestadorPrincipal: string;
  periodoCobro: string;
  desglosePorPrestador: DesglosePrestador[];
  resumen: {
    totalCopago: string;
    totalCopagoDeclarado?: string;
    revisionCobrosDuplicados: string;
  };
}

const parseCurrency = (value: string): number => {
    if (!value || typeof value !== 'string') return 0;
    // Handle CLP format: Remove dots, keep numbers and possible minus sign or decimals if comma
    const clean = value.replace(/\./g, '').replace('$', '').trim();
    // If comma is used for decimals, replace with dot, but usually CLP uses dot for thousands and no decimal
    // Standardize: remove non-numeric except comma and minus
    const standard = clean.replace(/[^0-9,-]+/g, "").replace(",", ".");
    return Number(standard) || 0;
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const PamResultDisplay: React.FC<{ result: Pam[] }> = ({ result }) => {
  if (!Array.isArray(result) || result.length === 0) return <div><p className="text-brand-light">No se encontraron datos de PAM para mostrar.</p></div>;

  let totalRecordsAcrossPams = 0;

  const totalCopagoConsolidado = result.reduce((acc, pam) => {
    return acc + parseCurrency(pam.resumen?.totalCopago);
  }, 0);


  return (
    <div className="space-y-10 text-brand-text font-sans">
      <div className="bg-brand-primary p-4 rounded-lg mb-6 shadow-lg">
        <h3 className="text-xl font-bold text-white">Resumen Consolidado de PAMs</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="font-semibold text-brand-light">Copago Total Consolidado:</span>
          <span className="font-bold text-2xl text-brand-cyan">{formatCurrency(totalCopagoConsolidado)}</span>
        </div>
      </div>

      {result.map((pam, index) => {
        let recordsInThisPam = 0;
        let sumItemsCopago = 0;

        if (pam.desglosePorPrestador) {
            pam.desglosePorPrestador.forEach(d => {
                if(d.items) {
                    recordsInThisPam += d.items.length;
                    d.items.forEach(item => {
                        sumItemsCopago += parseCurrency(item.copago);
                    });
                }
            });
        }
        totalRecordsAcrossPams += recordsInThisPam;

        const declaredTotal = parseCurrency(pam.resumen.totalCopagoDeclarado || pam.resumen.totalCopago);
        const difference = declaredTotal - sumItemsCopago;
        const hasSignificantDiff = Math.abs(difference) > 100; // Tolerance of $100 pesos

        return (
          <div key={index} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Folio PAM: {pam.folioPAM}</h2>
              <div className="text-sm text-brand-light space-y-1">
                <p><span className="font-semibold">Prestador Principal:</span> {pam.prestadorPrincipal}</p>
                <p><span className="font-semibold">Período de Cobro:</span> {pam.periodoCobro}</p>
              </div>
            </div>

            {pam.desglosePorPrestador && pam.desglosePorPrestador.map((desglose, dIndex) => (
              <div key={dIndex}>
                <h4 className="text-lg font-semibold text-brand-text mb-2">Desglose para: {desglose.nombrePrestador}</h4>
                <div className="overflow-x-auto bg-slate-50 text-slate-800 rounded-lg shadow-md">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="px-4 py-2 text-left">Código/G/C</th>
                        <th className="px-4 py-2 text-left">Descripción Prestación</th>
                        <th className="px-4 py-2 text-center">Cant. / N°</th>
                        <th className="px-4 py-2 text-right">Valor Total del Ítem ($)</th>
                        <th className="px-4 py-2 text-right">Bonificación del Ítem ($)</th>
                        <th className="px-4 py-2 text-right">Copago del Ítem ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {desglose.items && desglose.items.map((item, iIndex) => (
                        <tr key={iIndex} className="hover:bg-slate-100 text-slate-900">
                          <td className="px-4 py-2">{item.codigoGC}</td>
                          <td className="px-4 py-2">{item.descripcion}</td>
                          <td className="px-4 py-2 text-center">{item.cantidad}</td>
                          <td className="px-4 py-2 text-right">{item.valorTotal}</td>
                          <td className="px-4 py-2 text-right">{item.bonificacion}</td>
                          <td className="px-4 py-2 text-right font-medium">{item.copago}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            
            {pam.resumen && (
                <div className="mt-4 bg-brand-primary p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-brand-text mb-2">Resumen del PAM:</h4>
                    <div className="text-sm text-brand-light space-y-2">
                        <p><span className="font-semibold">Total Copago en Prestador/Clínica (Declarado):</span> {pam.resumen.totalCopagoDeclarado || pam.resumen.totalCopago}</p>
                        <p><span className="font-semibold">Revisión de Cobros Duplicados:</span> {pam.resumen.revisionCobrosDuplicados}</p>
                        
                        {hasSignificantDiff && (
                            <div className="mt-4 p-4 bg-red-900/30 border border-red-500 rounded text-white font-mono text-sm">
                                <p className="font-bold text-red-400 mb-2">⚠️ ALERTA DE INCONSISTENCIA FORENSE</p>
                                <p>Del análisis de este PAM se obtiene lo siguiente:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300">
                                    <li>Copagos por glosa recalculados (suma aritmética): <span className="text-white font-bold">{formatCurrency(sumItemsCopago)}</span></li>
                                    <li>Total Copago declarado en documento: <span className="text-white font-bold">{formatCurrency(declaredTotal)}</span></li>
                                </ul>
                                <p className="mt-2">
                                    El PAM declara en su resumen un Total Copago de <strong>{formatCurrency(declaredTotal)}</strong>, 
                                    lo que <span className="text-red-400 font-bold">NO COINCIDE</span> con la suma aritmética de los copagos por glosa ({formatCurrency(sumItemsCopago)}).
                                    <br/><br/>
                                    Existe una diferencia no explicada de: <span className="text-yellow-400 font-bold">{formatCurrency(difference)}</span>.
                                </p>
                            </div>
                        )}

                        <p className="font-bold text-brand-text mt-2">Total de registros extraídos para este PAM: {recordsInThisPam}</p>
                    </div>
                </div>
            )}

          </div>
        );
      })}
    </div>
  );
};

export default PamResultDisplay;
