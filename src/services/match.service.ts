import { Match, IMatch } from '../models/Match.ts';
import { Team } from '../models/Team.ts';
import { Tournament } from '../models/Tournament.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { MatchStatus } from '../constants/index.ts';

export class MatchService {
  static async createMatch(data: Partial<IMatch>): Promise<IMatch> {
    // Validate existence of tournament, teamA, and teamB
    const [tournamentExists, teamAExists, teamBExists] = await Promise.all([
      Tournament.exists({ _id: data.tournamentId }),
      Team.exists({ _id: data.teamA }),
      Team.exists({ _id: data.teamB }),
    ]);

    if (!tournamentExists) {
      throw new AppError('Tournament not found', 404);
    }
    if (!teamAExists || !teamBExists) {
      throw new AppError('One or both teams not found', 404);
    }

    return (await Match.create(data)).populate(['teamA', 'teamB']);
  }

  static async getMatches(
    page: number = 1,
    limit: number = 10,
    status?: MatchStatus,
    reduced: boolean = false
  ): Promise<{ matches: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const filter = status ? { status } : {};

    let query = Match.find(filter).sort({ startTime: 1 });

    if (reduced) {
      // Reduced-payload projection for low-bandwidth users
      query = query.select('_id score status venue startTime');
    } else {
      query = query.populate(['teamA', 'teamB', 'tournamentId']);
    }

    const [matches, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Match.countDocuments(filter),
    ]);

    return {
      matches,
      total,
      page,
      limit,
    };
  }

  static async getMatchById(id: string): Promise<IMatch> {
    const match = await Match.findById(id).populate(['teamA', 'teamB', 'tournamentId']);
    if (!match) {
      throw new AppError('Match not found', 404);
    }
    return match;
  }

  static async updateMatch(id: string, updateData: Partial<IMatch>): Promise<IMatch> {
    const match = await Match.findByIdAndUpdate(id, updateData, { new: true })
      .populate(['teamA', 'teamB']);

    if (!match) {
      throw new AppError('Match not found', 404);
    }
    return match;
  }

  static async updateScore(
    id: string,
    score: { teamA: number; teamB: number },
    status?: MatchStatus
  ): Promise<IMatch> {
    const updateData: Partial<IMatch> = { score };
    if (status) {
      updateData.status = status;
    }

    const match = await Match.findByIdAndUpdate(id, updateData, { new: true })
      .populate(['teamA', 'teamB']);

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    return match;
  }

  static async deleteMatch(id: string): Promise<void> {
    const result = await Match.findByIdAndDelete(id);
    if (!result) {
      throw new AppError('Match not found', 404);
    }
  }
}
