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

## Local Backend With Docker

Run PostgreSQL and the Spring Boot backend together:

```bash
docker compose up -d --build
```

The backend is available at:

```txt
http://localhost:8080
```

Health check:

```bash
curl http://localhost:8080/api/health
```

Stop the local stack:

```bash
docker compose stop
```

## Backend Without Docker

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

The mobile app lives in `mobile/` and uses Expo with TypeScript.

Run the web build for local testing:

```bash
cd mobile
npx expo start --web --port 8082
```

Open:

```txt
http://localhost:8082
```

On web the app uses `http://localhost:8080` as the API URL. On Android/iOS it uses the deployed Render backend.

Build an Android APK with EAS:

```bash
cd mobile
eas build -p android --profile preview
```

## Google Login

Google login is implemented but disabled until OAuth Client IDs are configured.

Create OAuth Client IDs in Google Cloud Console for the platforms you need, then set:

Root `.env` for the backend compose stack:

```txt
APP_SECURITY_GOOGLE_CLIENT_IDS=web-client-id.apps.googleusercontent.com,android-client-id.apps.googleusercontent.com
```

`mobile/.env` for Expo:

```txt
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=ios-client-id.apps.googleusercontent.com
```

Creating OAuth Client IDs is not a paid Footy feature, but Google may require normal Google Cloud project and consent screen setup.
