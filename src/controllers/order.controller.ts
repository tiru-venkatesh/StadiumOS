import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { z } from 'zod';
import { OrderStatus, UserRole } from '../constants/index.ts';

export const createOrderSchema = z.object({
  matchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Match ID'),
  items: z.array(
    z.object({
      name: z.string().min(1, 'Item name is required'),
      quantity: z.number().int().min(1, 'Quantity must be 1 or more'),
      price: z.number().min(0, 'Price cannot be negative'),
    })
  ).min(1, 'An order must have at least one item'),
  seatNumber: z.string().min(1, 'Seat number/location is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(OrderStatus) as [string, ...string[]]),
});

export const queryOrdersSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
  matchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export class OrderController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { matchId, items, seatNumber } = req.body;

      const order = await OrderService.createOrder(userId, matchId, items, seatNumber);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully. Concessions are on their way to your seat!',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, matchId } = req.query as any;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      // Fans can only query their own orders; Organizers can query all orders
      const userFilter = req.user!.role === UserRole.ORGANIZER ? undefined : req.user!.id;

      const result = await OrderService.getOrders(userFilter, matchId, pageNum, limitNum);

      res.status(200).json({
        success: true,
        message: 'Orders retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id);

      // Enforce authorization: user can only fetch their own orders, unless they are an organizer
      if (order.userId.toString() !== req.user!.id && req.user!.role !== UserRole.ORGANIZER) {
        res.status(403).json({ success: false, message: 'Forbidden: Access denied to this order.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order retrieved successfully.',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await OrderService.updateOrderStatus(id, status);

      // Real-time: Emit order status change notification directly to the user's room
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${order.userId.toString()}`).emit('order:status_update', {
          orderId: id,
          status: order.status,
          message: `Your concessions order is now: ${order.status}`,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Order status updated and customer notified.',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
