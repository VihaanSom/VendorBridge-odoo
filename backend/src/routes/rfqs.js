const { Router } = require('express');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

// All RFQ routes require authentication
router.use(authenticate);

// ──────────────────────────────────────────────────────────────
// GET / — List RFQs (role-aware)
// OFFICER/ADMIN → all RFQs
// VENDOR → only RFQs they are invited to
// ──────────────────────────────────────────────────────────────
router.get(
  '/',
  authorize('OFFICER', 'ADMIN', 'VENDOR'),
  asyncHandler(async (req, res) => {
    let rfqs;

    if (req.user.role === 'VENDOR') {
      // Find vendor profile for this user
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!vendorProfile) {
        return res.status(404).json({ error: 'Vendor profile not found.' });
      }

      // Get RFQs this vendor is invited to
      rfqs = await prisma.rfq.findMany({
        where: {
          vendorInvites: {
            some: { vendorId: vendorProfile.id },
          },
        },
        include: {
          items: true,
          vendorInvites: {
            include: {
              vendor: {
                select: { id: true, companyName: true, category: true },
              },
            },
          },
          creator: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // OFFICER / ADMIN see all
      rfqs = await prisma.rfq.findMany({
        include: {
          items: true,
          vendorInvites: {
            include: {
              vendor: {
                select: { id: true, companyName: true, category: true },
              },
            },
          },
          creator: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(rfqs);
  })
);

// ──────────────────────────────────────────────────────────────
// GET /:id — Single RFQ with items + invited vendors
// ──────────────────────────────────────────────────────────────
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const rfq = await prisma.rfq.findUnique({
      where: { id },
      include: {
        items: true,
        vendorInvites: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                category: true,
                gstNumber: true,
                contactPhone: true,
                rating: true,
                user: {
                  select: { email: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
        creator: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found.' });
    }

    // If VENDOR, verify they are invited
    if (req.user.role === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
      });

      const isInvited = rfq.vendorInvites.some(
        (invite) => invite.vendorId === vendorProfile?.id
      );

      if (!isInvited) {
        return res.status(403).json({ error: 'Access denied. You are not invited to this RFQ.' });
      }
    }

    res.json(rfq);
  })
);

// ──────────────────────────────────────────────────────────────
// POST / — Create RFQ (Officer only)
// Transaction: rfq → rfq_items → rfq_vendor_invites → activity_log
// ──────────────────────────────────────────────────────────────
router.post(
  '/',
  authorize('OFFICER'),
  asyncHandler(async (req, res) => {
    const { title, deadline, attachmentUrl, items, vendorIds } = req.body;

    // --- Validation ---
    if (!title || !deadline || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'title, deadline, and items (non-empty array) are required.' });
    }

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ error: 'vendorIds (non-empty array) is required.' });
    }

    // Validate each item
    for (const item of items) {
      if (!item.itemName || !item.quantity || !item.unitOfMeasure) {
        return res.status(400).json({
          error: 'Each item must have itemName, quantity, and unitOfMeasure.',
        });
      }
    }

    // Verify all vendor IDs exist
    const vendors = await prisma.vendorProfile.findMany({
      where: { id: { in: vendorIds } },
    });

    if (vendors.length !== vendorIds.length) {
      return res.status(400).json({ error: 'One or more vendorIds are invalid.' });
    }

    // --- Transaction ---
    const rfq = await prisma.$transaction(async (tx) => {
      // 1. Create RFQ
      const newRfq = await tx.rfq.create({
        data: {
          createdBy: req.user.id,
          title,
          deadline: new Date(deadline),
          status: 'ACTIVE',
          attachmentUrl: attachmentUrl || null,
        },
      });

      // 2. Bulk create RFQ items
      await tx.rfqItem.createMany({
        data: items.map((item) => ({
          rfqId: newRfq.id,
          itemName: item.itemName,
          description: item.description || null,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
        })),
      });

      // 3. Bulk create vendor invites
      await tx.rfqVendorInvite.createMany({
        data: vendorIds.map((vendorId) => ({
          rfqId: newRfq.id,
          vendorId,
        })),
      });

      // 4. Activity log
      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'RFQ_CREATED',
          entityType: 'RFQ',
          entityId: newRfq.id,
          description: `RFQ "${title}" created with ${items.length} items, invited ${vendorIds.length} vendors.`,
          ipAddress: req.ip || null,
        },
      });

      // Return full RFQ with relations
      return tx.rfq.findUnique({
        where: { id: newRfq.id },
        include: {
          items: true,
          vendorInvites: {
            include: {
              vendor: {
                select: { id: true, companyName: true, category: true },
              },
            },
          },
          creator: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });
    });

    res.status(201).json(rfq);
  })
);

// ──────────────────────────────────────────────────────────────
// PATCH /:id — Update RFQ status (Officer/Admin)
// ──────────────────────────────────────────────────────────────
router.patch(
  '/:id',
  authorize('OFFICER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }

    const validStatuses = ['DRAFT', 'ACTIVE', 'CLOSED', 'AWARDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Check RFQ exists
    const existing = await prisma.rfq.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'RFQ not found.' });
    }

    // Validate status transitions
    const allowedTransitions = {
      DRAFT: ['ACTIVE'],
      ACTIVE: ['CLOSED'],
      CLOSED: ['AWARDED'],
      AWARDED: [],
    };

    if (!allowedTransitions[existing.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${existing.status} to ${status}. Allowed: ${allowedTransitions[existing.status].join(', ') || 'none'}`,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const rfq = await tx.rfq.update({
        where: { id },
        data: { status },
        include: {
          items: true,
          vendorInvites: {
            include: {
              vendor: {
                select: { id: true, companyName: true, category: true },
              },
            },
          },
          creator: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      // Log status change
      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'RFQ_STATUS_UPDATED',
          entityType: 'RFQ',
          entityId: id,
          description: `RFQ status changed from ${existing.status} to ${status}.`,
          ipAddress: req.ip || null,
        },
      });

      return rfq;
    });

    res.json(updated);
  })
);

module.exports = router;
