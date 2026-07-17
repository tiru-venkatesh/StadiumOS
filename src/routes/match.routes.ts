import { Router } from 'express';
import { MatchController, createMatchSchema, updateMatchSchema, listMatchesSchema, updateScoreSchema } from '../controllers/match.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import { validateBody, validateQuery } from '../middleware/validation.ts';
import { UserRole } from '../constants/index.ts';

const router = Router();

// Publicly readable endpoints (requires authenticated users)
router.get(
  '/',
  authenticate,
  validateQuery(listMatchesSchema),
  MatchController.list
);

router.get(
  '/:id',
  authenticate,
  MatchController.getOne
);

// Organizer-only write operations
router.post(
  '/',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  validateBody(createMatchSchema),
  MatchController.create
);

router.put(
  '/:id',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  validateBody(updateMatchSchema),
  MatchController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  MatchController.delete
);

// Real-time: Live score and status patches
router.patch(
  '/:id/score',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  validateBody(updateScoreSchema),
  MatchController.updateScore
);

// AI features: Match tactical analysis and promotional chants
router.get(
  '/:id/ai-analysis',
  authenticate,
  MatchController.getAiAnalysis
);

export default router;
