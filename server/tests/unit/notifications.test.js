import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/User.js';
import { Hospital } from '../../src/models/Hospital.js';
import { Donor } from '../../src/models/Donor.js';
import { BloodRequest } from '../../src/models/BloodRequest.js';
import { Notification } from '../../src/models/Notification.js';
import { dispatchSimulatedAlerts } from '../../src/services/mockNotificationService.js';

describe('Mock Notification Service & Deduplication', () => {
  let hospital, donor, bloodRequest;

  beforeAll(async () => {
    await connectDB();
    await Notification.deleteMany({});
    await BloodRequest.deleteMany({});
    await Donor.deleteMany({});
    await Hospital.deleteMany({});
    await User.deleteMany({});

    const hospUser = await User.create({
      name: 'Hosp User',
      email: 'hosp@test.local',
      passwordHash: 'dummy',
      role: 'HOSPITAL',
    });

    hospital = await Hospital.create({
      userId: hospUser._id,
      hospitalName: 'Test Hospital',
      syntheticRegistrationNumber: 'TEST-001',
      address: '123 Main St',
      city: 'Metro City',
      latitude: 40.7128,
      longitude: -74.006,
      approvalStatus: 'APPROVED',
    });

    const donorUser = await User.create({
      name: 'Donor User',
      email: 'donor@test.local',
      passwordHash: 'dummy',
      role: 'DONOR',
    });

    donor = await Donor.create({
      userId: donorUser._id,
      syntheticDonorId: 'TEST-DONOR-101',
      displayName: 'Donor User',
      bloodGroup: 'O+',
      city: 'Metro City',
      latitude: 40.713,
      longitude: -74.005,
      isAvailable: true,
      acceptsUrgentAlerts: true,
      isSynthetic: true,
    });

    bloodRequest = await BloodRequest.create({
      hospitalId: hospital._id,
      bloodGroup: 'O+',
      unitsRequired: 2,
      urgency: 'HIGH',
      searchRadiusKm: 10,
      latitude: 40.7128,
      longitude: -74.006,
      requiredBy: new Date(Date.now() + 3600000),
      status: 'ACTIVE',
    });
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await BloodRequest.deleteMany({});
    await Donor.deleteMany({});
    await Hospital.deleteMany({});
    await User.deleteMany({});
    await disconnectDB();
  });

  it('should dispatch simulated alert and persist notification in database', async () => {
    const matchedDonors = [
      {
        donorId: donor._id.toString(),
        syntheticDonorId: donor.syntheticDonorId,
        distanceKm: 1.25,
      },
    ];

    const result = await dispatchSimulatedAlerts({
      bloodRequest,
      matchedDonors,
      hospital,
    });

    expect(result.alertsCreated).toBe(1);
    expect(result.notifications.length).toBe(1);
    expect(result.notifications[0].status).toBe('SENT_SIMULATED');
    expect(result.notifications[0].simulatedDeliveryDetails.mockSmsPhone).toBeDefined();

    const inDb = await Notification.findOne({ requestId: bloodRequest._id, donorId: donor._id });
    expect(inDb).not.toBeNull();
    expect(inDb.alertId).toMatch(/^ALERT-/);
  });

  it('should prevent duplicate notification creation when retried for same donor & request', async () => {
    const matchedDonors = [
      {
        donorId: donor._id.toString(),
        syntheticDonorId: donor.syntheticDonorId,
        distanceKm: 1.25,
      },
    ];

    const retryResult = await dispatchSimulatedAlerts({
      bloodRequest,
      matchedDonors,
      hospital,
    });

    expect(retryResult.alertsCreated).toBe(0);
    expect(retryResult.deliveryLogs[0].status).toBe('SKIPPED_DUPLICATE');

    const count = await Notification.countDocuments({ requestId: bloodRequest._id, donorId: donor._id });
    expect(count).toBe(1);
  });
});
