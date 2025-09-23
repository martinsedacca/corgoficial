import React, { createContext, useContext, ReactNode } from 'react';

// Remove PrintFormat type and context since we're only using A4 now
interface PrintConfigContextType {
  // Keep empty for now, might be useful for future print settings
}

const PrintConfigContext = createContext<PrintConfigContextType | undefined>(undefined);

export function PrintConfigProvider({ children }: { children: ReactNode }) {
  const value = {
    // Empty for now
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