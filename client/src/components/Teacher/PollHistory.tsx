import { useState, useEffect } from 'react';
import axios from 'axios';
import '../Student/PollResults.css';
import './PollHistory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface HistoryEntry {
  pollId: string;
  question: string;
  options: string[];
  votes: { option: number; count: number; percentage: number }[];
  totalVotes: number;
  status: string;
}

interface PollHistoryProps {
  onClose: () => void;
}

export const PollHistory: React.FC<PollHistoryProps> = ({ onClose }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/polls/history`);
        const data = res.data?.data ?? res.data ?? [];
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        setError('Failed to load poll history.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="ph-page">
      <div className="ph-card">
        <div className="ph-header">
          <h1 className="ph-title">View <strong>Poll History</strong></h1>
          <button className="ph-close" onClick={onClose}>✕ Close</button>
        </div>

        {loading && <p className="ph-status">Loading history...</p>}
        {error && <p className="ph-status ph-error">{error}</p>}

        {!loading && !error && history.length === 0 && (
          <p className="ph-status">No polls have been conducted yet.</p>
        )}

        <div className="ph-list">
          {history.map((entry, qi) => {
            const maxVotes = Math.max(...entry.votes.map(v => v.count), 1);
            return (
              <div key={entry.pollId} className="ph-entry">
                <p className="ph-qnum">Question {qi + 1}</p>
                <div className="pq-question-box" style={{ marginBottom: 16 }}>
                  {entry.question}
                </div>
                <div className="pr-results">
                  {entry.options.map((opt, oi) => {
                    const v = entry.votes.find(v => v.option === oi);
                    const count = v?.count ?? 0;
                    const pct = entry.totalVotes > 0
                      ? Math.round((count / entry.totalVotes) * 100)
                      : 0;
                    const isLeading = count > 0 && count === maxVotes;
                    return (
                      <div key={oi} className="pr-row">
                        <div className="pr-row-label">
                          <span className={`pq-opt-num${isLeading ? ' leading' : ''}`}>{oi + 1}</span>
                          <span className="pq-opt-text">{opt}</span>
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
                <p className="ph-total">{entry.totalVotes} vote{entry.totalVotes !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
