import mongoose, { Schema, Document } from 'mongoose';
import { IPoll } from '../types';

export interface PollDocument extends Omit<IPoll, '_id'>, Document {
  isExpired(): boolean;
  getRemainingTime(): number;
}

const PollSchema: Schema = new Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    minlength: [5, 'Question must be at least 5 characters long'],
    maxlength: [500, 'Question must not exceed 500 characters']
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function(v: string[]) {
        return v.length >= 2 && v.length <= 6;
      },
      message: 'Poll must have between 2 and 6 options'
    }
  },
  timerDuration: {
    type: Number,
    required: [true, 'Timer duration is required'],
    min: [15, 'Timer must be at least 15 seconds'],
    max: [300, 'Timer must not exceed 300 seconds (5 minutes)'],
    default: 60
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'active', 'completed'],
      message: 'Status must be either pending, active, or completed'
    },
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
PollSchema.index({ status: 1, createdAt: -1 });

// Virtual for vote count (will be populated when needed)
PollSchema.virtual('votes', {
  ref: 'Vote',
  localField: '_id',
  foreignField: 'pollId'
});

// Method to check if poll is expired
PollSchema.methods.isExpired = function(): boolean {
  if (!this.startedAt || this.status !== 'active') {
    return false;
  }
  const elapsedTime = Date.now() - this.startedAt.getTime();
  return elapsedTime >= this.timerDuration * 1000;
};

// Method to get remaining time
PollSchema.methods.getRemainingTime = function(): number {
  if (!this.startedAt || this.status !== 'active') {
    return this.timerDuration;
  }
  const elapsedTime = Math.floor((Date.now() - this.startedAt.getTime()) / 1000);
  const remaining = this.timerDuration - elapsedTime;
  return remaining > 0 ? remaining : 0;
};

export default mongoose.model<PollDocument>('Poll', PollSchema);