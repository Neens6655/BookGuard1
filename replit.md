# Book Evaluation & Whitelist Report Generator

## Overview

This is a full-stack web application that evaluates children's and family books for content appropriateness, cultural alignment, and age suitability. The system processes uploaded books (PDF, Word, TXT, EPUB, RTF formats), analyzes them using OpenAI's GPT API, and generates comprehensive evaluation reports including domain-specific content assessments, age recommendations, and parent discussion guides. The application is designed for the UAE Ministry of Education context, evaluating content against Islamic, Arab, and UAE cultural ethics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**AI Deep Assessment Page with Evidence-Based Analysis (October 2025)**:
- Built dedicated AI Deep Assessment page (`/ai-assessment`) for advanced book analysis with comprehensive evidence extraction
- **Evidence-Based Analysis Framework**:
  - **Narrative Structure**: Plot complexity, character development, pacing with 3-5 line textual quotes as evidence, pivotal moments with page references
  - **Language Metrics**: Vocabulary level with advanced word examples, sentence complexity with example sentences, reading ease score, unique word count, linguistic features
  - **Cultural Assessment**: Islamic values with textual evidence and page references, UAE cultural elements with quotes and context, universal themes, potential concerns with severity ratings and evidence
  - **Educational Insights**: Learning objectives with evidence quotes, skill development with implementation details, discussion topics with guiding questions, pedagogical value assessment
  - **Safety Analysis**: Content warnings with context, evidence quotes, and page references; age appropriateness with rationale and developmental considerations; parental guidance areas with discussion points; positive messages with supporting evidence; risk assessment with level and factors
  - **AI Recommendations**: Best-for audience, teaching strategies with implementation guides, usage contexts, complementary books
- **Data-Driven & Structured Presentation**:
  - All claims backed by direct textual quotes (3-5 lines)
  - Page references (Early/Mid/Late sections) for evidence attribution
  - Color-coded evidence boxes with proper formatting (blockquotes, italics, line spacing)
  - Severity badges for concerns (Low/Moderate/High)
  - Structured cards with clear sections for analysis vs. evidence
- Fresh Garden theme UI with glassmorphism effects and gradient backgrounds
- Interactive analysis cards with hover effects and organized sections
- Real-time progress tracking during analysis
- Download comprehensive analysis as JSON report
- Reset functionality to analyze multiple books without page refresh
- Accessible from main header "AI Deep Analysis" button
- Backend endpoint `/api/deep-analyze` uses enhanced OpenAI GPT-4o prompts requesting explicit evidence extraction
- Synchronous processing with robust error handling and file cleanup
- Defensive array handling with safety checks for all optional fields
- Test IDs added for automated testing coverage

**4-System Evaluation Framework (October 2025)**:
- Replaced legacy scoring methodology with comprehensive 4-system evaluation framework:
  - **System 1: UAE/Islamic/Arab Cultural Values** - Red-line system for cultural alignment (Safe/Moderate/Severe ratings)
  - **System 2: General Child Safety** - Red-line system for harmful content (Safe/Moderate/Severe ratings)
  - **System 3: Theme Complexity** - Developmental readiness assessment (Ages 3+, 5+, 7+, 9+, 12+, 15+, 18+)
  - **System 4: Language Complexity** - Reading level assessment (Ages 3+, 5+, 7+, 9+, 12+, 15+, 18+)
- Automatic rejection logic: "Severe" rating in System 1 or System 2 triggers "Not Whitelisted" verdict
- Age recommendation calculated from higher value between Theme and Language complexity
- Visual label system with 4 verdict states:
  - 🟢 **Approved** (Safe & culturally aligned, minimal concerns)
  - ✅ **Whitelisted** (Safe for families, minor concerns addressed)
  - 🟡 **Parent Guidance** (Safe with moderate concerns requiring discussion)
  - 🚫 **Not Whitelisted** (Severe violations - automatic rejection)
- Enhanced evidence presentation with 3-5 line quotes for Systems 1 and 2
- Updated ResultsView with dedicated System 1 and System 2 detailed cards showing ratings, assessments, concerns, and evidence
- Maintains backward compatibility with legacy domain-based evaluations

**Database Persistence Implementation (October 2025)**:
- Implemented PostgreSQL database storage for permanent evaluation persistence
- Book evaluations now persist across server restarts and sessions
- Created DbStorage class with full CRUD operations using Drizzle ORM
- Automatic fallback to in-memory storage when database is unavailable
- Explicit timestamp handling (createdAt/updatedAt) for consistency
- Comprehensive error handling and logging for database operations
- Database schema migrated with UUID primary keys and JSONB result storage

**Enhanced Evidence Quotes for Safety Analysis (October 2025)**:
- Upgraded domain evidence extraction from 1-2 lines to 3-5 lines or short paragraph
- OpenAI now provides fuller context and more substantial proof for safety concerns
- Enhanced UI typography and spacing for better readability of longer evidence quotes:
  - Increased font size (text-sm → text-base) for improved legibility
  - Enhanced line height (leading-relaxed → leading-loose) for multi-line quotes
  - Added whitespace-pre-line to preserve formatting and line breaks
  - Increased padding and added subtle shadow for better visual hierarchy
- Evidence quotes appear in blue-bordered blockquote sections on Safety Score tab
- Maintains backward compatibility with existing evaluations

**Cover Image Extraction (October 2025)**:
- Added cover image extraction for PDF, EPUB, and Word documents
- Integrated pdfjs-dist + canvas for PDF first-page rendering
- EPUB cover extraction from metadata using epub package
- Word document image extraction from media folder
- Cover images stored as base64 data URLs in evaluation records
- UI displays covers on book cards and detail pages with elegant fallbacks

**Book Catalog Management (October 2025)**:
- Implemented book metadata editing functionality with settings button on each book card
- Created EditBookDialog component for editing title, author, publisher, and uploading cover images
- Added PATCH /api/evaluations/:id endpoint with comprehensive validation:
  - Zod schema validation for metadata fields (title, author, publisher)
  - Image file type validation (PNG, JPEG, JPG, WebP only)
  - File size limit of 10MB for cover images
  - Client-side validation prevents empty required fields
- Cover image upload supports drag-and-drop interface with live preview
- Changes persist in PostgreSQL database and update UI in real-time
- Settings icon appears on book card cover for easy access to editing features
- Delete functionality with confirmation dialog to prevent accidental deletions:
  - DELETE /api/evaluations/:id endpoint for permanent book removal
  - AlertDialog confirmation shows book title and deletion warning
  - Successful deletion invalidates cache and refreshes book list
  - Deletes book evaluation and all associated data from database

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
- Library-first interface showing all analyzed books as interactive cards
- View state management: library → upload → processing → results → library
- Real-time progress tracking via polling for long-running book evaluations
- File upload with drag-and-drop support, 100MB maximum file size
- Multi-step progress indicators for user feedback during processing
- Book cards display title, executive summary, safety score, age recommendation, and verdict
- Click-through navigation from cards to full analysis details

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ESNext modules

**API Structure**: RESTful endpoints under `/api` prefix
- `POST /api/evaluate` - Upload file and initiate evaluation
- `GET /api/evaluate/:id` - Poll evaluation status and retrieve results
- `GET /api/evaluations` - List all evaluations

**File Processing Pipeline**:
1. Multer middleware for multipart file uploads (stored in `uploads/` directory)
2. Text extraction service supporting PDF (pdf-parse), Word documents (mammoth), TXT files, EPUB (epub-parser), and RTF (rtf-parser)
3. Smart text extraction strategy: For books over 50,000 characters, extracts from beginning, middle, and end sections
4. OpenAI API integration for content analysis
5. Asynchronous processing with progress updates
6. Automatic cleanup of uploaded files after processing

**Key Design Decisions**:
- Asynchronous file processing to prevent request timeouts
- Progress tracking system (0-100) with status states: processing, completed, failed
- File size limit of 100MB for uploaded documents
- Smart text extraction up to 50,000 characters with strategic sampling for longer books
- Request/response logging middleware for API endpoints
- Raw body preservation for potential webhook integrations

### Data Storage Solutions

**Current Implementation**: PostgreSQL database using Neon serverless with automatic fallback to in-memory storage
- Primary: `DbStorage` class using Drizzle ORM with PostgreSQL (`@neondatabase/serverless`)
- Fallback: `MemStorage` class using Map-based in-memory storage
- Evaluations stored with UUID primary keys
- Timestamps for creation and updates tracked automatically
- Cover images stored as base64 data URLs in database

**Database Schema** (PostgreSQL via Drizzle ORM):
```typescript
evaluations table:
  - id: UUID (primary key, default: gen_random_uuid())
  - filename: text
  - fileSize: integer
  - status: enum (processing, completed, failed)
  - progress: integer (0-100)
  - result: jsonb (structured evaluation results)
  - coverImage: text (base64 data URL)
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Key Design Decisions**:
- Storage interface (`IStorage`) allows swapping between database and in-memory implementations
- Automatic storage selection: Uses PostgreSQL if DATABASE_URL available, otherwise falls back to MemStorage
- DbStorage explicitly sets timestamps (createdAt/updatedAt) to ensure consistency
- JSONB column for flexible evaluation result storage with structured AI analysis
- Zod schemas for runtime validation matching database schema
- Comprehensive error handling with database operation logging

### Authentication and Authorization

**Current State**: No authentication implemented

**Architectural Consideration**: Session management infrastructure present (connect-pg-simple for PostgreSQL sessions) but not activated

### External Dependencies

**OpenAI API**:
- Model: GPT-4o (configured for structured outputs)
- Purpose: Book content analysis using 4-system evaluation framework
- Input: Extracted book text (max 50,000 characters with smart sampling)
- Output: Structured JSON evaluation with:
  - System 1 (UAE/Islamic/Arab Values): rating, assessment, concerns, evidence
  - System 2 (Child Safety): rating, assessment, concerns, evidence
  - System 3 (Theme Complexity): age rating with rationale
  - System 4 (Language Complexity): age rating with rationale
  - Final verdict (Approved/Whitelisted/Parent Guidance/Not Whitelisted)
  - Recommended age, key features, parent discussion guide
- API key required via `OPENAI_API_KEY` environment variable

**Neon Database** (Active):
- Serverless PostgreSQL provider (`@neondatabase/serverless`)
- Connection via `DATABASE_URL` environment variable
- Used for permanent storage of book evaluations
- Drizzle ORM for type-safe database operations

**File Processing Libraries**:
- PDF parsing: pdf-parse library for extracting text from PDF documents
- Word document parsing: mammoth library for .doc and .docx files
- TXT file reading: Node.js fs module for plain text files
- EPUB parsing: epub-parser library for eBook files with HTML content extraction
- RTF parsing: rtf-parser library for Rich Text Format documents
- Smart extraction strategy: Up to 50,000 characters total; longer books are sampled from beginning, middle, and end sections

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