import { Tournament, ITournament } from '../models/Tournament.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class TournamentService {
  static async createTournament(data: Partial<ITournament>): Promise<ITournament> {
    return await Tournament.create(data);
  }

  static async getTournaments(
    page: number = 1,
    limit: number = 10,
    reduced: boolean = false
  ): Promise<{ tournaments: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    let query = Tournament.find().sort({ startDate: 1 });

    // Support reduced-data mode for low-bandwidth or assistive technology
    if (reduced) {
      query = query.select('_id name sport status');
    } else {
      query = query.populate('teams');
    }

    const [tournaments, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Tournament.countDocuments(),
    ]);

    return {
      tournaments,
      total,
      page,
      limit,
    };
  }

  static async getTournamentById(id: string): Promise<ITournament> {
    const tournament = await Tournament.findById(id).populate('teams');
    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }
    return tournament;
  }

  static async updateTournament(id: string, updateData: Partial<ITournament>): Promise<ITournament> {
    const tournament = await Tournament.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('teams');

    if (!tournament) {
      throw new AppError('Tournament not found', 404);
    }
    return tournament;
  }

  static async deleteTournament(id: string): Promise<void> {
    const result = await Tournament.findByIdAndDelete(id);
    if (!result) {
      throw new AppError('Tournament not found', 404);
    }
  }
}
