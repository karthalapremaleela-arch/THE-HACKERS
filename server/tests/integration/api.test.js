import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/User.js';
import { Hospital } from '../../src/models/Hospital.js';
import { Donor } from '../../src/models/Donor.js';
import { BloodRequest } from '../../src/models/BloodRequest.js';
import { Notification } from '../../src/models/Notification.js';
import { Match } from '../../src/models/Match.js';
import { AuditLog } from '../../src/models/AuditLog.js';

describe('BloodConnect API Integration Tests', () => {
  let app;
  let adminToken;
  let pendingHospitalToken, pendingHospitalId;
  let approvedHospitalToken, approvedHospitalId, approvedHospitalUserId;
  let donorToken, donorId, otherDonorToken, otherDonorId;
  let createdRequestId, createdAlertId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await Donor.deleteMany({});
    await BloodRequest.deleteMany({});
    await Notification.deleteMany({});
    await Match.deleteMany({});
    await AuditLog.deleteMany({});

    app = createApp();

    // 1. Create seeded Admin
    const adminRes = await request(app).post('/api/auth/register/hospital').send({
      name: 'Admin Setup',
      email: 'admin@setup.local',
      password: 'AdminPassword123!',
      hospitalName: 'Admin Center',
      syntheticRegistrationNumber: 'ADMIN-000',
      address: 'Admin St',
      city: 'Metro City',
      latitude: 40.7128,
      longitude: -74.006,
    });
    // Manually promote to ADMIN in DB for testing
    await User.updateOne({ email: 'admin@setup.local' }, { role: 'ADMIN', accountStatus: 'ACTIVE' });

    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@setup.local',
      password: 'AdminPassword123!',
    });
    adminToken = adminLoginRes.body.token;

    // 2. Create Donor 1
    const donorRes = await request(app).post('/api/auth/register/donor').send({
      name: 'Primary Donor',
      email: 'primary.donor@demo.local',
      password: 'Password123!',
      displayName: 'Primary Donor',
      bloodGroup: 'O+',
      city: 'Metro City',
      latitude: 40.715,
      longitude: -74.008,
      isAvailable: true,
      acceptsUrgentAlerts: true,
    });
    donorToken = donorRes.body.token;
    donorId = donorRes.body.donor._id;

    // 3. Create Donor 2
    const otherDonorRes = await request(app).post('/api/auth/register/donor').send({
      name: 'Secondary Donor',
      email: 'other.donor@demo.local',
      password: 'Password123!',
      displayName: 'Secondary Donor',
      bloodGroup: 'O+',
      city: 'Metro City',
      latitude: 40.72,
      longitude: -74.01,
      isAvailable: true,
      acceptsUrgentAlerts: true,
    });
    otherDonorToken = otherDonorRes.body.token;
    otherDonorId = otherDonorRes.body.donor._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await Donor.deleteMany({});
    await BloodRequest.deleteMany({});
    await Notification.deleteMany({});
    await Match.deleteMany({});
    await AuditLog.deleteMany({});
    await disconnectDB();
  });

  describe('Authentication & Hospital Registration Workflow', () => {
    it('should register a hospital with status PENDING', async () => {
      const res = await request(app).post('/api/auth/register/hospital').send({
        name: 'Dr. Pending',
        email: 'pending.hospital@demo.local',
        password: 'Password123!',
        hospitalName: 'Pending Community Hospital',
        syntheticRegistrationNumber: 'SYN-PENDING-001',
        address: '200 Hope St',
        city: 'Metro City',
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.hospital.approvalStatus).toBe('PENDING');
      expect(res.body.token).toBeDefined();

      pendingHospitalToken = res.body.token;
      pendingHospitalId = res.body.hospital._id;
    });

    it('should reject invalid or expired tokens with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block pending hospital from creating emergency requests (403)', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${pendingHospitalToken}`)
        .send({
          bloodGroup: 'O+',
          unitsRequired: 2,
          urgency: 'CRITICAL',
          requiredBy: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.approvalStatus).toBe('PENDING');
      expect(res.body.error).toMatch(/pending administrator verification/i);
    });

    it('should prevent non-admin from approving hospital (403)', async () => {
      const res = await request(app)
        .patch(`/api/admin/hospitals/${pendingHospitalId}/approve`)
        .set('Authorization', `Bearer ${pendingHospitalToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow administrator to approve hospital', async () => {
      const res = await request(app)
        .patch(`/api/admin/hospitals/${pendingHospitalId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe('APPROVED');

      approvedHospitalToken = pendingHospitalToken;
      approvedHospitalId = pendingHospitalId;

      // Verify audit log
      const audit = await AuditLog.findOne({
        action: 'HOSPITAL_APPROVED',
        entityId: approvedHospitalId,
      });
      expect(audit).not.toBeNull();
    });
  });

  describe('Emergency Blood Request, Matching, and Simulated Alerts Workflow', () => {
    it('should allow approved hospital to create request and match nearby donors', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${approvedHospitalToken}`)
        .send({
          bloodGroup: 'O+',
          unitsRequired: 2,
          urgency: 'CRITICAL',
          searchRadiusKm: 15,
          requiredBy: new Date(Date.now() + 3600000).toISOString(),
          notes: 'Emergency trauma surgery',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matchedDonors.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.alertsDispatched).toBeGreaterThanOrEqual(1);

      createdRequestId = res.body.data.request._id;

      // Check distance sorting
      const donors = res.body.data.matchedDonors;
      for (let i = 0; i < donors.length - 1; i++) {
        expect(donors[i].distanceKm).toBeLessThanOrEqual(donors[i + 1].distanceKm);
      }
    });

    it('should allow matched donor to view alert on donor dashboard', async () => {
      const res = await request(app)
        .get('/api/donors/me/alerts')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      createdAlertId = res.body.data[0]._id;
      expect(res.body.data[0].status).toBe('SENT_SIMULATED');
    });

    it('should prevent an unauthorized donor from responding to another donor’s alert (403)', async () => {
      const res = await request(app)
        .patch(`/api/alerts/${createdAlertId}/respond`)
        .set('Authorization', `Bearer ${otherDonorToken}`) // other donor tries to respond
        .send({
          response: 'ACCEPT',
          notes: 'Intruder response',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/cannot respond to another donor’s alert/i);
    });

    it('should allow the assigned donor to accept the alert and update response counts', async () => {
      const res = await request(app)
        .patch(`/api/alerts/${createdAlertId}/respond`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          response: 'ACCEPT',
          notes: 'En route to the facility',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACCEPTED');

      // Verify request counts in DB
      const updatedReq = await BloodRequest.findById(createdRequestId);
      expect(updatedReq.acceptedResponseCount).toBe(1);

      // Verify match status in DB
      const match = await Match.findOne({ requestId: createdRequestId, donorId });
      expect(match.matchStatus).toBe('ACCEPTED');
    });

    it('should allow assigned donor to switch response to DECLINE and decrement accepted count', async () => {
      const res = await request(app)
        .patch(`/api/alerts/${createdAlertId}/respond`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          response: 'DECLINE',
          notes: 'Vehicle breakdown, cannot make it',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DECLINED');

      const updatedReq = await BloodRequest.findById(createdRequestId);
      expect(updatedReq.acceptedResponseCount).toBe(0);
      expect(updatedReq.declinedResponseCount).toBe(1);
    });

    it('should allow hospital to cancel request and prevent new alerts', async () => {
      const res = await request(app)
        .patch(`/api/requests/${createdRequestId}/cancel`)
        .set('Authorization', `Bearer ${approvedHospitalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('should prevent one hospital from accessing another hospital’s private request', async () => {
      // Register a second approved hospital
      const h2Res = await request(app).post('/api/auth/register/hospital').send({
        name: 'Dr. Rival',
        email: 'rival@demo.local',
        password: 'Password123!',
        hospitalName: 'Rival Hospital',
        syntheticRegistrationNumber: 'SYN-RIVAL-002',
        address: '500 Other St',
        city: 'Metro City',
        latitude: 40.71,
        longitude: -74.0,
      });

      // Approve rival
      await Hospital.updateOne({ _id: h2Res.body.hospital._id }, { approvalStatus: 'APPROVED' });

      // Rival hospital tries to access hospital 1's request
      const res = await request(app)
        .get(`/api/requests/${createdRequestId}`)
        .set('Authorization', `Bearer ${h2Res.body.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/permission to view another hospital’s request/i);
    });
  });
});
