Pivoting to Express and Node.js is a great move for a high-speed hackathon sprint. It allows for incredibly rapid iteration, and setting up an `express.Router()` architecture means you and your co-developer can work in completely separate files without ever triggering a Git merge conflict.

To divide this perfectly for two backend developers, we will split the application vertically. **Developer A** will handle Identity, Catalog, and the beginning of the procurement funnel. **Developer B** will handle the downstream financials, approvals, and the heavier I/O tasks like PDF generation and mailing.

Here is your complete Node/Express routing specification, isolated for two developers.

---

### **Developer A: Identity, Catalog & Sourcing**

**Focus:** Authentication, User/Vendor management, and RFQ generation.
**File Isolation:** `routes/auth.js`, `routes/users.js`, `routes/vendors.js`, `routes/rfqs.js`

#### 1. Auth Router (`/api/auth`)

* **`POST /signup`**
* **Input (`req.body`):** `email`, `password`, `role`, `companyName`, `gstNumber`, `category`
* **Process:** Hash password (bcrypt). Insert into `users`. If role is VENDOR, insert into `vendor_profiles` in the same transaction.
* **Output (`res.json`):** `{ token: "jwt_string", user: {...} }`


* **`POST /login`**
* **Input (`req.body`):** `email`, `password`
* **Process:** Compare bcrypt hash. Generate JWT payload containing `userId` and `role`.
* **Output (`res.json`):** `{ token: "jwt_string", user: {...} }`


* **`POST /forgot-password`**
* **Input (`req.body`):** `email`
* **Process:** Generate crypto token, save to `password_reset_tokens` with 15m expiration, send email via Nodemailer.
* **Output (`res.json`):** `{ message: "Reset link sent" }`


* **`POST /reset-password`**
* **Input (`req.body`):** `token`, `newPassword`
* **Process:** Validate token against DB and expiration. Hash new password. Update user. Delete token.
* **Output (`res.json`):** `{ message: "Password updated" }`


* **`GET /me`**
* **Input (`req.headers`):** Authorization Bearer Token
* **Process:** Decode JWT, fetch `users` record (and `vendor_profiles` if applicable).
* **Output (`res.json`):** `{ id, email, role, vendorProfile: {...} }`



#### 2. Directory Router (`/api/directory`)

* **`GET /users`**
* **Input (`req.query`):** `role` (optional filter)
* **Process:** `SELECT * FROM users WHERE role = ?`
* **Output (`res.json`):** Array of user objects.


* **`GET /vendors`**
* **Input (`req.query`):** `category` (optional filter)
* **Process:** Join `vendor_profiles` with `users` to return active vendors.
* **Output (`res.json`):** Array of vendor profiles.


* **`PATCH /vendors/:id`**
* **Input (`req.params`):** `id` | **(`req.body`):** `contactPhone`, `category`
* **Process:** Update `vendor_profiles` by ID.
* **Output (`res.json`):** Updated vendor object.



#### 3. RFQ Router (`/api/rfqs`)

* **`GET /`**
* **Input (`req.user` from JWT middleware):** `id`, `role`
* **Process:** If `role === 'OFFICER'`, return all. If `role === 'VENDOR'`, join `rfq_vendor_invites` and return only RFQs mapped to their `vendor_id`.
* **Output (`res.json`):** Array of RFQs.


* **`GET /:id`**
* **Input (`req.params`):** `id`
* **Process:** Fetch RFQ, join `rfq_items` and `rfq_vendor_invites`.
* **Output (`res.json`):** `{ id, title, items: [...], invitedVendors: [...] }`


* **`POST /`**
* **Input (`req.body`):** `title`, `deadline`, `attachmentUrl`, `items` (Array), `vendorIds` (Array)
* **Process:** DB Transaction: Insert `rfqs` -> Bulk insert `rfq_items` -> Bulk insert `rfq_vendor_invites`. Log to `activity_logs`.
* **Output (`res.json`):** Created RFQ object.


* **`PATCH /:id`**
* **Input (`req.params`):** `id` | **(`req.body`):** `status`
* **Process:** Update RFQ status.
* **Output (`res.json`):** Updated RFQ.



---

### **Developer B: Bidding, Approvals & Financials**

**Focus:** The transaction lifecycle. This involves heavier SQL aggregation and Node utilities (PDF/Email).
**File Isolation:** `routes/quotations.js`, `routes/approvals.js`, `routes/financials.js`, `routes/analytics.js`

#### 4. Quotations Router (`/api/quotations`)

* **`POST /`**
* **Input (`req.body`):** `rfqId`, `deliveryTimelineDays`, `notes`, `items` (Array of `{ rfqItemId, unitPrice }`)
* **Process:** Verify `uq_vendor_rfq_quote` constraint. Insert `quotations` -> Bulk insert `quotation_items`.
* **Output (`res.json`):** Created quotation.


* **`GET /rfq/:rfqId`**
* **Input (`req.params`):** `rfqId`
* **Process:** Fetch quotes for RFQ. Run mathematical aggregation: `SUM(rfq_items.quantity * quotation_items.unit_price)` as `totalPrice`.
* **Output (`res.json`):** Array of quotes with dynamic totals (for the comparison screen).


* **`PATCH /:id/status`**
* **Input (`req.params`):** `id` | **(`req.body`):** `status`, `approverId`
* **Process:** Update quote to `UNDER_REVIEW`. Create `PENDING` record in `approvals` table assigned to `approverId`.
* **Output (`res.json`):** Updated quotation.



#### 5. Approvals Router (`/api/approvals`)

* **`GET /`**
* **Input (`req.user`):** `id` (Manager's ID)
* **Process:** Select all from `approvals` where `approver_id = req.user.id` and `status = 'PENDING'`. Join RFQ details.
* **Output (`res.json`):** Array of pending approvals.


* **`PATCH /:id`**
* **Input (`req.params`):** `id` | **(`req.body`):** `status` (APPROVED/REJECTED), `remarks`
* **Process:** DB Transaction: Update `approvals` -> Update `quotations` status -> If APPROVED, insert new record into `purchase_orders`.
* **Output (`res.json`):** `{ message: "Approval recorded", poId: "..." }`



#### 6. Financials Router (`/api/financials`)

* **`GET /purchase-orders`**
* **Input (`req.user`):** `id`, `role`
* **Process:** Context-aware fetch. Officers see all; Vendors see only theirs.
* **Output (`res.json`):** Array of POs.


* **`POST /invoices`**
* **Input (`req.body`):** `poId`, `taxPercentage`
* **Process:** Calculate `subtotal` from PO items. Calculate `taxAmount` and `totalAmount`. Insert into `invoices`.
* **Output (`res.json`):** Created invoice object.


* **`GET /invoices`**
* **Input (`req.user`):** `id`, `role`
* **Process:** Context-aware fetch for invoice history.
* **Output (`res.json`):** Array of invoices.


* **`GET /invoices/:id/pdf`**
* **Input (`req.params`):** `id`
* **Process:** Generate PDF stream using `pdfkit` or `puppeteer` populated with invoice and vendor details. Set headers for `application/pdf`.
* **Output (`res.send`):** Binary PDF stream.


* **`POST /invoices/:id/email`**
* **Input (`req.params`):** `id`
* **Process:** Generate PDF in memory, attach to Nodemailer payload, send to vendor email, update `emailed_at` in DB.
* **Output (`res.json`):** `{ message: "Invoice emailed successfully" }`



#### 7. Analytics & Logs Router (`/api/analytics`)

* **`GET /activity-logs`**
* **Input (`req.query`):** `entityId`, `userId`
* **Process:** Fetch from `activity_logs`. Serves as the notification feed for the frontend.
* **Output (`res.json`):** Array of logs.


* **`GET /dashboard`**
* **Input:** None
* **Process:** Execute aggregate `COUNT(*)` queries across RFQs, POs, Invoices, and Approvals.
* **Output (`res.json`):** `{ activeRfqs: 12, pendingApprovals: 5, purchaseOrders: 10, invoices: 8 }`



---

Are you planning to use an ORM like Prisma or Sequelize for this Express setup, so we can lock in exactly how those nested insertions and joins will be written?