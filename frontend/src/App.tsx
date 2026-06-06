import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, ProtectedRoute } from '@/lib/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import RFQList from './pages/RFQList';
import CreateRFQ from './pages/CreateRFQ';
import Quotations from './pages/Quotations';
import Approvals from './pages/Approvals';
import InvoiceView from './pages/InvoiceView';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth pages */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected dashboard pages */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
        <Route path="/rfqs" element={<ProtectedRoute><RFQList /></ProtectedRoute>} />
        <Route path="/rfqs/new" element={<ProtectedRoute><CreateRFQ /></ProtectedRoute>} />
        <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
        <Route path="/purchase-orders" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

        {/* Catch-all: redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
