import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Hospital } from '../models/Hospital.js';
import { Donor } from '../models/Donor.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { Match } from '../models/Match.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { executeMatchingForRequest } from '../services/matchingService.js';

// Fictional Demo City: "Metro Health District" (Lat: 40.7128, Lon: -74.0060)
const DEMO_CITY_CENTER = {
  city: 'Metro City',
  latitude: 40.7128,
  longitude: -74.0060,
};

export async function seedDatabase(options = { disconnectOnDone: false }) {
  console.log('[Seed] Starting deterministic database seeding...');

  // Ensure DB connected
  await connectDB();

  // 1. Clean existing records for idempotent reset
  await Promise.all([
    User.deleteMany({}),
    Hospital.deleteMany({}),
    Donor.deleteMany({}),
    BloodRequest.deleteMany({}),
    Match.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('[Seed] Cleared existing collections.');

  const salt = await bcrypt.genSalt(10);
  const commonPassword = 'Password123!';
  const commonHash = await bcrypt.hash(commonPassword, salt);

  // 2. Create Administrator Account
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@bloodconnect.local').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminDemo@2026';
  const adminHash = await bcrypt.hash(adminPassword, salt);

  const adminUser = await User.create({
    name: process.env.ADMIN_NAME || 'System Administrator',
    email: adminEmail,
    passwordHash: adminHash,
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
  });
  console.log(`[Seed] Created Administrator: ${adminUser.email}`);

  // 3. Create 3 Hospitals in Different Approval States
  // A. Approved Hospital
  const approvedHospitalUser = await User.create({
    name: 'Dr. Sarah Jenkins',
    email: 'metropolitan@hospital.local',
    passwordHash: commonHash,
    role: 'HOSPITAL',
    accountStatus: 'ACTIVE',
  });

  const approvedHospital = await Hospital.create({
    userId: approvedHospitalUser._id,
    hospitalName: 'Metropolitan General Hospital',
    syntheticRegistrationNumber: 'SYN-HOSP-001',
    address: '100 Medical Center Blvd',
    city: DEMO_CITY_CENTER.city,
    latitude: 40.7128,
    longitude: -74.0060,
    approvalStatus: 'APPROVED',
    reviewedAt: new Date(Date.now() - 86400000 * 5),
    reviewedBy: adminUser._id,
  });

  // B. Pending Hospital
  const pendingHospitalUser = await User.create({
    name: 'Dr. Michael Chang',
    email: 'stjude@hospital.local',
    passwordHash: commonHash,
    role: 'HOSPITAL',
    accountStatus: 'PENDING',
  });

  const pendingHospital = await Hospital.create({
    userId: pendingHospitalUser._id,
    hospitalName: 'St. Jude Memorial Hospital',
    syntheticRegistrationNumber: 'SYN-HOSP-002',
    address: '450 Mercy Avenue',
    city: DEMO_CITY_CENTER.city,
    latitude: 40.7306,
    longitude: -73.9352,
    approvalStatus: 'PENDING',
  });

  // C. Rejected Hospital
  const rejectedHospitalUser = await User.create({
    name: 'Robert Vance',
    email: 'oakvalley@hospital.local',
    passwordHash: commonHash,
    role: 'HOSPITAL',
    accountStatus: 'SUSPENDED',
  });

  const rejectedHospital = await Hospital.create({
    userId: rejectedHospitalUser._id,
    hospitalName: 'Oak Valley Trauma Clinic',
    syntheticRegistrationNumber: 'SYN-HOSP-003',
    address: '92 Industrial Bypass',
    city: DEMO_CITY_CENTER.city,
    latitude: 40.6782,
    longitude: -73.9442,
    approvalStatus: 'REJECTED',
    rejectionReason: 'Synthetic facility credentials could not be verified by registry guidelines.',
    reviewedAt: new Date(Date.now() - 86400000 * 2),
    reviewedBy: adminUser._id,
  });

  console.log('[Seed] Created 3 Hospitals (Approved, Pending, Rejected).');

  // 4. Create at least 25 Synthetic Donors across all 8 Blood Groups
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const donorNames = [
    'Alex Rivers', 'Jordan Lee', 'Morgan Smith', 'Taylor Vance', 'Casey Diaz',
    'Riley Patel', 'Avery Johnson', 'Dakota Bennett', 'Cameron Clark', 'Reese Miller',
    'Kendall Wright', 'Peyton Scott', 'Skyler Adams', 'Quinn Davis', 'Hayden Morris',
    'Rowan Kelly', 'Sawyer Brooks', 'Finley Price', 'Harper Woods', 'Elliot Baker',
    'Logan Green', 'Parker Hall', 'Emerson King', 'Kai Rivera', 'Adrian Ward',
    'Samira Khan', 'Leo Martinez', 'Zoe Chen',
  ];

  // Dispersed coordinates around Metro City (distances roughly 1.5 km to 25 km)
  const donorOffsets = [
    { dLat: 0.012, dLon: 0.008, avail: true, alerts: true },   // ~1.5 km
    { dLat: -0.015, dLon: 0.010, avail: true, alerts: true },  // ~1.8 km
    { dLat: 0.025, dLon: -0.018, avail: true, alerts: true },  // ~3.2 km
    { dLat: -0.030, dLon: -0.022, avail: true, alerts: true }, // ~3.8 km
    { dLat: 0.045, dLon: 0.035, avail: true, alerts: true },   // ~5.8 km
    { dLat: -0.050, dLon: 0.040, avail: true, alerts: true },  // ~6.5 km
    { dLat: 0.060, dLon: -0.055, avail: false, alerts: true }, // ~8.2 km (Unavailable demo)
    { dLat: -0.075, dLon: -0.060, avail: true, alerts: true }, // ~9.7 km
    { dLat: 0.085, dLon: 0.070, avail: true, alerts: false },  // ~11.2 km (Alerts disabled)
    { dLat: -0.090, dLon: 0.085, avail: true, alerts: true },  // ~12.3 km
    { dLat: 0.110, dLon: -0.095, avail: true, alerts: true },  // ~14.8 km
    { dLat: -0.125, dLon: -0.110, avail: true, alerts: true }, // ~16.9 km
    { dLat: 0.140, dLon: 0.120, avail: true, alerts: true },   // ~19.0 km
    { dLat: -0.150, dLon: 0.130, avail: true, alerts: true },  // ~20.5 km
    { dLat: 0.018, dLon: -0.012, avail: true, alerts: true },  // ~2.3 km
    { dLat: -0.022, dLon: 0.015, avail: true, alerts: true },  // ~2.7 km
    { dLat: 0.038, dLon: 0.028, avail: true, alerts: true },   // ~4.9 km
    { dLat: -0.042, dLon: -0.032, avail: true, alerts: true }, // ~5.4 km
    { dLat: 0.055, dLon: -0.045, avail: true, alerts: true },  // ~7.3 km
    { dLat: -0.065, dLon: 0.050, avail: true, alerts: true },  // ~8.6 km
    { dLat: 0.070, dLon: 0.065, avail: true, alerts: true },   // ~9.6 km
    { dLat: -0.082, dLon: -0.075, avail: true, alerts: true }, // ~11.1 km
    { dLat: 0.095, dLon: -0.080, avail: true, alerts: true },  // ~12.7 km
    { dLat: -0.105, dLon: 0.090, avail: true, alerts: true },  // ~14.1 km
    { dLat: 0.120, dLon: 0.105, avail: true, alerts: true },   // ~16.2 km
    { dLat: -0.010, dLon: 0.005, avail: true, alerts: true },  // ~1.2 km
    { dLat: 0.020, dLon: 0.010, avail: true, alerts: true },   // ~2.4 km
    { dLat: -0.025, dLon: -0.015, avail: true, alerts: true }, // ~3.1 km
  ];

  const createdDonors = [];
  for (let i = 0; i < donorNames.length; i++) {
    const name = donorNames[i];
    const bloodGroup = bloodGroups[i % bloodGroups.length];
    const offset = donorOffsets[i];
    const email = `mock.donor${i + 1}@bloodconnect.local`;
    const syntheticId = `DONOR-MOCK-${101 + i}`;

    const donorUser = await User.create({
      name,
      email,
      passwordHash: commonHash,
      role: 'DONOR',
      accountStatus: 'ACTIVE',
    });

    const donor = await Donor.create({
      userId: donorUser._id,
      syntheticDonorId: syntheticId,
      displayName: name,
      bloodGroup,
      city: DEMO_CITY_CENTER.city,
      latitude: DEMO_CITY_CENTER.latitude + offset.dLat,
      longitude: DEMO_CITY_CENTER.longitude + offset.dLon,
      isAvailable: offset.avail,
      acceptsUrgentAlerts: offset.alerts,
      isSynthetic: true,
    });

    createdDonors.push({ user: donorUser, donor });
  }

  console.log(`[Seed] Created ${createdDonors.length} Synthetic Donors across all 8 blood groups.`);

  // 5. Create Sample Emergency Blood Requests for Approved Hospital
  // Request 1: Critical O- blood request
  const req1 = await BloodRequest.create({
    hospitalId: approvedHospital._id,
    bloodGroup: 'O-',
    unitsRequired: 3,
    urgency: 'CRITICAL',
    searchRadiusKm: 15,
    latitude: approvedHospital.latitude,
    longitude: approvedHospital.longitude,
    requiredBy: new Date(Date.now() + 3600000 * 2), // 2 hours from now
    notes: 'Urgent trauma unit arrival requiring O- universal donor transfusion.',
    status: 'ACTIVE',
  });

  // Run matching & alerts for Request 1
  await executeMatchingForRequest(req1._id);

  // Request 2: High priority A+ blood request
  const req2 = await BloodRequest.create({
    hospitalId: approvedHospital._id,
    bloodGroup: 'A+',
    unitsRequired: 2,
    urgency: 'HIGH',
    searchRadiusKm: 10,
    latitude: approvedHospital.latitude,
    longitude: approvedHospital.longitude,
    requiredBy: new Date(Date.now() + 3600000 * 8), // 8 hours from now
    notes: 'Scheduled cardiovascular procedure requiring A+ standby units.',
    status: 'ACTIVE',
  });

  // Run matching & alerts for Request 2
  await executeMatchingForRequest(req2._id);

  // Request 3: Exploratory ANY blood group request
  const req3 = await BloodRequest.create({
    hospitalId: approvedHospital._id,
    bloodGroup: 'ANY',
    unitsRequired: 5,
    urgency: 'NORMAL',
    searchRadiusKm: 8,
    latitude: approvedHospital.latitude,
    longitude: approvedHospital.longitude,
    requiredBy: new Date(Date.now() + 86400000), // 24 hours
    notes: 'General blood bank inventory replenishment drive.',
    status: 'ACTIVE',
  });

  await executeMatchingForRequest(req3._id);

  // 6. Simulate one Accepted and one Declined response on Request 1
  const req1Notifications = await Notification.find({ requestId: req1._id });
  if (req1Notifications.length > 0) {
    const firstNotif = req1Notifications[0];
    firstNotif.status = 'ACCEPTED';
    firstNotif.respondedAt = new Date();
    firstNotif.responseNotes = 'On my way to Metropolitan General Hospital right now.';
    await firstNotif.save();

    await Match.findOneAndUpdate(
      { requestId: req1._id, donorId: firstNotif.donorId },
      { matchStatus: 'ACCEPTED' }
    );

    req1.acceptedResponseCount = 1;
    await req1.save();
  }

  if (req1Notifications.length > 1) {
    const secondNotif = req1Notifications[1];
    secondNotif.status = 'DECLINED';
    secondNotif.respondedAt = new Date();
    secondNotif.responseNotes = 'Currently traveling outside city limits.';
    await secondNotif.save();

    await Match.findOneAndUpdate(
      { requestId: req1._id, donorId: secondNotif.donorId },
      { matchStatus: 'DECLINED' }
    );

    req1.declinedResponseCount = 1;
    await req1.save();
  }

  // 7. Initial Audit Log Entries
  await AuditLog.create([
    {
      actorUserId: adminUser._id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      entityId: 'SEED_INITIALIZER',
      safeMetadata: { city: DEMO_CITY_CENTER.city, syntheticDonorsCount: createdDonors.length },
    },
    {
      actorUserId: adminUser._id,
      action: 'HOSPITAL_APPROVED',
      entityType: 'HOSPITAL',
      entityId: approvedHospital._id.toString(),
      safeMetadata: { hospitalName: approvedHospital.hospitalName },
    },
    {
      actorUserId: adminUser._id,
      action: 'HOSPITAL_REJECTED',
      entityType: 'HOSPITAL',
      entityId: rejectedHospital._id.toString(),
      safeMetadata: { hospitalName: rejectedHospital.hospitalName, reason: rejectedHospital.rejectionReason },
    },
  ]);

  console.log('[Seed] Seeding completed successfully!');
  console.log('\n================ DEMO CREDENTIALS ================');
  console.log(`ADMIN:    ${adminEmail}  | Password: ${adminPassword}`);
  console.log(`HOSPITAL: metropolitan@hospital.local (APPROVED) | Password: ${commonPassword}`);
  console.log(`HOSPITAL: stjude@hospital.local (PENDING)        | Password: ${commonPassword}`);
  console.log(`HOSPITAL: oakvalley@hospital.local (REJECTED)    | Password: ${commonPassword}`);
  console.log(`DONOR 1:  mock.donor1@bloodconnect.local (A+)    | Password: ${commonPassword}`);
  console.log(`DONOR 8:  mock.donor8@bloodconnect.local (O-)    | Password: ${commonPassword}`);
  console.log('===================================================\n');

  if (options.disconnectOnDone) {
    await disconnectDB();
  }

  return {
    adminEmail,
    hospitalsCount: 3,
    donorsCount: createdDonors.length,
    requestsCount: 3,
  };
}

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase({ disconnectOnDone: true })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}

export default seedDatabase;
