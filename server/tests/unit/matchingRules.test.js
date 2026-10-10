import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { Donor } from '../../src/models/Donor.js';
import { User } from '../../src/models/User.js';
import { checkBloodGroupMatch, isValidBloodGroup } from '../../src/utils/bloodCompatibility.js';
import mockDonorDiscoveryProvider from '../../src/services/mockDonorDiscoveryService.js';

describe('Blood Compatibility & Matching Rules', () => {
  it('should validate blood groups correctly', () => {
    expect(isValidBloodGroup('A+')).toBe(true);
    expect(isValidBloodGroup('O-')).toBe(true);
    expect(isValidBloodGroup('AB+')).toBe(true);
    expect(isValidBloodGroup('XYZ')).toBe(false);
    expect(isValidBloodGroup('ANY', false)).toBe(false);
    expect(isValidBloodGroup('ANY', true)).toBe(true);
  });

  it('should enforce exact blood group matching for specific groups', () => {
    expect(checkBloodGroupMatch('A+', 'A+').isMatch).toBe(true);
    expect(checkBloodGroupMatch('A+', 'A+').matchType).toBe('EXACT');

    expect(checkBloodGroupMatch('A+', 'B+').isMatch).toBe(false);
    expect(checkBloodGroupMatch('O-', 'O+').isMatch).toBe(false);
  });

  it('should allow exploratory match for ANY with notice', () => {
    const match = checkBloodGroupMatch('ANY', 'O-');
    expect(match.isMatch).toBe(true);
    expect(match.matchType).toBe('EXPLORATORY_ANY');
    expect(match.notice).toBeDefined();
  });
});

describe('Mock Donor Discovery Service', () => {
  let createdUsers = [];
  let createdDonors = [];

  beforeAll(async () => {
    await connectDB();
    await Donor.deleteMany({});
    await User.deleteMany({});

    // Seed test donors with precise distances from (40.7128, -74.0060)
    const testDonorsData = [
      { name: 'Donor Near A+', bg: 'A+', dLat: 0.01, dLon: 0.01, avail: true, alerts: true }, // ~1.4 km
      { name: 'Donor Far A+', bg: 'A+', dLat: 0.15, dLon: 0.15, avail: true, alerts: true },   // ~21 km
      { name: 'Donor Near Unavailable A+', bg: 'A+', dLat: 0.015, dLon: 0.015, avail: false, alerts: true }, // ~2.1 km
      { name: 'Donor Near Disabled Alerts A+', bg: 'A+', dLat: 0.02, dLon: 0.02, avail: true, alerts: false }, // ~2.8 km
      { name: 'Donor Near B+', bg: 'B+', dLat: 0.012, dLon: 0.012, avail: true, alerts: true }, // ~1.7 km
    ];

    for (const d of testDonorsData) {
      const u = await User.create({
        name: d.name,
        email: `${d.name.toLowerCase().replace(/\s+/g, '')}@test.local`,
        passwordHash: 'dummy',
        role: 'DONOR',
      });
      createdUsers.push(u);

      const donor = await Donor.create({
        userId: u._id,
        syntheticDonorId: `TEST-${Math.random().toString(36).substring(7)}`,
        displayName: d.name,
        bloodGroup: d.bg,
        city: 'Metro City',
        latitude: 40.7128 + d.dLat,
        longitude: -74.0060 + d.dLon,
        isAvailable: d.avail,
        acceptsUrgentAlerts: d.alerts,
        isSynthetic: true,
      });
      createdDonors.push(donor);
    }
  });

  afterAll(async () => {
    await Donor.deleteMany({});
    await User.deleteMany({});
    await disconnectDB();
  });

  it('should filter by blood group and radius (10km) and exclude unavailable & disabled alerts', async () => {
    const result = await mockDonorDiscoveryProvider.findNearbyDonors({
      latitude: 40.7128,
      longitude: -74.0060,
      bloodGroup: 'A+',
      radiusKm: 10,
    });

    expect(result.isMockData).toBe(true);
    expect(result.searchMetadata.bloodGroupQuery).toBe('A+');
    expect(result.searchMetadata.recordsExamined).toBe(createdDonors.length);

    // Only 'Donor Near A+' should qualify:
    // 'Donor Far A+' is 21 km (> 10 km)
    // 'Donor Near Unavailable A+' is unavailable
    // 'Donor Near Disabled Alerts A+' has alerts disabled
    // 'Donor Near B+' is wrong blood group
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].displayName).toBe('Donor Near A+');
    expect(result.matches[0].distanceKm).toBeLessThan(10);
  });

  it('should return donors sorted by distance ascending when multiple match', async () => {
    const result = await mockDonorDiscoveryProvider.findNearbyDonors({
      latitude: 40.7128,
      longitude: -74.0060,
      bloodGroup: 'ANY',
      radiusKm: 25,
    });

    expect(result.matches.length).toBeGreaterThan(1);
    for (let i = 0; i < result.matches.length - 1; i++) {
      expect(result.matches[i].distanceKm).toBeLessThanOrEqual(result.matches[i + 1].distanceKm);
    }
  });

  it('should handle zero match queries gracefully without throwing', async () => {
    const result = await mockDonorDiscoveryProvider.findNearbyDonors({
      latitude: 40.7128,
      longitude: -74.0060,
      bloodGroup: 'AB-',
      radiusKm: 5,
    });

    expect(result.matches).toEqual([]);
    expect(result.searchMetadata.matchesFound).toBe(0);
  });

  it('should throw an error for invalid search coordinates', async () => {
    await expect(
      mockDonorDiscoveryProvider.findNearbyDonors({
        latitude: 95,
        longitude: -74,
        bloodGroup: 'A+',
      })
    ).rejects.toThrow(/Invalid search coordinates/);
  });
});
