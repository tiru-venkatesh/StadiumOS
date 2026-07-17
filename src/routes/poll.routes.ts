import { Router } from 'express';
import { PollController, createPollSchema, votePollSchema } from '../controllers/poll.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import { validateBody } from '../middleware/validation.ts';
import { UserRole } from '../constants/index.ts';
import { writeRateLimiter } from '../middleware/rateLimiter.ts';

const router = Router();

// Retrieve all polls of a match
router.get(
  '/',
  authenticate,
  PollController.getMatchPolls
);

// Retrieve results of a single poll
router.get(
  '/:id/results',
  authenticate,
  PollController.getResults
);

// Submit a vote (Fan or other roles)
router.post(
  '/:id/vote',
  authenticate,
  writeRateLimiter,
  validateBody(votePollSchema),
  PollController.vote
);

// Create poll (Organizer only)
router.post(
  '/',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  validateBody(createPollSchema),
  PollController.create
);

export default router;
