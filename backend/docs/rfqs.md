## Overview
This router handles Request for Quotation (RFQ) operations: creating new RFQs, retrieving RFQ details, listing RFQs contextually, and updating RFQ statuses.

All endpoints require a **JWT access token**.

---

### **Test Case 1: List RFQs**
Retrieves a list of RFQs. Officers/Admins see all RFQs, while Vendors only see RFQs they have been explicitly invited to.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/rfqs`
* **Authentication:** Required (JWT, OFFICER, ADMIN, or VENDOR role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  [
    {
      "id": "rfq123",
      "title": "Office Supplies",
      "status": "ACTIVE"
    }
  ]
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions
  * **404 Not Found** – Vendor profile not found (if accessed by VENDOR)

---

### **Test Case 2: Get Single RFQ**
Retrieves detailed information for a specific RFQ, including its items and invited vendors. If accessed by a VENDOR, checks if they are invited.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/rfqs/:id`
* **Authentication:** Required (JWT, any authenticated user)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  {
    "id": "rfq123",
    "title": "Office Supplies",
    "items": [],
    "vendorInvites": []
  }
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Vendor not invited to this RFQ
  * **404 Not Found** – RFQ not found

---

### **Test Case 3: Create RFQ**
Creates a new RFQ, its line items, and vendor invitations in a single transaction.

* **HTTP Method:** `POST`
* **Endpoint URL:** `http://localhost:5000/api/rfqs`
* **Authentication:** Required (JWT, OFFICER role only)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "title": "New Laptops",
    "deadline": "2026-07-01T00:00:00Z",
    "attachmentUrl": "http://example.com/spec.pdf",
    "items": [
      {
        "itemName": "MacBook Pro",
        "quantity": 10,
        "unitOfMeasure": "pcs"
      }
    ],
    "vendorIds": ["ven123", "ven456"]
  }
  ```
  * `title`, `deadline`, `items`, `vendorIds` (required)
* **Expected Successful Response (201):**
  ```json
  {
    "id": "rfq124",
    "title": "New Laptops",
    "status": "ACTIVE"
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing fields, empty arrays, or invalid vendor IDs
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions

---

### **Test Case 4: Update RFQ Status**
Updates the status of an RFQ following allowed state transitions.

* **HTTP Method:** `PATCH`
* **Endpoint URL:** `http://localhost:5000/api/rfqs/:id`
* **Authentication:** Required (JWT, OFFICER or ADMIN role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "status": "CLOSED"
  }
  ```
  * `status` (required): The new status to transition to
* **Expected Successful Response (200):**
  ```json
  {
    "id": "rfq123",
    "status": "CLOSED"
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing status, invalid status, or invalid transition
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions
  * **404 Not Found** – RFQ not found

---

## Notes
* Allowed RFQ status transitions are: `DRAFT` → `ACTIVE` → `CLOSED` → `AWARDED`.
* RFQ creation automatically logs an activity event.
