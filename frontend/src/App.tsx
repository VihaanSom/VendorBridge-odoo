import React from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import CreateRFQ from './pages/CreateRFQ';
import Quotations from './pages/Quotations';
import Approvals from './pages/Approvals';
import InvoiceView from './pages/InvoiceView';

function App(): React.JSX.Element {
  // TODO: Replace with react-router once routing is set up
  // Available pages: <Login />, <Register />, <Dashboard />, <Vendors />,
  //                  <CreateRFQ />, <Quotations />, <Approvals />, <InvoiceView />
  return <InvoiceView />;
}

export default App;
