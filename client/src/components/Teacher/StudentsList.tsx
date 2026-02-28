import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './StudentsList.css';

interface Student {
  sessionId: string;
  name: string;
  connectedAt: Date;
}

interface StudentsListProps {
  sessionId: string;
}

export const StudentsList: React.FC<StudentsListProps> = () => {
  const { on, off, emit } = useSocket();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const handleStudentsUpdated = (data: { students: Student[]; count: number }) => {
      setStudents(data.students);
    };

    on('students:updated', handleStudentsUpdated);

    return () => {
      off('students:updated', handleStudentsUpdated);
    };
  }, [on, off]);

  const handleKickStudent = (sessionId: string) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      emit('student:kick', { sessionId });
    }
  };

  return (
    <div className="students-list">
      <h3>📋 Connected Students ({students.length})</h3>
      
      {students.length === 0 ? (
        <p className="no-students">No students connected yet</p>
      ) : (
        <div className="students-grid">
          {students.map((student) => (
            <div key={student.sessionId} className="student-card">
              <div className="student-info">
                <span className="student-name">👤 {student.name}</span>
                <span className="student-time">
                  {new Date(student.connectedAt).toLocaleTimeString()}
                </span>
              </div>
              <button 
                onClick={() => handleKickStudent(student.sessionId)}
                className="kick-btn"
                title="Remove student"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
