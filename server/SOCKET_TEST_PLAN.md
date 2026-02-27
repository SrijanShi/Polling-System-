# 🧪 Socket.io System - Comprehensive Test Plan

## ✅ Current Security Implementation

### Authentication & Authorization
- ✅ Session validation for all actions
- ✅ Role-based access control (teacher/student)
- ✅ Server-side session data (no client spoofing)
- ✅ Unique compound index on votes (pollId + sessionId)

---

## ⚠️ Identified Issues & Gaps

### 1. **CRITICAL: Multiple Active Polls**
**Issue:** System allows only ONE active poll globally, but doesn't prevent creating multiple polls.
```typescript
// Teacher can create Poll A, Poll B, Poll C
// But only ONE can be active at a time - CONFUSING UX!
```
**Risk:** Teachers can create many polls, start one, but others remain in "pending" state.

**Test:**
1. Teacher creates Poll A → ✅ Created (status: pending)
2. Teacher creates Poll B → ✅ Created (status: pending)
3. Teacher starts Poll A → ✅ Active
4. Teacher tries to start Poll B → ❌ What happens?

---

### 2. **CRITICAL: Timer Recovery After Server Restart**
**Issue:** `TimerManager` stores timers in memory. On server restart, all timers are lost.
```typescript
// Scenario:
// 1. Teacher starts 60s poll
// 2. Server crashes at 30s
// 3. Server restarts → Timer lost!
// 4. Poll stuck in "active" state forever
```

**Test:**
1. Start poll with 60s timer
2. Wait 10s
3. Restart server: `npm run dev`
4. Check poll status → ❌ Still "active" but timer gone!

---

### 3. **MEDIUM: Race Condition - Poll Expiry**
**Issue:** What if a student submits a vote RIGHT when the timer expires?
```typescript
// Timeline:
// T=59.9s: Student clicks "Submit Vote"
// T=60.0s: Timer expires, poll status → "completed"
// T=60.1s: Vote arrives → Should it be accepted?
```

**Test:**
1. Start poll with 15s timer
2. Wait 14.9 seconds
3. Student submits vote → ❌ May fail with "Poll is not active"

---

### 4. **MEDIUM: Multiple Teachers Connected**
**Issue:** System doesn't prevent multiple teachers from connecting.
```typescript
// Teacher A creates poll → ✅
// Teacher B creates poll → ✅
// Teacher A starts their poll → ✅
// Teacher B tries to start their poll → ❌ Which one wins?
```

**Test:**
1. Tab 1: Register as Teacher "Mr. Smith"
2. Tab 2: Register as Teacher "Ms. Jones"
3. Both create polls
4. Both try to start polls → 🤔 Confusing state!

---

### 5. **LOW: Student Reconnection During Active Poll**
**Issue:** If student disconnects and reconnects, do they lose voting ability?
```typescript
// Scenario:
// 1. Poll starts
// 2. Student Alice votes → ✅
// 3. Alice disconnects (session deleted)
// 4. Alice reconnects with same sessionId
// 5. Can Alice vote again? → Should be NO!
```

**Test:**
1. Register as Student "Alice" with sessionId "alice-123"
2. Vote on active poll → ✅
3. Disconnect
4. Reconnect with SAME sessionId "alice-123"
5. Try to vote again → Should fail with "Already voted"

---

### 6. **LOW: Memory Leak - Expired Timers**
**Issue:** Do timers get properly cleaned up after poll completion?
```typescript
// After 10 polls:
// activeTimers.size = ? (should be 0)
```

**Test:**
1. Create and complete 5 polls
2. Check `TimerManager.getActiveTimers()` → Should be empty

---

## 🧪 Comprehensive Test Suite

### Test Category 1: Authentication & Authorization ✅

#### Test 1.1: No Session - Should Fail
```bash
# Expected: All actions fail with "No session found"
1. Connect (don't register)
2. Try: Create Poll → ❌ "No session found"
3. Try: Start Poll → ❌ "No session found"
4. Try: Submit Vote → ❌ "No session found"
5. Try: Kick Student → ❌ "No session found"
```

#### Test 1.2: Wrong Role - Should Fail
```bash
# Expected: Role validation prevents unauthorized actions
1. Register as Student
2. Try: Create Poll → ❌ "Requires teacher role"
3. Try: Start Poll → ❌ "Requires teacher role"
4. Try: Kick Student → ❌ "Requires teacher role"

5. Register as Teacher (new tab)
6. Try: Submit Vote → ❌ "Requires student role"
```

#### Test 1.3: Session Data Cannot Be Spoofed ✅
```bash
# Expected: Server uses validated session, not client data
1. Register as Student "Alice" (sessionId: alice-123)
2. Open browser console
3. Try: socket.emit('vote:submit', {
     pollId: 'xxx',
     selectedOption: 0
   }) → Vote recorded as "Alice", not custom data!
```

---

### Test Category 2: Poll Lifecycle

#### Test 2.1: Create Poll - Valid Input ✅
```bash
1. Register as Teacher
2. Create poll:
   - Question: "What is 2+2?"
   - Options: ["3", "4", "5"]
   - Timer: 30s
3. Expected: ✅ Poll created, status = "pending"
```

#### Test 2.2: Create Poll - Invalid Input ❌
```bash
1. Register as Teacher
2. Create poll with invalid data:
   - Empty question → ❌ "Question required"
   - Only 1 option → ❌ "Must have 2-6 options"
   - Timer = 10s → ❌ "Must be 15-300 seconds"
   - Timer = 400s → ❌ "Must be 15-300 seconds"
```

#### Test 2.3: Start Poll ✅
```bash
1. Teacher creates poll → Get pollId
2. Teacher starts poll → ✅ 
   - Status → "active"
   - startedAt → timestamp
   - Timer → started
3. All clients receive: poll:started event
```

#### Test 2.4: Cannot Restart Completed Poll ✅
```bash
1. Create and start poll
2. Wait for timer to expire
3. Try to start same poll again → ❌ "Cannot restart completed poll"
```

#### Test 2.5: Poll Auto-Completion ✅
```bash
1. Start poll with 15s timer
2. Wait 15 seconds
3. Timer callback executed → poll:ended event
4. Poll status → "completed"
5. No more votes accepted
```

---

### Test Category 3: Voting System

#### Test 3.1: Valid Vote ✅
```bash
1. Teacher starts poll (pollId: xxx)
2. Student registers and connects
3. Student submits vote → ✅ "Vote recorded"
4. All clients receive: poll:results:updated
```

#### Test 3.2: Cannot Vote Twice ✅
```bash
1. Student votes on active poll → ✅
2. Student tries to vote again → ❌ "Already voted in this poll"
```

#### Test 3.3: Cannot Vote on Pending Poll ✅
```bash
1. Teacher creates poll (doesn't start)
2. Student tries to vote → ❌ "Poll is not active"
```

#### Test 3.4: Cannot Vote on Expired Poll ✅
```bash
1. Teacher starts 15s poll
2. Wait 15+ seconds (poll completes)
3. Student tries to vote → ❌ "Poll time has expired" OR "Poll is not active"
```

#### Test 3.5: Invalid Option ✅
```bash
1. Poll has 3 options (0, 1, 2)
2. Student submits option 5 → ❌ "Invalid option selected"
3. Student submits option -1 → ❌ "Invalid option selected"
```

---

### Test Category 4: Real-Time Updates

#### Test 4.1: Poll Started - Broadcast to All ✅
```bash
1. Open 3 tabs: 1 Teacher, 2 Students
2. Teacher starts poll
3. Expected: All 3 tabs receive poll:started event
```

#### Test 4.2: Vote Submitted - Results Updated ✅
```bash
1. Teacher starts poll
2. Student A votes → All clients receive poll:results:updated
3. Student B votes → All clients receive poll:results:updated
4. Vote counts update in real-time
```

#### Test 4.3: Poll Ended - All Notified ✅
```bash
1. Start poll with 15s timer
2. Wait for expiry
3. All clients receive: poll:ended event with final results
```

#### Test 4.4: Students List Updates ✅
```bash
1. Teacher connects → students:updated (count: 0)
2. Student A connects → Teacher receives students:updated (count: 1)
3. Student B connects → Teacher receives students:updated (count: 2)
4. Student A disconnects → Teacher receives students:updated (count: 1)
```

---

### Test Category 5: Session Management

#### Test 5.1: Register Session ✅
```bash
1. Connect to server
2. Emit session:register:
   - sessionId: "test-123"
   - role: "student"
   - name: "Alice"
3. Expected: session:registered event
4. Server stores: {socketId → sessionId → role → name}
```

#### Test 5.2: Reconnect Session 🔶 (Test This!)
```bash
1. Register as Student "Alice" (sessionId: alice-123)
2. Vote on active poll → ✅
3. Disconnect
4. Reconnect with sessionId: alice-123
5. Emit session:reconnect
6. Expected: 
   - ✅ Session restored with same role/name
   - ✅ Receives current poll state
   - ❌ Should NOT be able to vote again!
```

#### Test 5.3: Kick Student (Teacher) ✅
```bash
1. Teacher connects
2. Students A, B, C connect
3. Teacher kicks Student B (by sessionId)
4. Expected:
   - Student B receives: session:kicked event
   - Student B disconnected
   - Other students still connected
   - Teacher receives: students:updated
```

#### Test 5.4: Disconnect Cleanup ✅
```bash
1. Student connects and registers
2. Teacher sees student in list
3. Student closes tab/disconnects
4. Expected:
   - Session removed from database
   - Teacher receives: students:updated
```

---

### Test Category 6: Edge Cases & Security

#### Test 6.1: Multiple Teachers 🔶 (NEEDS FIX)
```bash
1. Tab 1: Register as Teacher "Mr. Smith"
2. Tab 2: Register as Teacher "Ms. Jones"
3. Expected: ?
   - Should only allow ONE teacher?
   - Or allow multiple but coordinate polls?
```

#### Test 6.2: Multiple Active Polls 🔶 (NEEDS FIX)
```bash
1. Teacher creates Poll A
2. Teacher creates Poll B
3. Teacher starts Poll A → active
4. Teacher tries to start Poll B
5. Expected: ❌ "Another poll is already active"
```

#### Test 6.3: Server Restart with Active Poll ❌ (BROKEN!)
```bash
1. Start poll with 60s timer
2. Wait 10s
3. Kill server: Ctrl+C
4. Restart: npm run dev
5. Check poll status:
   - Database: status = "active" (stuck!)
   - TimerManager: No timer! (lost!)
6. Expected: Timer should be recovered!
```

#### Test 6.4: Concurrent Votes ✅
```bash
1. Start poll
2. 10 students vote simultaneously
3. Expected:
   - All votes recorded
   - No duplicates (unique index enforced)
   - Real-time updates sent to all
```

#### Test 6.5: Database Connection Loss 🔶
```bash
1. Stop MongoDB: brew services stop mongodb-community
2. Try to create poll
3. Expected: ❌ Graceful error message
4. Restart MongoDB
5. System should recover
```

---

## 🛠️ Recommended Fixes

### Fix 1: Prevent Multiple Active Polls
```typescript
// In PollService.startPoll():
const existingActive = await Poll.findOne({ status: 'active' });
if (existingActive) {
  throw new Error('Another poll is already active. Complete it first.');
}
```

### Fix 2: Timer Recovery on Server Restart
```typescript
// In server/src/index.ts - after MongoDB connects:
async function recoverActivePolls() {
  const activePolls = await Poll.find({ status: 'active' });
  
  for (const poll of activePolls) {
    const elapsed = Math.floor((Date.now() - poll.startedAt.getTime()) / 1000);
    const remaining = poll.timerDuration - elapsed;
    
    if (remaining <= 0) {
      // Poll should have expired - complete it now
      await PollService.completePoll(poll._id.toString());
    } else {
      // Restart timer with remaining time
      TimerManager.startTimer(poll._id.toString(), remaining, () => {
        // Emit poll:ended to all clients
        io.emit('poll:ended', ...);
      });
    }
  }
}
```

### Fix 3: Prevent Multiple Teachers
```typescript
// In SocketController.handleRegisterSession():
if (role === 'teacher') {
  const existingTeacher = await SessionService.getTeacherSessions();
  if (existingTeacher && existingTeacher.socketId !== socket.id) {
    throw new Error('A teacher is already connected');
  }
}
```

### Fix 4: Vote Grace Period
```typescript
// Add 1-second grace period for votes during timer expiry:
if (poll.status !== 'active') {
  const timeSinceExpiry = Date.now() - poll.startedAt.getTime() - (poll.timerDuration * 1000);
  if (timeSinceExpiry > 1000) { // 1s grace period
    throw new Error('Poll is not active');
  }
}
```

---

## 📋 Quick Test Checklist

### Must Test Before Production:
- [ ] ✅ Authentication: Try actions without session
- [ ] ✅ Authorization: Try teacher actions as student
- [ ] ✅ Vote once only: Try voting twice
- [ ] ✅ Real-time: Multiple tabs see updates
- [ ] ✅ Timer expiry: Poll auto-completes
- [ ] 🔶 Server restart: Active poll recovery
- [ ] 🔶 Multiple teachers: Coordination needed?
- [ ] 🔶 Multiple polls: Prevent or allow?
- [ ] ✅ Disconnect: Session cleanup
- [ ] ✅ Reconnect: Session restore (but can't re-vote)

---

## 🎯 Current Status Summary

### ✅ Working Well:
- Authentication & authorization
- Role-based access control
- Vote deduplication
- Real-time broadcasting
- Timer management (while server runs)
- Session cleanup on disconnect

### ⚠️ Needs Testing:
- Session reconnection (does it prevent double voting?)
- Multiple teachers handling
- Multiple active polls handling

### ❌ Broken:
- **Timer recovery after server restart** (CRITICAL!)
- **Active polls stuck in "active" state on crash**

### 🔧 Recommended Next Steps:
1. Implement timer recovery on server startup
2. Add constraint: Only ONE active poll at a time
3. Optional: Limit to ONE teacher connection
4. Add integration tests for edge cases
5. Test with 50+ concurrent users
