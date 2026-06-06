const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const analyticsService = require('../services/analytics.service');

const router = Router();

// ──────────────────────────────────────────────────────────────
// GET /api/analytics/activity-logs
// Filterable activity log feed (notification center)
// Auth: Any authenticated user
// ──────────────────────────────────────────────────────────────
router.get('/activity-logs', authenticate, async (req, res, next) => {
  try {
    const { entityId, userId } = req.query;
    const logs = await analyticsService.getActivityLogs({ entityId, userId });
    res.json(logs);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/analytics/dashboard
// Aggregate procurement stats
// Auth: Any authenticated user
// ──────────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

module.exports = router;
