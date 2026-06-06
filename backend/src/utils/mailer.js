/**
 * SMTP Email Service
 * Reusable Nodemailer transporter with two high-level helpers:
 *   - sendPasswordResetEmail(to, token)
 *   - sendInvoiceEmail(to, invoiceDetails, pdfBuffer)
 *
 * Configuration:
 *   Set SMTP_USER and SMTP_PASS environment variables for Gmail,
 *   or leave them unset to auto-create an Ethereal test account.
 */

const nodemailer = require('nodemailer');

// ─── Transporter Singleton ──────────────────────────────────────────────────

let _transporter = null;

/**
 * Build (or return cached) Nodemailer transporter.
 * - If SMTP_USER + SMTP_PASS env vars are set → uses Gmail SMTP.
 * - Otherwise → creates an Ethereal test account on-the-fly.
 */
const getTransporter = async () => {
  if (_transporter) return _transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // ── Production / Gmail ───────────────────────────────────
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('[MAILER] Using Gmail SMTP transport');
  } else {
    // ── Dev fallback: Ethereal ────────────────────────────────
    const testAccount = await nodemailer.createTestAccount();

    _transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('──────────────────────────────────────────');
    console.log('[MAILER] Using Ethereal test transport');
    console.log('[MAILER] Ethereal user:', testAccount.user);
    console.log('[MAILER] Preview sent emails at https://ethereal.email');
    console.log('──────────────────────────────────────────');
  }

  return _transporter;
};

// ─── Email Helpers ──────────────────────────────────────────────────────────

const SENDER = process.env.SMTP_USER || 'no-reply@vendorbridge.com';

/**
 * Send a password-reset email with a tokenised link.
 *
 * @param {string} to       - Recipient email address
 * @param {string} token    - The random reset token
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendPasswordResetEmail = async (to, token) => {
  const transporter = await getTransporter();
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;

  const info = await transporter.sendMail({
    from: `"VendorBridge" <${SENDER}>`,
    to,
    subject: 'VendorBridge — Password Reset Request',
    text: [
      'Hi,',
      '',
      'We received a request to reset your VendorBridge password.',
      `Click the link below to set a new password (valid for 15 minutes):`,
      '',
      resetLink,
      '',
      'If you did not request this, please ignore this email.',
      '',
      '— The VendorBridge Team',
    ].join('\n'),
    html: `
      <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          We received a request to reset your <strong>VendorBridge</strong> account password.
          Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.
        </p>
        <a href="${resetLink}"
           style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #059669; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">VendorBridge ERP &middot; Procurement Management System</p>
      </div>
    `,
  });

  // Log Ethereal preview URL when in dev
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('[MAILER] ✉  Password-reset email preview:', previewUrl);
  }

  return info;
};

/**
 * Send an invoice PDF as an email attachment to the vendor.
 *
 * @param {string} to              - Vendor email address
 * @param {Object} invoiceDetails  - { invoiceNumber, vendorName, totalAmount }
 * @param {Buffer} pdfBuffer       - The generated PDF buffer
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendInvoiceEmail = async (to, invoiceDetails, pdfBuffer) => {
  const transporter = await getTransporter();

  const { invoiceNumber, vendorName, totalAmount } = invoiceDetails;

  const info = await transporter.sendMail({
    from: `"VendorBridge" <${SENDER}>`,
    to,
    subject: `VendorBridge — Invoice ${invoiceNumber}`,
    text: [
      `Dear ${vendorName},`,
      '',
      `Please find attached your invoice ${invoiceNumber}.`,
      `Total Amount: ₹${Number(totalAmount).toLocaleString('en-IN')}`,
      '',
      'Thank you for your partnership.',
      '',
      '— The VendorBridge Team',
    ].join('\n'),
    html: `
      <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Invoice ${invoiceNumber}</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Dear <strong>${vendorName}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Please find your invoice attached to this email.
        </p>
        <table style="margin: 20px 0; font-size: 14px; color: #334155;">
          <tr><td style="padding: 4px 16px 4px 0; color: #64748b;">Invoice No.</td><td><strong>${invoiceNumber}</strong></td></tr>
          <tr><td style="padding: 4px 16px 4px 0; color: #64748b;">Total Amount</td><td><strong>₹${Number(totalAmount).toLocaleString('en-IN')}</strong></td></tr>
        </table>
        <p style="color: #475569; font-size: 14px;">Thank you for your partnership.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">VendorBridge ERP &middot; Procurement Management System</p>
      </div>
    `,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  // Log Ethereal preview URL when in dev
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('[MAILER] ✉  Invoice email preview:', previewUrl);
  }

  return info;
};

module.exports = {
  getTransporter,
  sendPasswordResetEmail,
  sendInvoiceEmail,
};
