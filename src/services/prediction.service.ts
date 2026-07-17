import { Prediction, IPrediction } from '../models/Prediction.ts';
import { Match } from '../models/Match.ts';
import { Team } from '../models/Team.ts';
import { User } from '../models/User.ts';
import { MatchStatus } from '../constants/index.ts';
import { AppError } from '../middleware/errorHandler.ts';
import mongoose from 'mongoose';

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: PREDICTION SERVICE
 * ============================================================================
 * Powers the gamified predictions and leaderboard hub of StadiumOS.
 * Fans guess results on upcoming matches, competing against friends and stadium
 * crowds. Scores are aggregated dynamically to generate live rankings.
 */

export class PredictionService {
  static async submitPrediction(userId: string, matchId: string, predictedWinner: string): Promise<IPrediction> {
    // Check if match exists and is still UPCOMING
    const match = await Match.findById(matchId);
    if (!match) {
      throw new AppError('Match not found', 404);
    }

    if (match.status !== MatchStatus.UPCOMING) {
      throw new AppError('Predictions are only allowed for upcoming matches.', 400);
    }

    // Check if the predicted team belongs to the match
    const predictedWinnerObjId = new mongoose.Types.ObjectId(predictedWinner);
    if (!match.teamA.equals(predictedWinnerObjId) && !match.teamB.equals(predictedWinnerObjId)) {
      throw new AppError('The predicted winner team is not participating in this match.', 400);
    }

    try {
      // Create or update prediction (Upsert)
      const prediction = await Prediction.findOneAndUpdate(
        { userId, matchId },
        { predictedWinner: predictedWinnerObjId, points: 0, processed: false },
        { new: true, upsert: true, runValidators: true }
      );
      return prediction;
    } catch (err: any) {
      if (err.code === 11000) {
        throw new AppError('You have already submitted a prediction for this match.', 400);
      }
      throw err;
    }
  }

  static async getUserPredictions(userId: string): Promise<IPrediction[]> {
    return await Prediction.find({ userId }).populate('matchId').populate('predictedWinner').lean() as unknown as IPrediction[];
  }

  static async getLeaderboard(limit: number = 10): Promise<any[]> {
    return await Prediction.aggregate([
      // Only compile points from processed matches
      { $match: { processed: true, points: { $gt: 0 } } },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$points' },
          predictionCount: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users', // name of the user collection
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          _id: 0,
          totalPoints: 1,
          predictionCount: 1,
          name: '$userInfo.name',
          email: '$userInfo.email',
        },
      },
    ]);
  }

  /**
   * Automatically grades predictions for a given match based on score outcomes.
   * Gives 100 points for successful guesses.
   */
  static async gradeMatchPredictions(matchId: string): Promise<number> {
    const match = await Match.findById(matchId);
    if (!match) {
      throw new AppError('Match not found', 404);
    }

    if (match.status !== MatchStatus.COMPLETED) {
      return 0; // Only completed matches are graded
    }

    let actualWinner: mongoose.Types.ObjectId | null = null;
    if (match.score.teamA > match.score.teamB) {
      actualWinner = match.teamA;
    } else if (match.score.teamB > match.score.teamA) {
      actualWinner = match.teamB;
    }
    // If it's a draw, actualWinner remains null

    // Fetch all unprocessed predictions for this match
    const predictions = await Prediction.find({ matchId, processed: false });

    if (predictions.length === 0) {
      return 0;
    }

    // Parallelize Mongoose document updates to avoid sequential blocking IO (N+1 database saves)
    await Promise.all(
      predictions.map(async (pred) => {
        let earnedPoints = 0;

        if (actualWinner && pred.predictedWinner.equals(actualWinner)) {
          earnedPoints = 100; // 100 points for correct winner prediction
        }

        pred.points = earnedPoints;
        pred.processed = true;
        await pred.save();
      })
    );

    return predictions.length;
  }
}
