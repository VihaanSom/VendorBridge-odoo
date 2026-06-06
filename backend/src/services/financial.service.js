const prisma = require('../config/prisma');
const { generateInvoiceNumber, generatePdf, emailInvoice } = require('../utils/financials.utils');

/**
 * Fetch purchase orders — context-aware based on role.
 * Officers/Admins see all; Vendors see only POs linked to their quotations.
 *
 * @param {string} userId - The authenticated user's id
 * @param {string} role - The user's role
 * @returns {Array} Purchase order records
 */
const getPurchaseOrders = async (userId, role) => {
  let where = {};

  if (role === 'VENDOR') {
    // Find the vendor profile for this user
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw { status: 404, message: 'Vendor profile not found.' };
    }

    // Filter POs where the quotation belongs to this vendor
    where = {
      quotation: {
        vendorId: vendorProfile.id,
      },
    };
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      quotation: {
        include: {
          rfq: { select: { id: true, title: true, deadline: true } },
          vendor: {
            include: {
              user: { select: { email: true, firstName: true, lastName: true } },
            },
          },
          items: {
            include: { rfqItem: true },
          },
        },
      },
      issuer: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      invoices: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return purchaseOrders;
};

/**
 * Create an invoice from a Purchase Order.
 * Calculates subtotal from PO → quotation → items (quantity × unitPrice),
 * then computes tax and total amounts.
 *
 * @param {string} poId - The purchase_orders.id
 * @param {number} taxPercentage - Tax rate (e.g., 18 for 18%)
 * @returns {Object} The created invoice
 */
const createInvoice = async (poId, taxPercentage) => {
  // Fetch PO with quotation items to calculate subtotal
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      quotation: {
        include: {
          items: {
            include: {
              rfqItem: true, // Need quantity
            },
          },
        },
      },
      invoices: true,
    },
  });

  if (!po) {
    throw { status: 404, message: 'Purchase order not found.' };
  }

  // Check if invoice already exists for this PO
  if (po.invoices && po.invoices.length > 0) {
    throw { status: 409, message: 'An invoice already exists for this purchase order.' };
  }

  // Calculate subtotal: SUM(quantity * unitPrice) across all quotation items
  const subtotal = po.quotation.items.reduce((sum, item) => {
    const quantity = item.rfqItem.quantity;
    const unitPrice = parseFloat(item.unitPrice);
    return sum + quantity * unitPrice;
  }, 0);

  const taxAmount = (subtotal * taxPercentage) / 100;
  const totalAmount = subtotal + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      poId,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxPercentage: parseFloat(taxPercentage),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'GENERATED',
    },
    include: {
      po: {
        include: {
          quotation: {
            include: {
              vendor: {
                include: {
                  user: { select: { email: true, firstName: true, lastName: true } },
                },
              },
              rfq: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  return invoice;
};

/**
 * Fetch invoices — context-aware based on role.
 * Officers/Admins see all; Vendors see only their own.
 *
 * @param {string} userId
 * @param {string} role
 * @returns {Array} Invoice records
 */
const getInvoices = async (userId, role) => {
  let where = {};

  if (role === 'VENDOR') {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw { status: 404, message: 'Vendor profile not found.' };
    }

    where = {
      po: {
        quotation: {
          vendorId: vendorProfile.id,
        },
      },
    };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      po: {
        include: {
          quotation: {
            include: {
              vendor: {
                include: {
                  user: { select: { email: true, firstName: true, lastName: true } },
                },
              },
              rfq: { select: { id: true, title: true } },
            },
          },
          issuer: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invoices;
};

/**
 * Generate a PDF for an invoice (placeholder).
 * Fetches full invoice data and passes to the PDF generator.
 *
 * @param {string} invoiceId
 * @returns {{ buffer: Buffer, invoice: Object }} PDF buffer and invoice data
 */
const getInvoicePdf = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      po: {
        include: {
          quotation: {
            include: {
              vendor: {
                include: {
                  user: { select: { email: true, firstName: true, lastName: true } },
                },
              },
              rfq: { select: { id: true, title: true } },
              items: { include: { rfqItem: true } },
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw { status: 404, message: 'Invoice not found.' };
  }

  const pdfData = {
    invoiceNumber: invoice.invoiceNumber,
    vendorName: invoice.po.quotation.vendor.companyName,
    rfqTitle: invoice.po.quotation.rfq.title,
    subtotal: invoice.subtotal,
    taxPercentage: invoice.taxPercentage,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    items: invoice.po.quotation.items,
    createdAt: invoice.createdAt,
  };

  const buffer = generatePdf(pdfData);
  return { buffer, invoice };
};

/**
 * Email an invoice PDF to the vendor.
 * Generates PDF, sends via email placeholder, updates emailed_at.
 *
 * @param {string} invoiceId
 * @returns {Object} Updated invoice
 */
const emailInvoiceToVendor = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      po: {
        include: {
          quotation: {
            include: {
              vendor: {
                include: {
                  user: { select: { email: true, firstName: true, lastName: true } },
                },
              },
              rfq: { select: { id: true, title: true } },
              items: { include: { rfqItem: true } },
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw { status: 404, message: 'Invoice not found.' };
  }

  const vendorEmail = invoice.po.quotation.vendor.user.email;
  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    vendorName: invoice.po.quotation.vendor.companyName,
    totalAmount: invoice.totalAmount,
  };

  // Call email placeholder
  await emailInvoice(invoiceData, vendorEmail);

  // Update emailed_at timestamp
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      emailedAt: new Date(),
      status: 'SENT',
    },
  });

  return updatedInvoice;
};

module.exports = {
  getPurchaseOrders,
  createInvoice,
  getInvoices,
  getInvoicePdf,
  emailInvoiceToVendor,
};
