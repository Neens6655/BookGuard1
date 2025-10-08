# Book Evaluation & Whitelist Report Generator

## Overview
This full-stack web application evaluates children's and family books for content appropriateness, cultural alignment, and age suitability, specifically for the UAE Ministry of Education. It processes various book formats (PDF, Word, TXT, EPUB, RTF) using OpenAI's GPT API to generate comprehensive evaluation reports. These reports include domain-specific content assessments, age recommendations, and parent discussion guides, ensuring content adheres to Islamic, Arab, and UAE cultural ethics. The system features a sophisticated 4-system evaluation framework, AI deep assessment with evidence-based analysis, and robust book catalog management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with **React** and **TypeScript** using **Vite**. It utilizes **Shadcn/ui** (New York style) with **Radix UI** for accessible components, styled with **Tailwind CSS** featuring a custom color palette. **TanStack Query** manages server state, while **Wouter** handles client-side routing. Typography uses **Inter** and **Noto Sans Arabic**. The **Fresh Garden Theme** features green-to-cyan gradients (green-500 → emerald-500 → cyan-500) in hero sections with enhanced glassmorphism effects and interactive button UX (scale transforms, shadow depth, smooth color transitions). Key design decisions include a library-first interface with interactive book cards, real-time progress tracking for evaluations, and drag-and-drop file upload with a 100MB limit. The homepage features an **illustrative value proposition section** showcasing the 4-system evaluation framework with color-coded cards (green for Cultural Values, blue for Child Safety, purple for Theme Complexity, orange for Language Level) and parent-focused trust indicators (automatic rejection, age recommendations, discussion guides). The application includes dedicated **About Us** (`/about`) and **How It Works** (`/how-it-works`) pages explaining the mission, stakeholders served, and detailed evaluation framework with real case studies.

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
*   **UI Component Libraries**:
    *   `Shadcn/ui` & `Radix UI`: For accessible and customizable UI components.
    *   `React Hook Form` with `Zod`: For form validation.
    *   `TanStack Query`: For server state management.
    *   `Wouter`: For client-side routing.
    *   `Drizzle ORM`: For type-safe database interactions with PostgreSQL.