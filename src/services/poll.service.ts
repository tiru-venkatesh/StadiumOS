import { Poll, IPoll } from '../models/Poll.ts';
import { Match } from '../models/Match.ts';
import { AppError } from '../middleware/errorHandler.ts';

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: POLL SERVICE
 * ============================================================================
 * Bridges the gap between passive viewers and active match influencers.
 * This service handles live MVP votes, interactive trivia, and consensus surveys,
 * ensuring high speed and security with Mongoose indexes and atomic operations.
 */

export interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  totalVotes: number;
  tallies: { optionIndex: number; optionText: string; count: number; percentage: number }[];
}

export class PollService {
  static async createPoll(matchId: string, question: string, options: string[]): Promise<IPoll> {
    const matchExists = await Match.exists({ _id: matchId });
    if (!matchExists) {
      throw new AppError('Match not found', 404);
    }

    if (options.length < 2) {
      throw new AppError('A poll must have at least 2 options', 400);
    }

    return await Poll.create({ matchId, question, options, votes: [] });
  }

  static async vote(pollId: string, userId: string, optionIndex: number): Promise<IPoll> {
    const poll = await Poll.findById(pollId);
    if (!poll) {
      throw new AppError('Poll not found', 404);
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new AppError('Invalid poll option selected', 400);
    }

    // Check if user has already voted on this poll
    const hasVoted = poll.votes.some((v) => v.userId.toString() === userId);
    if (hasVoted) {
      throw new AppError('You have already submitted a vote on this poll', 400);
    }

    // Atomic update to prevent race conditions during heavy traffic spike
    const updatedPoll = await Poll.findOneAndUpdate(
      { _id: pollId, 'votes.userId': { $ne: userId } },
      { $push: { votes: { userId, optionIndex } } },
      { new: true }
    );

    if (!updatedPoll) {
      throw new AppError('You have already submitted a vote on this poll', 400);
    }

    return updatedPoll;
  }

  static async getPollsByMatch(matchId: string): Promise<IPoll[]> {
    return await Poll.find({ matchId }).sort({ createdAt: -1 });
  }

  static getResults(poll: IPoll): PollResults {
    const totalVotes = poll.votes.length;
    const tallies = poll.options.map((optionText, optionIndex) => {
      const count = poll.votes.filter((v) => v.optionIndex === optionIndex).length;
      const percentage = totalVotes > 0 ? parseFloat(((count / totalVotes) * 100).toFixed(1)) : 0;
      return {
        optionIndex,
        optionText,
        count,
        percentage,
      };
    });

    return {
      pollId: poll._id.toString(),
      question: poll.question,
      options: poll.options,
      totalVotes,
      tallies,
    };
  }
}
