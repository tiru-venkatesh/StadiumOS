import { Request, Response } from 'express';
import { PredictionService } from '../services/prediction.service.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';

export const submitPredictionSchema = z.object({
  matchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Match ID'),
  predictedWinner: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Team ID'),
});

export const leaderboardQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default('10'),
});

/**
 * Controller managing user gamified match predictions and scoreboards.
 */
export class PredictionController {
  /**
   * Submits or overrides a user prediction for an upcoming match.
   */
  static submit = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Core fan-engagement feature: addresses 'beyond passive viewing' requirement
    const userId = req.user!.id;
    const { matchId, predictedWinner } = req.body;

    const prediction = await PredictionService.submitPrediction(userId, matchId, predictedWinner);

    res.status(200).json({
      success: true,
      message: 'Prediction submitted successfully.',
      data: prediction,
    });
  });

  /**
   * Fetches full prediction and points submission history for the logged-in fan.
   */
  static getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Core fan-engagement feature: addresses 'beyond passive viewing' requirement
    const userId = req.user!.id;
    const predictions = await PredictionService.getUserPredictions(userId);

    res.status(200).json({
      success: true,
      message: 'User prediction history retrieved successfully.',
      data: predictions,
    });
  });

  /**
   * Returns stadium rankings of fan participants ordered by correct score predictions.
   */
  static getLeaderboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limitStr = (req.query.limit as string) || '10';
    const limit = parseInt(limitStr, 10);

    const leaderboard = await PredictionService.getLeaderboard(limit);

    res.status(200).json({
      success: true,
      message: 'Leaderboard retrieved successfully.',
      data: leaderboard,
    });
  });

  /**
   * Grades match predictions after match completion, rewarding successful voters.
   */
  static gradeMatch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = req.params;
    const gradedCount = await PredictionService.gradeMatchPredictions(matchId);

    res.status(200).json({
      success: true,
      message: `Prediction grading completed. ${gradedCount} predictions processed.`,
      data: { gradedCount },
    });
  });
}
