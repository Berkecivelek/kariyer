# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareerAI is an AI-powered professional CV/resume builder with Turkish-language UI. Full-stack application with Express.js TypeScript backend and vanilla HTML/JS/Tailwind frontend.

## Commands

### Frontend (Tailwind CSS)
```bash
npm run build:css      # Build minified CSS
npm run watch:css      # Watch mode for development
```

### Backend (from /backend directory)
```bash
npm run dev            # Development with hot reload (tsx watch)
npm run build          # TypeScript to JavaScript
npm start              # Production server
npm run lint           # ESLint
npm run test           # Jest tests

# Database
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # GUI database viewer
```

### Deployment
```bash
./deploy.sh            # Automated EC2 deploy (git push, SSH, build, PM2 restart)
```

## Architecture

### Directory Structure
- `/backend/` - Express.js TypeScript backend with MVC pattern
  - `src/controllers/` - Request handlers
  - `src/services/` - Business logic (aiService.ts for Claude API)
  - `src/routes/` - API endpoint definitions
  - `src/middleware/` - Auth, validation, error handling
  - `prisma/schema.prisma` - PostgreSQL database schema
  - `public/` - Static frontend files served in production
- `/js/` - Frontend JavaScript modules (26 files)
  - `api-client.js` - Singleton API client, auto-detects localhost vs EC2
  - `cv-*.js` - CV builder functionality
  - `interview-*.js` - Interview prep modules
- `/*.html` - Frontend pages (30+ files)
- `/src/input.css` - Tailwind source
- `/css/tailwind.css` - Generated CSS output

### Key Patterns

**API Client**: Singleton pattern (`window.apiClient`) with automatic JWT token management and environment detection (localhost:3000 vs EC2 IP).

**API Response Format**:
```javascript
{ success: true, data: {...} }  // Success
{ success: false, error: "..." } // Error
```

**AI Integration**: `backend/src/services/aiService.ts` centralizes all Anthropic Claude API calls. Credit system limits FREE tier to 10 AI requests.

**Database**: PostgreSQL with Prisma ORM. Key models: User, Resume (JSON fields for experience/education/skills), Subscription (tier + credits), InterviewSession.

### Tech Stack
- Backend: Node.js 20+, Express 4.18, TypeScript 5.3, Prisma 5.7, Anthropic SDK
- Frontend: Vanilla JS, Tailwind CSS 3.4, HTML
- Database: PostgreSQL 14+
- Deployment: EC2, Nginx reverse proxy, PM2 process manager

## Environment Variables

Required in `backend/.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Auth secrets
- `ANTHROPIC_API_KEY` - Claude API key
- `CORS_ORIGIN` - Allowed origins (localhost + EC2)
