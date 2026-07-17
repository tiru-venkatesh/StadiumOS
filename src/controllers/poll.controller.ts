import { Request, Response } from 'express';
import { PollService } from '../services/poll.service.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { Poll as PollModel } from '../models/Poll.ts';

export const createPollSchema = z.object({
  matchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Match ID'),
  question: z.string().min(5, 'Question must be at least 5 characters long'),
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'A poll requires at least 2 options'),
});

export const votePollSchema = z.object({
  optionIndex: z.number().int().nonnegative('Option index must be 0 or greater'),
});

/**
 * Controller managing live interactive match polls and MVP fan-voting.
 */
export class PollController {
  /**
   * Spawns a new real-time poll for active spectator input, broadcasting the launch event.
   */
  static create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Core fan-engagement feature: addresses 'beyond passive viewing' requirement
    const { matchId, question, options } = req.body;
    const poll = await PollService.createPoll(matchId, question, options);

    // Real-time: Notify match room that a new poll has been launched
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${matchId}`).emit('poll:launched', {
        pollId: poll._id,
        question: poll.question,
        options: poll.options,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Poll launched successfully.',
      data: poll,
    });
  });

  /**
   * Registers a user vote atomically and broadcasts the updated percentages.
   */
  static vote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Core fan-engagement feature: addresses 'beyond passive viewing' requirement
    const { id } = req.params;
    const userId = req.user!.id;
    const { optionIndex } = req.body;

    const poll = await PollService.vote(id, userId, optionIndex);
    const results = PollService.getResults(poll);

    // Real-time: Broadcast updated poll results to the match room
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${poll.matchId.toString()}`).emit('poll:vote_update', results);
    }

    res.status(200).json({
      success: true,
      message: 'Vote registered successfully.',
      data: results,
    });
  });

  /**
   * Compiles and outputs current vote tallies and choice percentage share for a single poll.
   */
  static getResults = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const pollDoc = await PollModel.findById(id);
    if (!pollDoc) {
      res.status(404).json({ success: false, message: 'Poll not found' });
      return;
    }
    const results = PollService.getResults(pollDoc);
    res.status(200).json({
      success: true,
      message: 'Poll results retrieved successfully.',
      data: results,
    });
  });

  /**
   * Retrieves all active and past polls configured for a given match schedule.
   */
  static getMatchPolls = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { matchId } = req.query;
    if (!matchId || typeof matchId !== 'string') {
      res.status(400).json({ success: false, message: 'matchId query parameter is required' });
      return;
    }

    const polls = await PollService.getPollsByMatch(matchId);
    const pollsWithResults = polls.map((p) => PollService.getResults(p));

    res.status(200).json({
      success: true,
      message: 'Polls for match retrieved successfully.',
      data: pollsWithResults,
    });
  });
}
