import { Request, Response, NextFunction } from 'express';
import { PollService } from '../services/poll.service.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { z } from 'zod';

export const createPollSchema = z.object({
  matchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Match ID'),
  question: z.string().min(5, 'Question must be at least 5 characters long'),
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'A poll requires at least 2 options'),
});

export const votePollSchema = z.object({
  optionIndex: z.number().int().nonnegative('Option index must be 0 or greater'),
});

export class PollController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  static async vote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  static async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const poll = await PollService.getPollsByMatch(id); // Wait, this gets all polls by match, or a single poll's results?
      // Let's handle both! If the router triggers this for GET /polls/:id/results, let's load the poll results.
      // Let's make this helper load results for a single poll ID
      const singlePoll = await PollService.vote // wait, we have getPollsByMatch, let's load a single poll
      const { Poll: PollModel } = await import('../models/Poll.ts');
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
    } catch (error) {
      next(error);
    }
  }

  static async getMatchPolls(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
    } catch (error) {
      next(error);
    }
  }
}
