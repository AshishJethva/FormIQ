// src/models/PaymentHistory.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentHistory extends Document {
  userId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  plan: 'BRONZE' | 'SILVER' | 'GOLD';
  billing: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const paymentHistorySchema = new Schema<IPaymentHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpaySignature: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD'],
      required: true,
    },
    billing: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

paymentHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IPaymentHistory>(
  'PaymentHistory',
  paymentHistorySchema
);
