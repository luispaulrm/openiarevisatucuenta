import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-secondary p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h1 className="text-xl md:text-2xl font-bold text-brand-text tracking-wide">
            Analizador de cuentas hospitales y clínicas v.5
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;