import { Request, Response, NextFunction } from 'express';
import { PredictionService } from '../services/prediction.service.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { z } from 'zod';

export const submitPredictionSchema = z.object({
  matchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Match ID'),
  predictedWinner: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Team ID'),
});

export const leaderboardQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().default('10'),
});

export class PredictionController {
  static async submit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { matchId, predictedWinner } = req.body;

      const prediction = await PredictionService.submitPrediction(userId, matchId, predictedWinner);

      res.status(200).json({
        success: true,
        message: 'Prediction submitted successfully.',
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const predictions = await PredictionService.getUserPredictions(userId);

      res.status(200).json({
        success: true,
        message: 'User prediction history retrieved successfully.',
        data: predictions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limitStr = (req.query.limit as string) || '10';
      const limit = parseInt(limitStr, 10);

      const leaderboard = await PredictionService.getLeaderboard(limit);

      res.status(200).json({
        success: true,
        message: 'Leaderboard retrieved successfully.',
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }

  static async gradeMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { matchId } = req.params;
      const gradedCount = await PredictionService.gradeMatchPredictions(matchId);

      res.status(200).json({
        success: true,
        message: `Prediction grading completed. ${gradedCount} predictions processed.`,
        data: { gradedCount },
      });
    } catch (error) {
      next(error);
    }
  }
}
