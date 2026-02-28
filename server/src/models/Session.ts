import mongoose, { Schema, Document } from 'mongoose';
import { ISession } from '../types';

export interface SessionDocument extends Omit<ISession, '_id'>, Document {}

const SessionSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    unique: true,
    index: true
  },
  role: {
    type: String,
    enum: {
      values: ['teacher', 'student'],
      message: 'Role must be either teacher or student'
    },
    required: [true, 'Role is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name must not exceed 50 characters']
  },
  socketId: {
    type: String,
    required: [true, 'Socket ID is required']
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  isKicked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
SessionSchema.index({ socketId: 1 });
SessionSchema.index({ role: 1, connectedAt: -1 });

// TTL index to automatically delete old sessions after 24 hours
SessionSchema.index({ connectedAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<SessionDocument>('Session', SessionSchema);