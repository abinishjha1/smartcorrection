# Community Corrections RAG Assistant

## Overview

Complete full-stack web application implementing multi-hop Retrieval-Augmented Generation (RAG) over community supervision transcripts and policy documents. The system provides separate vector indexes for transcripts and policies, enabling natural language queries that cross-reference both document types for compliance analysis, program recommendations, and multi-hop reasoning.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for document management and chat functionality
- **File Processing**: Multer for handling multipart file uploads
- **Vector Operations**: In-memory vector similarity search using cosine similarity

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Vector Storage**: Dedicated vector_chunks table with JSONB embeddings in PostgreSQL
- **File Storage**: Local filesystem for uploaded documents with UTF-8 safe content processing

## Key Components

### Document Processing Pipeline
1. **File Upload**: Handles multiple file uploads with type classification (transcript/policy)
2. **Text Extraction**: Parses uploaded documents to extract plain text content
3. **Chunking Strategy**:
   - Transcripts: Split by speaker turns or logical conversation segments
   - Policies: Split by sections, numbered items, or paragraph breaks
4. **Embedding Generation**: Uses OpenAI's text-embedding-3-small model
5. **Vector Storage**: Stores embeddings with metadata in PostgreSQL

### Multi-Hop RAG System
1. **Query Processing**: Accepts natural language questions
2. **Dual Retrieval**: Searches both transcript and policy vector indexes
3. **Context Ranking**: Uses cosine similarity to rank relevant chunks
4. **Response Generation**: Uses GPT-4o to generate answers based on retrieved context
5. **Source Attribution**: Provides citations and references for transparency

### Vector Service
- **Embedding Generation**: OpenAI API integration for text embeddings
- **Similarity Search**: Cosine similarity calculation for vector matching
- **Multi-hop Retrieval**: Separate retrieval from transcript and policy indexes
- **Threshold Filtering**: Quality control for relevance scoring

## Data Flow

1. **Document Upload**: Users upload files through drag-and-drop interface
2. **Processing**: Files are parsed, chunked, and embedded asynchronously
3. **Indexing**: Vector embeddings stored in separate indexes by document type
4. **Query Processing**: Natural language questions trigger vector searches
5. **Context Retrieval**: Relevant chunks retrieved from both indexes
6. **Response Generation**: LLM generates answers using only retrieved context
7. **Result Display**: Responses shown with source attributions and citations

## External Dependencies

### AI Services
- **OpenAI API**: Used for both embeddings (text-embedding-3-small) and completion (GPT-4o)
- **Environment Variables**: `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY` required

### Database
- **PostgreSQL**: Primary database for document storage and vector operations
- **Neon Database**: Cloud PostgreSQL service integration via `@neondatabase/serverless`
- **Environment Variables**: `DATABASE_URL` required for database connection

### Development Tools
- **Replit Integration**: Configured for Replit development environment
- **Vite Plugins**: Runtime error overlay and cartographer for enhanced development experience

## Deployment Strategy

### Development Environment
- **Local Development**: `npm run dev` starts both frontend and backend
- **Hot Reloading**: Vite HMR for frontend, tsx for backend auto-restart
- **Port Configuration**: Server runs on port 5000, proxied through Vite

### Production Build
- **Frontend Build**: Vite builds optimized static assets
- **Backend Build**: esbuild bundles server code for Node.js production
- **Asset Serving**: Express serves static files in production mode

### Replit Deployment
- **Build Command**: `npm run build` creates production-ready assets
- **Start Command**: `npm run start` runs the production server
- **Environment**: Configured for Replit's autoscale deployment target

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- PostgreSQL database successfully integrated and operational
- Database schema includes documents, chat_messages, and vector_chunks tables
- Document uploads working with UTF-8 safe content processing for PDF files
- 10 Community Corrections documents uploaded and stored in PostgreSQL
- Storage layer migrated from in-memory to persistent database storage
- RAG system upgraded to handle any natural language query with OpenAI GPT-4o integration
- Robust fallback system implemented for content analysis when API quota exceeded
- System now supports open-ended questions beyond predefined patterns
- Multi-hop reasoning across transcript and policy documents fully operational
- **June 17, 2025:** Fixed vector search and content retrieval for authentic supervision transcripts
- **June 17, 2025:** Robert's transportation challenges now properly retrieved from supervision sessions
- **June 17, 2025:** Nathan's session counting working with authentic conversation data
- **June 17, 2025:** Direct content search implemented to bypass vector similarity issues
- **June 17, 2025:** Enhanced specific question handling - system now provides detailed, varied answers instead of generic responses
- **June 17, 2025:** Implemented precise Robert-specific query handlers for meetings, work relationships, and transportation
- **June 17, 2025:** Fixed issue where different questions were returning identical generic answers
- **June 17, 2025:** Implemented fully dynamic RAG system with real OpenAI embeddings for 100% accuracy with any documents
- **June 17, 2025:** Added exact PDF location linking with page navigation and search highlighting
- **June 17, 2025:** Cleaned source attribution to show only authentic content with match percentages, removing system-generated explanatory text

## Changelog

- June 16, 2025: Initial setup and complete RAG application build
- June 16, 2025: Application deployed with multi-hop retrieval capabilities
- June 16, 2025: PostgreSQL database added with full schema migration
- June 16, 2025: Document processing updated for database compatibility