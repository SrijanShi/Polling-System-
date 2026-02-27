import Session, {SessionDocument} from '../models/Session';
import { ISession } from '../types';

class SessionService {
    async createSession(sessionId: string, role: 'teacher' | 'student', name: string, socketId: string): Promise<SessionDocument> {
    try {
      // Check if session already exists
      let session = await Session.findOne({ sessionId });

      if (session) {

        session.socketId = socketId;
        session.connectedAt = new Date();
        await session.save();
        console.log(`Session updated: ${sessionId} (${role})`);
      } else {
        session = new Session({
          sessionId,
          role,
          name: name.trim(),
          socketId
        });
        await session.save();
        console.log(`Session created: ${sessionId} (${role})`);
      }

      return session;
    } catch (error: any) {
      console.error('Error creating session:', error.message);
      throw error;
    }
  }

  async getSessionById(sessionId: string): Promise<SessionDocument | null>{
    try {
        const session = await Session.findOne({sessionId});
        return session;
    }
    catch(error: any){
        console.error('Errorfetching session: ', error.message);
        throw error;
    }
  }

  async getSessionBySocketId(socketId: string): Promise<SessionDocument | null>{
    try {
        const session = await Session.findOne({socketId});
        return session;
    }
    catch(error: any){
        console.error('Error fetching session by socket ID: ', error.message);
        throw error;
    }
  }

  async getAllSessions(): Promise<SessionDocument[]>{
    try {
        const sessions = await Session.find().sort({connectedAt: -1});
        return sessions;
    }
    catch(error: any){
        console.error('Error fetching all sessions: ', error.message);
        throw error;
    }
  }

  async getStudentSessions(): Promise<SessionDocument[]>{
    try {
        const students = await Session.find({role: 'student'}).sort({connectedAt: -1});
        return students;
    }
    catch(error: any){
        console.error('Error fetching student sessions: ', error.message);
        throw error;
    }
  }

  async getTeacherSessions(): Promise<SessionDocument | null>{
    try {
        const teacher = await Session.findOne({role: 'teacher'}).sort({connectedAt: -1});
        return teacher;
    }
    catch(error: any){
        console.error('Error fetching teacher session: ', error.message);
        throw error;
    }
  }

  async updateSocketId(sessionId: string, newSocketId: string): Promise<SessionDocument | null> {
    try {
      const session = await Session.findOneAndUpdate(
        { sessionId },
        { 
          socketId: newSocketId,
          connectedAt: new Date()
        },
        { new: true }
      );

      if (session) {
        console.log(`Socket ID updated for session: ${sessionId}`);
      }

      return session;
    } catch (error: any) {
      console.error('Error updating socket ID:', error.message);
      throw error;
    }
  }

  async removeSession(socketId: string): Promise<void> {
    try {
      const session = await Session.findOneAndDelete({ socketId });
      
      if (session) {
        console.log(`Session removed: ${session.sessionId} (${session.role})`);
      }
    } catch (error: any) {
      console.error('Error removing session:', error.message);
      throw error;
    }
  }

  async removeSessionById(sessionId: string): Promise<void> {
    try {
      const session = await Session.findOneAndDelete({ sessionId });
      
      if (session) {
        console.log(`Session removed by ID: ${sessionId}`);
      }
    } catch (error: any) {
      console.error('Error removing session by ID:', error.message);
      throw error;
    }
  }

  async kickStudent(sessionId: string): Promise<SessionDocument | null> {
    try {
      const session = await Session.findOne({ sessionId, role: 'student' });

      if (!session) {
        throw new Error('Student session not found');
      }

      await Session.findByIdAndDelete(session._id);
      console.log(`Student kicked: ${sessionId}`);

      return session;
    } catch (error: any) {
      console.error('Error kicking student:', error.message);
      throw error;
    }
  }

  async countSessionsByRole(): Promise<{ students: number; teachers: number }> {
    try {
      const students = await Session.countDocuments({ role: 'student' });
      const teachers = await Session.countDocuments({ role: 'teacher' });

      return { students, teachers };
    } catch (error: any) {
      console.error('Error counting sessions:', error.message);
      throw error;
    }
  }

  async cleanupOldSessions(hoursOld: number = 24): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
      const result = await Session.deleteMany({
        connectedAt: { $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} old sessions`);
      return result.deletedCount;
    } catch (error: any) {
      console.error('Error cleaning up sessions:', error.message);
      throw error;
    }
  }
}

export default new SessionService();