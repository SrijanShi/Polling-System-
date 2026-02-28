import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { RoleSelection } from './components/Common/RoleSelection';
import { TeacherDashboard } from './components/Teacher/TeacherDashboard';
import { StudentView } from './components/Student/StudentView';
import { KickedPage } from './components/Student/KickedPage';
import type { SessionData } from './types';
import { saveSession, getSession, generateSessionId, setKicked, getKickedName, clearSession } from './utils/session';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const { isConnected, emit, on, off } = useSocket();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isKicked, setIsKicked] = useState<boolean>(() => getKickedName() !== null);

  // Listen for registration events with named callbacks for proper cleanup
  useEffect(() => {
    const handleRegistered = (data: any) => {
      setIsRegistered(true);
      console.log('Session registered:', data);
    };
    const handleReconnected = (data: any) => {
      setIsRegistered(true);
      console.log('Session reconnected:', data);
    };
    const handleError = (data: any) => {
      console.error('Session error:', data.message);
      setSession(null);
      setIsRegistered(false);
      saveSession(null as any);
    };
    const handleKicked = (_data: any) => {
      const currentSession = getSession();
      if (currentSession?.name) {
        setKicked(currentSession.name);
      }
      clearSession();
      setSession(null);
      setIsRegistered(false);
      setIsKicked(true);
    };

    on('session:registered', handleRegistered);
    on('session:reconnected', handleReconnected);
    on('session:error', handleError);
    on('session:kicked', handleKicked);

    return () => {
      off('session:registered', handleRegistered);
      off('session:reconnected', handleReconnected);
      off('session:error', handleError);
      off('session:kicked', handleKicked);
    };
  }, [on, off]);

  // State recovery: emit reconnect once socket is connected
  useEffect(() => {
    if (!isConnected) return;
    const savedSession = getSession();
    if (savedSession) {
      setSession(savedSession);
      emit('session:reconnect', { sessionId: savedSession.sessionId });
    }
  }, [isConnected, emit]);

  const handleSelectRole = (role: 'teacher' | 'student', name: string) => {
    const sessionId = generateSessionId(role, name);
    const sessionData: SessionData = { sessionId, role, name };
    emit('session:register', sessionData);
    setSession(sessionData);
    saveSession(sessionData);
  };

  if (isKicked) {
    return <KickedPage />;
  }

  if (!isConnected) {
    return (
      <div className="connecting">
        <div className="spinner"></div>
        <p>Connecting to server...</p>
      </div>
    );
  }

  if (!session || !isRegistered) {
    return <RoleSelection onSelectRole={handleSelectRole} />;
  }

  return (
    <div className="App">
      <Toaster position="top-right" />
      {session.role === 'teacher' ? (
        <TeacherDashboard sessionId={session.sessionId} name={session.name} />
      ) : (
        <StudentView sessionId={session.sessionId} name={session.name} />
      )}
    </div>
  );
}

export default App;