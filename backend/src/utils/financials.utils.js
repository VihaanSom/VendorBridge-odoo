const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { sendInvoiceEmail } = require('./mailer');

// ─── PO & Invoice Number Generators ─────────────────────────────────────────

/**
 * Generates a unique Purchase Order number.
 * Format: PO-YYYYMMDD-XXXX (e.g., PO-20260606-A1B2)
 */
const generatePoNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PO-${date}-${suffix}`;
};

/**
 * Generates a unique Invoice number.
 * Format: INV-YYYYMMDD-XXXX (e.g., INV-20260606-C3D4)
 */
const generateInvoiceNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INV-${date}-${suffix}`;
};

// ─── PDF Generation (pdfkit) ────────────────────────────────────────────────

/**
 * Generate a real PDF buffer for the given invoice data using pdfkit.
 *
 * @param {Object} invoiceData - Invoice details to render.
 * @param {string} invoiceData.invoiceNumber
 * @param {string} invoiceData.vendorName
 * @param {string} invoiceData.rfqTitle
 * @param {number|string} invoiceData.subtotal
 * @param {number|string} invoiceData.taxPercentage
 * @param {number|string} invoiceData.taxAmount
 * @param {number|string} invoiceData.totalAmount
 * @param {Array}  invoiceData.items - Quotation items with nested rfqItem
 * @param {Date}   invoiceData.createdAt
 * @returns {Promise<Buffer>} The generated PDF as a Buffer.
 */
const generatePdf = (invoiceData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 });

      // ── Header ──────────────────────────────────────────────
      doc
        .fontSize(22)
        .fillColor('#0f172a')
        .text('INVOICE', { align: 'center' })
        .moveDown(0.3);

      doc
        .fontSize(10)
        .fillColor('#64748b')
        .text('VendorBridge ERP — Procurement Management', { align: 'center' })
        .moveDown(1.5);

      // ── Invoice meta ────────────────────────────────────────
      doc
        .fontSize(11)
        .fillColor('#334155')
        .text(`Invoice No:   ${invoiceData.invoiceNumber}`)
        .text(`Date:         ${new Date(invoiceData.createdAt).toLocaleDateString('en-IN')}`)
        .text(`Vendor:       ${invoiceData.vendorName || 'N/A'}`)
        .text(`RFQ:          ${invoiceData.rfqTitle || 'N/A'}`)
        .moveDown(1);

      // ── Divider ─────────────────────────────────────────────
      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(0.8);

      // ── Line Items Table ────────────────────────────────────
      if (invoiceData.items && invoiceData.items.length > 0) {
        // Header row
        const tableTop = doc.y;
        doc.fontSize(9).fillColor('#64748b');
        doc.text('ITEM', 50, tableTop, { width: 200 });
        doc.text('QTY', 260, tableTop, { width: 60, align: 'right' });
        doc.text('UNIT PRICE', 330, tableTop, { width: 90, align: 'right' });
        doc.text('TOTAL', 430, tableTop, { width: 110, align: 'right' });
        doc.moveDown(0.5);

        doc
          .strokeColor('#e2e8f0')
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
          .moveDown(0.4);

        // Data rows
        doc.fontSize(10).fillColor('#334155');
        for (const item of invoiceData.items) {
          const y = doc.y;
          const qty = item.rfqItem?.quantity ?? 0;
          const price = Number(item.unitPrice);
          const lineTotal = qty * price;

          doc.text(item.rfqItem?.itemName || 'Item', 50, y, { width: 200 });
          doc.text(String(qty), 260, y, { width: 60, align: 'right' });
          doc.text(`₹${fmt(price)}`, 330, y, { width: 90, align: 'right' });
          doc.text(`₹${fmt(lineTotal)}`, 430, y, { width: 110, align: 'right' });
          doc.moveDown(0.6);
        }

        doc.moveDown(0.3);
      }

      // ── Totals ──────────────────────────────────────────────
      doc
        .strokeColor('#cbd5e1')
        .moveTo(330, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(0.5);

      doc.fontSize(10).fillColor('#334155');
      const totalsX = 380;
      const totalsValX = 430;

      doc.text('Subtotal:', totalsX, doc.y, { width: 60 });
      doc.text(`₹${fmt(invoiceData.subtotal)}`, totalsValX, doc.y - 12, { width: 110, align: 'right' });
      doc.moveDown(0.4);

      doc.text(`Tax (${invoiceData.taxPercentage}%):`, totalsX, doc.y, { width: 80 });
      doc.text(`₹${fmt(invoiceData.taxAmount)}`, totalsValX, doc.y - 12, { width: 110, align: 'right' });
      doc.moveDown(0.4);

      doc
        .strokeColor('#cbd5e1')
        .moveTo(330, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(0.5);

      doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold');
      doc.text('Total:', totalsX, doc.y, { width: 60 });
      doc.text(`₹${fmt(invoiceData.totalAmount)}`, totalsValX, doc.y - 14, { width: 110, align: 'right' });

      // ── Footer ──────────────────────────────────────────────
      doc.font('Helvetica');
      doc.moveDown(3);
      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .text('This is a system-generated invoice from VendorBridge ERP.', 50, doc.y, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ─── Email Invoice ──────────────────────────────────────────────────────────

/**
 * Email the invoice PDF to the vendor via SMTP.
 * Generates the PDF, then delegates to the mailer service.
 *
 * @param {Object} invoiceData  - { invoiceNumber, vendorName, totalAmount }
 * @param {string} vendorEmail  - The vendor's email address
 * @returns {Promise<void>}
 */
const emailInvoice = async (invoiceData, vendorEmail) => {
  console.log('──────────────────────────────────────────');
  console.log('[INVOICE EMAIL] Sending to:', vendorEmail);
  console.log('[INVOICE EMAIL] Invoice:', invoiceData.invoiceNumber);
  console.log('[INVOICE EMAIL] Amount:', invoiceData.totalAmount);

  // Generate a lightweight PDF for the attachment
  const pdfData = {
    invoiceNumber: invoiceData.invoiceNumber,
    vendorName: invoiceData.vendorName,
    rfqTitle: invoiceData.rfqTitle || '',
    subtotal: invoiceData.subtotal || invoiceData.totalAmount,
    taxPercentage: invoiceData.taxPercentage || 0,
    taxAmount: invoiceData.taxAmount || 0,
    totalAmount: invoiceData.totalAmount,
    items: invoiceData.items || [],
    createdAt: invoiceData.createdAt || new Date(),
  };

  const pdfBuffer = await generatePdf(pdfData);

  await sendInvoiceEmail(vendorEmail, invoiceData, pdfBuffer);

  console.log('[INVOICE EMAIL] ✓ Sent successfully');
  console.log('──────────────────────────────────────────');
};

module.exports = {
  generatePoNumber,
  generateInvoiceNumber,
  generatePdf,
  emailInvoice,
};
