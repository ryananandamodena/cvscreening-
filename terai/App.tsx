
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { OfflineIndicator } from './components/OfflineIndicator';

const App = () => {
  return (
    <Router>
      <AppRoutes />
      <OfflineIndicator />
    </Router>
  );
};

export default App;
