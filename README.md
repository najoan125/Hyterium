# Notion Clone

A full-stack collaborative workspace application built with **Spring Boot (Kotlin)** and **Next.js**, featuring real-time collaboration, Discord OAuth authentication, and a rich text editor powered by BlockNote.

## Features

- **Discord OAuth2 Authentication** with JWT tokens
- **Workspace Management** - Create, manage, and collaborate in workspaces
- **Real-time Collaboration** - See changes from other users instantly via WebSocket
- **Rich Text Editing** - Powered by BlockNote with markdown-like syntax
- **Page Management** - Hierarchical page structure like Notion
- **Member Management** - Role-based access control (Owner, Admin, Member, Guest)
- **Invite Links** - Generate shareable invite links for workspace collaboration
- **PostgreSQL Database** - Reliable data persistence

## Tech Stack

### Backend
- **Kotlin** + **Spring Boot 4.0**
- **Spring Security** + **OAuth2 Client** + **JWT**
- **Spring Data JPA** + **PostgreSQL**
- **WebSocket** (STOMP)

### Frontend
- **Next.js 16** + **React 19**
- **TypeScript**
- **Tailwind CSS**
- **BlockNote** - Rich text editor
- **Zustand** - State management
- **Axios** - API client
- **SockJS** + **STOMP** - WebSocket client

## Prerequisites

- **Java 21**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Discord Application** (for OAuth)

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE notion_clone;
\q
```

The application will automatically create tables on startup.

### 2. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URI: `http://localhost:8080/login/oauth2/code/discord`
5. Note down your Client ID and Client Secret

### 3. Backend Configuration

Create or update `src/main/resources/application.properties`:

```properties
# Database (already configured)
spring.datasource.url=jdbc:postgresql://192.168.1.4:5432/notion_clone
spring.datasource.username=postgres
spring.datasource.password=Najo$%an!2#

# Discord OAuth2
spring.security.oauth2.client.registration.discord.client-id=YOUR_DISCORD_CLIENT_ID
spring.security.oauth2.client.registration.discord.client-secret=YOUR_DISCORD_CLIENT_SECRET
```

Replace `YOUR_DISCORD_CLIENT_ID` and `YOUR_DISCORD_CLIENT_SECRET` with your Discord application credentials.

### 4. Frontend Configuration

The frontend configuration is already set up in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

## Running the Application

### Backend

```bash
# Build and run
./gradlew bootRun

# Or build and run separately
./gradlew build
java -jar build/libs/Notion-clone-0.0.1-SNAPSHOT.jar
```

The backend will start on `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

## Usage

1. Navigate to `http://localhost:3000`
2. Click "Sign in with Discord"
3. Authorize the application
4. Create a workspace
5. Create pages and start editing
6. Invite collaborators using the "Share" button
7. Collaborate in real-time!

## Project Structure

```
.
├── src/main/kotlin/kr/najoan/notionclone/
│   ├── config/           # Configuration classes
│   ├── controller/       # REST controllers
│   ├── dto/             # Data transfer objects
│   ├── entity/          # JPA entities
│   ├── repository/      # Data repositories
│   ├── security/        # Security & JWT
│   └── service/         # Business logic
├── frontend/
│   ├── app/             # Next.js pages (App Router)
│   ├── components/      # React components
│   └── lib/             # Utilities, API clients, stores
└── build.gradle         # Gradle configuration
```

## API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user
- `GET /oauth2/authorization/discord` - Discord OAuth login

### Workspaces
- `GET /api/workspaces` - List all workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/{id}` - Get workspace details
- `PUT /api/workspaces/{id}` - Update workspace
- `DELETE /api/workspaces/{id}` - Delete workspace

### Pages
- `GET /api/workspaces/{workspaceId}/pages` - List pages
- `POST /api/workspaces/{workspaceId}/pages` - Create page
- `GET /api/workspaces/{workspaceId}/pages/{pageId}` - Get page
- `PUT /api/workspaces/{workspaceId}/pages/{pageId}` - Update page
- `DELETE /api/workspaces/{workspaceId}/pages/{pageId}` - Delete page

### Blocks
- `GET /api/pages/{pageId}/blocks` - Get page blocks
- `POST /api/pages/{pageId}/blocks` - Create block
- `PUT /api/pages/{pageId}/blocks/{blockId}` - Update block
- `DELETE /api/pages/{pageId}/blocks/{blockId}` - Delete block
- `POST /api/pages/{pageId}/blocks/bulk` - Bulk update blocks

### Members
- `GET /api/workspaces/{workspaceId}/members` - List members
- `PUT /api/workspaces/{workspaceId}/members/{memberId}/role` - Update role
- `DELETE /api/workspaces/{workspaceId}/members/{memberId}` - Remove member

### Invites
- `POST /api/workspaces/{workspaceId}/invites` - Create invite link
- `GET /api/workspaces/{workspaceId}/invites` - List invite links
- `POST /api/invites/{token}/accept` - Accept invite

### WebSocket
- `/ws` - WebSocket endpoint
- `/topic/workspace.{workspaceId}.page.{pageId}` - Subscribe to page updates

## Environment Variables

### Backend
Set these as environment variables:
- `DISCORD_CLIENT_ID` - Discord OAuth Client ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth Client Secret

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8080)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (default: http://localhost:8080/ws)

## Development

### Backend Development
```bash
./gradlew bootRun
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Build for Production

#### Backend
```bash
./gradlew build
```

#### Frontend
```bash
cd frontend
npm run build
npm start
```

## License

ISC

## Contributing

This is a demonstration project. Feel free to fork and modify as needed.
