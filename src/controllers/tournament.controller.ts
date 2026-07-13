import { Request, Response, NextFunction } from 'express';
import { TournamentService } from '../services/tournament.service.ts';
import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters long'),
  sport: z.string().min(2, 'Sport name is required'),
  venue: z.string().min(2, 'Venue is required'),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime' }),
  endDate: z.string().datetime({ message: 'End date must be a valid ISO datetime' }),
  teams: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Team ID')).optional(),
  status: z.enum(['upcoming', 'live', 'completed']).optional(),
});

export const updateTournamentSchema = createTournamentSchema.partial();

export const queryTournamentSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
  reduced: z.enum(['true', 'false']).optional().default('false'),
});

export class TournamentController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournament = await TournamentService.createTournament(req.body);
      res.status(201).json({
        success: true,
        message: 'Tournament created successfully.',
        data: tournament,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, reduced } = req.query as any;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const isReduced = reduced === 'true';

      const result = await TournamentService.getTournaments(pageNum, limitNum, isReduced);

      res.status(200).json({
        success: true,
        message: 'Tournaments retrieved successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tournament = await TournamentService.getTournamentById(id);
      res.status(200).json({
        success: true,
        message: 'Tournament retrieved successfully.',
        data: tournament,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tournament = await TournamentService.updateTournament(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Tournament updated successfully.',
        data: tournament,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await TournamentService.deleteTournament(id);
      res.status(200).json({
        success: true,
        message: 'Tournament deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
