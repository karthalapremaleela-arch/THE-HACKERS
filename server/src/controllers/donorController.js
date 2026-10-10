import { Donor } from '../models/Donor.js';
import { Notification } from '../models/Notification.js';
import { Match } from '../models/Match.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * Get current donor's profile
 */
export async function getDonorMe(req, res, next) {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'Donor profile not found for this account.',
      });
    }

    res.status(200).json({
      success: true,
      data: donor,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update donor profile
 */
export async function updateDonorProfile(req, res, next) {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'Donor profile not found.',
      });
    }

    const allowedFields = [
      'displayName',
      'bloodGroup',
      'city',
      'latitude',
      'longitude',
      'isAvailable',
      'acceptsUrgentAlerts',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        donor[field] = req.body[field];
      }
    });

    await donor.save();

    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully.',
      data: donor,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle donor availability
 */
export async function toggleAvailability(req, res, next) {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'Donor profile not found.',
      });
    }

    const { isAvailable } = req.body;
    donor.isAvailable = Boolean(isAvailable);
    await donor.save();

    res.status(200).json({
      success: true,
      message: `Availability updated to ${donor.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}.`,
      data: donor,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get alerts for current donor
 */
export async function getDonorAlerts(req, res, next) {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({
        success: false,
        error: 'Donor profile not found.',
      });
    }

    const alerts = await Notification.find({ donorId: donor._id })
      .populate('requestId')
      .populate('hospitalId', 'hospitalName address city')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark an alert as VIEWED
 */
export async function markAlertViewed(req, res, next) {
  try {
    const { id } = req.params;
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ success: false, error: 'Donor profile not found' });
    }

    const alert = await Notification.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    // Security check: Must belong to this donor
    if (alert.donorId.toString() !== donor._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You cannot view or modify another donor’s alert.',
      });
    }

    if (alert.status === 'SENT_SIMULATED' || alert.status === 'QUEUED') {
      alert.status = 'VIEWED';
      alert.viewedAt = new Date();
      await alert.save();
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Respond to simulated alert (ACCEPT or DECLINE)
 */
export async function respondToAlert(req, res, next) {
  try {
    const { id } = req.params;
    const { response, notes } = req.body;

    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ success: false, error: 'Donor profile not found' });
    }

    const alert = await Notification.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    // Ownership check: Alert must belong to the requesting donor
    if (alert.donorId.toString() !== donor._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Cannot respond to another donor’s alert.',
      });
    }

    const isAccept = response === 'ACCEPT';
    const newStatus = isAccept ? 'ACCEPTED' : 'DECLINED';

    // Prevent double counting if already responded with the same status
    if (alert.status !== newStatus) {
      const prevStatus = alert.status;
      alert.status = newStatus;
      alert.respondedAt = new Date();
      if (notes) alert.responseNotes = notes;
      await alert.save();

      // Update Match record
      await Match.findOneAndUpdate(
        { requestId: alert.requestId, donorId: alert.donorId },
        { matchStatus: newStatus }
      );

      // Update BloodRequest counts
      const incField = isAccept ? 'acceptedResponseCount' : 'declinedResponseCount';
      const updateObj = { $inc: { [incField]: 1 } };

      // If switching from accepted to declined or vice versa, decrement previous
      if (prevStatus === 'ACCEPTED' && !isAccept) {
        updateObj.$inc.acceptedResponseCount = -1;
      } else if (prevStatus === 'DECLINED' && isAccept) {
        updateObj.$inc.declinedResponseCount = -1;
      }

      await BloodRequest.findByIdAndUpdate(alert.requestId, updateObj);

      await logAuditEvent({
        actorUserId: req.user._id,
        action: `ALERT_${newStatus}`,
        entityType: 'NOTIFICATION',
        entityId: alert._id,
        safeMetadata: {
          requestId: alert.requestId,
          donorDisplayName: donor.displayName,
          response: newStatus,
        },
      });

      // Emit live socket event for real-time hospital update
      const { getSocketIoInstance } = await import('../services/mockNotificationService.js');
      const io = getSocketIoInstance();
      if (io) {
        io.emit(`request:${alert.requestId}:update`, {
          requestId: alert.requestId,
          status: newStatus,
          donorId: alert.donorId,
        });
        io.emit('stats:updated');
      }
    }

    res.status(200).json({
      success: true,
      message: `You have successfully ${isAccept ? 'accepted' : 'declined'} this emergency request alert.`,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getDonorMe,
  updateDonorProfile,
  toggleAvailability,
  getDonorAlerts,
  markAlertViewed,
  respondToAlert,
};
