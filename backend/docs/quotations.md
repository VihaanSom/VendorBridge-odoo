## Overview
This router handles Quotation operations: submitting quotes for RFQs, listing quotes by RFQ, and sending quotes for approval review.

All endpoints require a **JWT access token**.

---

### **Test Case 1: Create Quotation**
Allows a vendor to submit a quotation for an active RFQ, including item-level pricing details.

* **HTTP Method:** `POST`
* **Endpoint URL:** `http://localhost:5000/api/quotations`
* **Authentication:** Required (JWT, VENDOR role only)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "rfqId": "rfq123",
    "deliveryTimelineDays": 14,
    "notes": "Includes free shipping.",
    "items": [
      {
        "rfqItemId": "item123",
        "unitPrice": 500.00,
        "remarks": "High quality"
      }
    ]
  }
  ```
  * `rfqId` (required): The ID of the RFQ
  * `deliveryTimelineDays` (required): Estimated days for delivery
  * `notes` (optional): Additional terms or notes
  * `items` (required): Non-empty array of pricing per RFQ item
* **Expected Successful Response (201):**
  ```json
  {
    "id": "quo123",
    "status": "SUBMITTED",
    "totalPrice": 500.00
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing fields or empty items array
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions (not a VENDOR)
  * **404 Not Found** – Vendor profile not found

---

### **Test Case 2: Get Quotations by RFQ**
Retrieves all submitted quotations for a specific RFQ.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/quotations/rfq/:rfqId`
* **Authentication:** Required (JWT, OFFICER, ADMIN, or APPROVER role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  [
    {
      "id": "quo123",
      "vendorId": "ven123",
      "totalPrice": 500.00
    }
  ]
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions

---

### **Test Case 3: Update Quotation Status (Request Review)**
Sends a quotation to an approver for review, creating a PENDING approval record.

* **HTTP Method:** `PATCH`
* **Endpoint URL:** `http://localhost:5000/api/quotations/:id/status`
* **Authentication:** Required (JWT, OFFICER or ADMIN role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "approverId": "usr_approver_123"
  }
  ```
  * `approverId` (required): User ID of the designated approver
* **Expected Successful Response (200):**
  ```json
  {
    "id": "quo123",
    "status": "IN_REVIEW"
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing `approverId`
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions
  * **404 Not Found** – Quotation not found

---

## Notes
* Creating a quotation operates inside a database transaction to ensure all items are saved atomically.
