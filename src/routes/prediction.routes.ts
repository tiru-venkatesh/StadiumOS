import { Router } from 'express';
import { PredictionController, submitPredictionSchema, leaderboardQuerySchema } from '../controllers/prediction.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import { validateBody, validateQuery } from '../middleware/validation.ts';
import { UserRole } from '../constants/index.ts';

const router = Router();

// Retrieve predictions leaderboard
router.get(
  '/leaderboard',
  authenticate,
  validateQuery(leaderboardQuerySchema),
  PredictionController.getLeaderboard
);

// Get current user's prediction history
router.get(
  '/history',
  authenticate,
  PredictionController.getHistory
);

// Submit or update a prediction
router.post(
  '/',
  authenticate,
  validateBody(submitPredictionSchema),
  PredictionController.submit
);

// Grade predictions for completed match (Organizer only)
router.post(
  '/grade/:matchId',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  PredictionController.gradeMatch
);

export default router;
