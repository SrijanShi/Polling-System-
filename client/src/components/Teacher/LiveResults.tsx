import { type FC } from 'react';
import type { PollState } from '../../types';
import { usePollTimer } from '../../hooks/usePollTimer';
import '../Student/PollQuestion.css';
import '../Student/PollResults.css';
import './LiveResults.css';

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

export const LiveResults: FC<{ pollState: PollState }> = ({ pollState }) => {
  const { timeRemaining } = usePollTimer(pollState.remainingTime ?? 0);
  const maxVotes = Math.max(...Object.values(pollState.votes).map(Number), 1);

  return (
    <div className="lr-content">
      <div className="lr-header">
        <span className="lr-question-label">Question</span>
        <span className="pq-timer">
          <ClockIcon />
          {formatTimer(timeRemaining)}
        </span>
      </div>

      <div className="pq-question-box" style={{ marginBottom: 24 }}>
        {pollState.poll.question}
      </div>

      <div className="pr-results">
        {pollState.poll.options.map((option, index) => {
          const count = pollState.votes[index] || 0;
          const pct = pollState.totalVotes > 0
            ? Math.round((count / pollState.totalVotes) * 100)
            : 0;
          const isLeading = count > 0 && count === maxVotes;

          return (
            <div key={index} className="pr-row">
              <div className="pr-row-label">
                <span className={`pq-opt-num${isLeading ? ' leading' : ''}`}>{index + 1}</span>
                <span className="pq-opt-text">{option}</span>
              </div>
              <div className="pr-bar-track">
                <div
                  className={`pr-bar-fill${isLeading ? ' leading' : ''}`}
                  style={{ width: `${pct}%` }}
                />
                <span className="pr-pct">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lr-total">
        {pollState.totalVotes} vote{pollState.totalVotes !== 1 ? 's' : ''} submitted
      </div>
    </div>
  );
};
