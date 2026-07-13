import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  jerseyNumber: number;
  teamId: mongoose.Types.ObjectId;
  stats: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    jerseyNumber: { type: Number, required: true },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true, // Optimized for roster listings
    },
    stats: {
      type: Schema.Types.Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const Player = mongoose.model<IPlayer>('Player', PlayerSchema);
