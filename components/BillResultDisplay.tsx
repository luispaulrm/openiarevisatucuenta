

import React from 'react';

const TotalHighlight: React.FC<{ monto: string }> = ({ monto }) => {
    if (!monto) return null;
    return (
        <div className="bg-gradient-to-r from-green-900/50 to-brand-primary border-l-4 border-green-500 p-6 rounded-lg mb-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <h3 className="text-brand-light font-bold uppercase tracking-wider text-sm mb-1">Total General de la Cuenta</h3>
                <p className="text-gray-400 text-xs">Monto consolidado final extraído del documento</p>
            </div>
            <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                <span className="text-green-500 text-2xl mr-1">$</span>
                {monto}
            </div>
        </div>
    );
};

const GrandTotalsSummary: React.FC<{ totals: { label: string, value: string }[] }> = ({ totals }) => {
    if (!totals || totals.length === 0) return null;
    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-brand-text mb-4 pb-2 border-b-2 border-brand-accent">Totales Consolidados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {totals.map((total, index) => (
                    <div key={index} className="bg-brand-primary p-4 rounded-lg text-center shadow-lg">
                        <p className="text-sm text-brand-light uppercase tracking-wider font-semibold">{total.label}</p>
                        <p className="text-3xl font-bold text-white mt-1">{total.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


const BillResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  if (!result) return null;

  const { encabezado, secciones, grandesTotales, montoTotalGeneral } = result;

  const renderHeader = () => {
    if (!encabezado) return null;
    const details = [
      { label: 'Empresa Emisora', value: encabezado.empresaEmisora }, { label: 'Paciente', value: encabezado.paciente },
      { label: 'RUT Paciente', value: encabezado.rutPaciente }, { label: 'Titular', value: encabezado.titular },
      { label: 'RUT Titular', value: encabezado.rutTitular }, { label: 'Previsión', value: encabezado.prevision },
      { label: 'ID Ingreso', value: encabezado.idIngreso }, { label: 'Tipo Cuenta', value: encabezado.tipo },
      { label: 'Fecha Ingreso', value: encabezado.fechaIngreso }, { label: 'Fecha Egreso', value: encabezado.fechaEgreso },
    ];

    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-text mb-4 pb-2 border-b-2 border-brand-accent">Resumen de la Cuenta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-brand-light bg-brand-primary p-4 rounded-lg">
          {details.map(({ label, value }) => (
            value ? (
              <div key={label} className="col-span-2 grid grid-cols-2">
                <span className="font-semibold text-brand-light">{label}</span>
                <span className="text-brand-text">{value}</span>
              </div>
            ) : null
          ))}
        </div>
      </div>
    );
  };

  const renderSections = () => {
    if (!secciones || !Array.isArray(secciones)) return null;

    return (
      <div className="space-y-8">
        {secciones.map((seccion: any, index: number) => {
          if (!seccion.headers || !seccion.items) return null;

          const headersLowerCase = seccion.headers.map((h: string) => h.toLowerCase().trim());
          const summaryFields = ['exento', 'afecto', 'neto', 'iva', 'total rec'];
          const summaryIndices = summaryFields.map(field => ({
            label: field,
            index: headersLowerCase.findIndex((h: string) => h.includes(field)) // Use includes for flexibility
          })).filter(item => item.index !== -1);
          

          return (
            <div key={index} className="rounded-lg overflow-hidden shadow-md">
              <div className="bg-brand-secondary p-3">
                <h3 className="text-lg font-bold text-brand-text uppercase tracking-wider">{seccion.titulo}</h3>
              </div>
              <div className="overflow-x-auto bg-slate-50">
                <table className="w-full text-sm">
                  <thead className="bg-slate-200 text-slate-600">
                    <tr>
                      {seccion.headers.map((header: string, hIndex: number) => (
                        <th key={hIndex} className="px-4 py-2 text-left font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {seccion.items.map((item: string[], iIndex: number) => (
                      <React.Fragment key={iIndex}>
                        <tr className="bg-white">
                          {item.map((cell: string, cIndex: number) => (
                            <td key={cIndex} className="px-4 py-2 align-top text-slate-400">{cell}</td>
                          ))}
                        </tr>
                        {summaryIndices.length > 0 && (
                           <tr className="bg-white border-b border-slate-200">
                            <td colSpan={seccion.headers.length} className="px-4 py-2">
                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-800 font-medium">
                                {summaryIndices.map(({ label, index }) => (
                                  <div key={label}>
                                    <span className="font-semibold capitalize">{label}: </span>
                                    <span>{item[index] || '0'}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  {seccion.subtotales && seccion.subtotales.length > 0 && (
                     <tfoot>
                        <tr className="bg-slate-200">
                           <td colSpan={seccion.headers.length} className="px-4 py-3 text-right">
                              <div className="flex justify-end flex-wrap gap-x-6">
                                 {seccion.subtotales.map((sub: { label: string; value: string }, sIndex: number) => (
                                    <div key={sIndex} className="text-sm font-bold text-slate-700">
                                       <span>{sub.label}: </span>
                                       <span>{sub.value}</span>
                                    </div>
                                 ))}
                              </div>
                           </td>
                        </tr>
                     </tfoot>
                  )}
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="text-brand-text font-sans">
      <TotalHighlight monto={montoTotalGeneral} />
      <GrandTotalsSummary totals={grandesTotales} />
      {renderHeader()}
      {renderSections()}
    </div>
  );
};

export default BillResultDisplay;