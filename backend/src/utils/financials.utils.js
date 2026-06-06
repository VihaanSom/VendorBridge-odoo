const crypto = require('crypto');

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

// ─── PDF Generation (Placeholder) ───────────────────────────────────────────

/**
 * PLACEHOLDER — Generate a PDF buffer for the given invoice data.
 * TODO: Replace with pdfkit or puppeteer implementation.
 *
 * @param {Object} invoiceData - The full invoice object with PO, vendor, and item details.
 * @returns {Buffer} A dummy PDF buffer.
 */
const generatePdf = (invoiceData) => {
  console.log('──────────────────────────────────────────');
  console.log('[PDF PLACEHOLDER] Generating PDF for invoice:', invoiceData.invoiceNumber);
  console.log('[PDF PLACEHOLDER] Vendor:', invoiceData.vendorName || 'N/A');
  console.log('[PDF PLACEHOLDER] Total:', invoiceData.totalAmount);
  console.log('──────────────────────────────────────────');

  // Return a minimal dummy buffer (real implementation will use pdfkit)
  const placeholderContent = `Invoice: ${invoiceData.invoiceNumber}\nTotal: ${invoiceData.totalAmount}\n\n[This is a placeholder PDF]`;
  return Buffer.from(placeholderContent, 'utf-8');
};

// ─── Email Invoice (Placeholder) ────────────────────────────────────────────

/**
 * PLACEHOLDER — Email the invoice PDF to the vendor.
 * TODO: Replace with Nodemailer transport + PDF attachment.
 *
 * @param {Object} invoiceData - The full invoice object.
 * @param {string} vendorEmail - The vendor's email address.
 * @returns {Promise<void>}
 */
const emailInvoice = async (invoiceData, vendorEmail) => {
  console.log('──────────────────────────────────────────');
  console.log('[EMAIL PLACEHOLDER] Sending invoice email...');
  console.log('[EMAIL PLACEHOLDER] To:', vendorEmail);
  console.log('[EMAIL PLACEHOLDER] Invoice:', invoiceData.invoiceNumber);
  console.log('[EMAIL PLACEHOLDER] Amount:', invoiceData.totalAmount);
  console.log('[EMAIL PLACEHOLDER] ✓ Email "sent" successfully (placeholder)');
  console.log('──────────────────────────────────────────');

  // In production, this would:
  // 1. Generate the PDF via generatePdf()
  // 2. Create a Nodemailer transport from SMTP_* env vars
  // 3. Send with the PDF as an attachment
  // 4. Return the send result
};

module.exports = {
  generatePoNumber,
  generateInvoiceNumber,
  generatePdf,
  emailInvoice,
};
