import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { PrintConfigProvider } from './contexts/PrintConfigContext';
import { AuthenticatedApp } from './components/AuthenticatedApp';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <PrintConfigProvider>
          <AuthenticatedApp />
        </PrintConfigProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;