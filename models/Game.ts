import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  _id: string;
  code: string;
  hostSecret: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    length: 6
  },
  hostSecret: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String,
    default: 'Song Bingo Game'
  },
}, {
  timestamps: true,
});

export const Game = mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);