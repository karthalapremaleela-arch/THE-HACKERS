/**
 * Mock Donor Discovery Service
 * Simulates external donor discovery and radius search using seeded synthetic donor records.
 * Provides a provider interface for future integration with authorized registries.
 */

import { Donor } from '../models/Donor.js';
import { calculateHaversineDistanceKm, isValidCoordinate } from '../utils/haversine.js';
import { checkBloodGroupMatch, MEDICAL_DISCLAIMER } from '../utils/bloodCompatibility.js';

/**
 * Base Donor Discovery Provider Interface
 */
export class DonorDiscoveryProvider {
  /**
   * Discovers donors near a location
   * @param {Object} query
   * @param {number} query.latitude
   * @param {number} query.longitude
   * @param {string} query.bloodGroup
   * @param {number} query.radiusKm
   * @returns {Promise<Object>}
   */
  async findNearbyDonors(query) {
    throw new Error('findNearbyDonors method must be implemented by provider');
  }
}

/**
 * Synthetic Mock Donor Discovery Provider
 */
export class MockDonorDiscoveryProvider extends DonorDiscoveryProvider {
  constructor(options = {}) {
    super();
    this.providerName = 'BloodConnect Synthetic Mock Donor Discovery Engine v1.0';
    this.options = options;
  }

  /**
   * Search synthetic donors near hospital coordinates
   * @param {Object} query
   * @param {number} query.latitude - Hospital latitude
   * @param {number} query.longitude - Hospital longitude
   * @param {string} query.bloodGroup - Requested blood group or 'ANY'
   * @param {number} [query.radiusKm=10] - Search radius in km
   * @param {boolean} [query.includeUnavailable=false] - For admin view / exploratory
   * @returns {Promise<{
   *   isMockData: boolean,
   *   provider: string,
   *   searchMetadata: {
   *     executionTimeMs: number,
   *     recordsExamined: number,
   *     matchesFound: number,
   *     searchRadiusKm: number,
   *     bloodGroupQuery: string,
   *     centerCoordinates: { latitude: number, longitude: number }
   *   },
   *   disclaimer: string,
   *   matches: Array<{
   *     donorId: string,
   *     syntheticDonorId: string,
   *     displayName: string,
   *     bloodGroup: string,
   *     distanceKm: number,
   *     city: string,
   *     isAvailable: boolean,
   *     acceptsUrgentAlerts: boolean,
   *     matchType: string,
   *     matchNotice?: string
   *   }>
   * }>}
   */
  async findNearbyDonors({ latitude, longitude, bloodGroup, radiusKm = 10, includeUnavailable = false }) {
    const startTime = Date.now();

    // 1. Validate coordinates
    if (!isValidCoordinate(latitude, longitude)) {
      throw new Error(`Invalid search coordinates: latitude=${latitude}, longitude=${longitude}`);
    }

    const radius = Number(radiusKm) || 10;
    const cleanBloodGroup = (bloodGroup || 'ANY').trim().toUpperCase();

    // 2. Fetch all synthetic mock donor records in dataset
    const allDonors = await Donor.find({ isSynthetic: true }).lean();
    const recordsExamined = allDonors.length;

    // 3. Filter by eligibility, blood group, and calculate Haversine distance
    const matchedDonors = [];

    for (const donor of allDonors) {
      // Validate donor coordinates
      if (!isValidCoordinate(donor.latitude, donor.longitude)) {
        continue;
      }

      // Check availability and alert preference rules
      if (!includeUnavailable && (!donor.isAvailable || !donor.acceptsUrgentAlerts)) {
        continue;
      }

      // Check blood group compatibility
      const compatibility = checkBloodGroupMatch(cleanBloodGroup, donor.bloodGroup);
      if (!compatibility.isMatch) {
        continue;
      }

      // Calculate distance using Haversine formula
      const distanceKm = calculateHaversineDistanceKm(
        latitude,
        longitude,
        donor.latitude,
        donor.longitude
      );

      // Check radius cutoff
      if (distanceKm <= radius) {
        matchedDonors.push({
          donorId: donor._id.toString(),
          syntheticDonorId: donor.syntheticDonorId,
          displayName: donor.displayName,
          bloodGroup: donor.bloodGroup,
          distanceKm,
          city: donor.city,
          latitude: donor.latitude,
          longitude: donor.longitude,
          isAvailable: donor.isAvailable,
          acceptsUrgentAlerts: donor.acceptsUrgentAlerts,
          matchType: compatibility.matchType,
          matchNotice: compatibility.notice,
          isSynthetic: true,
        });
      }
    }

    // 4. Sort matches by distance (nearest to farthest)
    matchedDonors.sort((a, b) => a.distanceKm - b.distanceKm);

    const executionTimeMs = Date.now() - startTime;

    return {
      isMockData: true,
      provider: this.providerName,
      searchMetadata: {
        executionTimeMs,
        recordsExamined,
        matchesFound: matchedDonors.length,
        searchRadiusKm: radius,
        bloodGroupQuery: cleanBloodGroup,
        centerCoordinates: { latitude, longitude },
      },
      disclaimer: MEDICAL_DISCLAIMER,
      matches: matchedDonors,
    };
  }
}

// Default exported singleton provider
const defaultProvider = new MockDonorDiscoveryProvider();

export default defaultProvider;
