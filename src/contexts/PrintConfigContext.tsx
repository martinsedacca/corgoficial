import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type PrintFormat = 'A4' | 'A5';

interface PrintConfigContextType {
  printFormat: PrintFormat;
  setPrintFormat: (format: PrintFormat) => void;
}

const PrintConfigContext = createContext<PrintConfigContextType | undefined>(undefined);

export function PrintConfigProvider({ children }: { children: ReactNode }) {
  const [printFormat, setPrintFormatState] = useState<PrintFormat>('A4');

  // Cargar configuración desde localStorage al inicializar
  useEffect(() => {
    const savedFormat = localStorage.getItem('printFormat') as PrintFormat;
    if (savedFormat && (savedFormat === 'A4' || savedFormat === 'A5')) {
      setPrintFormatState(savedFormat);
    }
  }, []);

  // Guardar configuración en localStorage cuando cambie
  const setPrintFormat = (format: PrintFormat) => {
    setPrintFormatState(format);
    localStorage.setItem('printFormat', format);
  };

  const value = {
    printFormat,
    setPrintFormat
  };

  return (
    <PrintConfigContext.Provider value={value}>
      {children}
    </PrintConfigContext.Provider>
  );
}

export function usePrintConfig() {
  const context = useContext(PrintConfigContext);
  if (context === undefined) {
    throw new Error('usePrintConfig must be used within a PrintConfigProvider');
  }
  return context;
}