## Overview
This router handles Authentication operations: user signup, login, password resets, and fetching current user profile details.

---

### **Test Case 1: User Signup**
Registers a new user account. If the role is VENDOR, it also creates an associated vendor profile.

* **HTTP Method:** `POST`
* **Endpoint URL:** `http://localhost:5000/api/auth/signup`
* **Authentication:** None
* **Request Headers:**
  ```http
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "email": "vendor@example.com",
    "password": "securepassword",
    "role": "VENDOR",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Acme Corp",
    "gstNumber": "GST12345",
    "category": "Hardware",
    "contactPhone": "1234567890"
  }
  ```
  * `email` (required): User's email address
  * `password` (required): User's password (min 6 chars)
  * `role` (required): One of `ADMIN`, `OFFICER`, `VENDOR`, `APPROVER`
  * `companyName`, `gstNumber`, `category` (required if role is VENDOR)
* **Expected Successful Response (201):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "id": "usr123",
      "email": "vendor@example.com",
      "role": "VENDOR"
    }
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing required fields or validation errors
  * **409 Conflict** – Email already registered
  * **500 Internal Server Error** – Database transaction error

---

### **Test Case 2: User Login**
Authenticates a user and returns a JWT token.

* **HTTP Method:** `POST`
* **Endpoint URL:** `http://localhost:5000/api/auth/login`
* **Authentication:** None
* **Request Headers:**
  ```http
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "email": "vendor@example.com",
    "password": "securepassword"
  }
  ```
* **Expected Successful Response (200):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "id": "usr123",
      "email": "vendor@example.com",
      "role": "VENDOR"
    }
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing email or password
  * **401 Unauthorized** – Invalid credentials
  * **403 Forbidden** – Account deactivated

---

### **Test Case 3: Request Password Reset**
Generates a password reset token and sends it via email.

* **HTTP Method:** `POST`
* **Endpoint URL:** `http://localhost:5000/api/auth/forgot-password`
* **Authentication:** None
* **Request Headers:**
  ```http
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "email": "vendor@example.com"
  }
  ```
* **Expected Successful Response (200):**
  ```json
  {
    "message": "If that email exists, a reset link has been sent."
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Missing email

---

### **Test Case 4: Reset Password**
Updates the user's password using a valid reset token.

* **HTTP Method:** `POST`
* **Endpoint URL:** `http://localhost:5000/api/auth/reset-password`
* **Authentication:** None
* **Request Headers:**
  ```http
  Content-Type: application/json
  ```
* **Body:**
  ```json
  {
    "token": "randomhexstring32chars...",
    "newPassword": "newsecurepassword"
  }
  ```
* **Expected Successful Response (200):**
  ```json
  {
    "message": "Password updated successfully."
  }
  ```
* **Expected Error Responses:**
  * **400 Bad Request** – Invalid/expired token, or missing fields

---

### **Test Case 5: Get Current User**
Retrieves details of the currently authenticated user.

* **HTTP Method:** `GET`
* **Endpoint URL:** `http://localhost:5000/api/auth/me`
* **Authentication:** Required (regular JWT)
* **Request Headers:**
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
* **Expected Successful Response (200):**
  ```json
  {
    "id": "usr123",
    "email": "vendor@example.com",
    "role": "VENDOR",
    "vendorProfile": {
      "id": "ven123",
      "companyName": "Acme Corp"
    }
  }
  ```
* **Expected Error Responses:**
  * **401 Unauthorized** – Missing or invalid JWT
  * **404 Not Found** – User no longer exists

---

## Notes
* JWT Tokens expire after 24 hours.
* Password reset tokens expire after 15 minutes.
