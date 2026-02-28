import { useState, useEffect, type FC } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { usePollState } from '../../hooks/usePollState';
import { WaitingRoom } from './WaitingRoom';
import { PollQuestion } from './PollQuestion';
import { PollResults } from './PollResults';
import { ChatPopup } from '../Chat/ChatPopup';

interface StudentViewProps {
  sessionId: string;
  name: string;
}

export const StudentView: FC<StudentViewProps> = ({ sessionId, name }) => {
  const { emit, on, off } = useSocket();
  const { pollState, setPollState } = usePollState(sessionId);
  const [hasVoted, setHasVoted] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);

  // Track question number
  useEffect(() => {
    const handlePollStarted = () => {
      setHasVoted(false);
      setQuestionNumber(n => n + 1);
    };
    on('poll:started', handlePollStarted);
    return () => off('poll:started', handlePollStarted);
  }, [on, off]);

  const handleVote = (selectedOption: number) => {
    if (pollState && !hasVoted) {
      emit('vote:submit', {
        pollId: pollState.poll._id,
        selectedOption,
      });
      setHasVoted(true);
      setPollState({ ...pollState, hasVoted: true });
    }
  };

  const renderContent = () => {
    if (!pollState) return <WaitingRoom />;
    if (pollState.hasVoted || hasVoted) {
      return <PollResults pollState={pollState} questionNumber={questionNumber} />;
    }
    return <PollQuestion pollState={pollState} onVote={handleVote} questionNumber={questionNumber} />;
  };

  return (
    <>
      {renderContent()}
      <ChatPopup role="student" name={name} sessionId={sessionId} />
    </>
  );
};
