import { BloodRequest } from '../models/BloodRequest.js';
import { Hospital } from '../models/Hospital.js';
import { Match } from '../models/Match.js';
import { executeMatchingForRequest } from '../services/matchingService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * Create Emergency Blood Request and Trigger Mock Matching & Simulated Alerts
 */
export async function createBloodRequest(req, res, next) {
  try {
    const hospital = req.hospital; // Attached by requireApprovedHospital middleware

    const {
      bloodGroup,
      unitsRequired = 1,
      urgency = 'HIGH',
      searchRadiusKm = 10,
      latitude,
      longitude,
      requiredBy,
      notes,
    } = req.body;

    const requestLat = latitude !== undefined ? latitude : hospital.latitude;
    const requestLon = longitude !== undefined ? longitude : hospital.longitude;

    const bloodRequest = await BloodRequest.create({
      hospitalId: hospital._id,
      bloodGroup: bloodGroup.toUpperCase(),
      unitsRequired,
      urgency,
      searchRadiusKm,
      latitude: requestLat,
      longitude: requestLon,
      requiredBy: new Date(requiredBy),
      notes,
      status: 'ACTIVE',
    });

    // Execute matching engine and dispatch simulated alerts
    const matchResults = await executeMatchingForRequest(bloodRequest._id);

    await logAuditEvent({
      actorUserId: req.user._id,
      action: 'REQUEST_CREATED',
      entityType: 'BLOOD_REQUEST',
      entityId: bloodRequest._id,
      safeMetadata: {
        hospitalName: hospital.hospitalName,
        bloodGroup,
        urgency,
        unitsRequired,
        searchRadiusKm,
        matchedDonorsCount: matchResults.matches.length,
      },
    });

    res.status(201).json({
      success: true,
      message: `Emergency request created. Dispatched simulated alerts to ${matchResults.alertsDispatched} mock donors.`,
      data: {
        request: matchResults.request,
        matchedDonors: matchResults.matches,
        alertsDispatched: matchResults.alertsDispatched,
        searchMetadata: matchResults.searchMetadata,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all requests for current hospital or all (for admin)
 */
export async function getRequests(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === 'HOSPITAL') {
      const hospital = await Hospital.findOne({ userId: req.user._id });
      if (!hospital) {
        return res.status(404).json({ success: false, error: 'Hospital not found' });
      }
      filter.hospitalId = hospital._id;
    }

    const requests = await BloodRequest.find(filter)
      .populate('hospitalId', 'hospitalName city address syntheticRegistrationNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get specific blood request details
 */
export async function getRequestById(req, res, next) {
  try {
    const { id } = req.params;
    const bloodRequest = await BloodRequest.findById(id).populate('hospitalId');
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: 'Blood request not found.',
      });
    }

    // Role ownership check
    if (req.user.role === 'HOSPITAL') {
      const hospital = await Hospital.findOne({ userId: req.user._id });
      if (!hospital || hospital._id.toString() !== bloodRequest.hospitalId._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not have permission to view another hospital’s request.',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: bloodRequest,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get matched donors for a request
 */
export async function getRequestMatches(req, res, next) {
  try {
    const { id } = req.params;
    const bloodRequest = await BloodRequest.findById(id).populate('hospitalId');
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: 'Blood request not found.',
      });
    }

    // Role ownership check
    if (req.user.role === 'HOSPITAL') {
      const hospital = await Hospital.findOne({ userId: req.user._id });
      if (!hospital || hospital._id.toString() !== bloodRequest.hospitalId._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this request.',
        });
      }
    }

    const matches = await Match.find({ requestId: id })
      .populate('donorId', 'syntheticDonorId displayName bloodGroup city isAvailable acceptsUrgentAlerts')
      .sort({ distanceKm: 1 });

    res.status(200).json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel an active blood request
 */
export async function cancelBloodRequest(req, res, next) {
  try {
    const { id } = req.params;
    const bloodRequest = await BloodRequest.findById(id);
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: 'Blood request not found.',
      });
    }

    // Check ownership
    if (req.user.role === 'HOSPITAL') {
      const hospital = await Hospital.findOne({ userId: req.user._id });
      if (!hospital || hospital._id.toString() !== bloodRequest.hospitalId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Cannot cancel another hospital’s request.',
        });
      }
    }

    bloodRequest.status = 'CANCELLED';
    await bloodRequest.save();

    await logAuditEvent({
      actorUserId: req.user._id,
      action: 'REQUEST_CANCELLED',
      entityType: 'BLOOD_REQUEST',
      entityId: bloodRequest._id,
      safeMetadata: { requestId: bloodRequest._id },
    });

    res.status(200).json({
      success: true,
      message: 'Blood request cancelled successfully.',
      data: bloodRequest,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  createBloodRequest,
  getRequests,
  getRequestById,
  getRequestMatches,
  cancelBloodRequest,
};
