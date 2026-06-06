## Overview
This router handles Financial operations: viewing purchase orders, creating invoices, viewing invoices, and sending invoice documents.

All endpoints require a **JWT access token** and are context-aware based on the user's role.

---

### **Test Case 1: List Purchase Orders**
Retrieves purchase orders. Officers/Admins see all POs, while Vendors only see their own.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/financials/purchase-orders`
* **Authentication:** Required (JWT, OFFICER, ADMIN, or VENDOR role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  [
    {
      "id": "po123",
      "poNumber": "PO-2026-001",
      "totalAmount": 5000.00
    }
  ]
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions

---

### **Test Case 2: Create Invoice**
Generates a new invoice from an existing Purchase Order.

* **HTTP Method:** `POST`
* **Endpoint URL:** `http://localhost:5000/api/financials/invoices`
* **Authentication:** Required (JWT, OFFICER or ADMIN role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "poId": "po123",
    "taxPercentage": 10.5
  }
  ```
  * `poId` (required): ID of the Purchase Order
  * `taxPercentage` (required): Tax percentage to apply (non-negative number)
* **Expected Successful Response (201):**
  ```json
  {
    "id": "inv123",
    "invoiceNumber": "INV-2026-001",
    "taxAmount": 525.00
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing/invalid `poId` or `taxPercentage`
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions

---

### **Test Case 3: List Invoices**
Retrieves a list of invoices. Context-aware (Officers see all, Vendors see theirs).

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/financials/invoices`
* **Authentication:** Required (JWT, OFFICER, ADMIN, or VENDOR role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  [
    {
      "id": "inv123",
      "invoiceNumber": "INV-2026-001"
    }
  ]
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT

---

### **Test Case 4: Download Invoice PDF**
Downloads the specified invoice as a PDF file.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/financials/invoices/:id/pdf`
* **Authentication:** Required (JWT, OFFICER, ADMIN, or VENDOR role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  * `Content-Type: application/pdf`
  * Binary PDF data
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT
  * **404 Not Found** – Invoice not found

---

### **Test Case 5: Email Invoice**
Sends the invoice document to the vendor's email address.

* **HTTP Method:** `POST`
* **Endpoint URL:** `http://localhost:5000/api/financials/invoices/:id/email`
* **Authentication:** Required (JWT, OFFICER or ADMIN role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  {
    "message": "Invoice emailed successfully"
  }
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT
  * **404 Not Found** – Invoice not found

---

## Notes
* PDF generation uses placeholder logic. Actual PDF buffer rendering is implemented in the service layer.
