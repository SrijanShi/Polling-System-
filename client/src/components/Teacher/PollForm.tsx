import { useState, type FC } from 'react';

interface Option {
  text: string;
}

interface PollFormProps {
  onCreatePoll: (question: string, options: string[], timerDuration: number, correctOption?: number) => void;
  onViewHistory: () => void;
}

export const PollForm: FC<PollFormProps> = ({ onCreatePoll, onViewHistory }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<Option[]>([{ text: '' }, { text: '' }]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const QUESTION_MAX = 200;

  const handleOptionChange = (index: number, value: string) => {
    const next = [...options];
    next[index] = { text: value };
    setOptions(next);
  };

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, { text: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      if (correctOption === index) setCorrectOption(null);
      else if (correctOption !== null && correctOption > index) setCorrectOption(correctOption - 1);
    }
  };

  const handleSubmit = () => {
    const validOptions = options.map(o => o.text.trim()).filter(Boolean);
    if (question.trim() && validOptions.length >= 2) {
      onCreatePoll(question.trim(), validOptions, timerDuration, correctOption ?? undefined);
      setQuestion('');
      setOptions([{ text: '' }, { text: '' }]);
      setTimerDuration(60);
      setCorrectOption(null);
    }
  };

  const canSubmit = question.trim().length > 0 && options.filter(o => o.text.trim()).length >= 2;

  return (
    <div className="pf-page">
      <div className="pf-card">
        {/* Header */}
        <div className="pf-top">
          <div className="intervue-badge">⚡ Intervue Poll</div>
          <button className="pf-history-link" onClick={onViewHistory}>
            📊 View Poll History
          </button>
        </div>

        <h1 className="pf-title">Let's <strong>Get Started</strong></h1>
        <p className="pf-sub">
          you'll have the ability to create and manage polls, ask questions, and monitor
          your students' responses in real-time.
        </p>

        {/* Question + Timer row */}
        <div className="pf-question-row">
          <div className="pf-question-wrap">
            <label className="pf-label">Enter your question</label>
            <textarea
              className="pf-textarea"
              value={question}
              maxLength={QUESTION_MAX}
              placeholder="Type your question here..."
              onChange={(e) => setQuestion(e.target.value)}
            />
            <span className="pf-charcount">{question.length}/{QUESTION_MAX}</span>
          </div>
          <div className="pf-timer-wrap">
            <label className="pf-label">&nbsp;</label>
            <select
              className="pf-timer-sel"
              value={timerDuration}
              onChange={(e) => setTimerDuration(Number(e.target.value))}
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>
        </div>

        {/* Options table */}
        <div className="pf-options-header">
          <span className="pf-col-label">Edit Options</span>
          <span className="pf-col-correct">Is it Correct?</span>
        </div>

        <div className="pf-options">
          {options.map((opt, idx) => (
            <div key={idx} className="pf-option-row">
              <div className="pf-opt-left">
                <span className="pq-opt-num">{idx + 1}</span>
                <input
                  className="pf-opt-input"
                  type="text"
                  value={opt.text}
                  placeholder={`Option ${idx + 1}`}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                />
                {options.length > 2 && (
                  <button className="pf-remove-btn" onClick={() => handleRemoveOption(idx)} title="Remove">×</button>
                )}
              </div>
              <div className="pf-correct-radios">
                <label className="pf-radio-label">
                  <input
                    type="radio"
                    name={`correct-${idx}`}
                    checked={correctOption === idx}
                    onChange={() => setCorrectOption(idx)}
                  /> Yes
                </label>
                <label className="pf-radio-label">
                  <input
                    type="radio"
                    name={`correct-${idx}`}
                    checked={correctOption !== idx}
                    onChange={() => { if (correctOption === idx) setCorrectOption(null); }}
                  /> No
                </label>
              </div>
            </div>
          ))}
        </div>

        {options.length < 6 && (
          <button className="pf-add-btn" onClick={handleAddOption}>
            + Add More option
          </button>
        )}

        <div className="pf-footer">
          <button className="pf-ask-btn" onClick={handleSubmit} disabled={!canSubmit}>
            Ask Question
          </button>
        </div>
      </div>
    </div>
  );
};
