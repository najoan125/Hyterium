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
- **Build Tool**: Gradle (using Gradle Wrapper)
- **Package Structure**: `kr.najoan.notionclone`

### Frontend
- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: BlockNote (rich text editor)
- **State Management**: Zustand
- **Real-time**: SockJS + STOMP WebSocket client

## Build and Development Commands

### Backend (Spring Boot)
```bash
# Build the project
./gradlew build

# Run the application (http://localhost:8080)
./gradlew bootRun

# Build without tests
./gradlew build -x test

# Run all tests
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
```

### Running Both Together
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

## Development Notes

### Environment Setup

1. **Database**: PostgreSQL must be running at 192.168.1.4:5432 (configured in application.properties)
2. **Discord OAuth**: Set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` environment variables
3. **Frontend env**: Configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` in frontend/.env.local

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
