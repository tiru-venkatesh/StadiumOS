import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  players: mongoose.Types.ObjectId[];
  tournamentId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true, // Optimized for tournament detail lookups
    },
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
