const prisma = require('../config/prisma');

/**
 * Create a new quotation with items in a single transaction.
 * Enforces the unique (rfqId, vendorId) constraint.
 *
 * @param {string} vendorProfileId - The vendor_profiles.id (NOT user.id)
 * @param {Object} data - { rfqId, deliveryTimelineDays, notes, items: [{ rfqItemId, unitPrice }] }
 * @returns {Object} The created quotation with nested items
 */
const createQuotation = async (vendorProfileId, data) => {
  const { rfqId, deliveryTimelineDays, notes, items } = data;

  // Check if vendor was actually invited to this RFQ
  const invite = await prisma.rfqVendorInvite.findUnique({
    where: {
      rfqId_vendorId: { rfqId, vendorId: vendorProfileId },
    },
  });

  if (!invite) {
    throw { status: 403, message: 'Vendor was not invited to this RFQ.' };
  }

  // Check for existing quotation (unique constraint guard)
  const existing = await prisma.quotation.findUnique({
    where: {
      rfqId_vendorId: { rfqId, vendorId: vendorProfileId },
    },
  });

  if (existing) {
    throw { status: 409, message: 'Vendor has already submitted a quotation for this RFQ.' };
  }

  // Transactional insert: quotation + all quotation items
  const quotation = await prisma.$transaction(async (tx) => {
    const newQuotation = await tx.quotation.create({
      data: {
        rfqId,
        vendorId: vendorProfileId,
        deliveryTimelineDays,
        notes,
        status: 'SUBMITTED',
        items: {
          create: items.map((item) => ({
            rfqItemId: item.rfqItemId,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            rfqItem: true,
          },
        },
        vendor: {
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
        },
      },
    });

    return newQuotation;
  });

  return quotation;
};

/**
 * Fetch all quotations for an RFQ with dynamically calculated totalPrice.
 * totalPrice = SUM(rfq_items.quantity * quotation_items.unit_price)
 *
 * @param {string} rfqId
 * @returns {Array} Quotations with computed totalPrice field
 */
const getQuotationsByRfq = async (rfqId) => {
  const quotations = await prisma.quotation.findMany({
    where: { rfqId },
    include: {
      vendor: {
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
      items: {
        include: {
          rfqItem: true, // Need quantity from rfq_items
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Dynamically compute totalPrice for each quotation
  const quotationsWithTotals = quotations.map((q) => {
    const totalPrice = q.items.reduce((sum, item) => {
      const quantity = item.rfqItem.quantity;
      const unitPrice = parseFloat(item.unitPrice);
      return sum + quantity * unitPrice;
    }, 0);

    return {
      ...q,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    };
  });

  return quotationsWithTotals;
};

/**
 * Update quotation status to UNDER_REVIEW and create a PENDING approval record.
 * Uses a transaction to ensure both operations succeed or fail together.
 *
 * @param {string} quotationId
 * @param {string} approverId - The user.id of the approver
 * @returns {Object} Updated quotation with the created approval
 */
const updateQuotationStatus = async (quotationId, approverId) => {
  const result = await prisma.$transaction(async (tx) => {
    // Verify quotation exists and is in SUBMITTED state
    const quotation = await tx.quotation.findUnique({
      where: { id: quotationId },
    });

    if (!quotation) {
      throw { status: 404, message: 'Quotation not found.' };
    }

    if (quotation.status !== 'SUBMITTED') {
      throw {
        status: 400,
        message: `Cannot send to review. Current status: ${quotation.status}`,
      };
    }

    // Update quotation to UNDER_REVIEW
    const updatedQuotation = await tx.quotation.update({
      where: { id: quotationId },
      data: { status: 'UNDER_REVIEW' },
      include: {
        items: { include: { rfqItem: true } },
        vendor: true,
      },
    });

    // Create PENDING approval record
    const approval = await tx.approval.create({
      data: {
        quotationId,
        approverId,
        previousStatus: 'SUBMITTED',
        status: 'PENDING',
      },
    });

    return { quotation: updatedQuotation, approval };
  });

  return result;
};

module.exports = {
  createQuotation,
  getQuotationsByRfq,
  updateQuotationStatus,
};
