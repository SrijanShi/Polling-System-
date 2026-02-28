import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './ChatPopup.css';

interface Message {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  text: string;
  timestamp: Date;
  isMe: boolean;
}

interface Participant {
  sessionId?: string;
  name: string;
}

interface ChatPopupProps {
  role: 'teacher' | 'student';
  name: string;
  sessionId: string;
}

export const ChatPopup: React.FC<ChatPopupProps> = ({ role, name, sessionId }) => {
  const { on, off, emit } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChatMessage = (data: {
      name: string;
      role: string;
      text: string;
      senderId: string;
      timestamp: string;
    }) => {
      const msg: Message = {
        id: `${Date.now()}-${Math.random()}`,
        name: data.name,
        role: data.role as 'teacher' | 'student',
        text: data.text,
        timestamp: new Date(data.timestamp),
        isMe: data.senderId === sessionId || data.name === name,
      };
      setMessages(prev => [...prev, msg]);
    };

    const handleStudentsUpdated = (data: { students: { sessionId: string; name: string }[] }) => {
      if (role === 'teacher') {
        setParticipants(data.students.map(s => ({ sessionId: s.sessionId, name: s.name })));
      }
    };

    const handleParticipantsUpdated = (data: { names: string[] }) => {
      if (role === 'student') {
        setParticipants(data.names.map(n => ({ name: n })));
      }
    };

    on('chat:message', handleChatMessage);
    on('students:updated', handleStudentsUpdated);
    on('participants:updated', handleParticipantsUpdated);

    return () => {
      off('chat:message', handleChatMessage);
      off('students:updated', handleStudentsUpdated);
      off('participants:updated', handleParticipantsUpdated);
    };
  }, [on, off, role, sessionId]);

  // Unread badge counter
  useEffect(() => {
    const handleNewMsg = () => {
      if (!isOpen || activeTab !== 'chat') setUnread(n => n + 1);
    };
    on('chat:message', handleNewMsg);
    return () => off('chat:message', handleNewMsg);
  }, [on, off, isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setUnread(0);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [isOpen, activeTab, messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    emit('chat:send', { text });
    setInput('');
  };

  const handleKick = (studentSessionId: string) => {
    if (window.confirm('Remove this student from the session?')) {
      emit('student:kick', { sessionId: studentSessionId });
    }
  };

  return (
    <>
      <button
        className="chat-fab"
        onClick={() => { setIsOpen(o => !o); setUnread(0); }}
        title="Chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
        {unread > 0 && <span className="chat-fab-badge">{unread}</span>}
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <button
              className={`chat-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >Chat</button>
            <button
              className={`chat-tab ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >Participants</button>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {activeTab === 'chat' && (
            <>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <p className="chat-empty">No messages yet. Say hi! 👋</p>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`chat-msg ${msg.isMe ? 'mine' : 'theirs'}`}>
                    {!msg.isMe && (
                      <span className="chat-sender">
                        {msg.name}
                        {msg.role === 'teacher' && ' (Teacher)'}
                      </span>
                    )}
                    <div className="chat-bubble">{msg.text}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-row">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  maxLength={300}
                />
                <button onClick={sendMessage} disabled={!input.trim()}>Send</button>
              </div>
            </>
          )}

          {activeTab === 'participants' && (
            <div className="chat-participants">
              {participants.length === 0 ? (
                <p className="chat-empty">No participants yet</p>
              ) : (
                <>
                  <div className="chat-part-header">
                    <span>Name</span>
                    {role === 'teacher' && <span>Action</span>}
                  </div>
                  {participants.map((p, i) => (
                    <div key={i} className="chat-part-row">
                      <span className="chat-part-name">{p.name}</span>
                      {role === 'teacher' && p.sessionId && (
                        <button
                          className="chat-kick-btn"
                          onClick={() => handleKick(p.sessionId!)}
                        >
                          Kick out
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
