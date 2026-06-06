/**
 * ═══════════════════════════════════════════════════════════════
 *  VendorBridge — Full Database Seed Script
 *  Populates ALL 12 tables with realistic procurement data.
 *
 *  Usage:  node prisma/seed.js
 * ═══════════════════════════════════════════════════════════════
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  LOGIN CREDENTIALS (plaintext passwords shown here)        │
 *  ├──────────────────────────────────┬──────────┬──────────────┤
 *  │  Email                           │ Password │ Role         │
 *  ├──────────────────────────────────┼──────────┼──────────────┤
 *  │  admin@vendorbridge.com          │ admin123 │ ADMIN        │
 *  │  officer@vendorbridge.com        │ officer1 │ OFFICER      │
 *  │  officer2@vendorbridge.com       │ officer2 │ OFFICER      │
 *  │  approver@vendorbridge.com       │ approve1 │ APPROVER     │
 *  │  approver2@vendorbridge.com      │ approve2 │ APPROVER     │
 *  │  vendor1@example.com             │ vendor11 │ VENDOR       │
 *  │  vendor2@example.com             │ vendor22 │ VENDOR       │
 *  │  vendor3@example.com             │ vendor33 │ VENDOR       │
 *  └──────────────────────────────────┴──────────┴──────────────┘
 */

require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ─── Prisma Client Setup ────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Utility Helpers ────────────────────────────────────────────
const hash = (pw) => bcrypt.hashSync(pw, 10);

const generatePoNumber = (index) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(index).padStart(4, '0');
  return `PO-${date}-${suffix}`;
};

const generateInvoiceNumber = (index) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(index).padStart(4, '0');
  return `INV-${date}-${suffix}`;
};

// ═══════════════════════════════════════════════════════════════
//  MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('🗑️  Wiping existing data (if any)...\n');
  // Delete in reverse dependency order
  await prisma.activityLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rfqVendorInvite.deleteMany();
  await prisma.rfqItem.deleteMany();
  await prisma.rfq.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log('   ✓ Tables cleared.\n');

  console.log('🌱 Seeding VendorBridge database (all 12 tables)...\n');

  // ═════════════════════════════════════════════════════════════
  //  1. USERS  (8 users)
  //     Table: users
  //     Passwords shown in plaintext → stored as bcrypt hashes
  // ═════════════════════════════════════════════════════════════
  console.log('── 1/12  users ──');

  const usersData = [
    // { email, password (plaintext), role, firstName, lastName }
    { email: 'admin@vendorbridge.com',    password: 'admin123', role: 'ADMIN',    firstName: 'Rajesh',     lastName: 'Sharma'   },
    { email: 'officer@vendorbridge.com',  password: 'officer1', role: 'OFFICER',  firstName: 'Priya',      lastName: 'Mehta'    },
    { email: 'officer2@vendorbridge.com', password: 'officer2', role: 'OFFICER',  firstName: 'Arjun',      lastName: 'Patel'    },
    { email: 'approver@vendorbridge.com', password: 'approve1', role: 'APPROVER', firstName: 'Sunita',     lastName: 'Desai'    },
    { email: 'approver2@vendorbridge.com',password: 'approve2', role: 'APPROVER', firstName: 'Vikram',     lastName: 'Reddy'    },
    { email: 'vendor1@example.com',       password: 'vendor11', role: 'VENDOR',   firstName: 'Ankit',      lastName: 'Gupta'    },
    { email: 'vendor2@example.com',       password: 'vendor22', role: 'VENDOR',   firstName: 'Meera',      lastName: 'Joshi'    },
    { email: 'vendor3@example.com',       password: 'vendor33', role: 'VENDOR',   firstName: 'Farhan',     lastName: 'Khan'     },
  ];

  const users = {};
  for (const u of usersData) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: hash(u.password),  // plaintext: u.password (see table above)
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });
    users[u.email] = created;
    console.log(`   ✅ ${u.role.padEnd(8)} ${u.email.padEnd(35)} pw: ${u.password}`);
  }

  // ═════════════════════════════════════════════════════════════
  //  2. VENDOR PROFILES  (3 profiles for 3 VENDOR users)
  //     Table: vendor_profiles
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 2/12  vendor_profiles ──');

  const vendorProfilesData = [
    {
      userEmail: 'vendor1@example.com',
      companyName: 'Alpha Supplies Pvt. Ltd.',
      gstNumber: '27AABCA1234F1Z5',
      contactPhone: '+91-9876543210',
      category: 'IT Hardware',
      vendorStatus: 'ACTIVE',
      rating: 4.50,
    },
    {
      userEmail: 'vendor2@example.com',
      companyName: 'Beta Technologies Ltd.',
      gstNumber: '29AABCB5678G2Z3',
      contactPhone: '+91-9123456789',
      category: 'IT Hardware',
      vendorStatus: 'ACTIVE',
      rating: 3.80,
    },
    {
      userEmail: 'vendor3@example.com',
      companyName: 'Gamma Office Solutions',
      gstNumber: '07AABCG9012H3Z1',
      contactPhone: '+91-9988776655',
      category: 'Office Supplies',
      vendorStatus: 'ACTIVE',
      rating: 4.20,
    },
  ];

  const vendorProfiles = {};
  for (const vp of vendorProfilesData) {
    const userId = users[vp.userEmail].id;
    const created = await prisma.vendorProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        companyName: vp.companyName,
        gstNumber: vp.gstNumber,
        contactPhone: vp.contactPhone,
        category: vp.category,
        vendorStatus: vp.vendorStatus,
        rating: vp.rating,
      },
    });
    vendorProfiles[vp.userEmail] = created;
    console.log(`   ✅ ${vp.companyName} (GST: ${vp.gstNumber}, Category: ${vp.category}, Rating: ${vp.rating})`);
  }

  // ═════════════════════════════════════════════════════════════
  //  3. PASSWORD RESET TOKENS  (2 tokens — 1 active, 1 expired)
  //     Table: password_reset_tokens
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 3/12  password_reset_tokens ──');

  const activeResetToken = crypto.randomBytes(32).toString('hex');
  const expiredResetToken = crypto.randomBytes(32).toString('hex');

  const resetToken1 = await prisma.passwordResetToken.create({
    data: {
      userId: users['officer@vendorbridge.com'].id,
      token: activeResetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min from now (ACTIVE)
    },
  });
  console.log(`   ✅ Active token for officer@vendorbridge.com`);
  console.log(`      Token: ${activeResetToken}`);
  console.log(`      Expires: ${resetToken1.expiresAt.toISOString()} (15 min from now)`);

  const resetToken2 = await prisma.passwordResetToken.create({
    data: {
      userId: users['vendor1@example.com'].id,
      token: expiredResetToken,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago (EXPIRED)
    },
  });
  console.log(`   ✅ Expired token for vendor1@example.com`);
  console.log(`      Token: ${expiredResetToken}`);
  console.log(`      Expires: ${resetToken2.expiresAt.toISOString()} (1 hour ago — EXPIRED)`);

  // ═════════════════════════════════════════════════════════════
  //  4. RFQs  (3 RFQs in different statuses)
  //     Table: rfqs
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 4/12  rfqs ──');

  const rfqsData = [
    {
      key: 'rfq1',
      title: 'Laptop Procurement Q3 2026',
      createdByEmail: 'officer@vendorbridge.com',
      deadline: new Date('2026-07-15T00:00:00Z'),
      status: 'AWARDED',
      attachmentUrl: 'https://docs.vendorbridge.com/rfq/laptop-specs-q3.pdf',
    },
    {
      key: 'rfq2',
      title: 'Office Furniture — New Branch Setup',
      createdByEmail: 'officer@vendorbridge.com',
      deadline: new Date('2026-08-01T00:00:00Z'),
      status: 'ACTIVE',
      attachmentUrl: null,
    },
    {
      key: 'rfq3',
      title: 'Server Infrastructure Upgrade',
      createdByEmail: 'officer2@vendorbridge.com',
      deadline: new Date('2026-09-30T00:00:00Z'),
      status: 'CLOSED',
      attachmentUrl: 'https://docs.vendorbridge.com/rfq/server-upgrade-specs.pdf',
    },
  ];

  const rfqs = {};
  for (const r of rfqsData) {
    const created = await prisma.rfq.create({
      data: {
        createdBy: users[r.createdByEmail].id,
        title: r.title,
        deadline: r.deadline,
        status: r.status,
        attachmentUrl: r.attachmentUrl,
      },
    });
    rfqs[r.key] = created;
    console.log(`   ✅ [${r.status.padEnd(7)}] "${r.title}" (deadline: ${r.deadline.toISOString().slice(0, 10)})`);
  }

  // ═════════════════════════════════════════════════════════════
  //  5. RFQ ITEMS  (items for each RFQ)
  //     Table: rfq_items
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 5/12  rfq_items ──');

  const rfqItemsData = [
    // RFQ 1: Laptop Procurement
    { rfqKey: 'rfq1', itemName: 'Dell Latitude 5540',       description: '14-inch business laptop, i7, 16GB RAM, 512GB SSD',  quantity: 50,  unitOfMeasure: 'units' },
    { rfqKey: 'rfq1', itemName: 'Logitech MX Keys',         description: 'Wireless keyboard for business',                    quantity: 50,  unitOfMeasure: 'units' },
    { rfqKey: 'rfq1', itemName: 'Logitech MX Master 3S',    description: 'Wireless ergonomic mouse',                          quantity: 50,  unitOfMeasure: 'units' },
    // RFQ 2: Office Furniture
    { rfqKey: 'rfq2', itemName: 'Executive Office Chair',    description: 'Ergonomic mesh chair with lumbar support',          quantity: 30,  unitOfMeasure: 'units' },
    { rfqKey: 'rfq2', itemName: 'Standing Desk 60x30',      description: 'Electric height-adjustable desk, 60x30 inches',     quantity: 30,  unitOfMeasure: 'units' },
    { rfqKey: 'rfq2', itemName: 'Filing Cabinet 4-Drawer',  description: 'Steel vertical filing cabinet',                     quantity: 15,  unitOfMeasure: 'units' },
    // RFQ 3: Server Infrastructure
    { rfqKey: 'rfq3', itemName: 'Dell PowerEdge R760',       description: '2U rack server, dual Xeon, 256GB RAM',              quantity: 4,   unitOfMeasure: 'units' },
    { rfqKey: 'rfq3', itemName: 'Cisco Catalyst 9300',       description: '48-port managed switch',                            quantity: 2,   unitOfMeasure: 'units' },
  ];

  const rfqItems = {};
  for (const item of rfqItemsData) {
    const created = await prisma.rfqItem.create({
      data: {
        rfqId: rfqs[item.rfqKey].id,
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
      },
    });
    // Store with composite key for later reference
    const key = `${item.rfqKey}_${item.itemName.replace(/\s+/g, '_').toLowerCase()}`;
    rfqItems[key] = created;
    console.log(`   ✅ [${item.rfqKey}] ${item.itemName} × ${item.quantity} ${item.unitOfMeasure}`);
  }

  // ═════════════════════════════════════════════════════════════
  //  6. RFQ VENDOR INVITES  (vendors invited to each RFQ)
  //     Table: rfq_vendor_invites
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 6/12  rfq_vendor_invites ──');

  const invitesData = [
    // RFQ 1 (Laptops) → invite Vendor 1 (Alpha) & Vendor 2 (Beta)
    { rfqKey: 'rfq1', vendorEmail: 'vendor1@example.com' },
    { rfqKey: 'rfq1', vendorEmail: 'vendor2@example.com' },
    // RFQ 2 (Furniture) → invite Vendor 3 (Gamma — Office Supplies)
    { rfqKey: 'rfq2', vendorEmail: 'vendor3@example.com' },
    // RFQ 3 (Servers) → invite Vendor 1 (Alpha) & Vendor 2 (Beta)
    { rfqKey: 'rfq3', vendorEmail: 'vendor1@example.com' },
    { rfqKey: 'rfq3', vendorEmail: 'vendor2@example.com' },
  ];

  for (const inv of invitesData) {
    await prisma.rfqVendorInvite.create({
      data: {
        rfqId: rfqs[inv.rfqKey].id,
        vendorId: vendorProfiles[inv.vendorEmail].id,
      },
    });
    console.log(`   ✅ [${inv.rfqKey}] → ${vendorProfiles[inv.vendorEmail].companyName}`);
  }

  // ═════════════════════════════════════════════════════════════
  //  7. QUOTATIONS  (vendor responses to RFQs)
  //     Table: quotations
  //     Unique constraint: (rfqId, vendorId)
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 7/12  quotations ──');

  const quotationsData = [
    // RFQ 1 — both vendors submitted
    {
      key: 'q1_v1',
      rfqKey: 'rfq1',
      vendorEmail: 'vendor1@example.com',
      deliveryTimelineDays: 14,
      notes: 'We can offer volume discounts for orders above 40 units. Free next-business-day support included for 1 year.',
      status: 'APPROVED',
    },
    {
      key: 'q1_v2',
      rfqKey: 'rfq1',
      vendorEmail: 'vendor2@example.com',
      deliveryTimelineDays: 21,
      notes: 'Standard delivery 21 days. Extended warranty available at 8% additional cost.',
      status: 'REJECTED',
    },
    // RFQ 2 — vendor 3 submitted
    {
      key: 'q2_v3',
      rfqKey: 'rfq2',
      vendorEmail: 'vendor3@example.com',
      deliveryTimelineDays: 30,
      notes: 'Custom ergonomic chairs available. Bulk installation service included. Assembly team dispatched within 3 days of delivery.',
      status: 'SUBMITTED',
    },
    // RFQ 3 — vendor 1 submitted, vendor 2 submitted
    {
      key: 'q3_v1',
      rfqKey: 'rfq3',
      vendorEmail: 'vendor1@example.com',
      deliveryTimelineDays: 45,
      notes: 'Server rack mounting and initial configuration included. 24/7 support for first 6 months.',
      status: 'UNDER_REVIEW',
    },
    {
      key: 'q3_v2',
      rfqKey: 'rfq3',
      vendorEmail: 'vendor2@example.com',
      deliveryTimelineDays: 35,
      notes: 'Faster delivery possible with express shipping (+12%). On-site installation and 3-year warranty included.',
      status: 'UNDER_REVIEW',
    },
  ];

  const quotations = {};
  for (const q of quotationsData) {
    const created = await prisma.quotation.create({
      data: {
        rfqId: rfqs[q.rfqKey].id,
        vendorId: vendorProfiles[q.vendorEmail].id,
        deliveryTimelineDays: q.deliveryTimelineDays,
        notes: q.notes,
        status: q.status,
      },
    });
    quotations[q.key] = created;
    console.log(`   ✅ [${q.status.padEnd(12)}] ${vendorProfiles[q.vendorEmail].companyName} → ${rfqs[q.rfqKey].title.slice(0, 30)}... (${q.deliveryTimelineDays} days)`);
  }

  // ═════════════════════════════════════════════════════════════
  //  8. QUOTATION ITEMS  (line-item pricing from each vendor)
  //     Table: quotation_items
  //     unitPrice is what the vendor quoted per unit
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 8/12  quotation_items ──');

  // Helper to find rfqItem by rfqKey and partial item name
  const findRfqItem = (rfqKey, partialName) => {
    const matchKey = Object.keys(rfqItems).find(
      (k) => k.startsWith(rfqKey) && k.includes(partialName.toLowerCase().replace(/\s+/g, '_'))
    );
    return rfqItems[matchKey];
  };

  const quotationItemsData = [
    // Q1_V1: Alpha's pricing for RFQ 1 (Laptops) — COMPETITIVE
    { quotationKey: 'q1_v1', rfqKey: 'rfq1', itemPartial: 'dell_latitude',      unitPrice: 72500.00 },
    { quotationKey: 'q1_v1', rfqKey: 'rfq1', itemPartial: 'logitech_mx_keys',   unitPrice: 8999.00  },
    { quotationKey: 'q1_v1', rfqKey: 'rfq1', itemPartial: 'logitech_mx_master',  unitPrice: 7499.00  },

    // Q1_V2: Beta's pricing for RFQ 1 (Laptops) — HIGHER
    { quotationKey: 'q1_v2', rfqKey: 'rfq1', itemPartial: 'dell_latitude',      unitPrice: 78000.00 },
    { quotationKey: 'q1_v2', rfqKey: 'rfq1', itemPartial: 'logitech_mx_keys',   unitPrice: 9500.00  },
    { quotationKey: 'q1_v2', rfqKey: 'rfq1', itemPartial: 'logitech_mx_master',  unitPrice: 7999.00  },

    // Q2_V3: Gamma's pricing for RFQ 2 (Furniture)
    { quotationKey: 'q2_v3', rfqKey: 'rfq2', itemPartial: 'executive_office',   unitPrice: 18500.00 },
    { quotationKey: 'q2_v3', rfqKey: 'rfq2', itemPartial: 'standing_desk',      unitPrice: 32000.00 },
    { quotationKey: 'q2_v3', rfqKey: 'rfq2', itemPartial: 'filing_cabinet',     unitPrice: 8750.00  },

    // Q3_V1: Alpha's pricing for RFQ 3 (Servers)
    { quotationKey: 'q3_v1', rfqKey: 'rfq3', itemPartial: 'dell_poweredge',     unitPrice: 485000.00 },
    { quotationKey: 'q3_v1', rfqKey: 'rfq3', itemPartial: 'cisco_catalyst',     unitPrice: 225000.00 },

    // Q3_V2: Beta's pricing for RFQ 3 (Servers) — slightly cheaper
    { quotationKey: 'q3_v2', rfqKey: 'rfq3', itemPartial: 'dell_poweredge',     unitPrice: 470000.00 },
    { quotationKey: 'q3_v2', rfqKey: 'rfq3', itemPartial: 'cisco_catalyst',     unitPrice: 218000.00 },
  ];

  for (const qi of quotationItemsData) {
    const rfqItem = findRfqItem(qi.rfqKey, qi.itemPartial);
    await prisma.quotationItem.create({
      data: {
        quotationId: quotations[qi.quotationKey].id,
        rfqItemId: rfqItem.id,
        unitPrice: qi.unitPrice,
      },
    });
    const totalLine = (qi.unitPrice * rfqItem.quantity).toLocaleString('en-IN');
    console.log(`   ✅ [${qi.quotationKey}] ${rfqItem.itemName}: ₹${qi.unitPrice.toLocaleString('en-IN')}/unit × ${rfqItem.quantity} = ₹${totalLine}`);
  }

  // ═════════════════════════════════════════════════════════════
  //  9. APPROVALS  (manager decisions on quotations)
  //     Table: approvals
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 9/12  approvals ──');

  const approvalsData = [
    // RFQ 1: Alpha APPROVED, Beta REJECTED by approver1
    {
      quotationKey: 'q1_v1',
      approverEmail: 'approver@vendorbridge.com',
      status: 'APPROVED',
      previousStatus: 'UNDER_REVIEW',
      remarks: 'Alpha offers best price-to-value ratio with faster delivery and free support. Approved.',
      actedAt: new Date('2026-06-05T10:30:00Z'),
    },
    {
      quotationKey: 'q1_v2',
      approverEmail: 'approver@vendorbridge.com',
      status: 'REJECTED',
      previousStatus: 'UNDER_REVIEW',
      remarks: 'Beta pricing is 7-8% higher with slower delivery. Rejected in favor of Alpha.',
      actedAt: new Date('2026-06-05T10:35:00Z'),
    },
    // RFQ 3: Both under review, assigned to approver2, PENDING
    {
      quotationKey: 'q3_v1',
      approverEmail: 'approver2@vendorbridge.com',
      status: 'PENDING',
      previousStatus: 'SUBMITTED',
      remarks: null,
      actedAt: null,
    },
    {
      quotationKey: 'q3_v2',
      approverEmail: 'approver2@vendorbridge.com',
      status: 'PENDING',
      previousStatus: 'SUBMITTED',
      remarks: null,
      actedAt: null,
    },
  ];

  const approvals = {};
  for (const a of approvalsData) {
    const created = await prisma.approval.create({
      data: {
        quotationId: quotations[a.quotationKey].id,
        approverId: users[a.approverEmail].id,
        status: a.status,
        previousStatus: a.previousStatus,
        remarks: a.remarks,
        actedAt: a.actedAt,
      },
    });
    approvals[a.quotationKey] = created;
    const vendorName = a.quotationKey.includes('v1') ? 'Alpha' : a.quotationKey.includes('v2') ? 'Beta' : 'Gamma';
    console.log(`   ✅ [${a.status.padEnd(8)}] ${vendorName}'s quote → by ${a.approverEmail}${a.remarks ? ` — "${a.remarks.slice(0, 50)}..."` : ''}`);
  }

  // ═════════════════════════════════════════════════════════════
  //  10. PURCHASE ORDERS  (generated from approved quotations)
  //      Table: purchase_orders
  //      Only q1_v1 was approved → 1 PO
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 10/12  purchase_orders ──');

  const poNumber1 = generatePoNumber(1);

  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: poNumber1,
      quotationId: quotations['q1_v1'].id,
      issuedBy: users['officer@vendorbridge.com'].id,
      status: 'ISSUED',
    },
  });
  console.log(`   ✅ ${poNumber1} → Alpha Supplies (Laptop Procurement), status: ISSUED`);
  console.log(`      Issued by: officer@vendorbridge.com`);
  console.log(`      Quotation total: ₹${((72500 * 50) + (8999 * 50) + (7499 * 50)).toLocaleString('en-IN')}`);

  // ═════════════════════════════════════════════════════════════
  //  11. INVOICES  (generated from purchase orders)
  //      Table: invoices
  //      PO1 → 1 invoice with 18% GST
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 11/12  invoices ──');

  // Calculate from quotation items:
  // Dell Latitude: 72500 × 50 = 3,625,000
  // MX Keys:       8999 × 50  =   449,950
  // MX Master:     7499 × 50  =   374,950
  // Subtotal:                    4,449,900
  const subtotal = 72500 * 50 + 8999 * 50 + 7499 * 50; // 4,449,900
  const taxPercentage = 18.00;
  const taxAmount = subtotal * (taxPercentage / 100);     // 800,982
  const totalAmount = subtotal + taxAmount;                // 5,250,882

  const invNumber1 = generateInvoiceNumber(1);

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: invNumber1,
      poId: po1.id,
      subtotal,
      taxPercentage,
      taxAmount,
      totalAmount,
      status: 'SENT',
      emailedAt: new Date('2026-06-05T14:00:00Z'),
    },
  });
  console.log(`   ✅ ${invNumber1}`);
  console.log(`      Subtotal:       ₹${subtotal.toLocaleString('en-IN')}`);
  console.log(`      Tax (${taxPercentage}% GST): ₹${taxAmount.toLocaleString('en-IN')}`);
  console.log(`      Total:          ₹${totalAmount.toLocaleString('en-IN')}`);
  console.log(`      Status: SENT | Emailed at: 2026-06-05T14:00:00Z`);

  // ═════════════════════════════════════════════════════════════
  //  12. ACTIVITY LOGS  (audit trail of procurement actions)
  //      Table: activity_logs
  // ═════════════════════════════════════════════════════════════
  console.log('\n── 12/12  activity_logs ──');

  const logsData = [
    {
      userId: users['officer@vendorbridge.com'].id,
      action: 'RFQ_CREATED',
      entityType: 'RFQ',
      entityId: rfqs['rfq1'].id,
      description: 'RFQ "Laptop Procurement Q3 2026" created with 3 items, invited 2 vendors (Alpha Supplies, Beta Technologies).',
      ipAddress: '192.168.1.10',
    },
    {
      userId: users['officer@vendorbridge.com'].id,
      action: 'RFQ_CREATED',
      entityType: 'RFQ',
      entityId: rfqs['rfq2'].id,
      description: 'RFQ "Office Furniture — New Branch Setup" created with 3 items, invited 1 vendor (Gamma Office Solutions).',
      ipAddress: '192.168.1.10',
    },
    {
      userId: users['officer2@vendorbridge.com'].id,
      action: 'RFQ_CREATED',
      entityType: 'RFQ',
      entityId: rfqs['rfq3'].id,
      description: 'RFQ "Server Infrastructure Upgrade" created with 2 items, invited 2 vendors (Alpha Supplies, Beta Technologies).',
      ipAddress: '192.168.1.15',
    },
    {
      userId: users['vendor1@example.com'].id,
      action: 'QUOTATION_SUBMITTED',
      entityType: 'QUOTATION',
      entityId: quotations['q1_v1'].id,
      description: 'Alpha Supplies submitted quotation for "Laptop Procurement Q3 2026" — 14 days delivery, total ₹44,49,900.',
      ipAddress: '203.0.113.45',
    },
    {
      userId: users['vendor2@example.com'].id,
      action: 'QUOTATION_SUBMITTED',
      entityType: 'QUOTATION',
      entityId: quotations['q1_v2'].id,
      description: 'Beta Technologies submitted quotation for "Laptop Procurement Q3 2026" — 21 days delivery, total ₹47,74,950.',
      ipAddress: '203.0.113.78',
    },
    {
      userId: users['vendor3@example.com'].id,
      action: 'QUOTATION_SUBMITTED',
      entityType: 'QUOTATION',
      entityId: quotations['q2_v3'].id,
      description: 'Gamma Office Solutions submitted quotation for "Office Furniture" — 30 days delivery.',
      ipAddress: '203.0.113.120',
    },
    {
      userId: users['officer@vendorbridge.com'].id,
      action: 'QUOTATION_SENT_FOR_APPROVAL',
      entityType: 'QUOTATION',
      entityId: quotations['q1_v1'].id,
      description: 'Alpha\'s quotation for RFQ "Laptop Procurement" sent to approver Sunita Desai for approval.',
      ipAddress: '192.168.1.10',
    },
    {
      userId: users['approver@vendorbridge.com'].id,
      action: 'APPROVAL_APPROVED',
      entityType: 'APPROVAL',
      entityId: approvals['q1_v1'].id,
      description: 'Approved Alpha Supplies quotation. Reason: Best price-to-value ratio with faster delivery.',
      ipAddress: '192.168.1.20',
    },
    {
      userId: users['approver@vendorbridge.com'].id,
      action: 'APPROVAL_REJECTED',
      entityType: 'APPROVAL',
      entityId: approvals['q1_v2'].id,
      description: 'Rejected Beta Technologies quotation. Reason: 7-8% higher pricing with slower delivery.',
      ipAddress: '192.168.1.20',
    },
    {
      userId: users['officer@vendorbridge.com'].id,
      action: 'PO_CREATED',
      entityType: 'PURCHASE_ORDER',
      entityId: po1.id,
      description: `Purchase Order ${poNumber1} created for Alpha Supplies — Laptop Procurement Q3 2026.`,
      ipAddress: '192.168.1.10',
    },
    {
      userId: users['officer@vendorbridge.com'].id,
      action: 'INVOICE_GENERATED',
      entityType: 'INVOICE',
      entityId: invoice1.id,
      description: `Invoice ${invNumber1} generated from PO ${poNumber1}. Total: ₹${totalAmount.toLocaleString('en-IN')} (incl. 18% GST).`,
      ipAddress: '192.168.1.10',
    },
    {
      userId: users['officer@vendorbridge.com'].id,
      action: 'INVOICE_EMAILED',
      entityType: 'INVOICE',
      entityId: invoice1.id,
      description: `Invoice ${invNumber1} emailed to vendor1@example.com (Alpha Supplies Pvt. Ltd.)`,
      ipAddress: '192.168.1.10',
    },
    {
      userId: users['officer@vendorbridge.com'].id,
      action: 'RFQ_STATUS_UPDATED',
      entityType: 'RFQ',
      entityId: rfqs['rfq1'].id,
      description: 'RFQ "Laptop Procurement Q3 2026" status changed from CLOSED to AWARDED.',
      ipAddress: '192.168.1.10',
    },
    {
      userId: users['vendor1@example.com'].id,
      action: 'QUOTATION_SUBMITTED',
      entityType: 'QUOTATION',
      entityId: quotations['q3_v1'].id,
      description: 'Alpha Supplies submitted quotation for "Server Infrastructure Upgrade" — 45 days delivery.',
      ipAddress: '203.0.113.45',
    },
    {
      userId: users['vendor2@example.com'].id,
      action: 'QUOTATION_SUBMITTED',
      entityType: 'QUOTATION',
      entityId: quotations['q3_v2'].id,
      description: 'Beta Technologies submitted quotation for "Server Infrastructure Upgrade" — 35 days delivery.',
      ipAddress: '203.0.113.78',
    },
  ];

  for (const log of logsData) {
    await prisma.activityLog.create({ data: log });
    console.log(`   ✅ [${log.action}] ${log.description.slice(0, 80)}...`);
  }

  // ═════════════════════════════════════════════════════════════
  //  SUMMARY
  // ═════════════════════════════════════════════════════════════
  console.log('\n\n🎉 ═══ SEEDING COMPLETE ═══════════════════════════════════════');
  console.log('');
  console.log('   Tables seeded:     12/12');
  console.log('   Users:             8  (1 admin, 2 officers, 2 approvers, 3 vendors)');
  console.log('   Vendor Profiles:   3');
  console.log('   Reset Tokens:      2  (1 active, 1 expired)');
  console.log('   RFQs:              3  (AWARDED, ACTIVE, CLOSED)');
  console.log('   RFQ Items:         8');
  console.log('   Vendor Invites:    5');
  console.log('   Quotations:        5  (APPROVED, REJECTED, SUBMITTED, 2×UNDER_REVIEW)');
  console.log('   Quotation Items:   14');
  console.log('   Approvals:         4  (2 decided, 2 pending)');
  console.log('   Purchase Orders:   1');
  console.log('   Invoices:          1  (SENT, emailed)');
  console.log('   Activity Logs:     15');
  console.log('');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  LOGIN CREDENTIALS                                         │');
  console.log('├──────────────────────────────────┬──────────┬──────────────┤');
  console.log('│  Email                           │ Password │ Role         │');
  console.log('├──────────────────────────────────┼──────────┼──────────────┤');
  console.log('│  admin@vendorbridge.com          │ admin123 │ ADMIN        │');
  console.log('│  officer@vendorbridge.com        │ officer1 │ OFFICER      │');
  console.log('│  officer2@vendorbridge.com       │ officer2 │ OFFICER      │');
  console.log('│  approver@vendorbridge.com       │ approve1 │ APPROVER     │');
  console.log('│  approver2@vendorbridge.com      │ approve2 │ APPROVER     │');
  console.log('│  vendor1@example.com             │ vendor11 │ VENDOR       │');
  console.log('│  vendor2@example.com             │ vendor22 │ VENDOR       │');
  console.log('│  vendor3@example.com             │ vendor33 │ VENDOR       │');
  console.log('└──────────────────────────────────┴──────────┴──────────────┘');
  console.log('');
}

// ─── Run ─────────────────────────────────────────────────────
main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
