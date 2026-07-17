import { Request, Response } from 'express';
import { TournamentService } from '../services/tournament.service.ts';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';

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

/**
 * Controller managing tournament leagues, configuration records, and listing details.
 */
export class TournamentController {
  /**
   * Registers a new tournament league with specific sporting events and timelines.
   */
  static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tournament = await TournamentService.createTournament(req.body);
    res.status(201).json({
      success: true,
      message: 'Tournament created successfully.',
      data: tournament,
    });
  });

  /**
   * Fetches tournaments with full support for paging, filters, and low-bandwidth payload reduction.
   */
  static list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  });

  /**
   * Retrieves profile specifications of a single tournament league.
   */
  static getOne = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const tournament = await TournamentService.getTournamentById(id);
    res.status(200).json({
      success: true,
      message: 'Tournament retrieved successfully.',
      data: tournament,
    });
  });

  /**
   * Modifies timeline dates, location venue, or details on an existing tournament league.
   */
  static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const tournament = await TournamentService.updateTournament(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Tournament updated successfully.',
      data: tournament,
    });
  });

  /**
   * Purges a tournament league profile from database records.
   */
  static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await TournamentService.deleteTournament(id);
    res.status(200).json({
      success: true,
      message: 'Tournament deleted successfully.',
    });
  });
}
