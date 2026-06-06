const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const quotationService = require('../services/quotation.service');
const prisma = require('../config/prisma');

const router = Router();

// ──────────────────────────────────────────────────────────────
// POST /api/quotations
// Create a quotation + items (transactional)
// Auth: VENDOR only
// ──────────────────────────────────────────────────────────────
router.post('/', authenticate, authorize('VENDOR'), async (req, res, next) => {
  try {
    const { rfqId, deliveryTimelineDays, notes, items } = req.body;

    // Validate required fields
    if (!rfqId || !deliveryTimelineDays || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'rfqId, deliveryTimelineDays, and items (non-empty array) are required.',
      });
    }

    // Resolve the vendor profile from the authenticated user
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendorProfile) {
      return res.status(404).json({ error: 'Vendor profile not found for this user.' });
    }

    const quotation = await quotationService.createQuotation(vendorProfile.id, {
      rfqId,
      deliveryTimelineDays,
      notes,
      items,
    });

    res.status(201).json(quotation);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/quotations/rfq/:rfqId
// List quotes for an RFQ with dynamic totalPrice
// Auth: OFFICER, ADMIN, APPROVER
// ──────────────────────────────────────────────────────────────
router.get('/rfq/:rfqId', authenticate, authorize('OFFICER', 'ADMIN', 'APPROVER'), async (req, res, next) => {
  try {
    const { rfqId } = req.params;
    const quotations = await quotationService.getQuotationsByRfq(rfqId);
    res.json(quotations);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// PATCH /api/quotations/:id/status
// Send quotation to review → creates a PENDING approval
// Auth: OFFICER only
// ──────────────────────────────────────────────────────────────
router.patch('/:id/status', authenticate, authorize('OFFICER', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;

    if (!approverId) {
      return res.status(400).json({ error: 'approverId is required.' });
    }

    const result = await quotationService.updateQuotationStatus(id, approverId);
    res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

module.exports = router;
