import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import CreateRFQ from './pages/CreateRFQ';
import Quotations from './pages/Quotations';
import Approvals from './pages/Approvals';
import InvoiceView from './pages/InvoiceView';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';

function App(): React.JSX.Element {
  return (
    <Routes>
      {/* Auth pages */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard pages (wrapped in DashboardLayout internally) */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/vendors" element={<Vendors />} />
      <Route path="/rfqs" element={<CreateRFQ />} />
      <Route path="/quotations" element={<Quotations />} />
      <Route path="/approvals" element={<Approvals />} />
      <Route path="/invoices" element={<InvoiceView />} />
      <Route path="/activity" element={<ActivityLogs />} />
      <Route path="/reports" element={<Reports />} />

      {/* Catch-all: redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
