# Footy

Mobile app for organizing football matches and tournaments.

## Stack

- Mobile: React Native, Expo, TypeScript
- Backend: Spring Boot 3, Java 21, Maven
- Database: PostgreSQL 18 for local development
- Auth: JWT

## Requirements

- Java 21 LTS
- Docker Desktop
- Node.js 22 LTS for the Expo mobile app

## Database

```bash
docker compose up -d postgres
```

Local PostgreSQL runs on port `5433` to avoid conflicts with other local PostgreSQL installations.

```txt
jdbc:postgresql://localhost:5433/footy
```

## Backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Health check:

```bash
curl http://localhost:8080/api/health
```

## Mobile

The mobile app will live in `mobile/` and use Expo with TypeScript. Install Node.js 22 LTS before creating or running it.