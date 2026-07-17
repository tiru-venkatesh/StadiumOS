import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.ts';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['organizer', 'team', 'fan']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Controller handles user registration, login and session refreshes.
 */
export class AuthController {
  /**
   * Registers a new user account.
   */
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;
    const data = await AuthService.register(name, email, password, role);
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data,
    });
  });

  /**
   * Logs in an existing user.
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const data = await AuthService.login(email, password);
    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data,
    });
  });

  /**
   * Refreshes JWT and refresh tokens using a valid refresh token.
   */
  static refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const data = AuthService.refresh(refreshToken);
    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully.',
      data,
    });
  });
}
