import { Hospital } from '../models/Hospital.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { Notification } from '../models/Notification.js';

/**
 * Get logged-in hospital's profile
 */
export async function getHospitalMe(req, res, next) {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital profile not found for this account.',
      });
    }

    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Hospital Dashboard Overview
 */
export async function getHospitalDashboard(req, res, next) {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital profile not found.',
      });
    }

    const [
      activeRequestsCount,
      totalRequestsCount,
      recentRequests,
      recentNotifications,
    ] = await Promise.all([
      BloodRequest.countDocuments({ hospitalId: hospital._id, status: 'ACTIVE' }),
      BloodRequest.countDocuments({ hospitalId: hospital._id }),
      BloodRequest.find({ hospitalId: hospital._id }).sort({ createdAt: -1 }).limit(10),
      Notification.find({ hospitalId: hospital._id })
        .populate('donorId', 'displayName bloodGroup city syntheticDonorId')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Aggregate total accepted responses
    const totalAccepted = await Notification.countDocuments({
      hospitalId: hospital._id,
      status: 'ACCEPTED',
    });

    res.status(200).json({
      success: true,
      data: {
        hospital,
        stats: {
          approvalStatus: hospital.approvalStatus,
          activeRequests: activeRequestsCount,
          totalRequests: totalRequestsCount,
          totalAcceptedResponses: totalAccepted,
        },
        recentRequests,
        recentNotifications,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getHospitalMe,
  getHospitalDashboard,
};
