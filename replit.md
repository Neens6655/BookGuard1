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

Automatic rejection occurs if System 1 or 2 rates "Severe". An "AI Deep Assessment" page provides evidence-based analysis, detailing narrative structure, language metrics, cultural assessment, educational insights, and safety analysis with textual quotes and page references. The assessment header displays age group recommendations and dynamic whitelist status (Whitelisted/Parent Guidance/Not Whitelisted) with appropriate icons and glassmorphism styling. Book catalog management includes metadata editing and deletion functionality with cover image extraction for various formats. The application supports batch uploads with sequential processing, real-time queue status, and progress visualization. A dedicated reports page (`/reports`) offers advanced multi-layer filtering for generating dynamic PDF reports for selected books. An enterprise-grade scoring configuration administration system (`/admin/scoring`) allows management of evaluation criteria, weights, thresholds, age mappings, and verdict rules with version control and audit trails. PDF reports are generated with a branded, visually appealing design, including card-based layouts and color-coded system breakdowns. The verdict system is consolidated into three statuses: Whitelisted, Parent Guidance, and Not Whitelisted. **NMC age band filtering** is available on both the landing page (FilterSidebar) and Report Generation page (Scoring Criteria accordion), allowing users to filter books by National Media Council age bands (Not Allowed, 6+, 10+, 13+, 17+, 21+). Note that NMC age bands and display ages (recommended_minimum_age) are separate assessments and may differ for the same book.

## External Dependencies

*   **OpenAI API**: Utilizes `GPT-4o` for book content analysis, configured for structured JSON outputs.
*   **Neon Database**: Serverless PostgreSQL for persistent storage.
*   **Apify Goodreads Scraper**: Enriches book data with Goodreads ratings, reviews, and cover images. Uses the `epctex/goodreads-scraper` actor with field name `image` for cover images.
*   **File Processing Libraries**: `pdf-parse`, `mammoth`, `epub-parser`, `rtf-parser`, Node.js `fs`.
*   **PDF Generation**: `Puppeteer` and `Chromium` (Nix package) for HTML-to-PDF conversion.
*   **UI Component Libraries**: `Shadcn/ui`, `Radix UI`, `React Hook Form`, `Zod`, `TanStack Query`, `Wouter`, `Drizzle ORM`.

## Recent Updates

### Goodreads Integration & Similarity Matching (Oct 2025)

#### Cover Image Integration
Fixed Goodreads cover image integration to properly display book covers from Goodreads API:
- **Frontend**: BookCard and ResultsView components now prioritize Goodreads cover images (`goodreadsData?.coverImageUrl`) over uploaded covers (`coverImage`)
- **Backend**: Apify service updated to use correct field name `book.image` from the Goodreads scraper response
- **Fallback Chain**: Goodreads cover → Uploaded cover → BookOpen icon placeholder

#### Smart Similarity Matching
Implemented intelligent title matching to prevent incorrect Goodreads associations:
- **Unicode-Aware Normalization**: Handles Arabic titles with diacritics (tashkeel), Latin accents, and multilingual content using NFKD normalization and `\p{M}` regex
- **Jaccard Similarity Algorithm**: Calculates word-based similarity between book titles and author names
- **Confidence Scoring**: Weighted average (70% title + 30% author) with 40% threshold to reject low-confidence matches
- **Match Transparency**: Returns `matchConfidence` (0-100%) and `matchedTitle` fields for debugging
- **Console Logging**: All matches logged with confidence scores for monitoring
- **Protection**: Prevents fuzzy Goodreads search results from associating wrong books with evaluations

#### Goodreads Reviews & Ratings Display (Oct 2025)
Added comprehensive Goodreads community insights to book evaluation pages:
- **Overview Tab - Community Insights Section**: Consolidated display showing overall rating (with 5-star visualization), total ratings count, total reviews count, published year, Goodreads categories/genres, and featured review preview with quick link to full reviews tab
- **Dedicated Reviews Tab**: Full list of top Goodreads reviews with author avatars, star ratings, review text (with line clamping), number of likes, and link to Goodreads
- **Header Integration**: Rating displayed prominently in hero section and book analysis subtitle
- **Automatic Display**: Goodreads data only shown when successfully fetched (status: 'ok')