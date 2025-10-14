# Book Evaluation & Whitelist Report Generator

## Overview
This full-stack web application evaluates children's and family books for content appropriateness, cultural alignment, and age suitability, specifically for the UAE Ministry of Education. It processes various book formats (PDF, Word, TXT, EPUB, RTF) using OpenAI's GPT API to generate comprehensive evaluation reports. These reports include domain-specific content assessments, age recommendations, and parent discussion guides, ensuring content adheres to Islamic, Arab, and UAE cultural ethics. The system features a sophisticated 4-system evaluation framework, AI deep assessment with evidence-based analysis, and robust book catalog management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with **React** and **TypeScript** using **Vite**. It utilizes **Shadcn/ui** (New York style) with **Radix UI** for accessible components, styled with **Tailwind CSS** featuring a custom color palette. **TanStack Query** manages server state, while **Wouter** handles client-side routing. Typography uses **Inter** and **Noto Sans Arabic**. The **Fresh Garden Theme** features green-to-cyan gradients in hero sections with enhanced glassmorphism effects and interactive button UX. Key design decisions include a library-first interface with interactive book cards, real-time progress tracking for evaluations, and drag-and-drop file upload with a 100MB limit. The homepage features an **illustrative value proposition section** showcasing the 4-system evaluation framework with color-coded cards and parent-focused trust indicators. The application includes dedicated **About Us** (`/about`) and **How It Works** (`/how-it-works`) pages. Hero sections and the **AI Deep Assessment** (`/ai-assessment`) page feature **interactive back buttons** with glassmorphism styling.

### Backend Architecture
The backend uses **Node.js** with **Express.js** and **TypeScript**. It provides RESTful endpoints under `/api`. The file processing pipeline uses **Multer** for uploads, various libraries for text extraction, and **OpenAI API** for content analysis. Asynchronous processing with progress updates and automatic file cleanup are core features. A smart text extraction strategy samples longer books from the beginning, middle, and end.

### Data Storage Solutions
The application primarily uses a **PostgreSQL database** (Neon serverless) for permanent evaluation persistence, with an automatic fallback to in-memory storage if the database is unavailable. **Drizzle ORM** is used for type-safe CRUD operations. Evaluation records include UUID primary keys, file metadata, status, progress, structured JSONB results from AI analysis, and base64 encoded cover images.

### System Design Choices
The core evaluation mechanism is a **4-System Evaluation Framework**:
1.  **UAE/Islamic/Arab Cultural Values**: Red-line system for cultural alignment (Safe/Moderate/Severe).
2.  **General Child Safety**: Red-line system for harmful content (Safe/Moderate/Severe).
3.  **Theme Complexity**: Developmental readiness assessment (age-based).
4.  **Language Complexity**: Reading level assessment (age-based).

Automatic rejection occurs if System 1 or 2 rates "Severe". 

**NMC Standards Parallel Scoring System**: A separate evaluation system runs independently alongside the UAE framework, assessing content against 5 National Media Council regulatory categories: Gambling Content, Language & Profanity, Violence & Terror, Alcohol/Smoking/Drugs, and Sex & Nudity. Each category provides detection status, age band ratings, and evidence quotes. The final NMC age band is determined by the highest (most restrictive) category rating. NMC results display as dual age badges on book cards and include dedicated breakdown sections in AI assessments, PDF reports, and Scoring Admin configuration.

An "AI Deep Assessment" page provides evidence-based analysis, detailing narrative structure, language metrics, cultural assessment, educational insights, and safety analysis with textual quotes and page references. The assessment header displays age group recommendations and dynamic whitelist status (Whitelisted/Parent Guidance/Not Whitelisted) with appropriate icons and glassmorphism styling. Book catalog management includes metadata editing and deletion functionality with cover image extraction for various formats. The application supports batch uploads with sequential processing, real-time queue status, and progress visualization. A dedicated reports page (`/reports`) offers advanced multi-layer filtering for generating dynamic PDF reports for selected books. An enterprise-grade scoring configuration administration system (`/admin/scoring`) allows management of evaluation criteria, weights, thresholds, age mappings, and verdict rules with version control and audit trails. PDF reports are generated with a branded, visually appealing design, including card-based layouts and color-coded system breakdowns. The verdict system is consolidated into three statuses: Whitelisted, Parent Guidance, and Not Whitelisted.

**NMC Backfill Process**: For existing books uploaded before NMC system implementation, a backfill API endpoint (`POST /api/evaluations/:id/backfill-nmc`) allows re-uploading book files to add NMC assessment. A utility script (`scripts/backfill-nmc.ts`) lists all evaluations missing NMC data and provides API usage examples.

## External Dependencies

*   **OpenAI API**: Utilizes `GPT-4o` for book content analysis, configured for structured JSON outputs.
*   **Neon Database**: Serverless PostgreSQL for persistent storage.
*   **File Processing Libraries**: `pdf-parse`, `mammoth`, `epub-parser`, `rtf-parser`, Node.js `fs`.
*   **PDF Generation**: `Puppeteer` and `Chromium` (Nix package) for HTML-to-PDF conversion.
*   **UI Component Libraries**: `Shadcn/ui`, `Radix UI`, `React Hook Form`, `Zod`, `TanStack Query`, `Wouter`, `Drizzle ORM`.