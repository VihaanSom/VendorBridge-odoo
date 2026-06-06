const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const approvalService = require('../services/approval.service');

const router = Router();

// ──────────────────────────────────────────────────────────────
// GET /api/approvals
// List pending approvals for the current approver
// Auth: APPROVER only
// ──────────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('APPROVER'), async (req, res, next) => {
  try {
    const approvals = await approvalService.getPendingApprovals(req.user.id);
    res.json(approvals);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// PATCH /api/approvals/:id
// Approve or reject (transactional: approval → quotation → PO)
// Auth: APPROVER only
// ──────────────────────────────────────────────────────────────
router.patch('/:id', authenticate, authorize('APPROVER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        error: 'status is required and must be APPROVED or REJECTED.',
      });
    }

    const result = await approvalService.processApproval(id, status, remarks, req.user.id);
    res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

module.exports = router;
