import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus } from '../constants/index.ts';

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: ORDER MODULE (IN-SEAT CONCESSIONS)
 * ============================================================================
 * Moving fans beyond passive viewing by solving a major physical pain-point:
 * standing in long concession lines. With in-seat ordering, fans buy food,
 * drinks, or merch directly from their device, receiving active status updates
 * without ever missing a critical play.
 */

export interface IOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  status: OrderStatus;
  total: number;
  seatNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Quick lookup for user's order history
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true, // Useful for vendor queues sorted by match
    },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      required: true,
      index: true,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
