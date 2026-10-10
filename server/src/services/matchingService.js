/**
 * Matching Service
 * Coordinates donor discovery, match record persistence, and simulated alert triggering.
 */

import mockDonorDiscoveryProvider from './mockDonorDiscoveryService.js';
import { dispatchSimulatedAlerts } from './mockNotificationService.js';
import { Match } from '../models/Match.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { Hospital } from '../models/Hospital.js';

/**
 * Executes matching for a blood request and dispatches simulated alerts
 * @param {string|import('mongoose').Types.ObjectId} requestId
 * @returns {Promise<{
 *   request: Object,
 *   matches: Array<Object>,
 *   alertsDispatched: number,
 *   searchMetadata: Object
 * }>}
 */
export async function executeMatchingForRequest(requestId) {
  const bloodRequest = await BloodRequest.findById(requestId);
  if (!bloodRequest) {
    throw new Error(`Blood request not found: ${requestId}`);
  }

  // If request is cancelled or expired, do not match or dispatch alerts
  if (bloodRequest.status === 'CANCELLED' || bloodRequest.status === 'EXPIRED') {
    throw new Error(`Cannot match donors for request with status: ${bloodRequest.status}`);
  }

  const hospital = await Hospital.findById(bloodRequest.hospitalId);

  // 1. Run discovery engine
  const discoveryResult = await mockDonorDiscoveryProvider.findNearbyDonors({
    latitude: bloodRequest.latitude,
    longitude: bloodRequest.longitude,
    bloodGroup: bloodRequest.bloodGroup,
    radiusKm: bloodRequest.searchRadiusKm,
  });

  const { matches, searchMetadata } = discoveryResult;

  // 2. Persist Match documents (idempotent / upsert logic)
  const persistedMatches = [];
  for (const match of matches) {
    const matchDoc = await Match.findOneAndUpdate(
      {
        requestId: bloodRequest._id,
        donorId: match.donorId,
      },
      {
        $setOnInsert: {
          requestId: bloodRequest._id,
          donorId: match.donorId,
          distanceKm: match.distanceKm,
          matchReason: match.matchType === 'EXPLORATORY_ANY' 
            ? 'Exploratory ANY group match within radius'
            : `Exact ${bloodRequest.bloodGroup} match within ${match.distanceKm} km`,
          matchStatus: 'MATCHED',
        },
      },
      { upsert: true, new: true }
    );
    persistedMatches.push(matchDoc);
  }

  // 3. Dispatch simulated alerts
  const alertResult = await dispatchSimulatedAlerts({
    bloodRequest,
    matchedDonors: matches,
    hospital,
  });

  // 4. Update request matched count
  bloodRequest.matchedDonorCount = matches.length;
  await bloodRequest.save();

  return {
    request: bloodRequest,
    matches,
    persistedMatches,
    alertsDispatched: alertResult.alertsCreated,
    searchMetadata,
  };
}

export default {
  executeMatchingForRequest,
};
