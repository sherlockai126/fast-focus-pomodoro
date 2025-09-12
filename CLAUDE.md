# Fast Focus Pomodoro - Claude Code Context

**Project**: Fast Focus Pomodoro Task Manager with Real-time Chat  
**Last Updated**: September 11, 2025  
**Version**: 0.2.0  

---

## Project Overview

A Next.js full-stack web application combining Pomodoro timer functionality with task management and real-time chat capabilities. Built with TypeScript, React 19, Prisma ORM, and NextAuth.js.

### Current Architecture
- **Frontend**: Next.js 15.5.2 + React 19 + Tailwind CSS 4
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL with Prisma migrations
- **Authentication**: NextAuth.js with session management
- **Real-time**: Socket.io for WebSocket connections (new feature)

---

## Recent Changes

### ✅ September 11, 2025 - Chat Application Design Phase
- **Feature**: Real-time chat application integration
- **Branch**: `001-create-me-an`
- **Status**: Phase 1 Design Complete
- **Artifacts Created**:
  - `/specs/001-create-me-an/research.md` - All NEEDS CLARIFICATION resolved
  - `/specs/001-create-me-an/data-model.md` - Database schema extensions
  - `/specs/001-create-me-an/contracts/chat-api.yaml` - REST API specifications
  - `/specs/001-create-me-an/contracts/websocket-events.yaml` - WebSocket event contracts
  - `/specs/001-create-me-an/quickstart.md` - Executable test scenarios

### 🔧 Technical Decisions Made
- **Authentication**: Extend existing NextAuth.js system (no new auth layer)
- **Real-time**: Socket.io for WebSocket implementation with fallback support
- **Persistence**: 30-day message retention in PostgreSQL
- **Scope**: Phase 1 = One-on-one chat only (group chat future enhancement)
- **Message Format**: Plain text + emoji + auto-linked URLs (rich media future enhancement)

---

## Database Schema Extensions (Pending Implementation)

### New Tables for Chat Feature
```prisma
// Extend existing User model
model User {
  // ... existing fields ...
  
  // New chat-specific fields
  isOnline    Boolean @default(false)
  lastSeenAt  DateTime?
  chatStatus  ChatStatus @default(AVAILABLE)
  
  // Relations
  participations ConversationParticipant[]
  sentMessages   Message[] @relation("MessageSender")
}

// New models for chat
model Conversation {
  id            String @id @default(cuid())
  type          ConversationType @default(DIRECT)
  name          String?
  lastMessageAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  participants  ConversationParticipant[]
  messages      Message[]
}

model ConversationParticipant {
  id             String @id @default(cuid())
  userId         String
  conversationId String
  joinedAt       DateTime @default(now())
  lastReadAt     DateTime?
  isActive       Boolean @default(true)
  
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
  
  conversation Conversation @relation(fields: [conversationId], references: [id])
  sender       User? @relation("MessageSender", fields: [senderId], references: [id])
}
```

---

## API Endpoints (To Be Implemented)

### REST API Routes
- `GET /api/chat/conversations` - Get user's conversations
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations/[id]/messages` - Get conversation messages
- `POST /api/chat/conversations/[id]/messages` - Send message
- `PATCH /api/chat/messages/[id]` - Edit/delete message
- `GET /api/chat/users/search` - Search users for new conversations
- `GET /api/chat/users/online` - Get online users list

### WebSocket Events (Socket.io)
- **Client → Server**: `join_conversation`, `typing_start`, `typing_stop`, `message_read`
- **Server → Client**: `message_received`, `typing_indicator`, `user_online_status`, `message_status_changed`

---

## File Structure

### Source Code Organization
```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Existing NextAuth routes
│   │   ├── tasks/          # Existing task management
│   │   ├── settings/       # Existing user settings
│   │   └── chat/           # NEW: Chat API routes (to be created)
│   ├── (dashboard)/        # Existing dashboard pages
│   └── chat/               # NEW: Chat UI pages (to be created)
├── components/
│   ├── Dashboard.tsx       # Existing - modified
│   ├── PomodoroTimer.tsx   # Existing
│   ├── TaskList.tsx        # Existing - modified  
│   └── chat/               # NEW: Chat components (to be created)
├── lib/
│   ├── auth.ts            # Existing NextAuth config
│   ├── db.ts              # Existing Prisma client
│   └── socket.ts          # NEW: Socket.io client setup
└── types/
    └── chat.ts            # NEW: Chat type definitions
```

### Specifications & Documentation
```
specs/001-create-me-an/
├── spec.md              # Original feature specification
├── plan.md              # Implementation plan (this execution)
├── research.md          # NEEDS CLARIFICATION resolutions
├── data-model.md        # Database schema design
├── quickstart.md        # Test scenarios
└── contracts/
    ├── chat-api.yaml    # REST API OpenAPI spec
    └── websocket-events.yaml # WebSocket event definitions
```

---

## Dependencies

### Current Production Dependencies
```json
{
  "next": "15.5.2",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "@prisma/client": "^6.15.0",
  "next-auth": "^4.24.11",
  "@next-auth/prisma-adapter": "^1.0.7",
  "tailwindcss": "^4",
  "lucide-react": "^0.542.0",
  "date-fns": "^4.1.0",
  "clsx": "^2.1.1"
}
```

### New Dependencies Needed for Chat
```json
{
  "socket.io": "^4.7.2",
  "socket.io-client": "^4.7.2",
  "dompurify": "^3.0.5",
  "@types/dompurify": "^3.0.2"
}
```

---

## Environment Configuration

### Current Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL for NextAuth
- `NEXTAUTH_SECRET`: JWT signing secret
- Additional auth provider secrets (GitHub, Google, etc.)

### New Environment Variables Needed
- `SOCKET_IO_SECRET`: Secret for Socket.io authentication
- `CHAT_RATE_LIMIT_WINDOW`: Rate limiting window (default: 60 seconds)
- `CHAT_RATE_LIMIT_MAX`: Max messages per window (default: 10)

---

## Testing Strategy

### Current Testing Setup
- **Framework**: To be implemented (Jest + React Testing Library + Playwright)
- **Database**: Separate test database required
- **Authentication**: Mock NextAuth for unit tests, real auth for integration

### Test Coverage Requirements
1. **Contract Tests**: API endpoint schemas, WebSocket message formats
2. **Integration Tests**: Database operations, real-time message flow, authentication
3. **E2E Tests**: Complete user chat scenarios using Playwright
4. **Unit Tests**: Individual components, utilities, business logic

---

## Performance Requirements

### Response Time Targets
- Message sending: < 200ms (click to database storage)
- Message delivery: < 100ms (database to recipient display)
- Chat history loading: < 500ms (50 messages)
- Conversation switching: < 300ms

### Scalability Targets
- 50-100 concurrent users
- 100+ concurrent WebSocket connections per Node.js process
- Support for message pagination (50 messages per load)
- 30-day message retention with automatic cleanup

---

## Security Considerations

### Authentication & Authorization
- Extend existing NextAuth.js session management
- WebSocket authentication via session tokens
- User authorization for conversation access
- Rate limiting: 10 messages per minute per user

### Data Protection
- XSS prevention via DOMPurify content sanitization
- HTTPS/WSS for all communications
- Message encryption at rest (PostgreSQL built-in)
- Input validation on all API endpoints

---

## Development Workflow

### Constitutional Compliance
- **TDD Mandatory**: Tests written and failing before implementation
- **Simplicity**: Direct framework usage (Next.js + Prisma), no unnecessary abstractions
- **Integration Testing**: Real database connections, actual WebSocket testing
- **Observability**: Structured logging, error boundaries, frontend-to-backend error streaming

### Git Workflow
- Feature branch: `001-create-me-an`
- Commit order: Failing tests → Implementation → Passing tests
- Database migrations committed separately from application code
- Version bump: 0.1.0 → 0.2.0 (MINOR increment for new chat feature)

---

## Implementation Status

### ✅ Completed (Phase 0-1)
- [x] Feature specification with all ambiguities resolved
- [x] Technical research and decision documentation
- [x] Data model design with Prisma schema
- [x] API contract specifications (REST + WebSocket)
- [x] Comprehensive test scenarios in quickstart.md
- [x] Constitutional compliance verification

### 🔄 Next Steps (Phase 2 - Tasks)
- [ ] Generate ordered task list from design artifacts
- [ ] Create contract tests (must fail initially)
- [ ] Database migration files
- [ ] Socket.io server setup
- [ ] API route implementations
- [ ] React components for chat UI

### 📋 Future Enhancements (Post-MVP)
- Group chat functionality
- Rich text message formatting
- File and image sharing
- Message search functionality
- Push notifications
- Message reactions/emojis
- Voice/video call integration

---

## Troubleshooting Notes

### Common Development Issues
1. **WebSocket Connection**: Ensure Socket.io server starts with Next.js dev server
2. **Database Migrations**: Run `npx prisma migrate dev` after schema changes
3. **Authentication**: WebSocket authentication requires careful session token handling
4. **Real-time Testing**: Use multiple browser windows/incognito for multi-user testing

### Performance Monitoring
- Monitor WebSocket connection counts
- Track message delivery latency
- Database query performance for message pagination
- Memory usage with concurrent connections

---

**Note**: This document is automatically updated as the project evolves. Always reference this file for current architecture decisions and implementation status.