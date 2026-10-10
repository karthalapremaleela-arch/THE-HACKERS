import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
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
    distanceKm: {
      type: Number,
      required: true,
    },
    matchReason: {
      type: String,
      default: 'Blood group and proximity eligibility match',
    },
    matchStatus: {
      type: String,
      enum: ['MATCHED', 'ALERTED', 'ACCEPTED', 'DECLINED', 'EXPIRED'],
      default: 'MATCHED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ requestId: 1, donorId: 1 }, { unique: true });

export const Match = mongoose.model('Match', matchSchema);
export default Match;
