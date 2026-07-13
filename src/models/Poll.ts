import mongoose, { Schema, Document } from 'mongoose';

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: POLL MODULE
 * ============================================================================
 * Moving fans beyond passive viewing by inviting active real-time input
 * during matches. Live polls allow organizers to trigger instant trivia, 
 * MVP votes, or match prediction prompts that push directly to user devices.
 */

export interface IVote {
  userId: mongoose.Types.ObjectId;
  optionIndex: number;
}

export interface IPoll extends Document {
  matchId: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  votes: IVote[];
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    optionIndex: { type: Number, required: true },
  },
  { _id: false }
);

const PollSchema: Schema = new Schema(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true, // Optimized for fetching match-specific live polls
    },
    question: { type: String, required: true, trim: true },
    options: [{ type: String, required: true, trim: true }],
    votes: [VoteSchema],
  },
  { timestamps: true }
);

// Prevent a user from voting multiple times on the same poll
PollSchema.index({ _id: 1, 'votes.userId': 1 });

export const Poll = mongoose.model<IPoll>('Poll', PollSchema);
