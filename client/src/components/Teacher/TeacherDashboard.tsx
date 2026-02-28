import { useState, useEffect, type FC } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { usePollState } from '../../hooks/usePollState';
import { PollForm } from './PollForm';
import { LiveResults } from './LiveResults';
import { PollHistory } from './PollHistory';
import { ChatPopup } from '../Chat/ChatPopup';
import type { PollState } from '../../types';
import './TeacherDashboard.css';

interface TeacherDashboardProps {
  sessionId: string;
  name: string;
}

export const TeacherDashboard: FC<TeacherDashboardProps> = ({ sessionId, name }) => {
  const { emit, on, off } = useSocket();
  const { pollState } = usePollState(sessionId);

  type View = 'form' | 'results' | 'history';
  const [view, setView] = useState<View>('form');
  const [isPollActive, setIsPollActive] = useState(false);
  const [displayPoll, setDisplayPoll] = useState<PollState | null>(null);
  const [prevView, setPrevView] = useState<'form' | 'results'>('form');

  // Sync live pollState → displayPoll
  useEffect(() => {
    if (pollState) {
      setDisplayPoll(pollState);
    }
  }, [pollState]);

  // State recovery: if active poll exists on mount, show results
  useEffect(() => {
    if (pollState) {
      setView('results');
      setIsPollActive(pollState.poll.status === 'active');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePollCreated = (data: any) => {
      // Auto-start immediately after creation
      emit('poll:start', { pollId: data.poll.pollId });
    };

    const handlePollStarted = (data: any) => {
      setIsPollActive(true);
      setView('results');
      setDisplayPoll({
        poll: {
          _id: data._id || data.pollId,
          question: data.question,
          options: data.options,
          timerDuration: data.timerDuration,
          createdAt: new Date(),
          startedAt: data.startedAt,
          status: 'active',
        },
        votes: {},
        totalVotes: 0,
        remainingTime: data.timerDuration,
        hasVoted: false,
      });
    };

    const handlePollEnded = (data: any) => {
      setIsPollActive(false);
      if (data?.votes) {
        const votesObj: Record<number, number> = {};
        (data.votes as { option: number; count: number }[]).forEach(v => {
          votesObj[v.option] = v.count;
        });
        setDisplayPoll(prev => prev ? {
          ...prev,
          votes: votesObj,
          totalVotes: data.totalVotes ?? 0,
          remainingTime: 0,
          poll: { ...prev.poll, status: 'completed' },
        } : null);
      }
    };

    on('poll:created', handlePollCreated);
    on('poll:started', handlePollStarted);
    on('poll:ended', handlePollEnded);
    return () => {
      off('poll:created', handlePollCreated);
      off('poll:started', handlePollStarted);
      off('poll:ended', handlePollEnded);
    };
  }, [on, off, emit]);

  const handleCreatePoll = (question: string, options: string[], timerDuration: number) => {
    emit('poll:create', { question, options, timerDuration });
  };

  const openHistory = () => {
    setPrevView(view === 'results' ? 'results' : 'form');
    setView('history');
  };

  return (
    <>
      {view === 'history' && (
        <PollHistory onClose={() => setView(prevView)} />
      )}
      {view === 'form' && (
        <PollForm
          onCreatePoll={handleCreatePoll}
          onViewHistory={openHistory}
        />
      )}
      {view === 'results' && (
        <div className="td-results-page">
          <div className="td-results-topbar">
            <button className="td-history-btn" onClick={openHistory}>
              📊 View Poll History
            </button>
          </div>
          <div className="td-results-content">
            {displayPoll && <LiveResults pollState={displayPoll} />}
          </div>
          <div className="td-results-footer">
            {isPollActive ? (
              <button className="td-close-btn" onClick={() => emit('poll:close')}>
                × Close Poll
              </button>
            ) : (
              <button className="td-newq-btn" onClick={() => setView('form')}>
                + Ask a new question
              </button>
            )}
          </div>
        </div>
      )}
      <ChatPopup role="teacher" name={name} sessionId={sessionId} />
    </>
  );
};