import { Request, Response, NextFunction } from 'express';
import { MatchService } from '../services/match.service.ts';
import { z } from 'zod';
import { MatchStatus } from '../constants/index.ts';

export const createMatchSchema = z.object({
  tournamentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Tournament ID'),
  teamA: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Team A ID'),
  teamB: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Team B ID'),
  venue: z.string().min(2, 'Venue must be at least 2 characters'),
  startTime: z.string().datetime({ message: 'Start time must be a valid ISO datetime string' }),
  score: z.object({
    teamA: z.number().int().min(0).default(0),
    teamB: z.number().int().min(0).default(0),
  }).optional(),
  status: z.enum(Object.values(MatchStatus) as [string, ...string[]]).optional(),
});

export const updateMatchSchema = createMatchSchema.partial();

export const updateScoreSchema = z.object({
  score: z.object({
    teamA: z.number().int().min(0, 'Score cannot be negative'),
    teamB: z.number().int().min(0, 'Score cannot be negative'),
  }),
  status: z.enum(Object.values(MatchStatus) as [string, ...string[]]).optional(),
});

export const listMatchesSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
  status: z.enum(Object.values(MatchStatus) as [string, ...string[]]).optional(),
  reduced: z.enum(['true', 'false']).optional().default('false'),
});

export class MatchController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const match = await MatchService.createMatch(req.body);
      res.status(201).json({
        success: true,
        message: 'Match created successfully.',
        data: match,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, reduced } = req.query as any;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const isReduced = reduced === 'true';

      const result = await MatchService.getMatches(pageNum, limitNum, status, isReduced);

      res.status(200).json({
        success: true,
        message: 'Matches retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const match = await MatchService.getMatchById(id);
      res.status(200).json({
        success: true,
        message: 'Match retrieved successfully.',
        data: match,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const match = await MatchService.updateMatch(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Match updated successfully.',
        data: match,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await MatchService.deleteMatch(id);
      res.status(200).json({
        success: true,
        message: 'Match deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { score, status } = req.body;
      const match = await MatchService.updateScore(id, score, status);

      // Real-time: Emit live score update to joined match room
      const io = req.app.get('io');
      if (io) {
        io.to(`match:${id}`).emit('match:score_update', {
          matchId: id,
          score: match.score,
          status: match.status,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Match score updated and broadcasted successfully.',
        data: match,
      });
    } catch (error) {
      next(error);
    }
  }
}
