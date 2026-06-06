const prisma = require('../config/prisma');
const { generatePoNumber } = require('../utils/financials.utils');

/**
 * Fetch all pending approvals assigned to a specific approver.
 * Includes quotation → RFQ details for the approval review screen.
 *
 * @param {string} approverId - The user.id of the approver
 * @returns {Array} Pending approval records with nested context
 */
const getPendingApprovals = async (approverId) => {
  const approvals = await prisma.approval.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      approver: {
        select: { firstName: true, lastName: true, email: true, role: true },
      },
      quotation: {
        include: {
          rfq: {
            include: {
              items: true,
              creator: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          },
          vendor: {
            include: {
              user: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
          },
          items: {
            include: {
              rfqItem: true,
            },
          },
        },
      },
    },
    orderBy: { quotation: { submittedAt: 'desc' } },
  });

  // Enrich each approval with the computed totalPrice
  return approvals.map((a) => {
    const totalPrice = a.quotation.items.reduce((sum, item) => {
      const quantity = item.rfqItem.quantity;
      const unitPrice = parseFloat(item.unitPrice);
      return sum + quantity * unitPrice;
    }, 0);

    return {
      ...a,
      quotation: {
        ...a.quotation,
        totalPrice: parseFloat(totalPrice.toFixed(2)),
      },
    };
  });
};

/**
 * Process an approval decision (APPROVE or REJECT).
 *
 * Uses Prisma $transaction to atomically:
 *   1. Update the approval record (status + remarks + actedAt)
 *   2. Update the quotation status to match
 *   3. If APPROVED → insert a new purchase_orders record
 *   4. Log the action to activity_logs
 *
 * @param {string} approvalId
 * @param {string} status - 'APPROVED' or 'REJECTED'
 * @param {string} remarks - Optional remarks from the approver
 * @param {string} userId - The acting user's id (for PO issuedBy + activity log)
 * @returns {Object} { message, approval, po? }
 */
const processApproval = async (approvalId, status, remarks, userId) => {
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw { status: 400, message: 'Status must be APPROVED or REJECTED.' };
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch & validate the approval
    const approval = await tx.approval.findUnique({
      where: { id: approvalId },
      include: { quotation: true },
    });

    if (!approval) {
      throw { status: 404, message: 'Approval not found.' };
    }

    if (approval.status !== 'PENDING') {
      throw {
        status: 400,
        message: `Approval has already been processed. Current status: ${approval.status}`,
      };
    }

    // 2. Update the approval record
    const updatedApproval = await tx.approval.update({
      where: { id: approvalId },
      data: {
        status,
        remarks,
        previousStatus: 'PENDING',
        actedAt: new Date(),
      },
    });

    // 3. Update quotation status to match
    const quotationStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    await tx.quotation.update({
      where: { id: approval.quotationId },
      data: { status: quotationStatus },
    });

    // 4. If APPROVED → create Purchase Order
    let po = null;
    if (status === 'APPROVED') {
      po = await tx.purchaseOrder.create({
        data: {
          poNumber: generatePoNumber(),
          quotationId: approval.quotationId,
          issuedBy: userId,
          status: 'ISSUED',
        },
      });
    }

    // 5. Log the action
    await tx.activityLog.create({
      data: {
        userId,
        action: `APPROVAL_${status}`,
        entityType: 'APPROVAL',
        entityId: approvalId,
        description: `Approval ${status.toLowerCase()} for quotation ${approval.quotationId}${remarks ? `. Remarks: ${remarks}` : ''}`,
      },
    });

    return { approval: updatedApproval, po };
  });

  return {
    message: 'Approval recorded',
    approval: result.approval,
    poId: result.po?.id || null,
    poNumber: result.po?.poNumber || null,
  };
};

module.exports = {
  getPendingApprovals,
  processApproval,
};
