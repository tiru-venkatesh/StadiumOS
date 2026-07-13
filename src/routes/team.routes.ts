import { Router } from 'express';
import { TeamController, createTeamSchema, updateTeamSchema, addPlayerSchema } from '../controllers/team.controller.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';
import { validateBody } from '../middleware/validation.ts';
import { UserRole } from '../constants/index.ts';

const router = Router();

// Publicly readable endpoints (requires authenticated users)
router.get(
  '/',
  authenticate,
  TeamController.list
);

router.get(
  '/:id',
  authenticate,
  TeamController.getOne
);

// Restricted write operations (requires Team or Organizer roles)
const privilegedRoles = [UserRole.TEAM, UserRole.ORGANIZER];

router.post(
  '/',
  authenticate,
  requireRole(privilegedRoles),
  validateBody(createTeamSchema),
  TeamController.create
);

router.put(
  '/:id',
  authenticate,
  requireRole(privilegedRoles),
  validateBody(updateTeamSchema),
  TeamController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole(privilegedRoles),
  TeamController.delete
);

router.post(
  '/:id/players',
  authenticate,
  requireRole(privilegedRoles),
  validateBody(addPlayerSchema),
  TeamController.addPlayer
);

export default router;
