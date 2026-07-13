import mongoose, { Schema, Document } from 'mongoose';
import { MatchStatus } from '../constants/index.ts';

export interface IMatch extends Document {
  tournamentId: mongoose.Types.ObjectId;
  teamA: mongoose.Types.ObjectId;
  teamB: mongoose.Types.ObjectId;
  venue: string;
  startTime: Date;
  score: {
    teamA: number;
    teamB: number;
  };
  status: MatchStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema: Schema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true, // Index for grouping tournament matches
    },
    teamA: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    teamB: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    venue: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true, index: true },
    score: {
      teamA: { type: Number, default: 0 },
      teamB: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: Object.values(MatchStatus),
      default: MatchStatus.UPCOMING,
      required: true,
      index: true, // Index for filtering live vs upcoming matches
    },
  },
  { timestamps: true }
);

export const Match = mongoose.model<IMatch>('Match', MatchSchema);
