# BloodConnect — AI-Powered Emergency Blood Donor Matching

[![Tests](https://img.shields.io/badge/Tests-31%20Passed%20(100%25)-emerald)](docs/testing.md)
[![Stack](https://img.shields.io/badge/Stack-MERN-red)](docs/architecture.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero-Docker](https://img.shields.io/badge/Docker-NOT%20REQUIRED-brightgreen)](README.md)
[![Demo](https://img.shields.io/badge/Demo-100%25%20Synthetic%20Mock%20Data-amber)](docs/demo-script.md)

> **Tagline:** AI-Powered Emergency Blood Donor Matching and Simulated Urgent Alert Platform

---

## 1. Project Overview

During critical medical emergencies, hospitals face dangerous delays sourcing compatible blood donors. Calling individuals manually or posting generic public appeals wastes precious time.

**BloodConnect** provides:
- **Verified Hospital Registration & Governance:** Only administrators can approve medical facilities to initiate urgent requests.
- **Proximity Donor Discovery:** Calculates straight-line distance to mock donors using the **Haversine formula**.
- **ABO/Rh Compatibility Filtering:** Supports exact blood group matching as well as exploratory `ANY` requests.
- **Simulated Emergency Alerts:** Dispatches persisted in-app alerts and delivery logs (mock SMS and simulated emails) without requiring paid third-party APIs.
- **100% Synthetic Mock Data:** Operates safely without scraping personal data, contacting real people, or making clinical medical claims.
- **Zero Docker Dependency:** Runs locally on Windows using embedded in-memory MongoDB fallback. No Docker Desktop, Docker Engine, or external daemons needed.

---

## 2. Quick Start for Windows & VS Code (Beginner-Friendly)

### 2.1 Prerequisites
- **Node.js**: v18 or higher (tested on Node v24). [Download Node.js](https://nodejs.org/)
- **Git** (optional): [Download Git](https://git-scm.com/)
- **Docker is NOT required.** The application runs completely natively on Windows.

### 2.2 Setup Commands

Open **VS Code Terminal** or **PowerShell** in the project directory:

```powershell
# 1. Install dependencies
npm.cmd install

# 2. Run one-time setup (installs server & client packages and seeds database)
npm.cmd run setup
```

> **Windows PowerShell Script Policy Note:** If PowerShell shows `File npm.ps1 cannot be loaded because running scripts is disabled`, use `npm.cmd` instead of `npm`, or run:
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

### 2.3 Start the Application

Start both the backend API and frontend Vite client with a single command:

```powershell
npm.cmd run dev
```

Alternatively, run in separate terminal tabs:
- **Terminal 1 (Backend API):** `npm.cmd run dev:server` (running on `http://localhost:5000`)
- **Terminal 2 (Frontend Client):** `npm.cmd run dev:client` (running on `http://localhost:5173`)

### 2.4 Access the Application
- **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
- **Backend API Root:** [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Demo Status:** [http://localhost:5000/api/demo/status](http://localhost:5000/api/demo/status)

---

## 3. Seeded Demo Accounts (Quick-Fill Available on Login Page)

The login screen includes **one-click demo credentials autofill** buttons for instant evaluation:

| Role | Email Address | Password | Account State | Capabilities |
|---|---|---|---|---|
| **Administrator** | `admin@bloodconnect.local` | `AdminDemo@2026` | Active | Full approval governance, audit logs, request monitoring |
| **Hospital (Approved)** | `metropolitan@hospital.local` | `Password123!` | Approved | Create emergency blood requests, rank nearby donors |
| **Hospital (Pending)** | `stjude@hospital.local` | `Password123!` | Pending | Access blocked from emergency requests until approved |
| **Hospital (Rejected)** | `oakvalley@hospital.local` | `Password123!` | Rejected | Facility rejected during audit check |
| **Donor (O- Universal)** | `mock.donor8@bloodconnect.local` | `Password123!` | Active | View incoming alerts, accept/decline, toggle availability |
| **Donor (A+)** | `mock.donor1@bloodconnect.local` | `Password123!` | Active | Profile configuration, alerts stream |

---

## 4. Available NPM Scripts

| Command | Description |
|---|---|
| `npm run setup` | One-step installer: installs all workspace packages and seeds the database |
| `npm run install:all` | Installs dependencies across root, backend, and frontend |
| `npm run seed` | Seeds deterministic baseline dataset into the database |
| `npm run demo:reset` | Resets the database to a fresh initial demonstration state |
| `npm run dev` | Runs both backend API and Vite client concurrently |
| `npm run dev:server` | Starts Express backend server on port 5000 |
| `npm run dev:client` | Starts Vite React frontend on port 5173 |
| `npm run test` | Executes all backend unit and integration tests via Vitest |
| `npm run test:client` | Executes frontend component tests via Vitest & React Testing Library |
| `npm run test:all` | Executes both backend and frontend test suites (31 tests) |
| `npm run build` | Builds the optimized production bundle for the client |
| `npm run start` | Starts the production backend server |

---

## 5. Automated Testing

All automated tests are verified and passing 100%:

```powershell
# Run all tests (backend + frontend)
npm.cmd run test:all
```

### Verified Test Results Summary:
- **Haversine Formula & Coordinate Validation:** 5 tests passed
- **Blood Group Rules & Proximity Filtering:** 7 tests passed
- **Notification Deduplication:** 2 tests passed
- **API Integration (Hospital Approval, Auth, Requests, Alerts):** 12 tests passed
- **Frontend Components & Disclaimers:** 5 tests passed
- **Total:** **31 tests passing (100% pass rate)**

For complete test logs and test case documentation, see [docs/testing.md](docs/testing.md).

---

## 6. Complete Workflows Verified

### Workflow A: Hospital Approval
1. Register a hospital at `/register-hospital` $\rightarrow$ account created with status `PENDING`.
2. Hospital dashboard blocks emergency request creation (`requireApprovedHospital` returns 403).
3. Log in as administrator (`admin@bloodconnect.local`) $\rightarrow$ open Approvals tab.
4. Click **Approve** $\rightarrow$ status becomes `APPROVED`, user account becomes `ACTIVE`, action recorded in `AuditLog`.
5. Hospital logs in and can now access request creation.

### Workflow B: Emergency Blood Matching
1. Log in as approved hospital (`metropolitan@hospital.local`).
2. Create urgent request for `O-` blood, urgency `CRITICAL`, radius `15 km`.
3. `mockDonorDiscoveryService` examines synthetic donors and calculates straight-line distances via Haversine formula.
4. Eligible donors are ranked from nearest to farthest (e.g. #1: 1.25 km, #2: 3.82 km).
5. Persists matching records and dispatches simulated alerts.

### Workflow C: Donor Alerts & Response Tracking
1. Log in as matched donor (`mock.donor8@bloodconnect.local`).
2. View incoming emergency alert card on dashboard with countdown timer.
3. Click **Accept Alert** (or **Decline**) and add optional notes.
4. Response is persisted and emitted live over Socket.IO.
5. Hospital dashboard response count immediately reflects the acceptance.

### Workflow D: Additional Edge Cases Tested
- **Exploratory `ANY` Search:** Matches donors across all blood groups within radius with prominent clinical disclaimer.
- **Zero Matches Handled:** Displays clear empty state banner when no donors exist within radius.
- **Unavailable / Alerts Disabled:** Automatically excluded from matching.
- **Cancelled Requests:** Request status marked `CANCELLED` and further alerts prevented.
- **Security Isolation:** Hospital A cannot access Hospital B's private request; Donor A cannot respond to Donor B's alert.

---

## 7. Windows & VS Code Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `npm.ps1 cannot be loaded` | Windows PowerShell Execution Policy restricts `.ps1` scripts | Use `npm.cmd run dev` or run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| `EADDRINUSE: port 5000 or 5173 already in use` | Another process is holding port 5000 or 5173 | In PowerShell, run `Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess \| Stop-Process -Force` |
| MongoDB is not installed | Windows machine does not have `mongod` service | No action needed! `server/src/config/db.js` automatically starts an embedded in-memory database |
| Do I need Docker? | Prompt requirement | **NO.** Docker is completely unnecessary. Do not install or run Docker. |

---

## 8. Definition of Done Checklist

- [x] Absolute requirement met: Zero Docker dependency. Runs 100% natively on Windows.
- [x] All dependencies install cleanly across root, server, and client.
- [x] Backend connects to MongoDB with automatic fallback to embedded in-memory MongoDB.
- [x] Deterministic seed script populates 1 admin, 3 hospitals, and 28 synthetic donors.
- [x] Haversine distance calculation and coordinate validation unit-tested.
- [x] Hospital verification workflow strictly enforced on backend (`requireApprovedHospital`).
- [x] Emergency blood request creation ranks mock donors by distance ascending.
- [x] Persistent simulated alerts and duplicate alert prevention verified.
- [x] Donor acceptance and rejection updates request metrics in real time.
- [x] Role-based access control and private request ownership enforced.
- [x] React frontend builds cleanly for production with Vite and Tailwind CSS.
- [x] Automated test suite (31 tests) passes with 100% success rate.
- [x] Documentation completed (`README.md`, `architecture.md`, `api.md`, `testing.md`, `demo-script.md`).
- [x] No real donor data or external paid API keys required.
