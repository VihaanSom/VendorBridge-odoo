import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, ProtectedRoute, RoleRoute } from '@/lib/AuthContext';
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
        {/* Public auth pages */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard — all roles */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Vendors — ADMIN, OFFICER */}
        <Route path="/vendors" element={<RoleRoute allowedRoles={['ADMIN','OFFICER']}><Vendors /></RoleRoute>} />

        {/* RFQ List — ADMIN, OFFICER, VENDOR */}
        <Route path="/rfqs" element={<RoleRoute allowedRoles={['ADMIN','OFFICER','VENDOR']}><RFQList /></RoleRoute>} />

        {/* Create RFQ — OFFICER only */}
        <Route path="/rfqs/new" element={<RoleRoute allowedRoles={['OFFICER']}><CreateRFQ /></RoleRoute>} />

        {/* Quotations — ADMIN, OFFICER, VENDOR */}
        <Route path="/quotations" element={<RoleRoute allowedRoles={['ADMIN','OFFICER','VENDOR']}><Quotations /></RoleRoute>} />

        {/* Approvals — ADMIN, APPROVER */}
        <Route path="/approvals" element={<RoleRoute allowedRoles={['ADMIN','APPROVER']}><Approvals /></RoleRoute>} />

        {/* Invoices — ADMIN, OFFICER, VENDOR */}
        <Route path="/invoices" element={<RoleRoute allowedRoles={['ADMIN','OFFICER','VENDOR']}><InvoiceView /></RoleRoute>} />

        {/* Reports — ADMIN, OFFICER */}
        <Route path="/reports" element={<RoleRoute allowedRoles={['ADMIN','OFFICER']}><Reports /></RoleRoute>} />

        {/* Activity — ADMIN, OFFICER, APPROVER */}
        <Route path="/activity" element={<RoleRoute allowedRoles={['ADMIN','OFFICER','APPROVER']}><ActivityLogs /></RoleRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
