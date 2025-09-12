# Data Model: Real-time Chat Application

**Date**: September 11, 2025  
**Phase**: 1 - Design & Contracts  
**Purpose**: Define data entities, relationships, and validation rules

---

## Entity Definitions

### 1. User (Extended)
**Purpose**: Extend existing User entity with chat-specific fields  
**Database Table**: `User` (extend existing)

#### Current Fields (from existing schema)
- `id`: String (Primary Key)
- `email`: String (Unique)
- `name`: String (Optional)
- `image`: String (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

#### New Fields for Chat
- `isOnline`: Boolean (Default: false)
- `lastSeenAt`: DateTime (Optional)
- `chatStatus`: Enum('AVAILABLE', 'BUSY', 'AWAY') (Default: 'AVAILABLE')

#### Validation Rules
- `chatStatus` must be one of defined enum values
- `lastSeenAt` automatically updated on user activity
- `isOnline` set to true when WebSocket connects, false on disconnect

---

### 2. Conversation
**Purpose**: Represents a communication thread between users  
**Database Table**: `Conversation`

#### Fields
- `id`: String (Primary Key, UUID)
- `type`: Enum('DIRECT', 'GROUP') (Default: 'DIRECT')
- `name`: String (Optional - for group chats)
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-updated)
- `lastMessageAt`: DateTime (Optional)

#### Relationships
- `participants` → Many-to-Many with User through ConversationParticipant
- `messages` → One-to-Many with Message

#### Validation Rules
- `type` must be 'DIRECT' or 'GROUP'
- Direct conversations must have exactly 2 participants
- Group conversations must have 2+ participants (future feature)
- `name` required only when `type` is 'GROUP'
- `lastMessageAt` updated whenever a new message is added

---

### 3. ConversationParticipant
**Purpose**: Junction table for many-to-many User-Conversation relationship  
**Database Table**: `ConversationParticipant`

#### Fields
- `id`: String (Primary Key, UUID)
- `userId`: String (Foreign Key → User.id)
- `conversationId`: String (Foreign Key → Conversation.id)
- `joinedAt`: DateTime (Auto-generated)
- `lastReadAt`: DateTime (Optional)
- `isActive`: Boolean (Default: true)

#### Relationships
- `user` → Many-to-One with User
- `conversation` → Many-to-One with Conversation

#### Validation Rules
- Unique constraint on (userId, conversationId)
- `lastReadAt` used for unread message counting
- `isActive` = false when user leaves conversation (soft delete)
- `joinedAt` cannot be modified after creation

---

### 4. Message
**Purpose**: Individual chat messages within conversations  
**Database Table**: `Message`

#### Fields
- `id`: String (Primary Key, UUID)
- `content`: Text (Max 5000 characters)
- `conversationId`: String (Foreign Key → Conversation.id)
- `senderId`: String (Foreign Key → User.id)
- `type`: Enum('TEXT', 'SYSTEM') (Default: 'TEXT')
- `status`: Enum('SENT', 'DELIVERED', 'READ') (Default: 'SENT')
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-updated)
- `editedAt`: DateTime (Optional)
- `isDeleted`: Boolean (Default: false)

#### Relationships
- `conversation` → Many-to-One with Conversation
- `sender` → Many-to-One with User

#### Validation Rules
- `content` cannot be empty for TEXT messages
- `content` max length 5000 characters
- `type` must be 'TEXT' or 'SYSTEM'
- `status` must be 'SENT', 'DELIVERED', or 'READ'
- System messages have no sender (senderId = null)
- Deleted messages retain content for audit (soft delete)
- `editedAt` set when message content is modified

---

### 5. TypingIndicator (Temporary State)
**Purpose**: Track users currently typing in conversations  
**Storage**: In-memory (Redis-like structure or application state)

#### Fields
- `userId`: String
- `conversationId`: String
- `startedAt`: DateTime
- `expiresAt`: DateTime (startedAt + 30 seconds)

#### Validation Rules
- Auto-expire after 30 seconds of inactivity
- One indicator per user per conversation
- Removed when user sends message or stops typing

---

## Database Schema (Prisma)

```prisma
model User {
  id          String @id @default(cuid())
  email       String @unique
  name        String?
  image       String?
  
  // Chat-specific fields
  isOnline    Boolean @default(false)
  lastSeenAt  DateTime?
  chatStatus  ChatStatus @default(AVAILABLE)
  
  // Existing timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  participations ConversationParticipant[]
  sentMessages   Message[] @relation("MessageSender")
}

enum ChatStatus {
  AVAILABLE
  BUSY
  AWAY
}

model Conversation {
  id            String @id @default(cuid())
  type          ConversationType @default(DIRECT)
  name          String?
  lastMessageAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  participants  ConversationParticipant[]
  messages      Message[]
}

enum ConversationType {
  DIRECT
  GROUP
}

model ConversationParticipant {
  id             String @id @default(cuid())
  userId         String
  conversationId String
  joinedAt       DateTime @default(now())
  lastReadAt     DateTime?
  isActive       Boolean @default(true)
  
  // Relations
  user         User @relation(fields: [userId], references: [id])
  conversation Conversation @relation(fields: [conversationId], references: [id])
  
  @@unique([userId, conversationId])
}

model Message {
  id             String @id @default(cuid())
  content        String
  conversationId String
  senderId       String?
  type           MessageType @default(TEXT)
  status         MessageStatus @default(SENT)
  isDeleted      Boolean @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  editedAt       DateTime?
  
  // Relations
  conversation Conversation @relation(fields: [conversationId], references: [id])
  sender       User? @relation("MessageSender", fields: [senderId], references: [id])
}

enum MessageType {
  TEXT
  SYSTEM
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
}
```

---

## State Transitions

### Message Status Flow
1. **SENT** → Created and stored in database
2. **DELIVERED** → WebSocket confirms delivery to recipient client
3. **READ** → Recipient reads message (views conversation)

### User Online Status Flow
1. **Offline** → WebSocket disconnected, isOnline = false
2. **Online** → WebSocket connected, isOnline = true, lastSeenAt updated
3. **Away** → No activity for 5+ minutes, chatStatus = AWAY
4. **Back** → Activity detected, chatStatus = AVAILABLE

### Conversation Lifecycle
1. **Created** → When first message sent between users
2. **Active** → Messages being exchanged
3. **Inactive** → No messages for 30+ days (but preserved)
4. **Archived** → User manually archives (hidden from main list)

---

## Indexing Strategy

### Primary Indexes (for queries)
- `Message.conversationId` + `Message.createdAt` (message history pagination)
- `Message.senderId` (user's message history)
- `ConversationParticipant.userId` (user's conversations)
- `User.email` (existing, for authentication)
- `User.isOnline` (online user lists)

### Composite Indexes
- `(conversationId, createdAt DESC)` on Message (chat history)
- `(userId, isActive)` on ConversationParticipant (active conversations)

---

## Data Relationships Diagram

```
User (1) ←→ (N) ConversationParticipant (N) ←→ (1) Conversation
  ↑                                                      ↓
  └──────── (1) ←→ (N) Message (N) ←→ (1) ─────────────┘
```

### Relationship Rules
- One User can participate in many Conversations
- One Conversation can have many Users (via ConversationParticipant)
- One User can send many Messages
- One Conversation can contain many Messages
- Direct Conversations have exactly 2 participants
- Group Conversations have 2+ participants (future)

---

## Data Validation Summary

### Server-Side Validation
- Message content sanitization (XSS prevention)
- Message length limits (5000 characters)
- User authorization for conversation access
- Rate limiting (10 messages/minute per user)

### Client-Side Validation
- Real-time character count display
- Empty message prevention
- Connection status checks before sending

### Database Constraints
- Foreign key integrity
- Unique constraints on participant relationships
- Non-null constraints on required fields
- Enum value validation

---

## Migration Strategy

### Phase 1: Core Tables
1. Extend User table with chat fields
2. Create Conversation table
3. Create ConversationParticipant table
4. Create Message table with basic fields

### Phase 2: Enhancements (Future)
1. Add message reactions table
2. Add file attachment support
3. Add message threading/replies
4. Add conversation settings table

### Data Migration Notes
- Existing users get default chat status values
- No breaking changes to existing User functionality
- All new tables start empty (no data migration needed)
- Database indexes added for performance

---

This data model provides a solid foundation for the chat application while maintaining compatibility with the existing system and allowing for future enhancements.