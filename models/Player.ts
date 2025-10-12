import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  _id: string;
  gameId: string;
  name: string;
  joinedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  gameId: { 
    type: String, 
    required: true,
    ref: 'Game'
  },
  name: { 
    type: String, 
    required: true 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Index for efficient querying
PlayerSchema.index({ gameId: 1 });

export const Player = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);