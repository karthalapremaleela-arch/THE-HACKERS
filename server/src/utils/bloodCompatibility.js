/**
 * Blood Compatibility & Rules Utility for BloodConnect
 * Handles blood group validation, matching rules, and exploratory ANY requests.
 * 
 * IMPORTANT DISCLAIMER:
 * Final blood-group compatibility and transfusion suitability must be confirmed
 * by qualified hospital or blood-bank personnel. This application performs synthetic
 * donor matching simulation and does not make clinical decisions.
 */

export const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const SEARCH_BLOOD_GROUPS = [...VALID_BLOOD_GROUPS, 'ANY'];

export const MEDICAL_DISCLAIMER =
  'Final blood-group compatibility and transfusion suitability must be confirmed by qualified hospital or blood-bank personnel.';

/**
 * Checks if a blood group is valid for a donor or request
 * @param {string} bg
 * @param {boolean} allowAny
 * @returns {boolean}
 */
export function isValidBloodGroup(bg, allowAny = false) {
  if (!bg || typeof bg !== 'string') return false;
  const upper = bg.trim().toUpperCase();
  return allowAny ? SEARCH_BLOOD_GROUPS.includes(upper) : VALID_BLOOD_GROUPS.includes(upper);
}

/**
 * Checks if a donor's blood group matches the requested blood group
 * In default mode, exact matching is used.
 * When requestedBloodGroup is 'ANY', all blood groups match (exploratory search).
 * 
 * @param {string} requestedBloodGroup
 * @param {string} donorBloodGroup
 * @returns {{ isMatch: boolean, matchType: 'EXACT' | 'EXPLORATORY_ANY' | 'NONE', notice?: string }}
 */
export function checkBloodGroupMatch(requestedBloodGroup, donorBloodGroup) {
  const req = (requestedBloodGroup || '').trim().toUpperCase();
  const donor = (donorBloodGroup || '').trim().toUpperCase();

  if (!VALID_BLOOD_GROUPS.includes(donor)) {
    return { isMatch: false, matchType: 'NONE' };
  }

  if (req === 'ANY') {
    return {
      isMatch: true,
      matchType: 'EXPLORATORY_ANY',
      notice: 'Exploratory ANY search: Donor returned without asserting specific transfusion compatibility.',
    };
  }

  if (req === donor) {
    return {
      isMatch: true,
      matchType: 'EXACT',
    };
  }

  return { isMatch: false, matchType: 'NONE' };
}

export default {
  VALID_BLOOD_GROUPS,
  SEARCH_BLOOD_GROUPS,
  MEDICAL_DISCLAIMER,
  isValidBloodGroup,
  checkBloodGroupMatch,
};
