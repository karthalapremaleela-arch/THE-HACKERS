import { describe, it, expect } from 'vitest';
import { calculateHaversineDistanceKm, isValidCoordinate } from '../../src/utils/haversine.js';

describe('Haversine Distance & Coordinate Utilities', () => {
  it('should validate valid latitude and longitude coordinates', () => {
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(40.7128, -74.006)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
    expect(isValidCoordinate(90, 180)).toBe(true);
  });

  it('should invalidate out-of-range or non-numeric coordinates', () => {
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(-91, 0)).toBe(false);
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate(0, -181)).toBe(false);
    expect(isValidCoordinate('40', -74)).toBe(false);
    expect(isValidCoordinate(NaN, -74)).toBe(false);
    expect(isValidCoordinate(null, -74)).toBe(false);
    expect(isValidCoordinate(undefined, -74)).toBe(false);
  });

  it('should return 0 km for identical coordinates', () => {
    const dist = calculateHaversineDistanceKm(40.7128, -74.006, 40.7128, -74.006);
    expect(dist).toBe(0);
  });

  it('should calculate accurate distance between two nearby coordinates', () => {
    // 40.7128, -74.0060 (City Hall NYC) to 40.7580, -73.9855 (Times Square NYC) ~ 5.3 km
    const dist = calculateHaversineDistanceKm(40.7128, -74.006, 40.758, -73.9855);
    expect(dist).toBeGreaterThan(4.5);
    expect(dist).toBeLessThan(6.0);
  });

  it('should throw an error when given invalid coordinates', () => {
    expect(() => calculateHaversineDistanceKm(100, 0, 40, -74)).toThrow(/Invalid origin coordinates/);
    expect(() => calculateHaversineDistanceKm(40, -74, 40, 200)).toThrow(/Invalid destination coordinates/);
  });
});
