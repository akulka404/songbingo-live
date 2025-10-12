import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  _id: string;
  gameId: string;
  itemId: string;
  order: number;
  calledAt: Date;
}

const CallSchema = new Schema<ICall>({
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
  order: { 
    type: Number, 
    required: true 
  },
  calledAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Index for efficient querying and ordering
CallSchema.index({ gameId: 1, order: 1 });

export const Call = mongoose.models.Call || mongoose.model<ICall>('Call', CallSchema);