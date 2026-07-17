import { Request, Response } from 'express';
import { TeamService } from '../services/team.service.ts';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters long'),
  tournamentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Tournament ID'),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters long').optional(),
});

export const addPlayerSchema = z.object({
  name: z.string().min(2, 'Player name is required'),
  jerseyNumber: z.number().int().min(0).max(99, 'Jersey number must be between 0 and 99'),
  stats: z.record(z.string(), z.any()).optional(),
});

/**
 * Controller handles registering teams, listing structures, and managing roster lists.
 */
export class TeamController {
  /**
   * Registers a brand new competing team under an active tournament schedule.
   */
  static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, tournamentId } = req.body;
    const team = await TeamService.createTeam(name, tournamentId);
    res.status(201).json({
      success: true,
      message: 'Team registered successfully.',
      data: team,
    });
  });

  /**
   * Outputs all registered teams, with optional filter parameters on tournament identifiers.
   */
  static list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { tournamentId } = req.query;
    const teams = await TeamService.getTeams(tournamentId as string);
    res.status(200).json({
      success: true,
      message: 'Teams retrieved successfully.',
      data: teams,
    });
  });

  /**
   * Retreives full profile details for a single sports club.
   */
  static getOne = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const team = await TeamService.getTeamById(id);
    res.status(200).json({
      success: true,
      message: 'Team retrieved successfully.',
      data: team,
    });
  });

  /**
   * Modifies information records of an existing registered sports club.
   */
  static update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const team = await TeamService.updateTeam(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Team updated successfully.',
      data: team,
    });
  });

  /**
   * Removes a team from databases, executing cascading deletes of associated players.
   */
  static delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await TeamService.deleteTeam(id);
    res.status(200).json({
      success: true,
      message: 'Team deleted successfully.',
    });
  });

  /**
   * Adds an athlete player into a team roster, asserting no jersey number collision.
   */
  static addPlayer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, jerseyNumber, stats } = req.body;
    const player = await TeamService.addPlayerToTeam(id, name, jerseyNumber, stats);
    res.status(201).json({
      success: true,
      message: 'Player added to team successfully.',
      data: player,
    });
  });
}
