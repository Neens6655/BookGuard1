# Book Evaluation & Whitelist Report Generator

## Overview
This full-stack web application evaluates children's and family books for content appropriateness, cultural alignment, and age suitability, specifically for the UAE Ministry of Education. It processes various book formats (PDF, Word, TXT, EPUB, RTF) using OpenAI's GPT API to generate comprehensive evaluation reports. These reports include domain-specific content assessments, age recommendations, and parent discussion guides, ensuring content adheres to Islamic, Arab, and UAE cultural ethics. The system features a sophisticated 4-system evaluation framework, AI deep assessment with evidence-based analysis, and robust book catalog management.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### PDF Report Generation Feature (October 2025)
Implemented professional PDF report generation for whitelisted books with branded, visually appealing design:

**Features:**
- **Branded PDF Reports**: Beautiful A4 PDF reports with 📚 brand logo, green gradient header, and Fresh Garden theme styling
- **Card-Based Layout**: Each book displayed in a professional card with cover image, metadata, and 4-system evaluation breakdown
- **Color-Coded Systems**: Visual cards for Cultural Values (green), Child Safety (blue), Theme Complexity (purple), Language Level (orange)
- **Professional Formatting**: Badges for ratings and age groups, shadows, gradients, and proper typography
- **Comprehensive Content**: Includes executive summary, all 4 systems assessments, age recommendations, key lessons, cultural values, and discussion guides
- **One-Click Download**: Hero section button to download complete report of all whitelisted books

**Technical Implementation:**
- Installed Puppeteer for HTML-to-PDF conversion with system Chromium
- Dynamic path detection for Chromium executable (`which chromium`)
- Configured headless browser with proper args (--no-sandbox, --disable-setuid-sandbox, --disable-dev-shm-usage, --disable-gpu)
- A4 format with 20px margins and background printing enabled
- File naming: `Whitelisted_Books_Report_YYYY-MM-DD.pdf`
- E2E tested and verified with 2.9MB PDF generation successful

**User Experience:**
- Download Report button in homepage hero section
- Success toast notification on completion
- Supports multiple sequential downloads
- Friendly, professional format (not overly formal)

**Future Considerations:**
- Add HTML escaping for user-sourced fields in template
- Monitor Puppeteer launch latency; consider pooling for high volume
- Add regression test for PDF endpoint non-empty buffer validation

### Verdict Consolidation (January 2025)
Successfully consolidated "Approved" and "Whitelisted" verdicts into a single **"Whitelisted"** status across the entire application. This unification simplifies the user experience and ensures consistent terminology throughout the system. The final verdict now supports exactly three options:

1. **✅ Whitelisted** (Green): Safe and culturally aligned for UAE families
2. **🟡 Parent Guidance** (Yellow): Safe but requires parental review
3. **🚫 Not Whitelisted** (Red): Not suitable; violates standards

**Changes implemented:**
- Updated database schema enum (removed "Approved" from final_verdict)
- Migrated all 9 existing "Approved" records to "Whitelisted" in production database
- Updated OpenAI service prompts to generate only the 3 consolidated verdicts
- Unified all UI components (FilterSidebar, BookCard, ResultsView, HowItWorks, Home) to use "Whitelisted" terminology
- Updated marketing copy and parent-facing content to reflect the consolidated terminology
- Verified through automated E2E testing with 0 "Approved" references remaining

**Monitoring recommendations:**
- Monitor future data imports to ensure no "Approved" verdicts are generated
- Review third-party integrations for terminology consistency
- Extend regression testing to verify verdict badge styling per status

## System Architecture

### Frontend Architecture
The frontend is built with **React** and **TypeScript** using **Vite**. It utilizes **Shadcn/ui** (New York style) with **Radix UI** for accessible components, styled with **Tailwind CSS** featuring a custom color palette. **TanStack Query** manages server state, while **Wouter** handles client-side routing. Typography uses **Inter** and **Noto Sans Arabic**. The **Fresh Garden Theme** features green-to-cyan gradients (green-500 → emerald-500 → cyan-500) in hero sections with enhanced glassmorphism effects and interactive button UX (scale transforms, shadow depth, smooth color transitions). Key design decisions include a library-first interface with interactive book cards, real-time progress tracking for evaluations, and drag-and-drop file upload with a 100MB limit. The homepage features an **illustrative value proposition section** showcasing the 4-system evaluation framework with color-coded cards (green for Cultural Values, blue for Child Safety, purple for Theme Complexity, orange for Language Level) and parent-focused trust indicators (automatic rejection, age recommendations, discussion guides). The application includes dedicated **About Us** (`/about`) and **How It Works** (`/how-it-works`) pages explaining the mission, stakeholders served, and detailed evaluation framework with real case studies. Hero sections and the **AI Deep Assessment** (`/ai-assessment`) page feature **interactive back buttons** with glassmorphism styling (white/transparent or green-tinted with backdrop blur), positioned in the top-left corner with smooth hover animations including scale transforms, shadow depth changes, and icon slide effects for enhanced navigation UX.

### Backend Architecture
The backend uses **Node.js** with **Express.js** and **TypeScript**. It provides RESTful endpoints under `/api`. The file processing pipeline uses **Multer** for uploads, various libraries for text extraction (pdf-parse, mammoth, epub-parser, rtf-parser), and **OpenAI API** for content analysis. Asynchronous processing with progress updates and automatic file cleanup are core features. A smart text extraction strategy samples longer books (over 50,000 characters) from the beginning, middle, and end.

### Data Storage Solutions
The application primarily uses a **PostgreSQL database** (Neon serverless) for permanent evaluation persistence, with an automatic fallback to in-memory storage if the database is unavailable. **Drizzle ORM** is used for type-safe CRUD operations. Evaluation records include UUID primary keys, file metadata, status, progress, structured JSONB results from AI analysis, and base64 encoded cover images.

### System Design Choices
The core evaluation mechanism is a **4-System Evaluation Framework**:
1.  **UAE/Islamic/Arab Cultural Values**: Red-line system for cultural alignment (Safe/Moderate/Severe).
2.  **General Child Safety**: Red-line system for harmful content (Safe/Moderate/Severe).
3.  **Theme Complexity**: Developmental readiness assessment (age-based).
4.  **Language Complexity**: Reading level assessment (age-based).

Automatic rejection occurs if System 1 or 2 rates "Severe". An "AI Deep Assessment" page provides evidence-based analysis, detailing narrative structure, language metrics, cultural assessment, educational insights, and safety analysis with textual quotes and page references. The assessment header displays age group recommendations and dynamic whitelist status (Whitelisted/Parent Guidance/Not Whitelisted) with appropriate icons and glassmorphism styling. Book catalog management includes metadata editing and deletion functionality with cover image extraction for various formats.

## External Dependencies

*   **OpenAI API**: Utilizes `GPT-4o` for book content analysis, configured for structured JSON outputs, providing detailed evaluations based on the 4-system framework and evidence extraction.
*   **Neon Database**: Serverless PostgreSQL used for persistent storage of book evaluations. Connected via `DATABASE_URL` environment variable.
*   **File Processing Libraries**:
    *   `pdf-parse`: Extracts text from PDF documents.
    *   `mammoth`: Processes .doc and .docx files.
    *   `epub-parser`: Extracts content from EPUB files.
    *   `rtf-parser`: Handles Rich Text Format documents.
    *   Node.js `fs` module: For plain text files.
*   **PDF Generation**:
    *   `Puppeteer`: Headless browser automation for HTML-to-PDF conversion.
    *   `Chromium`: System-level browser binary (Nix package) used by Puppeteer for PDF rendering.
*   **UI Component Libraries**:
    *   `Shadcn/ui` & `Radix UI`: For accessible and customizable UI components.
    *   `React Hook Form` with `Zod`: For form validation.
    *   `TanStack Query`: For server state management.
    *   `Wouter`: For client-side routing.
    *   `Drizzle ORM`: For type-safe database interactions with PostgreSQL.