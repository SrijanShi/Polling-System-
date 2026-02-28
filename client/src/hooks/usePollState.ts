// client/src/hooks/usePollState.ts
import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import type { PollState, PollResults } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const usePollState = (sessionId: string) => {
  const { socket, on, off } = useSocket();
  const [pollState, setPollState] = useState<PollState | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current state on mount (state recovery)
  useEffect(() => {
    const fetchCurrentState = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/current-state?sessionId=${sessionId}`);
        console.log('📊 Current state fetched:', response.data);
        if (response.data.data.hasActivePoll) {
          setPollState(response.data.data.poll);
        }
      } catch (error) {
        console.error('Error fetching current state:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentState();
  }, [sessionId]);

  // Listen for poll events
  useEffect(() => {
    if (!socket) return;

    const handlePollStarted = (data: any) => {
      console.log('🎬 Poll started event received:', data);
      setPollState({
        poll: data,
        votes: {},
        totalVotes: 0,
        remainingTime: data.timerDuration,
        hasVoted: false,
      });
    };

    const handleResultsUpdated = (data: PollResults) => {
      setPollState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          votes: data.votes.reduce((acc, v) => {
            acc[v.option] = v.count;
            return acc;
          }, {} as { [key: number]: number }),
          totalVotes: data.totalVotes,
        };
      });
    };

    const handlePollEnded = () => {
      setPollState(null);
    };

    on('poll:started', handlePollStarted);
    on('poll:results:updated', handleResultsUpdated);
    on('poll:ended', handlePollEnded);

    return () => {
      off('poll:started', handlePollStarted);
      off('poll:results:updated', handleResultsUpdated);
      off('poll:ended', handlePollEnded);
    };
  }, [socket, on, off]);

  return { pollState, setPollState, loading };
};