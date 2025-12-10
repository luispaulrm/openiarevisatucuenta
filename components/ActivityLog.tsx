

import React from 'react';

interface ActivityLogProps {
  logs: string[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  return (
    <div className="bg-black/80 p-4 rounded-lg shadow-lg font-mono text-xs border border-brand-accent/50">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
         <h3 className="text-brand-light font-semibold uppercase tracking-wider">Terminal de Actividad</h3>
         <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
         </div>
      </div>
      {/* Se elimina max-h-48 y overflow-y-auto para usar el scroll del navegador */}
      <div className="space-y-1 pr-2">
        {logs.length === 0 ? (
            <p className="text-gray-600 italic">Esperando inicio de operaciones...</p>
        ) : (
            logs.map((log, index) => (
            <div key={index} className="flex gap-2 animate-fade-in border-b border-gray-800/30 pb-1 last:border-0">
                <span className="text-gray-500 select-none opacity-50 shrink-0">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                <p className={`${log.includes('Error') ? 'text-red-400' : log.includes('100%') ? 'text-green-400 font-bold' : log.includes('%)') ? 'text-cyan-300' : 'text-brand-text'} whitespace-pre-wrap break-words`}>
                    {log.split(' - ')[1] || log}
                </p>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;