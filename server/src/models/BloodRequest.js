import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'ANY'],
      required: true,
      index: true,
    },
    unitsRequired: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'NORMAL'],
      default: 'HIGH',
      index: true,
    },
    searchRadiusKm: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 100,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    requiredBy: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    matchedDonorCount: {
      type: Number,
      default: 0,
    },
    acceptedResponseCount: {
      type: Number,
      default: 0,
    },
    declinedResponseCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

bloodRequestSchema.index({ hospitalId: 1, status: 1, createdAt: -1 });

export const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);
export default BloodRequest;
