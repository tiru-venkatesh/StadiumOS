import { Router } from 'express';
import { TournamentController, createTournamentSchema, updateTournamentSchema, queryTournamentSchema } from '../controllers/tournament.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import { validateBody, validateQuery } from '../middleware/validation.ts';
import { UserRole } from '../constants/index.ts';

const router = Router();

// Publicly readable endpoints (requires authenticated users)
router.get(
  '/',
  authenticate,
  validateQuery(queryTournamentSchema),
  TournamentController.list
);

router.get(
  '/:id',
  authenticate,
  TournamentController.getOne
);

// Organizer-only write operations
router.post(
  '/',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  validateBody(createTournamentSchema),
  TournamentController.create
);

router.put(
  '/:id',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  validateBody(updateTournamentSchema),
  TournamentController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.ORGANIZER]),
  TournamentController.delete
);

export default router;
