import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { AuthenticatedApp } from './components/AuthenticatedApp';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AuthenticatedApp />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;