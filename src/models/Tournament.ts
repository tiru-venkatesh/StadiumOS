import mongoose, { Schema, Document } from 'mongoose';

export interface ITournament extends Document {
  name: string;
  sport: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  teams: mongoose.Types.ObjectId[];
  status: 'upcoming' | 'live' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sport: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed'],
      default: 'upcoming',
      required: true,
      index: true, // Optimized for dashboard filters
    },
  },
  { timestamps: true }
);

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema);
