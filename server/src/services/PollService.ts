import Poll, { PollDocument } from '../models/Poll';
import Vote from '../models/Vote';
import { IPoll, PollState, PollResults, VoteCount } from '../types';
import mongoose from 'mongoose';

class PollService {
  async createPoll(question: string, options: string[], timerDuration: number = 60): Promise<PollDocument> {
    try {
      if (!question || question.trim().length < 5) {
        throw new Error('Question must be at least 5 characters long');
      }

      if (!options || options.length < 2 || options.length > 6) {
        throw new Error('Poll must have between 2 and 6 options');
      }

      if (timerDuration < 15 || timerDuration > 300) {
        throw new Error('Timer duration must be between 15 and 300 seconds');
      }

      const poll = new Poll({
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        timerDuration,
        status: 'pending'
      });

      await poll.save();
      console.log(`Poll created: ${poll._id}`);

      return poll;
    } catch (error: any) {
      console.error('Error creating poll:', error.message);
      throw error;
    }
  }

  async startPoll(pollId: string): Promise<PollDocument> {
    try {
      const poll = await Poll.findById(pollId);

      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.status === 'active') {
        throw new Error('Poll is already active');
      }

      if (poll.status === 'completed') {
        throw new Error('Cannot restart a completed poll');
      }

      poll.status = 'active';
      poll.startedAt = new Date();
      await poll.save();

      console.log(`Poll started: ${poll._id}`);
      return poll;
    } catch (error: any) {
      console.error('Error starting poll:', error.message);
      throw error;
    }
  }

  async getActivePoll(): Promise<PollDocument | null> {
    try {
      const poll = await Poll.findOne({ status: 'active' })
        .sort({ startedAt: -1 });

      return poll;
    } catch (error: any) {
      console.error('Error fetching active poll:', error.message);
      throw error;
    }
  }

  async getPollById(pollId: string): Promise<PollDocument | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(pollId)) {
        throw new Error('Invalid poll ID');
      }

      const poll = await Poll.findById(pollId);
      return poll;
    } catch (error: any) {
      console.error('Error fetching poll:', error.message);
      throw error;
    }
  }

  async getPollState(pollId: string, sessionId?: string): Promise<PollState> {
    try {
      const poll = await this.getPollById(pollId);

      if (!poll) {
        throw new Error('Poll not found');
      }

      const votes = await this.getVoteCounts(pollId);

      let hasVoted = false;
      if (sessionId) {
        const userVote = await Vote.findOne({ pollId, sessionId });
        hasVoted = !!userVote;
      }

      const remainingTime = poll.getRemainingTime();

      const pollState: PollState = {
        poll: {
          _id: poll._id.toString(),
          question: poll.question,
          options: poll.options,
          timerDuration: poll.timerDuration,
          createdAt: poll.createdAt,
          startedAt: poll.startedAt,
          status: poll.status
        },
        votes: votes.reduce((acc, v) => {
          acc[v.option] = v.count;
          return acc;
        }, {} as { [option: number]: number }),
        totalVotes: votes.reduce((sum, v) => sum + v.count, 0),
        remainingTime,
        hasVoted
      };

      return pollState;
    } catch (error: any) {
      console.error('Error getting poll state:', error.message);
      throw error;
    }
  }

  async submitVote(pollId: string, studentName: string, sessionId: string, selectedOption: number): Promise<void> {
    try {
      const poll = await this.getPollById(pollId);

      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.status !== 'active') {
        throw new Error('Poll is not active');
      }

      if (poll.isExpired()) {
        throw new Error('Poll time has expired');
      }

      if (selectedOption < 0 || selectedOption >= poll.options.length) {
        throw new Error('Invalid option selected');
      }

      const existingVote = await Vote.findOne({ pollId, sessionId });
      if (existingVote) {
        throw new Error('You have already voted in this poll');
      }

      const vote = new Vote({
        pollId,
        studentName: studentName.trim(),
        sessionId,
        selectedOption
      });

      await vote.save();
      console.log(`Vote submitted: ${vote._id} for poll ${pollId}`);
    } catch (error: any) {
      console.error('Error submitting vote:', error.message);
      throw error;
    }
  }

  async checkVoteEligibility(pollId: string, sessionId: string): Promise<boolean> {
    try {
      const existingVote = await Vote.findOne({ pollId, sessionId });
      return !existingVote;
    } catch (error: any) {
      console.error('Error checking vote eligibility:', error.message);
      throw error;
    }
  }

  async getVoteCounts(pollId: string): Promise<VoteCount[]> {
    try {
      const poll = await this.getPollById(pollId);

      if (!poll) {
        throw new Error('Poll not found');
      }

      const voteCounts = await Vote.aggregate([
        { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
        {
          $group: {
            _id: '$selectedOption',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const totalVotes = voteCounts.reduce((sum, v) => sum + v.count, 0);

      const results: VoteCount[] = poll.options.map((_, index) => {
        const voteData = voteCounts.find(v => v._id === index);
        const count = voteData ? voteData.count : 0;
        return {
          option: index,
          count,
          percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
        };
      });

      return results;
    } catch (error: any) {
      console.error('Error getting vote counts:', error.message);
      throw error;
    }
  }

  async completePoll(pollId: string): Promise<PollDocument> {
    try {
      const poll = await this.getPollById(pollId);

      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.status === 'completed') {
        return poll;
      }

      poll.status = 'completed';
      await poll.save();

      console.log(`Poll completed: ${poll._id}`);
      return poll;
    } catch (error: any) {
      console.error('Error completing poll:', error.message);
      throw error;
    }
  }

  async getPollResults(pollId: string): Promise<PollResults> {
    try {
      const poll = await this.getPollById(pollId);

      if (!poll) {
        throw new Error('Poll not found');
      }

      const voteCounts = await this.getVoteCounts(pollId);
      const totalVotes = voteCounts.reduce((sum, v) => sum + v.count, 0);

      return {
        pollId: poll._id.toString(),
        question: poll.question,
        options: poll.options,
        votes: voteCounts,
        totalVotes,
        status: poll.status
      };
    } catch (error: any) {
      console.error('Error getting poll results:', error.message);
      throw error;
    }
  }

  async getPollHistory(): Promise<PollResults[]> {
    try {
      const polls = await Poll.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(50);

      const results = await Promise.all(
        polls.map(poll => this.getPollResults(poll._id.toString()))
      );

      return results;
    } catch (error: any) {
      console.error('Error fetching poll history:', error.message);
      throw error;
    }
  }

  async deletePoll(pollId: string): Promise<void> {
    try {
      const poll = await this.getPollById(pollId);

      if (!poll) {
        throw new Error('Poll not found');
      }

      await Vote.deleteMany({ pollId });
      await Poll.findByIdAndDelete(pollId);

      console.log(`Poll deleted: ${pollId}`);
    } catch (error: any) {
      console.error('Error deleting poll:', error.message);
      throw error;
    }
  }
}

export default new PollService();