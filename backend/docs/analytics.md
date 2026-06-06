## Overview
This router handles Analytics operations, including retrieving activity logs (notification feed) and dashboard statistics for the procurement system.

All endpoints require a **JWT access token**.

---

### **Test Case 1: Get Activity Logs**
Retrieves a filterable activity log feed (notification center).

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/analytics/activity-logs`
* **Authentication:** Required (regular JWT)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Query Parameters:**
  * `entityId` (optional): Filter logs by a specific entity ID.
  * `userId` (optional): Filter logs by a specific user ID.
* **Expected Successful Response (200):**
  ```json
  [
    {
      "id": "log123",
      "action": "RFQ_CREATED",
      "description": "RFQ created successfully",
      "createdAt": "2026-06-06T10:00:00Z"
    }
  ]
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT token
  * **500 Internal Server Error** – Server-side error retrieving logs

---

### **Test Case 2: Get Dashboard Stats**
Retrieves aggregate procurement statistics.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/analytics/dashboard`
* **Authentication:** Required (regular JWT)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  {
    "totalPurchaseOrders": 150,
    "totalInvoices": 120,
    "pendingApprovals": 5
  }
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT token
  * **500 Internal Server Error** – Server-side error retrieving dashboard stats

---

## Notes
* The dashboard endpoint aggregates data across multiple modules depending on the authenticated user's role.
