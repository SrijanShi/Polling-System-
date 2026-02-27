import mongoose, { Schema, Document, HydratedDocument, Model } from 'mongoose';
import { IVote, IPoll } from '../types';

export interface VoteDocument extends Omit<IVote, '_id'>, Document {}

const VoteSchema: Schema = new Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: [true, 'Poll ID is required']
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name must not exceed 50 characters']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required']
  },
  selectedOption: {
    type: Number,
    required: [true, 'Selected option is required'],
    min: [0, 'Option index must be non-negative']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate votes from same session
VoteSchema.index({ pollId: 1, sessionId: 1 }, { unique: true });

// Index for faster queries
VoteSchema.index({ pollId: 1, timestamp: -1 });

// Pre-save hook to validate option exists in poll
VoteSchema.pre('save', async function() {
  const Poll = mongoose.model('Poll');
  const pollDoc = await Poll.findById(this.pollId);
  
  if (!pollDoc) {
    throw new Error('Poll not found');
  }

  // Type assertion for pollDoc
  const pollData = pollDoc as unknown as IPoll;
  const selectedOpt = this.selectedOption as number;

  if (selectedOpt >= pollData.options.length) {
    throw new Error('Invalid option selected');
  }

  if (pollData.status !== 'active') {
    throw new Error('Poll is not active');
  }
});

export default mongoose.model<VoteDocument>('Vote', VoteSchema);