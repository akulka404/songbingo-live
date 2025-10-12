import mongoose, { Schema, Document } from 'mongoose';

export interface IPlacement extends Document {
  _id: string;
  playerId: string;
  gameId: string;
  itemId: string;
  row: number;
  col: number;
  placedAt: Date;
}

const PlacementSchema = new Schema<IPlacement>({
  playerId: { 
    type: String, 
    required: true,
    ref: 'Player'
  },
  gameId: { 
    type: String, 
    required: true,
    ref: 'Game'
  },
  itemId: { 
    type: String, 
    required: true,
    ref: 'Item'
  },
  row: { 
    type: Number, 
    required: true,
    min: 0,
    max: 4
  },
  col: { 
    type: Number, 
    required: true,
    min: 0,
    max: 4
  },
  placedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Unique indexes as specified in requirements
PlacementSchema.index({ playerId: 1, row: 1, col: 1 }, { unique: true });
PlacementSchema.index({ playerId: 1, itemId: 1 }, { unique: true });

export const Placement = mongoose.models.Placement || mongoose.model<IPlacement>('Placement', PlacementSchema);