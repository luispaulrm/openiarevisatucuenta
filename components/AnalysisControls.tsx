
import React, { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { DocumentType } from '../types';

interface AnalysisControlsProps {
  files: Record<DocumentType, (File | null)[]>;
  onFileChange: (type: DocumentType, file: File | null, index: number) => void;
  onAnalyze: () => void;
  isAnalysisRunning: boolean;
}

const FileUploadDropzone: React.FC<{
    file: File | null;
    onDrop: (acceptedFiles: File[]) => void;
    slot: number;
}> = ({ file, onDrop: handleDrop, slot }) => {
    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            console.error("File rejected:", fileRejections);
            return;
        }
        if (acceptedFiles.length > 0) {
            handleDrop(acceptedFiles);
        }
    }, [handleDrop]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    return (
        <div {...getRootProps()} className={`w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors h-24 flex flex-col justify-center
        ${isDragActive ? 'border-brand-cyan bg-brand-accent/50' : 'border-gray-600 hover:border-brand-cyan'}
        ${file ? 'border-green-500' : ''}`}>
            <input {...getInputProps()} />
            {file ? (
                <p className="text-green-400 text-sm truncate px-2">{file.name}</p>
            ) : (
                isDragActive ?
                    <p className="text-brand-cyan text-sm">Suelte el archivo aquí...</p> :
                    <p className="text-brand-light text-sm">Parte {slot}</p>
            )}
        </div>
    );
};


const AnalysisControls: React.FC<AnalysisControlsProps> = ({ files, onFileChange, onAnalyze, isAnalysisRunning }) => {
    const atLeastOneFileLoaded =
        files.bill.some(f => f) ||
        files.pam.some(f => f) ||
        files.contract.some(f => f);

    const createDropHandler = (type: DocumentType, index: number) => (acceptedFiles: File[]) => {
        onFileChange(type, acceptedFiles[0] || null, index);
    };

    const categories: { type: DocumentType, title: string }[] = [
        { type: 'bill', title: '1. Cuenta Paciente' },
        { type: 'pam', title: '2. Programa Médico (PAM)' },
        { type: 'contract', title: '3. Contrato / Póliza' },
    ];

    return (
        <section className="bg-brand-secondary p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {categories.map(({ type, title }) => (
                    <div key={type} className="flex-1 flex flex-col items-center space-y-2">
                        <h3 className="text-lg font-semibold text-brand-text">{title}</h3>
                        <div className="w-full flex flex-col sm:flex-row gap-2">
                            <FileUploadDropzone file={files[type][0]} onDrop={createDropHandler(type, 0)} slot={1} />
                            <FileUploadDropzone file={files[type][1]} onDrop={createDropHandler(type, 1)} slot={2} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-4">
                <button
                    onClick={onAnalyze}
                    disabled={!atLeastOneFileLoaded || isAnalysisRunning}
                    className="bg-brand-cyan hover:bg-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all transform hover:scale-105 w-full md:w-auto"
                >
                    {isAnalysisRunning ? 'Analizando...' : 'Analizar Archivos Cargados'}
                </button>
            </div>
        </section>
    );
};

export default AnalysisControls;
