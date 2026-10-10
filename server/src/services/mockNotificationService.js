/**
 * Mock Notification Service
 * Dispatches simulated emergency alerts across in-app, mock SMS, and mock email channels.
 * Integrates with Socket.IO for real-time live demo updates.
 */

import { Notification } from '../models/Notification.js';

let ioInstance = null;

/**
 * Configure active Socket.IO instance for real-time live demo alerts
 * @param {import('socket.io').Server} io
 */
export function setSocketIoInstance(io) {
  ioInstance = io;
}

export function getSocketIoInstance() {
  return ioInstance;
}

/**
 * Generates a unique synthetic alert identifier
 */
function generateAlertId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ALERT-${timestamp}-${random}`;
}

/**
 * Dispatches simulated notifications to matched donors for a blood request
 * @param {Object} params
 * @param {Object} params.bloodRequest
 * @param {Array<Object>} params.matchedDonors
 * @param {Object} [params.hospital]
 * @returns {Promise<{
 *   alertsCreated: number,
 *   deliveryLogs: Array<Object>,
 *   notifications: Array<Object>
 * }>}
 */
export async function dispatchSimulatedAlerts({ bloodRequest, matchedDonors, hospital }) {
  const deliveryLogs = [];
  const createdNotifications = [];

  for (const match of matchedDonors) {
    const donorId = match.donorId || match._id;

    // Check if an alert already exists for this donor & request (prevent duplicate alerts)
    const existing = await Notification.findOne({
      requestId: bloodRequest._id,
      donorId,
    });

    if (existing) {
      deliveryLogs.push({
        status: 'SKIPPED_DUPLICATE',
        donorId,
        alertId: existing.alertId,
        message: 'Alert already dispatched to this donor for this request.',
      });
      continue;
    }

    const alertId = generateAlertId();
    const fakePhone = `+1-555-01${Math.floor(10 + Math.random() * 89)}`;
    const fakeEmail = `mock.${match.syntheticDonorId.toLowerCase().replace(/[^a-z0-9]/g, '')}@bloodconnect.local`;

    const notificationDoc = await Notification.create({
      alertId,
      requestId: bloodRequest._id,
      donorId,
      hospitalId: hospital?._id || bloodRequest.hospitalId,
      urgency: bloodRequest.urgency,
      bloodGroup: bloodRequest.bloodGroup,
      distanceKm: match.distanceKm,
      channel: 'IN_APP',
      status: 'SENT_SIMULATED',
      simulatedDeliveryDetails: {
        mockSmsPhone: fakePhone,
        mockEmail: fakeEmail,
        dispatchedAt: new Date(),
        simulatedProviderMessageId: `MOCK-SMS-LOG-${Date.now()}`,
      },
    });

    createdNotifications.push(notificationDoc);

    const logEntry = {
      alertId,
      donorId: match.syntheticDonorId || donorId,
      channel: 'IN_APP & SIMULATED_SMS',
      urgency: bloodRequest.urgency,
      distanceKm: match.distanceKm,
      status: 'DELIVERED_SIMULATED',
      timestamp: new Date().toISOString(),
      simulatedNotice: `[MOCK SMS] Emergency ${bloodRequest.urgency} Request: ${bloodRequest.bloodGroup} needed at ${hospital?.hospitalName || 'Local Hospital'}. Distance: ~${match.distanceKm} km.`,
    };
    deliveryLogs.push(logEntry);

    // If socket.io is active, emit live alert event
    if (ioInstance) {
      ioInstance.emit(`alert:donor:${donorId}`, {
        type: 'NEW_EMERGENCY_ALERT',
        alert: notificationDoc,
        request: bloodRequest,
      });
      // Broadcast general emergency alert update for admin/stats
      ioInstance.emit('alert:created', {
        alertId,
        urgency: bloodRequest.urgency,
        requestId: bloodRequest._id,
      });
    }
  }

  return {
    alertsCreated: createdNotifications.length,
    deliveryLogs,
    notifications: createdNotifications,
  };
}

export default {
  setSocketIoInstance,
  dispatchSimulatedAlerts,
};
