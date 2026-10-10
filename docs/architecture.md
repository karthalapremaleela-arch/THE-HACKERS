# BloodConnect Architecture & System Design Documentation

## 1. System Overview

**BloodConnect** is an AI-powered emergency blood donor matching and simulated alert platform built on the MERN stack (MongoDB, Express, React, Node.js). 

During critical medical emergencies (e.g. major trauma, urgent surgery, acute hemorrhages), hospital staff often lose precious minutes attempting to contact generic donor lists. BloodConnect solves this by:
1. Enforcing strict facility verification before requests can be submitted.
2. Searching a deterministic synthetic donor pool using the **Haversine great-circle distance algorithm**.
3. Filtering donors by ABO/Rh blood compatibility, radius cutoff, availability, and alert preferences.
4. Dispatching persisted in-app alerts and simulated SMS/email logs without relying on paid external APIs.

```
       ┌────────────────────────┐
       │   React 18 + Vite UI   │
       │  (Tailwind CSS + Icons)│
       └───────────┬────────────┘
                   │ HTTP / REST & Socket.IO
                   ▼
       ┌────────────────────────┐
       │ Express Backend Server │
       │ (JWT, Zod, Rate-Limit) │
       └───────────┬────────────┘
                   │
    ┌──────────────┴──────────────┐
    ▼                             ▼
┌────────────────────────┐  ┌────────────────────────┐
│ Mock Donor Discovery   │  │ Mock Notification      │
│ - Haversine Distance   │  │ - Persistent Alerts    │
│ - Blood Group Matching │  │ - Simulated SMS Logs   │
│ - Radius & Eligibility │  │ - Socket.IO Broadcast  │
└──────────────┬─────────┘  └─────────────┬──────────┘
               │                          │
               └──────────┬───────────────┘
                          ▼
            ┌───────────────────────────┐
            │   MongoDB / Mongoose      │
            │ (Auto-fallback Embedded)  │
            └───────────────────────────┘
```

---

## 2. Core Components

### 2.1 Backend Architecture

- **Runtime & Framework:** Node.js v24 (ES Modules) with Express.js.
- **Database Layer:** MongoDB with Mongoose ORM.
  - *Embedded Zero-Configuration Fallback:* Uses `mongodb-memory-server` if an external MongoDB instance is not configured, allowing instant local testing without Docker or service installation on Windows.
- **Authentication & Authorization:**
  - JSON Web Tokens (JWT) signed with HMAC-SHA256.
  - bcrypt password hashing (salt rounds: 10).
  - Role-Based Access Control (`ADMIN`, `HOSPITAL`, `DONOR`).
  - Strict ownership validation (hospitals only access their requests; donors only access their assigned alerts).
  - Approval enforcement: Hospitals with `PENDING` or `REJECTED` status are blocked by `requireApprovedHospital` middleware.
- **Input Validation:** Zod schemas applied via `validateRequest` middleware on all state-mutating endpoints.
- **Audit Logging:** Dedicated `AuditLog` collection records administrative actions (`HOSPITAL_APPROVED`, `HOSPITAL_REJECTED`, `REQUEST_CREATED`, `REQUEST_CANCELLED`).

### 2.2 Donor Discovery Service (`mockDonorDiscoveryService.js`)

Implements a provider interface (`DonorDiscoveryProvider`) enabling future drop-in replacement with an authorized national donor registry:

```javascript
class DonorDiscoveryProvider {
  async findNearbyDonors(query) { /* abstract */ }
}
```

The default `MockDonorDiscoveryProvider`:
1. Validates coordinate ranges (latitude: -90 to 90, longitude: -180 to 180).
2. Reads the synthetic donor dataset from the local database.
3. Computes great-circle distance between the hospital coordinates and each donor using the Haversine formula:
   $$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
   $$d = R \cdot \Delta\sigma \quad (R = 6371\text{ km})$$
4. Filters out ineligible donors:
   - Donors with `isAvailable === false`
   - Donors with `acceptsUrgentAlerts === false`
   - Donors outside the configured search radius ($d > \text{radiusKm}$)
   - Incompatible blood groups (exact matching for ABO/Rh, or exploratory matching for `ANY`).
5. Returns matches sorted by distance ascending (nearest to farthest).
6. Attaches search metadata: `executionTimeMs`, `recordsExamined`, `matchesFound`, and the mandatory medical safety disclaimer.

### 2.3 Simulated Notification Service (`mockNotificationService.js`)

Simulates urgent alert dispatch across three demo channels without third-party API dependencies or costs:
- **In-App Notifications:** Persisted as `Notification` documents in MongoDB with unique IDs (`ALERT-XXXXX`).
- **Real-Time Live Updates:** Emits events via Socket.IO directly to connected donor and hospital dashboards.
- **Simulated SMS & Email Logs:** Generates synthetic phone numbers (`+1-555-01XX`), dummy email addresses, and payload logs.
- **Deduplication:** Prevents duplicate alert generation if matching is retried for an existing request.

---

## 3. Data Models & Relationships

| Model | Primary Fields | Key Relationships & Indexes |
|---|---|---|
| **User** | `name`, `email`, `passwordHash`, `role`, `accountStatus` | Unique email index; indexed by `role` |
| **Hospital** | `userId`, `hospitalName`, `syntheticRegistrationNumber`, `address`, `city`, `latitude`, `longitude`, `approvalStatus` | 1-to-1 with `User`; indexed by `approvalStatus` |
| **Donor** | `userId`, `syntheticDonorId`, `displayName`, `bloodGroup`, `city`, `latitude`, `longitude`, `isAvailable`, `acceptsUrgentAlerts` | 1-to-1 with `User`; compound index on `[bloodGroup, isAvailable, acceptsUrgentAlerts]` |
| **BloodRequest** | `hospitalId`, `bloodGroup`, `unitsRequired`, `urgency`, `searchRadiusKm`, `latitude`, `longitude`, `requiredBy`, `status` | Belongs to `Hospital`; indexed by `status` and `createdAt` |
| **Match** | `requestId`, `donorId`, `distanceKm`, `matchReason`, `matchStatus` | Connects `BloodRequest` and `Donor`; compound unique index on `[requestId, donorId]` |
| **Notification** | `alertId`, `requestId`, `donorId`, `hospitalId`, `urgency`, `bloodGroup`, `distanceKm`, `status`, `simulatedDeliveryDetails` | Unique `alertId`; compound unique index on `[requestId, donorId]` |
| **AuditLog** | `actorUserId`, `action`, `entityType`, `entityId`, `safeMetadata`, `createdAt` | Indexed by `createdAt` descending |

---

## 4. Security Architecture

1. **Password Protection:** bcrypt hashing with 10 salt rounds. Plaintext passwords and hashes are excluded from API responses (`toJSON` schema transforms).
2. **Rate Limiting:** `express-rate-limit` throttles `/api/auth` endpoints to 100 requests per 15 minutes.
3. **Security Headers:** `helmet` sets Content-Security-Policy, X-Frame-Options, and X-Content-Type-Options.
4. **CORS:** Restricted to configured `CLIENT_URL` (default: `http://localhost:5173`).
5. **Role-Based Guards:** Express middleware (`requireRole('ADMIN')`, `requireApprovedHospital`) blocks privilege escalation attempts.

---

## 5. Future Production Roadmap

To transition BloodConnect from hackathon MVP to a certified clinical production system:
1. **Authorized Registry Integration:** Replace `MockDonorDiscoveryProvider` with an authenticated integration with national health registries (e.g. Red Cross / NHS Blood and Transplant APIs).
2. **Verified Notification Gateways:** Implement Twilio Verify / AWS SNS for real-time donor SMS dispatch with strict opt-in consent.
3. **HIPAA & GDPR Compliance:** Implement field-level encryption for donor health details and strict data retention policies.
4. **Hospital Geofencing:** Support real-time travel-time calculation via OpenStreetMap / OSRM routing rather than straight-line distance.
