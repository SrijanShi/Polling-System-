# Resilient Live Polling System

A real-time polling system with state recovery, built with React, Node.js, Express, Socket.io, and MongoDB. Designed for classroom environments with Teacher and Student personas.

## Project Overview

This system enables teachers to create live polls with timers, while students can join and vote in real-time. The key feature is **state recovery** - if a teacher refreshes mid-poll, the poll persists. If a student joins late, their timer synchronizes correctly (e.g., joining 30 seconds into a 60-second poll shows 30 seconds remaining, not 60).

## Features

### Core Features
- ✅ **Real-time Polling** - Live vote updates using Socket.io
- ✅ **State Recovery** - Polls persist through page refreshes
- ✅ **Timer Synchronization** - Late joiners see correct remaining time
- ✅ **Role-based Access** - Teacher creates/starts polls, Students vote
- ✅ **Duplicate Prevention** - One vote per student per poll
- ✅ **Auto-expiration** - Polls automatically complete when timer reaches zero

### Security
- ✅ **Session Authentication** - All actions require registered session
- ✅ **Role Validation** - Server-side authorization checks
- ✅ **Identity Protection** - Server uses authenticated session data, not client input
- ✅ **Single Teacher** - Only one teacher can connect at a time

### Bonus Features
- ✅ **Kick Student** - Teacher can remove students
- ✅ **Student List** - Live student count and names
- ✅ **Network Recovery** - Auto-reconnection on disconnect
- ✅ **Timer Persistence** - Timers restore after server restart

## Architecture

```
├── server/                   # Backend (Node.js + Express + Socket.io)
│   ├── src/
│   │   ├── controllers/      # HTTP & Socket.io controllers
│   │   ├── services/         # Business logic layer
│   │   ├── models/           # MongoDB schemas (Mongoose)
│   │   ├── routes/           # REST API routes
│   │   ├── utils/            # Utilities (TimerManager, error handlers)
│   │   └── config/           # Database configuration
│   ├── test-socket.html      # Interactive test page
│   ├── test-socket-comprehensive.html  # Automated test suite (26 tests)
│   ├── SOCKET_TESTING_GUIDE.md        # Testing documentation
│   └── SOCKET_STATUS_REPORT.md        # Implementation status
│
└── client/                   # Frontend (React + Vite + TypeScript)
    └── [Not yet implemented - Next step]
```

## Tech Stack

### Backend (Complete ✅)
- **Node.js** v18+ with TypeScript
- **Express** 5.2.1 - REST API framework
- **Socket.io** 4.8.3 - Real-time bidirectional communication
- **MongoDB** with Mongoose 9.2.2 - Database and ODM
- **nodemon** 3.1.14 - Hot reload during development

### Frontend
- **React** with Vite - UI framework
- **TypeScript** - Type safety
- **Socket.io-client** - Real-time updates
- **Custom Hooks** - useSocket, usePollTimer, usePollState

## Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB running locally (port 27017)
- npm or yarn

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/SrijanShi/Polling-System-.git
cd Polling-System-

# 2. Install server dependencies
cd server
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your configuration:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/polling-system
# NODE_ENV=development

# 4. Start MongoDB (if not running)
# On macOS with Homebrew:
brew services start mongodb-community

# 5. Start the development server
npm run dev
```

Server will start on `http://localhost:5000`

## Testing

### Automated Tests (26 tests)

```bash
# 1. Ensure server is running
cd server
npm run dev

# 2. Open test file in browser
open test-socket-comprehensive.html

# 3. Click "▶ Run All Tests"
# Should see: ✓ 26 passed, ✗ 0 failed
```

### Manual Testing

```bash
# Open test-socket.html in browser
open server/test-socket.html

# Test scenarios:
# 1. Register as Teacher → Create Poll → Start Poll
# 2. Open another tab, Register as Student → Submit Vote
# 3. Verify real-time results update in both tabs
```

## API Documentation

### Socket.io Events

#### Client → Server

| Event | Role | Payload | Description |
|-------|------|---------|-------------|
| `session:register` | Any | `{sessionId, role, name}` | Register user session |
| `poll:create` | Teacher | `{question, options[], timerDuration}` | Create new poll |
| `poll:start` | Teacher | `{pollId}` | Start poll with timer |
| `vote:submit` | Student | `{pollId, selectedOption}` | Submit vote |
| `student:kick` | Teacher | `{sessionId}` | Remove student |

#### Server → Client

| Event | Description | Payload |
|-------|-------------|---------|
| `welcome` | Connection established | `{message, socketId}` |
| `session:registered` | Registration successful | `{success, sessionId, role, name}` |
| `poll:started` | Poll started (broadcast) | `{pollId, question, options, timerDuration, startedAt}` |
| `poll:ended` | Poll expired (broadcast) | `{pollId, question, votes, totalVotes}` |
| `poll:results:updated` | New vote received (broadcast) | `{pollId, votes, totalVotes}` |
| `vote:submitted` | Vote recorded | `{success, message}` |
| `students:updated` | Student list changed | `{students, count}` |

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/polls` | Create poll |
| GET | `/api/polls/:id` | Get poll state |
| GET | `/api/polls/:id/results` | Get poll results |
| GET | `/api/current-state` | Get active poll |
| DELETE | `/api/polls/:id` | Delete poll |

## Database Schema

### Poll Model
```typescript
{
  question: String (required, min 5 chars)
  options: [String] (2-6 options)
  timerDuration: Number (15-300 seconds)
  status: 'pending' | 'active' | 'completed'
  startedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### Vote Model
```typescript
{
  pollId: ObjectId (ref: Poll)
  sessionId: String (indexed)
  studentName: String
  selectedOption: Number
  votedAt: Date
}
// Unique index: (pollId + sessionId) - prevents duplicate votes
```

### Session Model
```typescript
{
  sessionId: String (unique, indexed)
  socketId: String (indexed)
  role: 'teacher' | 'student'
  name: String
  connectedAt: Date
}
```

## Security Features

1. **Session Validation** - All socket events require authenticated session
2. **Role-based Authorization** - Teachers can't vote, students can't create polls
3. **Server-side Identity** - Session data retrieved from database, not client
4. **Duplicate Prevention** - Database unique index prevents multiple votes
5. **Single Teacher Lock** - Only one teacher allowed per system instance
6. **Input Validation** - Comprehensive validation on all inputs

## Project Status

### ✅ Completed (Backend - Steps 1-4)
- [x] Project structure and TypeScript setup
- [x] Database models (Poll, Vote, Session)
- [x] Service layer (PollService, SessionService, TimerManager)
- [x] Controllers (HTTP REST + Socket.io events)
- [x] Security & authentication
- [x] Timer persistence (server restart recovery)
- [x] Comprehensive testing suite
- [x] Documentation

## Usage Example

### Teacher Flow
```typescript
// 1. Connect and register
socket.emit('session:register', {
  sessionId: 'teacher-123',
  role: 'teacher',
  name: 'Mr. Smith'
});

// 2. Create poll
socket.emit('poll:create', {
  question: 'What is 2 + 2?',
  options: ['3', '4', '5'],
  timerDuration: 60
});

// 3. Start poll
socket.on('poll:created', (data) => {
  socket.emit('poll:start', { pollId: data.poll.pollId });
});

// 4. Watch results
socket.on('poll:results:updated', (data) => {
  console.log('Votes:', data.votes);
});
```

### Student Flow
```typescript
// 1. Connect and register
socket.emit('session:register', {
  sessionId: 'student-456',
  role: 'student',
  name: 'Alice'
});

// 2. Listen for poll start
socket.on('poll:started', (data) => {
  console.log('Poll:', data.question);
  console.log('Time remaining:', data.timerDuration);
});

// 3. Submit vote
socket.emit('vote:submit', {
  pollId: 'poll-id-here',
  selectedOption: 1  // Vote for option at index 1
});
```

## Known Limitations

1. **Single Teacher** - Only one teacher can connect at a time (by design)
2. **No Authentication** - Uses session IDs, not user accounts (suitable for classroom)
3. **Timer Sync** - Relies on client-server time agreement
4. **LAN Optimized** - Best used in local network/classroom environment


## License

MIT License - See LICENSE file for details



**Last Updated**: February 27, 2026
