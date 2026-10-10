import { Hospital } from '../models/Hospital.js';
import { User } from '../models/User.js';
import { Donor } from '../models/Donor.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { Match } from '../models/Match.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * Get Admin Dashboard Summary Statistics
 */
export async function getAdminDashboard(req, res, next) {
  try {
    const [
      totalHospitals,
      pendingHospitals,
      approvedHospitals,
      rejectedHospitals,
      totalDonors,
      activeRequests,
      totalRequests,
      totalMatches,
      simulatedNotifications,
      recentAuditLogs,
    ] = await Promise.all([
      Hospital.countDocuments(),
      Hospital.countDocuments({ approvalStatus: 'PENDING' }),
      Hospital.countDocuments({ approvalStatus: 'APPROVED' }),
      Hospital.countDocuments({ approvalStatus: 'REJECTED' }),
      Donor.countDocuments(),
      BloodRequest.countDocuments({ status: 'ACTIVE' }),
      BloodRequest.countDocuments(),
      Match.countDocuments(),
      Notification.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('actorUserId', 'name email role'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalHospitals,
          pendingHospitals,
          approvedHospitals,
          rejectedHospitals,
          totalDonors,
          activeRequests,
          totalRequests,
          totalMatches,
          simulatedNotifications,
        },
        recentAuditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Hospitals List with optional status filter
 */
export async function getHospitals(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.approvalStatus = status.toUpperCase();
    }

    const hospitals = await Hospital.find(filter)
      .populate('userId', 'name email accountStatus createdAt')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: hospitals,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve Hospital Registration
 */
export async function approveHospital(req, res, next) {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findById(id).populate('userId');
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital record not found.',
      });
    }

    hospital.approvalStatus = 'APPROVED';
    hospital.reviewedAt = new Date();
    hospital.reviewedBy = req.user._id;
    hospital.rejectionReason = undefined;
    await hospital.save();

    // Update user account status
    if (hospital.userId) {
      hospital.userId.accountStatus = 'ACTIVE';
      await hospital.userId.save();
    }

    await logAuditEvent({
      actorUserId: req.user._id,
      action: 'HOSPITAL_APPROVED',
      entityType: 'HOSPITAL',
      entityId: hospital._id,
      safeMetadata: {
        hospitalName: hospital.hospitalName,
        approvedBy: req.user.email,
        syntheticRegistrationNumber: hospital.syntheticRegistrationNumber,
      },
    });

    res.status(200).json({
      success: true,
      message: `Hospital "${hospital.hospitalName}" approved successfully.`,
      data: hospital,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject Hospital Registration
 */
export async function rejectHospital(req, res, next) {
  try {
    const { id } = req.params;
    const { rejectionReason = 'Documentation could not be verified in demo review.' } = req.body;

    const hospital = await Hospital.findById(id).populate('userId');
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital record not found.',
      });
    }

    hospital.approvalStatus = 'REJECTED';
    hospital.rejectionReason = rejectionReason;
    hospital.reviewedAt = new Date();
    hospital.reviewedBy = req.user._id;
    await hospital.save();

    await logAuditEvent({
      actorUserId: req.user._id,
      action: 'HOSPITAL_REJECTED',
      entityType: 'HOSPITAL',
      entityId: hospital._id,
      safeMetadata: {
        hospitalName: hospital.hospitalName,
        rejectionReason,
        rejectedBy: req.user.email,
      },
    });

    res.status(200).json({
      success: true,
      message: `Hospital "${hospital.hospitalName}" registration rejected.`,
      data: hospital,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all blood requests (admin view)
 */
export async function getAllRequests(req, res, next) {
  try {
    const requests = await BloodRequest.find()
      .populate('hospitalId')
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
 * Get all notifications (admin view)
 */
export async function getAllNotifications(req, res, next) {
  try {
    const notifications = await Notification.find()
      .populate('requestId')
      .populate('donorId')
      .populate('hospitalId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get system audit logs
 */
export async function getAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.find()
      .populate('actorUserId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get synthetic donor records (admin view)
 */
export async function getDonors(req, res, next) {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: donors,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAdminDashboard,
  getHospitals,
  approveHospital,
  rejectHospital,
  getAllRequests,
  getAllNotifications,
  getAuditLogs,
  getDonors,
};
