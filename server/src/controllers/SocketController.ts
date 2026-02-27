import { Server, Socket } from 'socket.io';
import PollService from '../services/PollService';
import SessionService from '../services/SessionService';
import Session, { SessionDocument } from '../models/Session';
import TimerManager from '../utils/TimerManager';

class SocketController {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  private async validateSession(socket: Socket): Promise<SessionDocument | null> {
    const session = await SessionService.getSessionBySocketId(socket.id);
    return session;
  }

  private async validateRole(socket: Socket, requiredRole: 'teacher' | 'student'): Promise<{ valid: boolean; session: SessionDocument | null; message?: string }> {
    const session = await this.validateSession(socket);
    
    if (!session) {
      return { valid: false, session: null, message: 'No session found. Please register first.' };
    }
    
    if (session.role !== requiredRole) {
      return { valid: false, session, message: `This action requires ${requiredRole} role.` };
    }
    
    return { valid: true, session };
  }

  initializeHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.emit('welcome', {
        message: 'Connected to Polling System',
        socketId: socket.id
      });

      this.handleRegisterSession(socket);
      this.handleCreatePoll(socket);
      this.handleStartPoll(socket);
      this.handleSubmitVote(socket);
      this.handleKickStudent(socket);
      this.handleSessionReconnect(socket);
      this.handleDisconnect(socket);
    });
  }

  private handleRegisterSession(socket: Socket): void {
    socket.on('session:register', async (data: {
      sessionId: string;
      role: 'teacher' | 'student';
      name: string;
    }) => {
      try {
        const { sessionId, role, name } = data;

        // Prevent multiple teachers from connecting
        if (role === 'teacher') {
          const existingTeacher = await SessionService.getTeacherSessions();
          if (existingTeacher) {
            socket.emit('session:error', {
              success: false,
              message: 'A teacher is already connected to the system. Only one teacher allowed at a time.'
            });
            return;
          }
        }

        const session = await SessionService.createSession(
          sessionId,
          role,
          name,
          socket.id
        );

        socket.join(role);

        if (role === 'student') {
          socket.join('students');
        }

        socket.emit('session:registered', {
          success: true,
          sessionId: session.sessionId,
          role: session.role,
          name: session.name
        });

        if (role === 'student') {
          const students = await SessionService.getStudentSessions();
          this.io.to('teacher').emit('students:updated', {
            students: students.map(s => ({
              sessionId: s.sessionId,
              name: s.name,
              connectedAt: s.connectedAt
            })),
            count: students.length
          });
        }

        console.log(`Session registered: ${sessionId} (${role}) - ${name}`);
      } catch (error: any) {
        console.error('Error registering session:', error.message);
        socket.emit('session:error', {
          success: false,
          message: error.message
        });
      }
    });
  }

  private handleSessionReconnect(socket: Socket): void {
    socket.on('session:reconnect', async (data: {
      sessionId: string;
    }) => {
      try {
        const { sessionId } = data;

        const session = await SessionService.updateSocketId(sessionId, socket.id);

        if (session) {
          socket.join(session.role);
          if (session.role === 'student') {
            socket.join('students');
          }

          const activePoll = await PollService.getActivePoll();
          
          if (activePoll) {
            const pollState = await PollService.getPollState(
              activePoll._id.toString(),
              sessionId
            );

            socket.emit('session:reconnected', {
              success: true,
              session: {
                sessionId: session.sessionId,
                role: session.role,
                name: session.name
              },
              currentPoll: pollState
            });
          } else {
            socket.emit('session:reconnected', {
              success: true,
              session: {
                sessionId: session.sessionId,
                role: session.role,
                name: session.name
              },
              currentPoll: null
            });
          }

          console.log(`Session reconnected: ${sessionId}`);
        }
      } catch (error: any) {
        console.error('Error reconnecting session:', error.message);
        socket.emit('session:error', {
          success: false,
          message: error.message
        });
      }
    });
  }

  private handleCreatePoll(socket: Socket): void {
    socket.on('poll:create', async (data: {
      question: string;
      options: string[];
      timerDuration: number;
    }) => {
      try {
        // Validate teacher role
        const validation = await this.validateRole(socket, 'teacher');
        if (!validation.valid) {
          socket.emit('poll:error', {
            success: false,
            message: validation.message
          });
          return;
        }

        const { question, options, timerDuration } = data;

        const poll = await PollService.createPoll(question, options, timerDuration);

        socket.emit('poll:created', {
          success: true,
          poll: {
            pollId: poll._id,
            question: poll.question,
            options: poll.options,
            timerDuration: poll.timerDuration,
            status: poll.status
          }
        });

        console.log(`Poll created: ${poll._id}`);
      } catch (error: any) {
        console.error('Error creating poll:', error.message);
        socket.emit('poll:error', {
          success: false,
          message: error.message
        });
      }
    });
  }

  private handleStartPoll(socket: Socket): void {
    socket.on('poll:start', async (data: { pollId: string }) => {
      try {
        // Validate teacher role
        const validation = await this.validateRole(socket, 'teacher');
        if (!validation.valid) {
          socket.emit('poll:error', {
            success: false,
            message: validation.message
          });
          return;
        }

        const { pollId } = data;

        const poll = await PollService.startPoll(pollId);

        TimerManager.startTimer(pollId, poll.timerDuration, () => {
          this.handlePollExpired(pollId);
        });

        this.io.emit('poll:started', {
          pollId: poll._id,
          question: poll.question,
          options: poll.options,
          timerDuration: poll.timerDuration,
          startedAt: poll.startedAt
        });

        console.log(`Poll started: ${poll._id}`);
      } catch (error: any) {
        console.error('Error starting poll:', error.message);
        socket.emit('poll:error', {
          success: false,
          message: error.message
        });
      }
    });
  }

  private handleSubmitVote(socket: Socket): void {
    socket.on('vote:submit', async (data: {
      pollId: string;
      selectedOption: number;
    }) => {
      try {
        // Validate student role
        const validation = await this.validateRole(socket, 'student');
        if (!validation.valid) {
          socket.emit('vote:error', {
            success: false,
            message: validation.message
          });
          return;
        }

        // Use session data from validated session, not from client
        const { pollId, selectedOption } = data;
        const sessionId = validation.session!.sessionId;
        const studentName = validation.session!.name;

        await PollService.submitVote(pollId, studentName, sessionId, selectedOption);

        socket.emit('vote:submitted', {
          success: true,
          message: 'Vote recorded successfully'
        });

        const results = await PollService.getPollResults(pollId);

        this.io.emit('poll:results:updated', {
          pollId: results.pollId,
          votes: results.votes,
          totalVotes: results.totalVotes
        });

        console.log(`Vote submitted by ${studentName} for poll ${pollId}`);
      } catch (error: any) {
        console.error('Error submitting vote:', error.message);
        socket.emit('vote:error', {
          success: false,
          message: error.message
        });
      }
    });
  }

  // Public method for timer restoration to call
  public async handlePollExpired(pollId: string): Promise<void> {
    try {
      await PollService.completePoll(pollId);

      const results = await PollService.getPollResults(pollId);

      this.io.emit('poll:ended', {
        pollId: results.pollId,
        question: results.question,
        options: results.options,
        votes: results.votes,
        totalVotes: results.totalVotes,
        status: results.status
      });

      console.log(`Poll expired and completed: ${pollId}`);
    } catch (error: any) {
      console.error('Error handling poll expiration:', error.message);
    }
  }

  private handleKickStudent(socket: Socket): void {
    socket.on('student:kick', async (data: { sessionId: string }) => {
      try {
        // Validate teacher role
        const validation = await this.validateRole(socket, 'teacher');
        if (!validation.valid) {
          socket.emit('student:kick:error', {
            success: false,
            message: validation.message
          });
          return;
        }

        const { sessionId } = data;

        const session = await SessionService.kickStudent(sessionId);

        if (session) {
          this.io.to(session.socketId).emit('session:kicked', {
            message: 'You have been removed by the teacher'
          });

          const studentSocket = this.io.sockets.sockets.get(session.socketId);
          if (studentSocket) {
            studentSocket.disconnect(true);
          }

          socket.emit('student:kicked', {
            success: true,
            sessionId: session.sessionId
          });

          const students = await SessionService.getStudentSessions();
          this.io.to('teacher').emit('students:updated', {
            students: students.map(s => ({
              sessionId: s.sessionId,
              name: s.name,
              connectedAt: s.connectedAt
            })),
            count: students.length
          });

          console.log(`Student kicked: ${sessionId}`);
        }
      } catch (error: any) {
        console.error('Error kicking student:', error.message);
        socket.emit('student:kick:error', {
          success: false,
          message: error.message
        });
      }
    });
  }

  private handleDisconnect(socket: Socket): void {
    socket.on('disconnect', async () => {
      try {
        const session = await Session.findOne({ socketId: socket.id });

        await SessionService.removeSession(socket.id);

        if (session && session.role === 'student') {
          const students = await SessionService.getStudentSessions();
          this.io.to('teacher').emit('students:updated', {
            students: students.map(s => ({
              sessionId: s.sessionId,
              name: s.name,
              connectedAt: s.connectedAt
            })),
            count: students.length
          });
        }

        console.log(`Client disconnected: ${socket.id}`);
      } catch (error: any) {
        console.error('Error handling disconnect:', error.message);
      }
    });
  }
}

export default SocketController;