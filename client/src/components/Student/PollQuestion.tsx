import { useState, type FC } from 'react';
import type { PollState } from '../../types';
import { usePollTimer } from '../../hooks/usePollTimer';
import './PollQuestion.css';

interface PollQuestionProps {
  pollState: PollState;
  onVote: (selectedOption: number) => void;
  questionNumber?: number;
}

const formatTimer = (sec: number) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l4.75 3.35.75-1.27-4-2.25V7z"/>
  </svg>
);

export const PollQuestion: FC<PollQuestionProps> = ({ pollState, onVote, questionNumber = 1 }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { timeRemaining, isExpired } = usePollTimer(pollState.remainingTime);

  const handleSubmit = () => {
    if (selectedOption !== null && !isSubmitting && !isExpired) {
      setIsSubmitting(true);
      onVote(selectedOption);
    }
  };

  return (
    <div className="pq-page">
      <div className="pq-card">
        <div className="pq-header">
          <span className="pq-qnum">Question {questionNumber}</span>
          <span className={`pq-timer ${isExpired ? 'expired' : ''}`}>
            <ClockIcon />
            {isExpired ? '00:00' : formatTimer(timeRemaining)}
          </span>
        </div>

        <div className="pq-question-box">
          {pollState.poll.question}
        </div>

        <div className="pq-options">
          {pollState.poll.options.map((option, index) => (
            <div
              key={index}
              className={`pq-option ${selectedOption === index ? 'selected' : ''} ${isSubmitting || isExpired ? 'disabled' : ''}`}
              onClick={() => !isSubmitting && !isExpired && setSelectedOption(index)}
            >
              <span className={`pq-opt-num ${selectedOption === index ? 'selected' : ''}`}>{index + 1}</span>
              <span className="pq-opt-text">{option}</span>
            </div>
          ))}
        </div>

        <button
          className="pq-submit"
          onClick={handleSubmit}
          disabled={selectedOption === null || isSubmitting || isExpired}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>

        {isExpired && (
          <p className="pq-expired">Time's up! Waiting for results...</p>
        )}
      </div>
    </div>
  );
};
