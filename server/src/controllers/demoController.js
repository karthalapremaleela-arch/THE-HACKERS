import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Hospital } from '../models/Hospital.js';
import { Donor } from '../models/Donor.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { Notification } from '../models/Notification.js';
import { MEDICAL_DISCLAIMER } from '../utils/bloodCompatibility.js';
import { seedDatabase } from '../scripts/seed.js';

/**
 * Health check endpoint
 */
export async function getHealth(req, res) {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? 'CONNECTED' : dbState === 2 ? 'CONNECTING' : 'DISCONNECTED';

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'in-memory',
    },
    service: 'BloodConnect Emergency Matching API',
  });
}

/**
 * Demo and Simulation Status
 */
export async function getDemoStatus(req, res, next) {
  try {
    const [hospitalCount, donorCount, requestCount, notificationCount] = await Promise.all([
      Hospital.countDocuments(),
      Donor.countDocuments(),
      BloodRequest.countDocuments(),
      Notification.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      demoMode: true,
      syntheticDataNotice: 'DEMO DATA ONLY: All donor, hospital, and notification records are synthetic simulations.',
      disclaimer: MEDICAL_DISCLAIMER,
      mockServices: {
        donorDiscovery: 'MockDonorDiscoveryProvider v1.0 (Haversine Straight-line Distance)',
        notifications: 'MockNotificationService v1.0 (In-App & Simulated SMS/Email Logs)',
      },
      counts: {
        hospitals: hospitalCount,
        syntheticDonors: donorCount,
        bloodRequests: requestCount,
        simulatedAlerts: notificationCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Trigger re-seeding on demand
 */
export async function triggerSeed(req, res, next) {
  try {
    const result = await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Demo dataset seeded successfully.',
      result,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getHealth,
  getDemoStatus,
  triggerSeed,
};
