# Implementation Plan: Real-time Chat Application

**Branch**: `001-create-me-an` | **Date**: September 11, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/trantuan126/Desktop/fast-focus-pomodoro/specs/001-create-me-an/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Primary requirement: Real-time chat application within existing Fast Focus Pomodoro webapp, enabling authenticated users to send and receive messages instantly without page refresh.

Technical approach: Integration with existing Next.js + Prisma + NextAuth stack, adding WebSocket support for real-time messaging and extending current user authentication system.

## Technical Context
**Language/Version**: TypeScript 5 + Node.js (Next.js 15.5.2)  
**Primary Dependencies**: Next.js, React 19, Prisma ORM, NextAuth, Socket.io (for WebSocket), Tailwind CSS  
**Storage**: PostgreSQL with Prisma ORM (existing schema to be extended)  
**Testing**: Jest + React Testing Library + Playwright E2E (to be added)  
**Target Platform**: Web browsers (modern ES2020+ support)
**Project Type**: web - Next.js full-stack application (frontend + API routes)  
**Performance Goals**: <200ms message delivery, support 100 concurrent chat sessions, 60fps UI animations  
**Constraints**: <1s initial chat load, real-time updates without polling, mobile-responsive design  
**Scale/Scope**: 50-100 concurrent users, message retention for 30 days, 1-on-1 and group chat support

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js full-stack app with integrated frontend/backend)
- Using framework directly? YES (Next.js API routes, React components, Prisma ORM)
- Single data model? YES (Prisma schema extensions for chat entities)
- Avoiding patterns? YES (Direct database access via Prisma, no additional abstraction layers)

**Architecture**:
- EVERY feature as library? N/A (Web app integration, not standalone libraries)
- Libraries listed: N/A (Feature integrated into existing Next.js app)
- CLI per library: N/A (Web application feature)
- Library docs: N/A (Web application feature)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES (Tests written first, must fail before implementation)
- Git commits show tests before implementation? YES (Will commit failing tests first)
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (PostgreSQL via Prisma, actual WebSocket connections)
- Integration tests for: YES (API contract changes, WebSocket integration, schema extensions)
- FORBIDDEN: Implementation before test, skipping RED phase? ACKNOWLEDGED

**Observability**:
- Structured logging included? YES (Console logs structured, error boundaries implemented)
- Frontend logs → backend? YES (Client errors sent to API endpoints)
- Error context sufficient? YES (User ID, timestamp, action context in all logs)

**Versioning**:
- Version number assigned? YES (0.2.0 - MINOR increment for new chat feature)
- BUILD increments on every change? YES (Will update package.json on each meaningful change)
- Breaking changes handled? YES (Database migrations planned, backward compatibility maintained)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 1 (Single project) - Next.js integrates frontend/backend, using existing src/ structure with API routes

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data-model.md, quickstart.md)
- Database schema extensions → Prisma migration tasks [P]
- REST API contracts → contract test + implementation tasks
- WebSocket events → Socket.io setup + event handler tasks  
- UI components from quickstart scenarios → React component tasks
- Integration tests from quickstart.md scenarios

**Specific Task Categories**:
1. **Database Tasks** [P - Parallel]:
   - Create Prisma migration for User model extensions
   - Create Conversation, ConversationParticipant, Message models
   - Add database indexes for performance
   - Create database seed data for testing

2. **Contract Test Tasks** (Must fail initially):
   - API endpoint contract tests (8 endpoints from chat-api.yaml)
   - WebSocket event contract tests (6 client events, 8 server events)
   - Authentication/authorization tests for all endpoints

3. **Backend Implementation Tasks**:
   - Socket.io server setup with Next.js integration
   - Chat API routes implementation (/api/chat/*)
   - WebSocket event handlers for real-time functionality
   - Rate limiting middleware
   - Message sanitization utilities

4. **Frontend Implementation Tasks**:
   - Chat UI components (ConversationList, MessageInput, MessageBubble)
   - WebSocket client integration
   - Real-time state management
   - Chat page routing and navigation

5. **Integration Test Tasks** (from quickstart.md):
   - Scenario 1: Basic chat flow end-to-end test
   - Scenario 2: Online status and presence test
   - Scenario 3: Message history and pagination test
   - Scenario 4: Error handling and edge cases test
   - Scenario 5: Multi-conversation management test

**Ordering Strategy**:
- **Phase A**: Database schema + Contract tests (parallel execution)
- **Phase B**: Backend API implementation (depends on Phase A)
- **Phase C**: Frontend components (parallel with Phase B)
- **Phase D**: Integration tests (depends on Phase B + C)
- **Phase E**: Performance validation + cleanup

**Dependency Management**:
- Database migrations must complete before API implementation
- Contract tests must exist and fail before implementation begins
- WebSocket server setup required before client integration
- Authentication extension needed before chat API routes

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md
- 8 Database/migration tasks [P]
- 12 Contract test tasks [P]
- 10 Backend implementation tasks
- 8 Frontend implementation tasks [P]
- 5 Integration test tasks
- 2 Performance/validation tasks

**Task Template Format**:
```
## Task X: [Task Name] [P]
**Type**: [Database|Contract|Backend|Frontend|Integration|Validation]
**Dependencies**: [List of prerequisite task numbers]
**Estimated Time**: [1-4 hours]
**Success Criteria**: [Specific completion conditions]
**Files Modified**: [List of files to be created/modified]
```

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS  
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no deviations)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*