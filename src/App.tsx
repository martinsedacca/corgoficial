import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AppContent } from './components/AppContent';

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;