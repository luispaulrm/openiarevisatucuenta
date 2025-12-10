

import React, { useState } from 'react';

const IconPabellon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-cyan mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v5m-2.5-2.5h5" />
    </svg>
);

const IconHospital: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-cyan mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-3 3v4" />
    </svg>
);

const IconPackage: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-cyan mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);


const IconScales: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-cyan mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.7 9.3l.01-.01M12 12.01l.01-.01M16.3 9.3l.01-.01M21 21V10a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11V6.972a2 2 0 011.08-1.816l.012-.054a2 2 0 001.603 0l.12.054A2 2 0 0115 6.972V11" />
    </svg>
);

const IconTimeline: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-cyan mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.59V3.41" />
    </svg>
);


const ContextualExplanation: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true); // Open by default for visibility

    return (
        <section className="bg-brand-secondary p-4 sm:p-6 rounded-lg shadow-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left flex justify-between items-center group"
                aria-expanded={isOpen}
                aria-controls="explanation-content"
            >
                <h2 className="text-lg sm:text-xl font-bold text-brand-text group-hover:text-brand-cyan transition-colors">
                    <span className="text-2xl mr-2">💡</span>Aclaraciones Clave de Auditoría
                </h2>
                <svg className={`w-6 h-6 text-brand-light transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            {isOpen && (
                <div id="explanation-content" className="mt-4 border-t border-brand-accent pt-4 space-y-8">
                    
                     <div>
                        <h3 className="text-lg font-semibold text-white">Desglosando el "Derecho de Pabellón" (Según Circular IF-319)</h3>
                        <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent mt-2 text-center">
                            <IconPackage />
                            <h4 className="font-bold text-brand-text mb-2">Un Paquete con Exclusiones Claras</h4>
                            <p className="text-sm text-brand-light max-w-3xl mx-auto mb-4">
                                La normativa (Arancel FONASA MLE, Circular IF-319) define el procedimiento quirúrgico (ej: Colecistectomía) como un <strong className="text-white">paquete integral del acto médico</strong>, pero permite facturar por separado los <strong className="text-white">consumibles de costo variable</strong>. No es doble cobro, es un desglose normativo.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-left">
                                <div className="bg-green-900/50 p-3 rounded-lg border border-green-700">
                                    <h5 className="font-semibold text-green-300">✅ INCLUIDO en el Paquete Base</h5>
                                    <ul className="text-xs text-brand-light mt-1 list-disc list-inside space-y-1">
                                        <li><strong className="text-white">Honorarios del Equipo Médico:</strong> Cirujano, anestesista, etc.</li>
                                        <li><strong className="text-white">Uso de Sala y Equipos:</strong> Derecho a pabellón, monitores.</li>
                                        <li><strong className="text-white">Gases Clínicos Básicos:</strong> Oxígeno, aire comprimido.</li>
                                    </ul>
                                </div>
                                <div className="bg-yellow-900/50 p-3 rounded-lg border border-yellow-700">
                                    <h5 className="font-semibold text-yellow-300">⚠️ FACTURADO POR SEPARADO (Correcto)</h5>
                                     <ul className="text-xs text-brand-light mt-1 list-disc list-inside space-y-1">
                                        <li><strong className="text-white">Insumos y Materiales:</strong> Jeringas, guantes, tubos, kits.</li>
                                        <li><strong className="text-white">Fármacos:</strong> Anestésicos específicos, medicamentos.</li>
                                        <li><strong className="text-white">Prótesis o Insumos de Alta Especificidad.</strong></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white">El Paquete Quirúrgico: Más Allá del Quirófano</h3>
                        <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent mt-2 text-center">
                            <IconTimeline />
                            <h4 className="font-bold text-brand-text mb-2">Un Proceso, No un Lugar</h4>
                            <p className="text-sm text-brand-light max-w-3xl mx-auto mb-4">
                                El "Derecho a Pabellón" no cubre solo lo que pasa dentro del quirófano. Es un <strong className="text-white">paquete funcional</strong> que incluye el cuidado estándar e inseparable del post-operatorio inmediato, aunque ocurra en la habitación.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-left">
                                <div className="bg-red-900/50 p-3 rounded-lg border border-red-700">
                                    <h5 className="font-semibold text-red-300">IMPROCEDENTE Cobrar Aparte</h5>
                                    <p className="text-xs text-brand-light mt-1">Analgésicos para el dolor de la herida, antibióticos post-quirúrgicos, etc. Son consecuencia directa de la cirugía y ya están incluidos en el paquete.</p>
                                </div>
                                <div className="bg-green-900/50 p-3 rounded-lg border border-green-700">
                                    <h5 className="font-semibold text-green-300">CORRECTO Cobrar Aparte</h5>
                                    <p className="text-xs text-brand-light mt-1">Medicamentos para tratar condiciones preexistentes del paciente (diabetes, hipertensión) o complicaciones inesperadas no relacionadas con la cirugía.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-white">Evento Único vs. Paquetización de Pabellón</h3>
                        <div className="flex-1 bg-brand-primary p-4 rounded-lg border border-brand-accent mt-2">
                            <IconScales />
                            <div className="grid md:grid-cols-2 gap-4 text-center mt-2">
                                <div>
                                    <h4 className="font-bold text-brand-text mb-2">Principio de "Evento Único"</h4>
                                    <p className="text-sm text-brand-light">
                                        <strong className="text-green-400 block">✅ CORRECTO</strong>
                                        Consolida toda la atención en <strong className="text-white">un solo siniestro</strong> para aplicar topes y deducibles una sola vez.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-text mb-2">Regla de "Paquetización"</h4>
                                    <p className="text-sm text-brand-light">
                                        <strong className="text-red-400 block">❌ INCORRECTO</strong>
                                        Define que, <strong className="text-white">dentro de ese evento único</strong>, el pabellón ya incluye los fármacos estándar de la cirugía y su recuperación inmediata. Facturarlos aparte es improcedente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white">El Misterio de los Insumos en el Contrato</h3>
                        <div className="flex flex-col md:flex-row gap-4 mt-2">
                            <div className="flex-1 bg-brand-primary p-4 rounded-lg border border-brand-accent text-center">
                                <IconPabellon />
                                <h4 className="font-bold text-brand-text mb-2">ESCENARIO 1: En Cirugía</h4>
                                <p className="text-sm text-brand-light">La <strong className="text-white">normativa</strong> considera el "Derecho a Pabellón" un <strong className="text-white">paquete cerrado</strong>. Cobrar insumos y fármacos estándar por separado es improcedente.</p>
                            </div>
                            <div className="flex-1 bg-brand-primary p-4 rounded-lg border border-brand-accent text-center">
                                <IconHospital />
                                <h4 className="font-bold text-brand-text mb-2">ESCENARIO 2: Fuera de Pabellón</h4>
                                <p className="text-sm text-brand-light">En hospitalización en sala o urgencias, <strong className="text-white">no hay un "paquete"</strong>. Aquí, los cobros individuales de insumos y fármacos son correctos y el contrato define su cobertura.</p>
                            </div>
                        </div>
                    </div>
                                        
                     <p className="text-center text-xs text-gray-400 pt-4 border-t border-brand-accent">
                        En resumen: El contrato es amplio para ser versátil. Nuestro auditor aplica la regla correcta según el contexto de la atención.
                    </p>
                </div>
            )}
        </section>
    );
};

export default ContextualExplanation;
