import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: true,
      index: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: true,
      index: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'NORMAL'],
      default: 'HIGH',
    },
    bloodGroup: {
      type: String,
      required: true,
    },
    distanceKm: {
      type: Number,
      required: true,
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'MOCK_SMS', 'MOCK_EMAIL'],
      default: 'IN_APP',
    },
    status: {
      type: String,
      enum: ['QUEUED', 'SENT_SIMULATED', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED'],
      default: 'SENT_SIMULATED',
      index: true,
    },
    simulatedDeliveryDetails: {
      mockSmsPhone: String,
      mockEmail: String,
      dispatchedAt: Date,
      simulatedProviderMessageId: String,
    },
    viewedAt: {
      type: Date,
    },
    respondedAt: {
      type: Date,
    },
    responseNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ requestId: 1, donorId: 1 }, { unique: true });
notificationSchema.index({ donorId: 1, status: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
