## Overview
This router handles Directory operations: viewing all system users and managing vendor profiles. 

All endpoints require a **JWT access token** with role-based restrictions.

---

### **Test Case 1: List Users**
Retrieves a list of all registered users in the system.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/directory/users`
* **Authentication:** Required (JWT, ADMIN role only)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Query Parameters:**
  * `role` (optional): Filter users by a specific role (e.g., `VENDOR`, `OFFICER`).
* **Expected Successful Response (200):**
  ```json
  [
    {
      "id": "usr123",
      "email": "admin@example.com",
      "role": "ADMIN",
      "isActive": true
    }
  ]
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Invalid role filter
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions (not an ADMIN)

---

### **Test Case 2: List Vendors**
Retrieves a list of registered vendor profiles.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/directory/vendors`
* **Authentication:** Required (JWT, ADMIN or OFFICER role)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Query Parameters:**
  * `category` (optional): Filter vendors by category.
* **Expected Successful Response (200):**
  ```json
  [
    {
      "id": "ven123",
      "companyName": "Acme Corp",
      "category": "Hardware",
      "user": {
        "email": "vendor@example.com"
      }
    }
  ]
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions

---

### **Test Case 3: Update Vendor Profile**
Updates details or the status of a specific vendor profile.

* **HTTP Method:** `PATCH`
* **Endpoint URL:** `http://localhost:5000/api/directory/vendors/:id`
* **Authentication:** Required (JWT, ADMIN role only)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "vendorStatus": "ACTIVE",
    "contactPhone": "0987654321"
  }
  ```
  * `contactPhone` (optional): Update vendor contact number
  * `category` (optional): Update vendor category
  * `vendorStatus` (optional): Update status (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
* **Expected Successful Response (200):**
  ```json
  {
    "id": "ven123",
    "vendorStatus": "ACTIVE",
    "contactPhone": "0987654321"
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Invalid status or no valid fields provided
  * **401 Unauthorized** – Missing or invalid JWT
  * **403 Forbidden** – Insufficient permissions (not an ADMIN)
  * **404 Not Found** – Vendor not found

---

## Notes
* Updating a vendor's status to `SUSPENDED` prevents them from interacting with new RFQs.
