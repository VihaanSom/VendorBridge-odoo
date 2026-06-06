require('dotenv').config();

const express = require('express');
const cors = require('cors');

// ─── Route Imports ──────────────────────────────────────────────────────────
// Dev A: Identity, Catalog & Sourcing
const authRoutes = require('./src/routes/auth');
const directoryRoutes = require('./src/routes/directory');
const rfqRoutes = require('./src/routes/rfqs');

// Dev B: Bidding, Approvals & Financials
const quotationRoutes = require('./src/routes/quotations');
const approvalRoutes = require('./src/routes/approvals');
const financialRoutes = require('./src/routes/financials');
const analyticsRoutes = require('./src/routes/analytics');

// ─── App Setup ──────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VendorBridge API',
    timestamp: new Date().toISOString(),
  });
});

// ─── Route Mounting ─────────────────────────────────────────────────────────
// Dev A Routes
app.use('/api/auth', authRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/rfqs', rfqRoutes);

// Dev B Routes
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('── Unhandled Error ──');
  console.error(err.stack || err);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 VendorBridge API running on http://localhost:${PORT}`);
  console.log(`📋 Health check:  http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment:   ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
