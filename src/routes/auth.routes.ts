import { Router } from 'express';
import { AuthController, registerSchema, loginSchema, refreshSchema } from '../controllers/auth.controller.ts';
import { validateBody } from '../middleware/validation.ts';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh', validateBody(refreshSchema), AuthController.refresh);

export default router;
