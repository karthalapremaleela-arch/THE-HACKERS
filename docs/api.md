# BloodConnect REST API Reference

Base URL: `http://localhost:5000/api`

All state-modifying requests accept `Content-Type: application/json`. Protected endpoints require an `Authorization: Bearer <token>` header.

---

## 1. Authentication Endpoints

### 1.1 Register Hospital
- **Route:** `POST /auth/register/hospital`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Dr. Sarah Jenkins",
    "email": "metropolitan@hospital.local",
    "password": "Password123!",
    "hospitalName": "Metropolitan General Hospital",
    "syntheticRegistrationNumber": "SYN-HOSP-001",
    "address": "100 Medical Center Blvd",
    "city": "Metro City",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Hospital registered successfully. Account is pending administrator approval.",
    "token": "eyJhbGciOi...",
    "user": { "_id": "...", "name": "Dr. Sarah Jenkins", "email": "...", "role": "HOSPITAL", "accountStatus": "PENDING" },
    "hospital": { "_id": "...", "hospitalName": "...", "approvalStatus": "PENDING" }
  }
  ```

### 1.2 Register Donor
- **Route:** `POST /auth/register/donor`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Alex Rivers",
    "email": "alex@donor.local",
    "password": "Password123!",
    "displayName": "Alex R.",
    "bloodGroup": "O-",
    "city": "Metro City",
    "latitude": 40.714,
    "longitude": -74.008,
    "isAvailable": true,
    "acceptsUrgentAlerts": true
  }
  ```
- **Response (201 Created):** Returns user, token, and synthetic donor profile with generated `syntheticDonorId`.

### 1.3 User Sign In
- **Route:** `POST /auth/login`
- **Access:** Public
- **Request Body:** `{ "email": "admin@bloodconnect.local", "password": "AdminDemo@2026" }`
- **Response (200 OK):** Returns user profile, role, and signed JWT token.

### 1.4 Get Current User Profile
- **Route:** `GET /auth/me`
- **Access:** Authenticated (Bearer Token)
- **Response (200 OK):** Returns current user account and linked hospital or donor profile.

---

## 2. Administrator Endpoints

Requires `role: 'ADMIN'`.

### 2.1 Get Admin Dashboard Stats
- **Route:** `GET /admin/dashboard`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "totalHospitals": 3,
        "pendingHospitals": 1,
        "approvedHospitals": 1,
        "rejectedHospitals": 1,
        "totalDonors": 28,
        "activeRequests": 3,
        "simulatedNotifications": 19
      },
      "recentAuditLogs": [ ... ]
    }
  }
  ```

### 2.2 List Hospitals
- **Route:** `GET /admin/hospitals?status=PENDING`
- **Query Params:** `status` (optional: `PENDING`, `APPROVED`, `REJECTED`)
- **Response (200 OK):** Array of hospital documents with user details.

### 2.3 Approve Hospital
- **Route:** `PATCH /admin/hospitals/:id/approve`
- **Response (200 OK):** Sets hospital `approvalStatus` to `APPROVED`, user `accountStatus` to `ACTIVE`, and records an audit log.

### 2.4 Reject Hospital
- **Route:** `PATCH /admin/hospitals/:id/reject`
- **Request Body:** `{ "rejectionReason": "Credentials mismatch in demo check." }`
- **Response (200 OK):** Sets hospital `approvalStatus` to `REJECTED`.

### 2.5 List Audit Logs
- **Route:** `GET /admin/audit-logs`
- **Response (200 OK):** Last 100 system audit logs sorted newest first.

---

## 3. Hospital Endpoints

Requires `role: 'HOSPITAL'` (or `'ADMIN'`).

### 3.1 Get Hospital Dashboard
- **Route:** `GET /hospitals/dashboard`
- **Response (200 OK):** Hospital details, active request counts, accepted donor response totals, and recent requests.

### 3.2 Create Emergency Blood Request
- **Route:** `POST /requests`
- **Access:** Approved Hospital Only (`requireApprovedHospital`)
- **Request Body:**
  ```json
  {
    "bloodGroup": "O-",
    "unitsRequired": 2,
    "urgency": "CRITICAL",
    "searchRadiusKm": 15,
    "requiredBy": "2026-10-10T08:00:00.000Z",
    "notes": "Emergency surgical trauma case"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Emergency request created. Dispatched simulated alerts to 4 mock donors.",
    "data": {
      "request": { "_id": "...", "status": "ACTIVE", "matchedDonorCount": 4 },
      "matchedDonors": [
        { "syntheticDonorId": "DONOR-MOCK-108", "displayName": "...", "distanceKm": 1.25, "bloodGroup": "O-" },
        { "syntheticDonorId": "DONOR-MOCK-116", "displayName": "...", "distanceKm": 3.82, "bloodGroup": "O-" }
      ],
      "alertsDispatched": 4,
      "searchMetadata": {
        "executionTimeMs": 6,
        "recordsExamined": 28,
        "matchesFound": 4,
        "searchRadiusKm": 15
      }
    }
  }
  ```

### 3.3 List Facility Requests
- **Route:** `GET /requests`
- **Response (200 OK):** List of blood requests submitted by this hospital.

### 3.4 Get Request Matches
- **Route:** `GET /requests/:id/matches`
- **Response (200 OK):** Matched donors sorted ascending by distance ($km$).

### 3.5 Cancel Active Request
- **Route:** `PATCH /requests/:id/cancel`
- **Response (200 OK):** Sets status to `CANCELLED`.

---

## 4. Donor Endpoints

Requires `role: 'DONOR'`.

### 4.1 Get Donor Profile
- **Route:** `GET /donors/me`
- **Response (200 OK):** Synthetic donor details, blood group, coordinates, and availability status.

### 4.2 Update Availability Toggle
- **Route:** `PATCH /donors/me/availability`
- **Request Body:** `{ "isAvailable": true }`
- **Response (200 OK):** Updated availability state.

### 4.3 Get Donor Urgent Alerts
- **Route:** `GET /donors/me/alerts`
- **Response (200 OK):** All emergency match notifications sent to this donor.

### 4.4 Respond to Simulated Alert
- **Route:** `PATCH /alerts/:id/respond`
- **Request Body:**
  ```json
  {
    "response": "ACCEPT",
    "notes": "En route to medical center"
  }
  ```
- **Response (200 OK):** Updates alert status to `ACCEPTED` or `DECLINED`, increments/decrements request response counters, and updates `Match` state.

---

## 5. System & Demo Status Endpoints

### 5.1 System Health
- **Route:** `GET /health`
- **Response (200 OK):**
  ```json
  {
    "status": "OK",
    "uptimeSeconds": 240,
    "database": { "status": "CONNECTED", "name": "in-memory" },
    "service": "BloodConnect Emergency Matching API"
  }
  ```

### 5.2 Demo Status
- **Route:** `GET /demo/status`
- **Response (200 OK):** Returns counts of seeded mock hospitals, donors, requests, and alerts.

### 5.3 Reseed Demo Database
- **Route:** `POST /demo/seed`
- **Response (200 OK):** Clears and reseeds fresh deterministic baseline records.
