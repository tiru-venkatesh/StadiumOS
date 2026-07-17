import { Router } from 'express';
import { OrderController, createOrderSchema, updateOrderStatusSchema, queryOrdersSchema } from '../controllers/order.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import { validateBody, validateQuery } from '../middleware/validation.ts';
import { UserRole } from '../constants/index.ts';
import { writeRateLimiter } from '../middleware/rateLimiter.ts';

const router = Router();

// Placed order listing & details (Requires standard authenticated users)
router.get(
  '/',
  authenticate,
  validateQuery(queryOrdersSchema),
  OrderController.list
);

router.get(
  '/:id',
  authenticate,
  OrderController.getOne
);

// Order creation (Authenticated fans or other users)
router.post(
  '/',
  authenticate,
  writeRateLimiter,
  validateBody(createOrderSchema),
  OrderController.create
);

// Concessions fulfillment status modification (Organizer only)
router.patch(
  '/:id/status',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  validateBody(updateOrderStatusSchema),
  OrderController.updateStatus
);

export default router;
