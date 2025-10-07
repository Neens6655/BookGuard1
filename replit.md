# Book Evaluation & Whitelist Report Generator

## Overview

This is a full-stack web application that evaluates children's and family books for content appropriateness, cultural alignment, and age suitability. The system processes uploaded books (PDF, Word, TXT formats), analyzes them using OpenAI's GPT API, and generates comprehensive evaluation reports including domain-specific content assessments, age recommendations, and parent discussion guides. The application is designed for the UAE Ministry of Education context, evaluating content against Islamic, Arab, and UAE cultural ethics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: Shadcn/ui (New York style) with Radix UI primitives providing accessible, headless components. The design system uses CSS variables for theming with support for light/dark modes.

**Styling**: Tailwind CSS with custom color palette featuring:
- Primary: Green (`hsl(160, 84%, 39%)`) for main actions
- Secondary: Purple (`hsl(258, 90%, 66%)`) for accents
- Accent: Yellow (`hsl(43, 96%, 56%)`) for highlights
- Warm cream background (`hsl(54, 91%, 95%)`)

**State Management**: TanStack Query (React Query) for server state with custom query client configuration. Local UI state managed with React hooks.

**Routing**: Wouter for lightweight client-side routing

**Typography**: Inter for Latin text, Noto Sans Arabic for Arabic script support

**Key Design Decisions**:
- Single-page application with view state management (upload → processing → results)
- Real-time progress tracking via polling for long-running book evaluations
- File upload with drag-and-drop support limited to 50MB
- Multi-step progress indicators for user feedback during processing

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ESNext modules

**API Structure**: RESTful endpoints under `/api` prefix
- `POST /api/evaluate` - Upload file and initiate evaluation
- `GET /api/evaluate/:id` - Poll evaluation status and retrieve results
- `GET /api/evaluations` - List all evaluations

**File Processing Pipeline**:
1. Multer middleware for multipart file uploads (stored in `uploads/` directory)
2. Text extraction service (currently supports TXT, with placeholders for PDF/Word)
3. OpenAI API integration for content analysis
4. Asynchronous processing with progress updates

**Key Design Decisions**:
- Asynchronous file processing to prevent request timeouts
- Progress tracking system (0-100) with status states: processing, completed, failed
- File size limit of 50MB for uploaded documents
- Text truncation to 18,000 characters for API token management
- Request/response logging middleware for API endpoints
- Raw body preservation for potential webhook integrations

### Data Storage Solutions

**Current Implementation**: In-memory storage using a Map-based implementation (`MemStorage`)
- Evaluations stored with UUID primary keys
- Timestamps for creation and updates tracked automatically

**Database Schema** (Drizzle ORM defined, PostgreSQL ready):
```typescript
evaluations table:
  - id: UUID (primary key)
  - filename: text
  - fileSize: integer
  - status: enum (processing, completed, failed)
  - progress: integer (0-100)
  - result: jsonb (structured evaluation results)
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Key Design Decisions**:
- Storage interface (`IStorage`) allows swapping between in-memory and database implementations
- PostgreSQL schema defined via Drizzle ORM but not yet connected
- JSONB column for flexible evaluation result storage
- Zod schemas for runtime validation matching database schema

### Authentication and Authorization

**Current State**: No authentication implemented

**Architectural Consideration**: Session management infrastructure present (connect-pg-simple for PostgreSQL sessions) but not activated

### External Dependencies

**OpenAI API**:
- Model: GPT-5 (explicitly configured as newest model)
- Purpose: Book content analysis and evaluation
- Input: Extracted book text (max 18,000 characters)
- Output: Structured JSON evaluation with domains, age verdicts, recommendations
- API key required via `OPENAI_API_KEY` environment variable

**Neon Database** (Configured but not active):
- Serverless PostgreSQL provider (`@neondatabase/serverless`)
- Connection via `DATABASE_URL` environment variable
- Drizzle migrations stored in `./migrations` directory

**File Processing Libraries** (Planned):
- PDF parsing: Not yet implemented (placeholder in code)
- Word document parsing: Not yet implemented (placeholder in code)
- Current: TXT file reading via Node.js fs module

**Development Tools**:
- Vite plugins for Replit integration (cartographer, dev banner, runtime error overlay)
- TypeScript for type safety across shared schemas
- Drizzle Kit for database migrations and schema management

**UI Component Libraries**:
- Radix UI: 20+ component primitives (dialogs, dropdowns, tooltips, etc.)
- React Hook Form with Zod resolvers for form validation
- date-fns for date formatting
- cmdk for command palette interfaces
- class-variance-authority for component variant management

**Key Architectural Decisions**:
- Monorepo structure with shared types between client/server via `@shared` alias
- Environment-based configuration for development vs production
- Separation of concerns: file processing, AI evaluation, and storage as distinct services
- Type-safe schema validation using Zod with Drizzle integration
- Build process: Vite for frontend, esbuild for backend bundling