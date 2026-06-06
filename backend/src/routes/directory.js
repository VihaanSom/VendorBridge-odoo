const { Router } = require('express');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

// All directory routes require authentication
router.use(authenticate);

// ──────────────────────────────────────────────────────────────
// GET /users — Admin only
// ──────────────────────────────────────────────────────────────
router.get(
  '/users',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { role } = req.query;

    const where = {};
    if (role) {
      const validRoles = ['ADMIN', 'OFFICER', 'VENDOR', 'APPROVER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role filter. Must be one of: ${validRoles.join(', ')}` });
      }
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  })
);

// ──────────────────────────────────────────────────────────────
// GET /vendors — Admin & Officer
// ──────────────────────────────────────────────────────────────
router.get(
  '/vendors',
  authorize('ADMIN', 'OFFICER'),
  asyncHandler(async (req, res) => {
    const { category } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }

    const vendors = await prisma.vendorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    res.json(vendors);
  })
);

// ──────────────────────────────────────────────────────────────
// PATCH /vendors/:id — Admin only
// ──────────────────────────────────────────────────────────────
router.patch(
  '/vendors/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { contactPhone, category, vendorStatus } = req.body;

    // Check vendor exists
    const vendor = await prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found.' });
    }

    // Build update data — only allow specific fields
    const updateData = {};
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (category !== undefined) updateData.category = category;
    if (vendorStatus !== undefined) {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
      if (!validStatuses.includes(vendorStatus)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      updateData.vendorStatus = vendorStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update. Allowed: contactPhone, category, vendorStatus.' });
    }

    const updated = await prisma.vendorProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });

    res.json(updated);
  })
);

module.exports = router;
