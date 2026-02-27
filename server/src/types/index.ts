export interface IPoll {
  _id?: string;
  question: string;
  options: string[];
  timerDuration: number;
  createdAt: Date;
  startedAt?: Date;
  status: 'pending' | 'active' | 'completed';
}

export interface IVote {
  _id?: string;
  pollId: string;
  studentName: string;
  sessionId: string;
  selectedOption: number;
  timestamp: Date;
}

export interface ISession {
  _id?: string;
  sessionId: string;
  role: 'teacher' | 'student';
  name: string;
  socketId: string;
  connectedAt: Date;
}

export interface PollState {
  poll: IPoll;
  votes: { [option: number]: number };
  totalVotes: number;
  remainingTime: number;
  hasVoted: boolean;
}

export interface VoteCount {
  option: number;
  count: number;
  percentage: number;
}

export interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  votes: VoteCount[];
  totalVotes: number;
  status: 'pending' | 'active' | 'completed';
}