import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/team.service.ts';
import { z } from 'zod';

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

export class TeamController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, tournamentId } = req.body;
      const team = await TeamService.createTeam(name, tournamentId);
      res.status(201).json({
        success: true,
        message: 'Team registered successfully.',
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.query;
      const teams = await TeamService.getTeams(tournamentId as string);
      res.status(200).json({
        success: true,
        message: 'Teams retrieved successfully.',
        data: teams,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const team = await TeamService.getTeamById(id);
      res.status(200).json({
        success: true,
        message: 'Team retrieved successfully.',
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const team = await TeamService.updateTeam(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Team updated successfully.',
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await TeamService.deleteTeam(id);
      res.status(200).json({
        success: true,
        message: 'Team deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addPlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, jerseyNumber, stats } = req.body;
      const player = await TeamService.addPlayerToTeam(id, name, jerseyNumber, stats);
      res.status(201).json({
        success: true,
        message: 'Player added to team successfully.',
        data: player,
      });
    } catch (error) {
      next(error);
    }
  }
}
