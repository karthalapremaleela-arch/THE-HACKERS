# BloodConnect Hackathon Presentation & Demonstration Script (3–5 Minutes)

This presentation script guides hackathon presenters through a live demonstration of BloodConnect.

---

## Part 1: The Problem & The Solution (0:00 – 0:45)

**Presenter Talking Points:**
> "In acute medical emergencies—such as severe trauma, pediatric surgeries, or postpartum hemorrhages—hospitals cannot afford delays in sourcing compatible blood.
> 
> Today, hospitals often rely on manual phone calls, social media broadcasts, or outdated spreadsheets. By the time a willing donor responds, critical hours have passed.
> 
> We built **BloodConnect**: an AI-powered emergency blood donor matching platform that pairs verified hospital facilities with nearby donors in seconds, ranking candidates using geographic proximity and dispatching instant simulated alerts."

**On Screen:**
1. Open `http://localhost:5173/` (Landing Page).
2. Point out the live database statistics (e.g. 3 Hospitals, 28 Synthetic Donors, Active Requests).
3. Highlight the **"Hackathon Demo Mode: All records are synthetic simulations"** safety banner and medical disclaimer.

---

## Part 2: Hospital Verification Workflow (0:45 – 1:30)

**Presenter Talking Points:**
> "To prevent panic or fraudulent requests, BloodConnect enforces strict facility verification. Unverified facilities cannot alert donors."

**On Screen Actions:**
1. Click **"Register Hospital"** in the navigation bar.
2. Enter a demo facility name: `Sunset Trauma Center`.
3. Click **"Auto-generate Metro Location"** to populate realistic coordinates.
4. Click **"Register Hospital (Pending Review)"**.
5. The screen immediately transitions to the **Pending Approval Page**, showing that the account is in `PENDING` status.
6. Attempting to navigate directly to `/hospital/request/new` is blocked with a 403 authorization guard.

---

## Part 3: Administrator Console & Approval (1:30 – 2:15)

**Presenter Talking Points:**
> "Now let's switch to the Administrator's perspective. Administrators govern the facility network and monitor system health."

**On Screen Actions:**
1. Click **"Sign In"** or navigate to `/login`.
2. Click the **"Admin"** quick-fill button (`admin@bloodconnect.local`), then click **"Sign In"**.
3. Point out the **Administrator Dashboard**:
   - Total Hospitals, Pending Approvals, Active Requests, Mock Donors.
4. Go to the **"Pending Approvals"** tab.
5. Locate `Sunset Trauma Center` (or `St. Jude Memorial Hospital`).
6. Click **"Approve"** and confirm the confirmation modal.
7. Show the **"Audit Log Trail"** tab: verify that the approval action was recorded with timestamp and administrator metadata.
8. Click **Log Out**.

---

## Part 4: Emergency Request & Haversine Donor Ranking (2:15 – 3:15)

**Presenter Talking Points:**
> "With approval granted, our hospital can now launch a real-time emergency triage request."

**On Screen Actions:**
1. Click **"Sign In"**, click **"Hospital (Approved)"** quick-fill (`metropolitan@hospital.local`), and click **"Sign In"**.
2. Click **"Create Emergency Request"**.
3. Select **Blood Group: `O-`** (universal red cell donor).
4. Select **Units: `2`**, **Urgency: `CRITICAL`** (notice the pulsing emergency badge), and set **Search Radius: `15 km`**.
5. Click **"Submit Emergency Request & Alert Donors"**.
6. The app executes the **Haversine great-circle distance algorithm** against the local synthetic dataset and routes directly to the **Request Details Page**.
7. Point out the results:
   - Donors are strictly ranked by straight-line distance (e.g. #1: 1.25 km, #2: 3.82 km, etc.).
   - Search execution metadata (e.g., 28 records examined in 5 ms).
   - Live countdown timer showing hours remaining until deadline.

---

## Part 5: Simulated Donor Alert & Live Response Tracking (3:15 – 4:00)

**Presenter Talking Points:**
> "Now, how does a nearby donor experience this alert? Without collecting real phone numbers or incurring paid SMS fees, BloodConnect creates persisted in-app alerts and delivery logs."

**On Screen Actions:**
1. Sign out, go to `/login`, and click **"Donor (O-)"** quick-fill (`mock.donor8@bloodconnect.local`), then click **"Sign In"**.
2. Notice the **Donor Dashboard**:
   - Show the **Emergency Availability Toggle** (instant flip between Available and Unavailable).
   - Under **Incoming Emergency Blood Alerts**, notice the critical flashing alert from `Metropolitan General Hospital` indicating that `O-` blood is needed ~1.25 km away!
3. Click **"Accept Alert"**.
4. Type an optional note: `On my way now!` and confirm.
5. Switch to `/notifications` to show the **Simulated Delivery Stream**, showing the synthetic SMS payload and delivery record.
6. Log back into the Hospital dashboard: point out that **Accepted Responses** incremented to reflect the donor's decision!

---

## Part 6: Architecture & Future Scope (4:00 – 4:30)

**Presenter Talking Points:**
> "In summary:
> 1. **Zero External Costs:** Operates completely offline or locally without paid Google Maps or Twilio API keys.
> 2. **Provider Pattern:** The `MockDonorDiscoveryService` implements an extensible provider interface, allowing future drop-in integration with authorized blood bank registries like the Red Cross.
> 3. **Medical Safety:** Strict disclaimers ensure hospital personnel make final cross-matching decisions.
> 
> BloodConnect turns emergency blood sourcing into a fast, transparent, and verified digital workflow. Thank you!"
