import { Team, ITeam } from '../models/Team.ts';
import { Tournament } from '../models/Tournament.ts';
import { Player, IPlayer } from '../models/Player.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class TeamService {
  static async createTeam(name: string, tournamentId: string): Promise<ITeam> {
    const tournamentExists = await Tournament.exists({ _id: tournamentId });
    if (!tournamentExists) {
      throw new AppError('Tournament not found', 404);
    }

    const team = await Team.create({ name, tournamentId, players: [] });

    // Update the tournament's team list
    await Tournament.findByIdAndUpdate(tournamentId, { $push: { teams: team._id } });

    return team;
  }

  static async getTeams(tournamentId?: string): Promise<ITeam[]> {
    const filter = tournamentId ? { tournamentId } : {};
    return await Team.find(filter).populate('players').populate('tournamentId');
  }

  static async getTeamById(id: string): Promise<ITeam> {
    const team = await Team.findById(id).populate('players').populate('tournamentId');
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    return team;
  }

  static async updateTeam(id: string, updateData: Partial<ITeam>): Promise<ITeam> {
    const team = await Team.findByIdAndUpdate(id, updateData, { new: true })
      .populate('players')
      .populate('tournamentId');

    if (!team) {
      throw new AppError('Team not found', 404);
    }
    return team;
  }

  static async deleteTeam(id: string): Promise<void> {
    const team = await Team.findById(id);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Cascade: delete players belonging to this team, and remove team from tournament list
    await Promise.all([
      Player.deleteMany({ teamId: id }),
      Tournament.findByIdAndUpdate(team.tournamentId, { $pull: { teams: id } }),
      Team.findByIdAndDelete(id),
    ]);
  }

  // Player Management within Team
  static async addPlayerToTeam(teamId: string, name: string, jerseyNumber: number, stats: Record<string, any> = {}): Promise<IPlayer> {
    const team = await Team.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Check if jersey number is already taken in this team
    const jerseyTaken = await Player.exists({ teamId, jerseyNumber });
    if (jerseyTaken) {
      throw new AppError(`Jersey number ${jerseyNumber} is already taken in this team.`, 409);
    }

    const player = await Player.create({ name, jerseyNumber, teamId, stats });

    // Add player to team array
    await Team.findByIdAndUpdate(teamId, { $push: { players: player._id } });

    return player;
  }
}
