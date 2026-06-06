## Overview
This router handles Approval operations: listing pending approvals for the current approver and processing (approving/rejecting) an approval request.

All endpoints require a **JWT access token** with the `APPROVER` role.

---

### **Test Case 1: List Pending Approvals**
Retrieves a list of pending approvals assigned to the current approver.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/approvals`
* **Authentication:** Required (JWT, APPROVER role only)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  [
    {
      "id": "app123",
      "status": "PENDING",
      "entityType": "QUOTATION",
      "entityId": "quo123"
    }
  ]
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT token
  * **403 Forbidden** – User does not have the APPROVER role
  * **500 Internal Server Error** – Server-side error retrieving approvals

---

### **Test Case 2: Process Approval**
Approves or rejects a pending request. This is a transactional operation that cascades changes (e.g., from approval to quotation to PO).

* **HTTP Method:** `PATCH`
* **Endpoint URL:** `http://localhost:5000/api/approvals/:id`
* **Authentication:** Required (JWT, APPROVER role only)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "status": "APPROVED",
    "remarks": "Looks good to proceed."
  }
  ```
  * `status` (required): Must be either `APPROVED` or `REJECTED`.
  * `remarks` (optional): Additional comments from the approver.
* **Expected Successful Response (200):**
  ```json
  {
    "id": "app123",
    "status": "APPROVED",
    "remarks": "Looks good to proceed."
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing or invalid `status` value
  * **401 Unauthorized** – Missing or invalid JWT token
  * **403 Forbidden** – User does not have the APPROVER role
  * **500 Internal Server Error** – Transaction failure

---

## Notes
* Processing an approval can trigger downstream actions like generating a Purchase Order if a Quotation is approved.
