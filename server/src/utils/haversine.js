/**
 * Haversine Formula Utility for BloodConnect
 * Calculates great-circle distance between two geographic coordinates on Earth.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Validates geographic latitude and longitude coordinates
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @returns {boolean} True if coordinates are valid numbers within bounds
 */
export function isValidCoordinate(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return false;
  }
  if (isNaN(lat) || isNaN(lon)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Converts degrees to radians
 * @param {number} deg
 * @returns {number}
 */
function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates straight-line distance in kilometers between two points using the Haversine formula
 * @param {number} lat1 - Latitude of origin
 * @param {number} lon1 - Longitude of origin
 * @param {number} lat2 - Latitude of destination
 * @param {number} lon2 - Longitude of destination
 * @param {number} decimals - Precision (default 2)
 * @returns {number} Distance in kilometers
 * @throws {Error} If any coordinates are invalid
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2, decimals = 2) {
  if (!isValidCoordinate(lat1, lon1)) {
    throw new Error(`Invalid origin coordinates: lat=${lat1}, lon=${lon1}`);
  }
  if (!isValidCoordinate(lat2, lon2)) {
    throw new Error(`Invalid destination coordinates: lat=${lat2}, lon=${lon2}`);
  }

  // Same coordinates shortcut
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Number(distance.toFixed(decimals));
}

export default {
  isValidCoordinate,
  calculateHaversineDistanceKm,
};
