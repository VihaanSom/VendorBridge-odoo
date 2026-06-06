const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/mailer');
const asyncHandler = require('../middleware/asyncHandler');

const router = Router();

// ──────────────────────────────────────────────────────────────
// POST /signup
// ──────────────────────────────────────────────────────────────
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { email, password, role, firstName, lastName, companyName, gstNumber, category, contactPhone } = req.body;

    // --- Validation ---
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'email, password, and role are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const validRoles = ['ADMIN', 'OFFICER', 'VENDOR', 'APPROVER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    if (role === 'VENDOR' && (!companyName || !gstNumber || !category)) {
      return res.status(400).json({ error: 'VENDOR role requires companyName, gstNumber, and category.' });
    }

    // --- Check existing ---
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // --- Hash password ---
    const passwordHash = await bcrypt.hash(password, 10);

    // --- Create user (+ vendor profile if VENDOR) ---
    let user;

    if (role === 'VENDOR') {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            role,
            firstName: firstName || null,
            lastName: lastName || null,
          },
        });

        await tx.vendorProfile.create({
          data: {
            userId: newUser.id,
            companyName,
            gstNumber,
            category,
            contactPhone: contactPhone || null,
          },
        });

        return tx.user.findUnique({
          where: { id: newUser.id },
          include: { vendorProfile: true },
        });
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role,
          firstName: firstName || null,
          lastName: lastName || null,
        },
      });
    }

    // --- Generate JWT ---
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // --- Strip sensitive fields ---
    const { passwordHash: _, ...safeUser } = user;

    res.status(201).json({ token, user: safeUser });
  })
);

// ──────────────────────────────────────────────────────────────
// POST /login
// ──────────────────────────────────────────────────────────────
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { vendorProfile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { passwordHash: _, ...safeUser } = user;

    res.json({ token, user: safeUser });
  })
);

// ──────────────────────────────────────────────────────────────
// POST /forgot-password
// ──────────────────────────────────────────────────────────────
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success (prevent email enumeration)
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send reset email via SMTP (Ethereal in dev, Gmail in prod)
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    console.log('[PASSWORD RESET] Token generated for:', email);
    console.log('[PASSWORD RESET] Link:', resetLink);
    console.log('[PASSWORD RESET] Expires:', expiresAt.toISOString());

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (mailErr) {
      // Non-fatal: log but don't fail the request
      console.error('[PASSWORD RESET] Email send failed:', mailErr.message);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  })
);

// ──────────────────────────────────────────────────────────────
// POST /reset-password
// ──────────────────────────────────────────────────────────────
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'token and newPassword are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Find valid token
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (resetRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    // Hash new password & update user, delete token — atomic
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetRecord.id },
      }),
    ]);

    res.json({ message: 'Password updated successfully.' });
  })
);

// ──────────────────────────────────────────────────────────────
// GET /me
// ──────────────────────────────────────────────────────────────
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { vendorProfile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { passwordHash: _, ...safeUser } = user;

    res.json(safeUser);
  })
);

module.exports = router;
