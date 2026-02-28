// client/src/components/Common/RoleSelection.tsx
import { useState } from 'react';
import './RoleSelection.css';

interface RoleSelectionProps {
  onSelectRole: (role: 'teacher' | 'student', name: string) => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  const [step, setStep] = useState<'role' | 'name'>('role');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
  const [name, setName] = useState('');

  const handleRoleContinue = () => {
    if (!selectedRole) return;
    if (selectedRole === 'teacher') {
      onSelectRole('teacher', 'Teacher');
    } else {
      setStep('name');
    }
  };

  const handleNameContinue = () => {
    if (name.trim()) {
      onSelectRole('student', name.trim());
    }
  };

  if (step === 'name') {
    return (
      <div className="rs-page">
        <div className="rs-card">
          <div className="intervue-badge">⚡ Intervue Poll</div>
          <h1 className="rs-title">
            Let's <strong>Get Started</strong>
          </h1>
          <p className="rs-sub">
            If you're a student, you'll be able to <strong>submit your answers</strong>, participate in live
            polls, and see how your responses compare with your classmates.
          </p>
          <div className="rs-name-group">
            <label>Enter Your Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameContinue()}
              autoFocus
            />
          </div>
          <button
            className="rs-btn"
            onClick={handleNameContinue}
            disabled={!name.trim()}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rs-page">
      <div className="rs-card">
        <div className="intervue-badge">⚡ Intervue Poll</div>
        <h1 className="rs-title">
          Welcome to the <strong>Live Polling System</strong>
        </h1>
        <p className="rs-sub">
          Please select the role that best describes you to begin using the live polling system.
        </p>
        <div className="rs-roles">
          <div
            className={`rs-role-card ${selectedRole === 'student' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('student')}
          >
            <span className="rs-role-title">I'm a Student</span>
            <span className="rs-role-desc">
              Submit your answers and participate in live polls in real-time.
            </span>
          </div>
          <div
            className={`rs-role-card ${selectedRole === 'teacher' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('teacher')}
          >
            <span className="rs-role-title">I'm a Teacher</span>
            <span className="rs-role-desc">
              Create polls and view live poll results in real-time.
            </span>
          </div>
        </div>
        <button
          className="rs-btn"
          onClick={handleRoleContinue}
          disabled={!selectedRole}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
