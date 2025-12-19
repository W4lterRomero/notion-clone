# AI Agent Setup Guide

This document is designed to help an AI agent understand how to run and interact with this project locally.

## Project Structure
- **Backend**: NestJS application running on port 4000.
- **Frontend**: Next.js application running on port 3000.
- **Database**: PostgreSQL (v16) running on port 5432.
- **Cache**: Redis (v7) running on port 6379.
- **Storage**: Minio running on port 9000/9001.
- **Search**: Meilisearch running on port 7700.

## Running the Project
The entire stack is containerized. To start the project:

```bash
docker-compose up -d
```

To rebuild after code changes (critical for backend entity changes):

```bash
docker-compose up -d --build
```

To stop:

```bash
docker-compose down
```

## Database Connection
- **Type**: PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **User**: notion_user
- **Password**: SecurePass123!
- **Database**: notion_db
- **Connection String**: `postgresql://notion_user:SecurePass123!@localhost:5432/notion_db`

## Environment Variables
The `docker-compose.yml` file defines the source of truth for local environment variables.
- Backend `DATABASE_URL` matches the Postgres container credentials.
- Frontend `NEXT_PUBLIC_API_URL` points to `http://localhost:4000`.

## Persistence
Data is persisted in Docker volumes:
- `postgres_data`
- `redis_data`
- `minio_data`
- `meilisearch_data`

If data is lost between restarts, verify volume mounting in `docker-compose.yml`.

## Verify Health
- Backend: `GET http://localhost:4000/health`
- Frontend: `GET http://localhost:3000`
