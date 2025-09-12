# Tasks: Real-time Chat Application

**Input**: Design documents from `/Users/trantuan126/Desktop/fast-focus-pomodoro/specs/001-create-me-an/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✓ Found: Next.js + TypeScript + Prisma + Socket.io stack
   → ✓ Extract: web project structure, existing auth
2. Load optional design documents:
   → data-model.md: 4 entities → model tasks
   → contracts/: 8 REST endpoints + 14 WebSocket events → contract test tasks
   → research.md: Socket.io + Prisma decisions → setup tasks
3. Generate tasks by category:
   → Setup: Socket.io server, Prisma migrations, dependencies
   → Tests: contract tests for 8 endpoints + WebSocket tests
   → Core: 4 data models, API routes, WebSocket handlers
   → Integration: Socket.io middleware, authentication
   → Polish: unit tests, performance validation
4. Apply task rules:
   → Different files = marked [P] for parallel
   → Same files = sequential (no [P])
   → Tests before implementation (TDD enforced)
5. Number tasks sequentially (T001-T042)
6. Generate dependency graph - tests → models → services → endpoints
7. ✓ Parallel execution examples provided
8. Validate task completeness:
   → ✓ All 8 contracts have tests
   → ✓ All 4 entities have models
   → ✓ All endpoints implemented
9. Return: SUCCESS (42 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
Web app structure (from plan.md):
- **API Routes**: `src/app/api/chat/`
- **Components**: `src/components/chat/`
- **Services**: `src/lib/chat/`
- **Database**: `prisma/schema.prisma`
- **Tests**: `tests/`

## Phase 3.1: Setup

- [ ] T001 Install Socket.io dependencies: `npm install socket.io socket.io-client @types/socket.io`
- [ ] T002 [P] Configure TypeScript for Socket.io in `tsconfig.json`
- [ ] T003 [P] Update ESLint config for WebSocket patterns in `.eslintrc.json`
- [ ] T004 Create Prisma migrations for chat schema in `prisma/migrations/`
- [ ] T005 [P] Set up test database configuration in `tests/setup.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests for REST Endpoints
- [ ] T006 [P] Contract test GET /api/chat/conversations in `tests/contract/conversations-get.test.ts`
- [ ] T007 [P] Contract test POST /api/chat/conversations in `tests/contract/conversations-post.test.ts`
- [ ] T008 [P] Contract test GET /api/chat/conversations/{id} in `tests/contract/conversation-get.test.ts`
- [ ] T009 [P] Contract test GET /api/chat/conversations/{id}/messages in `tests/contract/messages-get.test.ts`
- [ ] T010 [P] Contract test POST /api/chat/conversations/{id}/typing in `tests/contract/typing-post.test.ts`
- [ ] T011 [P] Contract test PATCH /api/chat/messages/{id} in `tests/contract/message-patch.test.ts`
- [ ] T012 [P] Contract test POST /api/chat/messages/{id}/read in `tests/contract/message-read.test.ts`
- [ ] T013 [P] Contract test GET /api/chat/users/search in `tests/contract/users-search.test.ts`
- [ ] T014 [P] Contract test GET /api/chat/users/online in `tests/contract/users-online.test.ts`

### WebSocket Event Tests
- [ ] T015 [P] WebSocket connection test in `tests/websocket/connection.test.ts`
- [ ] T016 [P] WebSocket join_conversation event test in `tests/websocket/join-conversation.test.ts`
- [ ] T017 [P] WebSocket send_message event test in `tests/websocket/send-message.test.ts`
- [ ] T018 [P] WebSocket typing_start/stop event tests in `tests/websocket/typing-events.test.ts`
- [ ] T019 [P] WebSocket presence event tests in `tests/websocket/presence-events.test.ts`

### Integration Tests (from quickstart.md scenarios)
- [ ] T020 [P] Integration test: Basic chat flow in `tests/integration/basic-chat.test.ts`
- [ ] T021 [P] Integration test: Multiple users conversation in `tests/integration/multi-user-chat.test.ts`
- [ ] T022 [P] Integration test: Real-time message delivery in `tests/integration/realtime-delivery.test.ts`
- [ ] T023 [P] Integration test: Message persistence and history in `tests/integration/message-persistence.test.ts`
- [ ] T024 [P] Integration test: User presence and typing indicators in `tests/integration/presence-typing.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models & Schema
- [ ] T025 [P] Extend User model with chat fields in `prisma/schema.prisma`
- [ ] T026 [P] Create Conversation model in `prisma/schema.prisma`
- [ ] T027 [P] Create Message model in `prisma/schema.prisma`
- [ ] T028 [P] Create ConversationParticipant junction model in `prisma/schema.prisma`
- [ ] T029 Run Prisma migration: `npx prisma migrate dev --name add-chat-models`

### Socket.io Server Setup
- [ ] T030 Create Socket.io server configuration in `src/lib/chat/socket-server.ts`
- [ ] T031 Create WebSocket authentication middleware in `src/lib/chat/socket-auth.ts`
- [ ] T032 Create WebSocket event handlers in `src/lib/chat/socket-handlers.ts`

### API Route Implementations
- [ ] T033 Implement GET /api/chat/conversations in `src/app/api/chat/conversations/route.ts`
- [ ] T034 Implement POST /api/chat/conversations in `src/app/api/chat/conversations/route.ts`
- [ ] T035 Implement GET /api/chat/conversations/[id]/route.ts
- [ ] T036 Implement GET /api/chat/conversations/[id]/messages/route.ts  
- [ ] T037 Implement POST /api/chat/conversations/[id]/typing/route.ts
- [ ] T038 Implement PATCH /api/chat/messages/[id]/route.ts
- [ ] T039 Implement POST /api/chat/messages/[id]/read/route.ts
- [ ] T040 Implement GET /api/chat/users/search/route.ts
- [ ] T041 Implement GET /api/chat/users/online/route.ts

### Service Layer
- [ ] T042 [P] Create ConversationService in `src/lib/chat/conversation-service.ts`
- [ ] T043 [P] Create MessageService in `src/lib/chat/message-service.ts`
- [ ] T044 [P] Create UserPresenceService in `src/lib/chat/user-presence-service.ts`

## Phase 3.4: Integration

### Frontend Components
- [ ] T045 [P] Create ChatProvider context in `src/components/chat/ChatProvider.tsx`
- [ ] T046 [P] Create ConversationList component in `src/components/chat/ConversationList.tsx`
- [ ] T047 [P] Create MessageList component in `src/components/chat/MessageList.tsx`
- [ ] T048 [P] Create MessageInput component in `src/components/chat/MessageInput.tsx`
- [ ] T049 [P] Create TypingIndicator component in `src/components/chat/TypingIndicator.tsx`
- [ ] T050 Create main ChatInterface component in `src/components/chat/ChatInterface.tsx`

### WebSocket Client Integration
- [ ] T051 Create Socket.io client hook in `src/hooks/useSocket.ts`
- [ ] T052 Create useChat hook for message management in `src/hooks/useChat.ts`
- [ ] T053 Create usePresence hook for online status in `src/hooks/usePresence.ts`

### Next.js Integration
- [ ] T054 Integrate Socket.io server with Next.js in `src/app/api/socket/route.ts`
- [ ] T055 Add chat routes to main navigation in `src/components/Dashboard.tsx`
- [ ] T056 Create chat page in `src/app/chat/page.tsx`

## Phase 3.5: Polish

- [ ] T057 [P] Unit tests for ConversationService in `tests/unit/conversation-service.test.ts`
- [ ] T058 [P] Unit tests for MessageService in `tests/unit/message-service.test.ts`
- [ ] T059 [P] Unit tests for UserPresenceService in `tests/unit/user-presence-service.test.ts`
- [ ] T060 [P] Unit tests for React components in `tests/unit/chat-components.test.ts`
- [ ] T061 Performance test: Message delivery <200ms in `tests/performance/message-delivery.test.ts`
- [ ] T062 Performance test: 100 concurrent users in `tests/performance/concurrent-users.test.ts`
- [ ] T063 [P] Update documentation in `README.md`
- [ ] T064 Execute quickstart.md validation scenarios
- [ ] T065 Clean up unused code and optimize bundle size

## Dependencies

### Sequential Dependencies
- **Setup Phase**: T001 → T004 → T029 (migrations must run after schema)
- **Models**: T025-T028 → T029 → T042-T044 (services depend on models)
- **API Routes**: T042-T044 → T033-T041 (routes depend on services)
- **Socket.io**: T030 → T031 → T032 → T054 (server setup sequence)
- **Frontend**: T045 → T050 → T051-T053 → T055-T056 (context → components → hooks → integration)

### Test Dependencies  
- All T006-T024 (tests) MUST complete and FAIL before T025+ (implementation)
- T057-T062 (unit/performance tests) come after implementation

## Parallel Execution Examples

### Phase 3.2: Contract Tests (Launch Together)
```bash
# All contract tests can run in parallel - different files
Task: "Contract test GET /api/chat/conversations in tests/contract/conversations-get.test.ts"
Task: "Contract test POST /api/chat/conversations in tests/contract/conversations-post.test.ts"
Task: "Contract test GET /api/chat/conversations/{id} in tests/contract/conversation-get.test.ts"
Task: "Contract test GET /api/chat/conversations/{id}/messages in tests/contract/messages-get.test.ts"
```

### Phase 3.3: Database Models (Launch Together)
```bash
# All models can be created in parallel - same file but independent sections
Task: "Extend User model with chat fields in prisma/schema.prisma"
Task: "Create Conversation model in prisma/schema.prisma" 
Task: "Create Message model in prisma/schema.prisma"
Task: "Create ConversationParticipant junction model in prisma/schema.prisma"
```

### Phase 3.4: Frontend Components (Launch Together)
```bash
# Independent components can be built in parallel
Task: "Create ConversationList component in src/components/chat/ConversationList.tsx"
Task: "Create MessageList component in src/components/chat/MessageList.tsx"
Task: "Create MessageInput component in src/components/chat/MessageInput.tsx"
Task: "Create TypingIndicator component in src/components/chat/TypingIndicator.tsx"
```

### Phase 3.5: Unit Tests (Launch Together)
```bash
# All unit tests can run in parallel - different files
Task: "Unit tests for ConversationService in tests/unit/conversation-service.test.ts"
Task: "Unit tests for MessageService in tests/unit/message-service.test.ts"
Task: "Unit tests for UserPresenceService in tests/unit/user-presence-service.test.ts"
Task: "Unit tests for React components in tests/unit/chat-components.test.ts"
```

## Notes
- **[P] tasks** = different files, no dependencies - safe for parallel execution
- **Sequential tasks** = shared files or dependency chains - must run in order  
- **TDD Critical**: All tests T006-T024 must be written and failing before implementation T025+
- **File paths**: All paths are absolute within the Next.js project structure
- **Commit strategy**: Commit after each completed task for rollback safety
- **Validation**: Run `npm run build` and `npm run test` after each phase

## Task Generation Rules Applied

✅ **From Contracts**: 8 REST endpoints → 9 contract tests, 14 WebSocket events → 5 event tests  
✅ **From Data Model**: 4 entities → 4 model tasks + 3 service tasks  
✅ **From User Stories**: 5 quickstart scenarios → 5 integration tests  
✅ **Ordering**: Setup → Tests → Models → Services → Endpoints → Frontend → Polish  
✅ **Dependencies**: Tests before implementation, models before services, services before endpoints

## Validation Checklist
*GATE: Checked before task execution*

- [✅] All contracts have corresponding tests (T006-T014 cover 8 REST endpoints)
- [✅] All entities have model tasks (T025-T028 cover 4 entities)  
- [✅] All tests come before implementation (T006-T024 before T025+)
- [✅] Parallel tasks truly independent ([P] tasks use different files)
- [✅] Each task specifies exact file path  
- [✅] No [P] task modifies same file as another [P] task
- [✅] WebSocket functionality fully covered (server setup, client integration, event handling)
- [✅] Integration with existing Next.js + Prisma + NextAuth stack maintained
- [✅] Performance requirements addressed (T061-T062)
- [✅] All quickstart scenarios have corresponding integration tests

**Task Count**: 65 tasks total
**Estimated Duration**: 2-3 weeks for full implementation with testing
**Critical Path**: Setup → Contract Tests → Models → Services → API Routes → Frontend Integration