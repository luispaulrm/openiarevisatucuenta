import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Processing Document..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-cyan"></div>
      <h2 className="text-xl font-semibold text-brand-text">{message}</h2>
      <p className="text-brand-light text-center">The AI is processing the document. This may take a moment.</p>
    </div>
  );
};

export default Loader;
