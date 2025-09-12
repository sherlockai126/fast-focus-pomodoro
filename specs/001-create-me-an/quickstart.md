# Quickstart: Real-time Chat Application

**Date**: September 11, 2025  
**Phase**: 1 - Design & Contracts  
**Purpose**: Executable test scenarios to validate implementation

---

## Pre-requisites

### Development Environment Setup
1. **Database**: PostgreSQL running with existing Fast Focus schema
2. **Node.js**: Version 18+ with npm/yarn
3. **Dependencies**: All existing project dependencies installed
4. **Authentication**: NextAuth.js configured and working
5. **Test Users**: At least 2 test user accounts created

### Required Test Data
```sql
-- Ensure test users exist (adapt to your user creation method)
INSERT INTO "User" (id, email, name, "isOnline", "chatStatus") VALUES
  ('test-user-1', 'alice@example.com', 'Alice Johnson', false, 'AVAILABLE'),
  ('test-user-2', 'bob@example.com', 'Bob Smith', false, 'AVAILABLE');
```

---

## Scenario 1: Basic Chat Flow (Core Functionality)

### Test Description
Validate the complete flow from user authentication to sending and receiving messages in real-time.

### Step-by-Step Execution

#### Step 1: User Authentication & Setup
```bash
# Start the development server
npm run dev

# Open two browser windows/tabs
# Window 1: http://localhost:3000 (login as Alice)
# Window 2: http://localhost:3000 (login as Bob)
```

**Expected Result**: Both users successfully authenticated and can access the main application.

#### Step 2: Navigate to Chat Interface
```javascript
// In browser console or through UI navigation
// Navigate to chat section of the application
window.location.href = '/chat';
```

**Expected Result**: Chat interface loads with:
- User's conversation list (empty for new users)
- Option to start new conversation
- Online status indicator
- User profile information displayed

#### Step 3: Start New Conversation
```javascript
// Alice starts conversation with Bob
// This should trigger API call: POST /api/chat/conversations
{
  "recipientId": "test-user-2",
  "initialMessage": "Hello Bob! How are you doing?"
}
```

**Expected Result**: 
- New conversation created in database
- Both users receive `conversation_created` WebSocket event
- Conversation appears in both users' conversation lists
- Initial message appears in chat window

#### Step 4: Real-time Message Exchange
```javascript
// Bob responds to Alice
// API call: POST /api/chat/conversations/{conversationId}/messages
{
  "content": "Hi Alice! I'm doing great, thanks for asking!"
}
```

**Expected Result**:
- Message stored in database with SENT status
- Alice receives `message_received` WebSocket event immediately
- Message appears in Alice's chat window without page refresh
- Message status updates to DELIVERED

#### Step 5: Typing Indicators
```javascript
// Alice starts typing a response
// WebSocket event: typing_start
{
  "conversationId": "{conversationId}"
}
```

**Expected Result**:
- Bob sees "Alice is typing..." indicator
- Indicator disappears after 30 seconds or when Alice sends message
- No indicator shown to Alice herself

#### Step 6: Message Read Status
```javascript
// Alice reads Bob's message (views conversation)
// WebSocket event: message_read
{
  "messageId": "{messageId}",
  "conversationId": "{conversationId}"
}
```

**Expected Result**:
- Message status updates from DELIVERED to READ
- Bob sees read receipt indicator (checkmark, timestamp, etc.)
- Database updated with read status and timestamp

---

## Scenario 2: Online Status & Presence

### Test Description
Validate user online/offline status tracking and real-time presence updates.

### Step-by-Step Execution

#### Step 1: Initial Online Status
```javascript
// Check initial status when both users are logged in
// WebSocket should emit user_online_status events
```

**Expected Result**:
- Both users show as online in each other's contact lists
- Database `User.isOnline` field set to true for both users
- `User.lastSeenAt` updated to current timestamp

#### Step 2: User Goes Offline
```javascript
// Bob closes browser tab or loses internet connection
// WebSocket disconnect event should trigger
```

**Expected Result**:
- Alice receives `user_online_status` event with `isOnline: false` for Bob
- Bob's status shows as "Last seen X minutes ago"
- Database updated: `User.isOnline = false`, `User.lastSeenAt` = disconnect time

#### Step 3: User Returns Online
```javascript
// Bob reopens browser and reconnects
// WebSocket connection established and authenticated
```

**Expected Result**:
- Alice receives `user_online_status` event with `isOnline: true` for Bob
- Bob's status shows as "Online" immediately
- Database updated: `User.isOnline = true`

---

## Scenario 3: Message History & Pagination

### Test Description
Validate message storage, retrieval, and pagination for long conversations.

### Step-by-Step Execution

#### Step 1: Generate Test Messages
```bash
# Script to create 60+ messages in a conversation
# This tests pagination (default 50 messages per load)
for i in {1..65}; do
  curl -X POST http://localhost:3000/api/chat/conversations/{conversationId}/messages \
    -H "Content-Type: application/json" \
    -H "Cookie: session-cookie" \
    -d "{\"content\": \"Test message number $i\"}"
done
```

**Expected Result**:
- All 65 messages stored in database
- Messages have sequential timestamps
- Each message has unique ID

#### Step 2: Load Chat History
```javascript
// GET /api/chat/conversations/{conversationId}/messages?limit=50
// Should return most recent 50 messages
```

**Expected Result**:
- API returns 50 most recent messages (16-65)
- Messages sorted by `createdAt` DESC
- Response includes `hasMore: true`
- Pagination cursor provided for loading older messages

#### Step 3: Load Older Messages
```javascript
// GET /api/chat/conversations/{conversationId}/messages?limit=20&before={oldestMessageId}
// Should return next 20 older messages
```

**Expected Result**:
- API returns messages 1-15 (oldest 15 messages)
- Response includes `hasMore: false` (no more older messages)
- Messages maintain chronological order in UI

---

## Scenario 4: Error Handling & Edge Cases

### Test Description
Validate error handling, rate limiting, and edge case behaviors.

### Step-by-Step Execution

#### Step 1: Rate Limiting Test
```javascript
// Send 15 messages rapidly (exceeds 10/minute limit)
for (let i = 0; i < 15; i++) {
  fetch('/api/chat/conversations/{conversationId}/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `Rapid message ${i}` })
  });
}
```

**Expected Result**:
- First 10 messages succeed (HTTP 201)
- Subsequent messages fail with HTTP 429 (Rate Limited)
- Error message: "Rate limit exceeded. Maximum 10 messages per minute."
- User can send again after waiting 1 minute

#### Step 2: Empty Message Validation
```javascript
// Attempt to send empty message
fetch('/api/chat/conversations/{conversationId}/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: '' })
});
```

**Expected Result**:
- Request fails with HTTP 400
- Error message indicates content is required
- No message stored in database

#### Step 3: Unauthorized Access Test
```javascript
// Attempt to access conversation without permission
fetch('/api/chat/conversations/{otherUserConversationId}/messages', {
  method: 'GET',
  // No valid session cookie or wrong user session
});
```

**Expected Result**:
- Request fails with HTTP 403 Forbidden
- Error message: "Access denied"
- No conversation data leaked

#### Step 4: Network Connectivity Loss
```javascript
// Simulate network disconnection during message sending
// Disable network in browser dev tools, attempt to send message
```

**Expected Result**:
- UI shows "Connection lost" indicator
- Message queued locally or shows "Failed to send"
- Automatic reconnection attempted
- Queued messages sent when connection restored

---

## Scenario 5: Multi-Conversation Management

### Test Description
Validate handling multiple simultaneous conversations and switching between them.

### Step-by-Step Execution

#### Step 1: Create Multiple Conversations
```javascript
// Alice creates conversations with Bob and Charlie
// POST /api/chat/conversations (recipientId: Bob)
// POST /api/chat/conversations (recipientId: Charlie)
```

**Expected Result**:
- Two separate conversations created
- Both appear in Alice's conversation list
- Each has unique conversation ID

#### Step 2: Switch Between Conversations
```javascript
// Alice joins Bob's conversation room
// WebSocket: join_conversation { conversationId: "bob-conv-id" }
// Send message to Bob, then switch to Charlie's conversation
// WebSocket: leave_conversation { conversationId: "bob-conv-id" }
// WebSocket: join_conversation { conversationId: "charlie-conv-id" }
```

**Expected Result**:
- Alice receives real-time updates only for active conversation
- Message history loads correctly when switching
- Unread message counts update properly
- No message cross-contamination between conversations

#### Step 3: Concurrent Message Reception
```javascript
// While Alice is in Bob's conversation:
// Charlie sends message to Alice
// Bob sends message to Alice
```

**Expected Result**:
- Alice sees Bob's message immediately (active conversation)
- Alice sees notification for Charlie's message (inactive conversation)
- Unread count increases for Charlie's conversation
- Both messages stored correctly in respective conversations

---

## Performance Validation

### Response Time Targets
- **Message sending**: < 200ms from click to database storage
- **Message delivery**: < 100ms from storage to recipient display
- **Chat history loading**: < 500ms for 50 messages
- **Conversation switching**: < 300ms including message loading

### Concurrent User Testing
```bash
# Use simple load testing tool to simulate multiple users
# Test with 10 concurrent users in different conversations
```

**Expected Results**:
- All users can send/receive messages simultaneously
- No message loss or duplication
- Response times remain within targets
- WebSocket connections stable

---

## Database Validation Queries

### Verify Data Integrity
```sql
-- Check message storage
SELECT id, content, "senderId", "conversationId", "createdAt", status 
FROM "Message" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check conversation participants
SELECT c.id as conversation_id, c.type, 
       u.name as participant_name, cp."joinedAt"
FROM "Conversation" c
JOIN "ConversationParticipant" cp ON c.id = cp."conversationId"
JOIN "User" u ON cp."userId" = u.id
ORDER BY c."createdAt" DESC;

-- Check user online status
SELECT id, name, email, "isOnline", "lastSeenAt", "chatStatus"
FROM "User"
WHERE "isOnline" = true;
```

### Verify Indexes Performance
```sql
-- Test query performance for message pagination
EXPLAIN ANALYZE 
SELECT * FROM "Message" 
WHERE "conversationId" = 'test-conversation-id'
ORDER BY "createdAt" DESC 
LIMIT 50;
```

**Expected Result**: Query should use index scan, execution time < 5ms

---

## Cleanup & Reset

### Test Data Cleanup
```sql
-- Clean up test data after quickstart
DELETE FROM "Message" WHERE "conversationId" IN (
  SELECT id FROM "Conversation" 
  WHERE id LIKE 'test-%'
);

DELETE FROM "ConversationParticipant" WHERE "conversationId" IN (
  SELECT id FROM "Conversation" 
  WHERE id LIKE 'test-%'
);

DELETE FROM "Conversation" WHERE id LIKE 'test-%';

-- Reset user online status
UPDATE "User" 
SET "isOnline" = false, "chatStatus" = 'AVAILABLE' 
WHERE email IN ('alice@example.com', 'bob@example.com');
```

---

## Success Criteria Summary

✅ **Core Chat Functionality**
- [x] Users can send and receive messages in real-time
- [x] Message history is preserved and paginated
- [x] Typing indicators work correctly
- [x] Online/offline status tracking functions

✅ **Technical Performance**
- [x] Response times meet targets (< 200ms message sending)
- [x] WebSocket connections are stable
- [x] Database queries are optimized
- [x] Rate limiting prevents abuse

✅ **Error Handling**
- [x] Invalid inputs are rejected with proper errors
- [x] Network issues are handled gracefully  
- [x] Unauthorized access is blocked
- [x] Rate limits are enforced

✅ **User Experience**
- [x] Interface is responsive and intuitive
- [x] Real-time updates work without page refresh
- [x] Multiple conversations can be managed
- [x] Message status indicators provide feedback

---

This quickstart provides comprehensive validation of the chat application's core functionality and serves as both testing documentation and implementation guidance.