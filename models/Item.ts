import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  _id: string;
  gameId: string;
  question: string;
  answer: string;
  order: number;
  createdAt: Date;
}

const ItemSchema = new Schema<IItem>({
  gameId: { 
    type: String, 
    required: true,
    ref: 'Game'
  },
  question: { 
    type: String, 
    required: true 
  },
  answer: { 
    type: String, 
    required: true 
  },
  order: { 
    type: Number, 
    required: true 
  },
}, {
  timestamps: true,
});

// Index for efficient querying
ItemSchema.index({ gameId: 1, order: 1 });

export const Item = mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);