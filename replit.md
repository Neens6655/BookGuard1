# Book Evaluation & Whitelist Report Generator

## Overview
This full-stack web application evaluates children's and family books for content appropriateness, cultural alignment, and age suitability, specifically for the UAE Ministry of Education. It processes various book formats (PDF, Word, TXT, EPUB, RTF) using OpenAI's GPT API to generate comprehensive evaluation reports. These reports include domain-specific content assessments, age recommendations, and parent discussion guides, ensuring content adheres to Islamic, Arab, and UAE cultural ethics. The system features a sophisticated 4-system evaluation framework, AI deep assessment with evidence-based analysis, and robust book catalog management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript using Vite, utilizing Shadcn/ui (New York style) with Radix UI and Tailwind CSS for styling. TanStack Query manages server state, while Wouter handles client-side routing. Key design elements include a library-first interface with interactive book cards, real-time progress tracking, drag-and-drop file upload, and an illustrative value proposition section. The application includes dedicated About Us and How It Works pages, with interactive back buttons featuring glassmorphism styling. The Fresh Garden Theme incorporates green-to-cyan gradients and enhanced glassmorphism effects.

### Backend Architecture
The backend uses Node.js with Express.js and TypeScript, providing RESTful endpoints. The file processing pipeline uses Multer for uploads, various libraries for text extraction, and OpenAI API for content analysis. Features include asynchronous processing with progress updates, automatic file cleanup, and a smart text extraction strategy that samples longer books from the beginning, middle, and end.

### Data Storage Solutions
The application primarily uses a PostgreSQL database (Neon serverless) for permanent evaluation persistence, with an automatic fallback to in-memory storage. Drizzle ORM is used for type-safe CRUD operations. Evaluation records include UUID primary keys, file metadata, status, progress, structured JSONB results from AI analysis, and base64 encoded cover images. A dedicated `goodreads_cache` table stores Apify Goodreads API responses with a 7-day TTL.

### System Design Choices
The core evaluation uses a **4-System Evaluation Framework**:
1.  **UAE/Islamic/Arab Cultural Values**: Red-line system for cultural alignment.
2.  **General Child Safety**: Red-line system for harmful content.
3.  **Theme Complexity**: Developmental readiness assessment.
4.  **Language Complexity**: Reading level assessment.

Automatic rejection occurs if System 1 or 2 rates "Severe". An "AI Deep Assessment" page provides evidence-based analysis, detailing narrative structure, language metrics, cultural assessment, educational insights, and safety analysis with textual quotes and page references. The assessment header displays age group recommendations and dynamic whitelist status (Whitelisted/Parent Guidance/Not Whitelisted). Book catalog management includes metadata editing and deletion. Batch uploads support sequential processing, real-time queue status, and progress visualization. A dedicated reports page (`/reports`) offers advanced multi-layer filtering for generating dynamic PDF reports. An enterprise-grade scoring configuration administration system (`/admin/scoring`) allows management of evaluation criteria, weights, thresholds, age mappings, and verdict rules with version control and audit trails. PDF reports are generated with a branded design. NMC age band filtering is available on the landing page and Report Generation page. Goodreads integration provides community insights, including overall rating stats, categories, and categorized reviews (Most Helpful, Parent & Educator, Critical Perspectives). Smart similarity matching uses Unicode-aware normalization and Jaccard Similarity to accurately associate books with Goodreads data. Text extraction capacity is increased to 100,000 characters, with a research-backed sampling strategy (35% beginning, 30% middle, 35% end) for longer books, incorporating overlapping chunks and contextual separators. The system supports bulk operations (selection, delete, CSV export) and includes an Analytics Dashboard displaying evaluation metrics, verdict breakdowns, language distribution, top genres, and age group distribution. API resilience includes retry logic with exponential backoff for external calls.

## External Dependencies

*   **OpenAI API**: Utilizes `GPT-4o` for book content analysis.
*   **Neon Database**: Serverless PostgreSQL for persistent storage.
*   **Apify Goodreads Scraper**: Enriches book data with ratings, reviews, and cover images using `epctex/goodreads-scraper`.
*   **File Processing Libraries**: `pdf-parse`, `mammoth`, `epub-parser`, `rtf-parser`, Node.js `fs`.
*   **PDF Generation**: `Puppeteer` and `Chromium` (Nix package) for HTML-to-PDF conversion.
*   **UI Component Libraries**: `Shadcn/ui`, `Radix UI`, `React Hook Form`, `Zod`, `TanStack Query`, `Wouter`, `Drizzle ORM`.