import { Hospital } from '../models/Hospital.js';

/**
 * Middleware to restrict route access to specific user roles
 * @param {Array<string>|string} allowedRoles
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user.role}.`,
      });
    }

    next();
  };
}

/**
 * Middleware ensuring current user is a Hospital AND has been APPROVED by an admin.
 * Pending or Rejected hospitals are blocked from creating emergency blood requests.
 */
export async function requireApprovedHospital(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'HOSPITAL') {
      return res.status(403).json({
        success: false,
        error: 'Access restricted to hospital accounts only.',
      });
    }

    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital profile not found for this account.',
      });
    }

    if (hospital.approvalStatus === 'PENDING') {
      return res.status(403).json({
        success: false,
        error: 'Your hospital registration is currently pending administrator verification. Emergency requests are blocked until approval.',
        approvalStatus: 'PENDING',
      });
    }

    if (hospital.approvalStatus === 'REJECTED') {
      return res.status(403).json({
        success: false,
        error: 'Your hospital registration was rejected by administrator.',
        approvalStatus: 'REJECTED',
        rejectionReason: hospital.rejectionReason,
      });
    }

    // Attach hospital document to request
    req.hospital = hospital;
    next();
  } catch (error) {
    next(error);
  }
}

export default {
  requireRole,
  requireApprovedHospital,
};
