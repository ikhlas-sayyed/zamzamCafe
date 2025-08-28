import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  waiter: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  status: 'pending' | 'completed' | 'refunded';
  cashCollected?: number;
  cashSubmitted?: number;
  submittedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  waiter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending'
  },
  cashCollected: {
    type: Number,
    min: 0
  },
  cashSubmitted: {
    type: Number,
    min: 0
  },
  submittedAt: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

export default mongoose.model<IPayment>('Payment', paymentSchema);
