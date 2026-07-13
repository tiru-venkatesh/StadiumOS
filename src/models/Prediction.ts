import mongoose, { Schema, Document } from 'mongoose';

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: PREDICTION MODULE
 * ============================================================================
 * Moving fans beyond passive viewing by creating gamified tournament outcomes.
 * Fans guess match winners beforehand, accumulating score points to progress
 * on stadium-wide live leaderboards, driving deep, continuous engagement.
 */

export interface IPrediction extends Document {
  userId: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  predictedWinner: mongoose.Types.ObjectId;
  points: number;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true,
    },
    predictedWinner: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    processed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee a fan can submit exactly one prediction per match
PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export const Prediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);
