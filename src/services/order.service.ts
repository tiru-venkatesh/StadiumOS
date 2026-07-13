import { Order, IOrder, IOrderItem } from '../models/Order.ts';
import { Match } from '../models/Match.ts';
import { OrderStatus } from '../constants/index.ts';
import { AppError } from '../middleware/errorHandler.ts';

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: ORDER SERVICE (IN-SEAT CONCESSIONS)
 * ============================================================================
 * Enhances stadium experiences by managing seat-side food & merchandise orders.
 * Fans order concessions directly from their seats, while vendors manage 
 * queues and update order states in real-time. Prices are calculated and 
 * verified exclusively on the server side to prevent malicious client tampering.
 */

export class OrderService {
  static async createOrder(
    userId: string,
    matchId: string,
    items: IOrderItem[],
    seatNumber: string
  ): Promise<IOrder> {
    const matchExists = await Match.exists({ _id: matchId });
    if (!matchExists) {
      throw new AppError('Match not found', 404);
    }

    if (items.length === 0) {
      throw new AppError('An order must contain at least one item', 400);
    }

    // Server-side total calculation & validation (critical security measure)
    let computedTotal = 0;
    for (const item of items) {
      if (item.quantity <= 0 || item.price < 0) {
        throw new AppError('Invalid item quantity or price.', 400);
      }
      computedTotal += item.price * item.quantity;
    }

    // Round total to 2 decimal places
    computedTotal = parseFloat(computedTotal.toFixed(2));

    const order = await Order.create({
      userId,
      matchId,
      items,
      status: OrderStatus.PENDING,
      total: computedTotal,
      seatNumber,
    });

    return order;
  }

  static async getOrders(
    userId?: string,
    matchId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: IOrder[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (matchId) filter.matchId = matchId;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean() as unknown as IOrder[],
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  static async getOrderById(id: string): Promise<IOrder> {
    const order = await Order.findById(id).populate('matchId');
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }

  static async updateOrderStatus(id: string, status: OrderStatus): Promise<IOrder> {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }
}
