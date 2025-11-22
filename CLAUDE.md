# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack Notion clone application with real-time collaboration capabilities:

### Backend
- **Language**: Kotlin (with Java 21 toolchain)
- **Framework**: Spring Boot 4.0.0
- **Security**: Spring Security + OAuth2 Client + JWT
- **Database**: PostgreSQL 14+ with Spring Data JPA
- **Real-time**: WebSocket (STOMP)
- **Build Tool**: Gradle 8.5 (using Gradle Wrapper)
- **Package Structure**: `kr.najoan.notionclone`

### Frontend
- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.1
- **Editor**: BlockNote (rich text editor)
- **State Management**: Zustand 5.0
- **Real-time**: SockJS + STOMP WebSocket client
- **Node Version**: 20+ (Docker), 18+ (local development)

## Build and Development Commands

### Backend (Spring Boot)
```bash
# Build the project
./gradlew build

# Run the application (http://localhost:8080)
./gradlew bootRun

# Build without tests
./gradlew build -x test

# Run tests
./gradlew test

# Clean build artifacts
./gradlew clean
```

### Frontend (Next.js)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run linter
npm run lint

# Start Yjs collaboration server (optional, port 1234)
npm run yjs-server
```

### Docker Development (Full Stack)
```bash
# Build and start all services (backend:9000, frontend:3020, db)
docker-compose up -d --build

# View logs for all services
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Stop all services
docker-compose down
```

### Running Both Together (Local Development)
1. Start backend: `./gradlew bootRun` (port 8080)
2. In another terminal, start frontend: `cd frontend && npm run dev` (port 3000)
3. Access the application at http://localhost:3000

## Architecture

### Backend Structure
```
src/main/kotlin/kr/najoan/notionclone/
├── config/           # Configuration (Security, WebSocket, CORS)
├── controller/       # REST & WebSocket controllers
├── dto/             # Data transfer objects
├── entity/          # JPA entities (User, Workspace, Page, Block, etc.)
├── repository/      # Spring Data JPA repositories
├── security/        # JWT utils, OAuth handlers, filters
└── service/         # Business logic layer
```

### Frontend Structure
```
frontend/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages (login, callback)
│   ├── workspace/         # Workspace & page views
│   └── invite/            # Invite acceptance
├── components/
│   ├── editor/            # BlockNote editor integration
│   └── workspace/         # Workspace-related components
└── lib/
    ├── api/               # API client functions
    ├── hooks/             # Custom React hooks (useWebSocket)
    ├── store/             # Zustand state management
    ├── types/             # TypeScript type definitions
    └── utils/             # Utility functions
```

### Key Features

1. **Authentication**: Discord OAuth2 → JWT token → Stored in localStorage
2. **Workspaces**: Multi-tenant workspaces with role-based access (Owner, Admin, Member, Guest)
3. **Pages**: Hierarchical page structure with parent-child relationships
4. **Blocks**: Page content stored as blocks (compatible with BlockNote format)
5. **Real-time Collaboration**: WebSocket broadcasts for live updates
6. **Invite Links**: Shareable links with configurable expiry and usage limits

### Database Schema

- **users**: User accounts (from Discord OAuth)
- **workspaces**: Workspace containers
- **workspace_members**: User-workspace relationships with roles
- **pages**: Document pages within workspaces
- **blocks**: Content blocks within pages
- **invite_links**: Workspace invitation tokens

### API Endpoints

All endpoints require JWT authentication (except auth and OAuth routes).

- **Auth**: `/api/auth/*`, `/oauth2/authorization/discord`
- **Workspaces**: `/api/workspaces/*`
- **Pages**: `/api/workspaces/{id}/pages/*`
- **Blocks**: `/api/pages/{id}/blocks/*`
- **Members**: `/api/workspaces/{id}/members/*`
- **Invites**: `/api/workspaces/{id}/invites/*`, `/api/invites/{token}/accept`
- **WebSocket**: `/ws` (STOMP endpoint)

## Environment Configuration

### Required Environment Variables

#### Backend (.env or environment)
```bash
# Database
DB_HOST=192.168.1.4        # Development: hardcoded IP, Production: db
DB_PORT=5432
DB_NAME=notion_clone
DATABASE_PASSWORD=          # Required

# JWT (use: openssl rand -base64 64)
JWT_SECRET=                 # Min 256 bits for HS256
JWT_EXPIRATION=86400000     # 24 hours in milliseconds

# Discord OAuth2
DISCORD_CLIENT_ID=          # Required
DISCORD_CLIENT_SECRET=      # Required

# Production URLs
BASE_URL=https://hyfata.kr  # Production domain
CORS_ALLOWED_ORIGINS=       # Comma-separated list
WEBSOCKET_ALLOWED_ORIGINS=  # Comma-separated list
```

#### Frontend (.env.local)
```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
NEXT_PUBLIC_YJS_URL=ws://localhost:1234  # Optional Yjs server

# Production (Docker)
NEXT_PUBLIC_API_URL=https://hyfata.kr/hyterium/api
NEXT_PUBLIC_WS_URL=wss://hyfata.kr/hyterium/api/ws
```

### Spring Profiles

- **Default** (`application.properties`): Development settings, ddl-auto=update
- **Production** (`application-prod.properties`):
  - Context path: `/hyterium/api`
  - ddl-auto=validate (strict validation)
  - HikariCP connection pooling (max:10, min:5)
  - Actuator health endpoints enabled

## Production Deployment

### Docker Deployment
The application uses multi-stage Docker builds for optimization:
- **Backend**: Gradle build → Eclipse Temurin JRE 21
- **Frontend**: Node dependencies → Next.js standalone build
- **Database**: PostgreSQL (internal network only)

### Production URLs
- Frontend: `https://hyfata.kr/hyterium/`
- API: `https://hyfata.kr/hyterium/api/`
- WebSocket: `wss://hyfata.kr/hyterium/api/ws`
- Health Check: `https://hyfata.kr/hyterium/api/actuator/health`

### Apache Configuration
Required modules: `proxy`, `proxy_http`, `proxy_wstunnel`, `rewrite`, `headers`, `ssl`
- HTTP → HTTPS redirect configured
- Proxy passes for API and WebSocket
- CORS headers handling for preflight requests

## Development Notes

### Adding New Features

1. **Backend**: Create entity → repository → service → controller → DTO
2. **Frontend**: Add API client function → create component → integrate with store

### Kotlin/Spring Conventions
- Uses JSR-305 strict null-safety checks
- Data classes for entities and DTOs
- Service layer handles business logic
- Controllers are thin, delegating to services

### Frontend Patterns
- Server components by default (Next.js 14+)
- Use `"use client"` for interactive components
- Zustand for global state
- Custom hooks for reusable logic (e.g., useWebSocket)

### Testing
- Backend: JUnit 5 with Spring Boot Test (`./gradlew test`)
- Frontend: No test infrastructure configured yet

### Database Migrations
SQL migration files available:
- `migration_add_sort_order.sql`: Adds sort order to blocks
- `fix_properties_column.sql`: Fixes properties column structure