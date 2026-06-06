const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const financialService = require('../services/financial.service');

const router = Router();

// ──────────────────────────────────────────────────────────────
// GET /api/financials/purchase-orders
// Context-aware PO list (Officers see all, Vendors see theirs)
// Auth: OFFICER, ADMIN, VENDOR
// ──────────────────────────────────────────────────────────────
router.get('/purchase-orders', authenticate, authorize('OFFICER', 'ADMIN', 'VENDOR'), async (req, res, next) => {
  try {
    const purchaseOrders = await financialService.getPurchaseOrders(req.user.id, req.user.role);
    res.json(purchaseOrders);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/financials/invoices
// Generate invoice from a Purchase Order
// Auth: OFFICER, ADMIN
// ──────────────────────────────────────────────────────────────
router.post('/invoices', authenticate, authorize('OFFICER', 'ADMIN'), async (req, res, next) => {
  try {
    const { poId, taxPercentage } = req.body;

    if (!poId || taxPercentage === undefined || taxPercentage === null) {
      return res.status(400).json({ error: 'poId and taxPercentage are required.' });
    }

    if (typeof taxPercentage !== 'number' || taxPercentage < 0) {
      return res.status(400).json({ error: 'taxPercentage must be a non-negative number.' });
    }

    const invoice = await financialService.createInvoice(poId, taxPercentage);
    res.status(201).json(invoice);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/financials/invoices
// Context-aware invoice list
// Auth: OFFICER, ADMIN, VENDOR
// ──────────────────────────────────────────────────────────────
router.get('/invoices', authenticate, authorize('OFFICER', 'ADMIN', 'VENDOR'), async (req, res, next) => {
  try {
    const invoices = await financialService.getInvoices(req.user.id, req.user.role);
    res.json(invoices);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/financials/invoices/:id/pdf
// Download invoice as PDF (placeholder)
// Auth: OFFICER, ADMIN, VENDOR
// ──────────────────────────────────────────────────────────────
router.get('/invoices/:id/pdf', authenticate, authorize('OFFICER', 'ADMIN', 'VENDOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { buffer, invoice } = await financialService.getInvoicePdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(buffer);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/financials/invoices/:id/email
// Email invoice to vendor (placeholder)
// Auth: OFFICER, ADMIN
// ──────────────────────────────────────────────────────────────
router.post('/invoices/:id/email', authenticate, authorize('OFFICER', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await financialService.emailInvoiceToVendor(id);
    res.json({ message: 'Invoice emailed successfully' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

module.exports = router;
