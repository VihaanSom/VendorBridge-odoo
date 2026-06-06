const prisma = require('../config/prisma');

/**
 * Fetch activity logs with optional filters.
 * Serves as the notification/audit feed for the frontend.
 *
 * @param {Object} filters - { entityId?, userId? }
 * @returns {Array} Activity log records
 */
const getActivityLogs = async (filters = {}) => {
  const where = {};

  if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  const logs = await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Reasonable limit for the feed
  });

  return logs;
};

/**
 * Fetch aggregate dashboard statistics.
 * Executes COUNT(*) queries across RFQs, Approvals, POs, and Invoices.
 *
 * @returns {Object} { activeRfqs, pendingApprovals, purchaseOrders, invoices }
 */
const getDashboardStats = async () => {
  const [activeRfqs, pendingApprovals, purchaseOrders, invoices] =
    await Promise.all([
      prisma.rfq.count({ where: { status: 'ACTIVE' } }),
      prisma.approval.count({ where: { status: 'PENDING' } }),
      prisma.purchaseOrder.count(),
      prisma.invoice.count(),
    ]);

  return {
    activeRfqs,
    pendingApprovals,
    purchaseOrders,
    invoices,
  };
};

module.exports = {
  getActivityLogs,
  getDashboardStats,
};
