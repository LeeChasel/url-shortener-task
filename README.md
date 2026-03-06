# URL Shortener

A RESTful URL shortening service built with NestJS, PostgreSQL, and Redis.

## Tech Stack

- **Framework**: NestJS 11 + TypeScript
- **Database**: PostgreSQL (via Prisma 7)
- **Cache**: Redis (ioredis 5)
- **Auth**: JWT (Bearer token)
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Run with Docker

```bash
# Copy environment file
cp .env.example .env   # adjust values as needed

# Start all services
docker compose up -d
```

The API will be available at `http://localhost:3000` (or `APP_PORT` if overridden).

### Environment Variables

| Variable            | Default                   | Description                  |
| ------------------- | ------------------------- | ---------------------------- |
| `APP_PORT`          | `3000`                    | API server port              |
| `DATABASE_URL`      | *(required)*              | PostgreSQL connection string |
| `JWT_SECRET`        | `change-me-in-production` | JWT signing secret           |
| `JWT_EXPIRES_IN`    | `7d`                      | JWT token expiry             |
| `REDIS_URL`         | `redis://localhost:6379`  | Redis connection URL         |
| `POSTGRES_DB`       | `url_shortener_task`      | PostgreSQL database name     |
| `POSTGRES_USER`     | `user`                    | PostgreSQL user              |
| `POSTGRES_PASSWORD` | `password`                | PostgreSQL password          |

## API Reference

### Base URL

All versioned endpoints are prefixed with `/api/v1`.

---

### Health

#### `GET /health`

Check service health status.

**Response**

```json
{
  "status": "ok",
  "services": {
    "db": { "status": "ok" },
    "cache": { "status": "ok" }
  }
}
```

`status` is `"degraded"` if any service is unavailable.

---

### Auth

#### `POST /api/v1/auth/register`

Register a new account.

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response** `201`

```json
{
  "id": "cuid",
  "email": "user@example.com",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

#### `POST /api/v1/auth/login`

Login and receive a JWT.

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response** `200`

```json
{
  "accessToken": "<jwt>"
}
```

---

### URLs

#### `POST /api/v1/urls`

Create a short link. Works for both guests and authenticated members.

**Auth**: Optional (`Authorization: Bearer <token>`)

**Request Body**

| Field            | Type    | Required | Description                                           |
| ---------------- | ------- | -------- | ----------------------------------------------------- |
| `originalUrl`    | string  | Yes      | The URL to shorten (must be a valid URL)              |
| `expiresInHours` | integer | No       | Expiry in hours (member only, max `168` = 7 days)     |
| `maxClicks`      | integer | No       | Maximum click count before link expires (member only) |

**Guest behaviour**: `expiresInHours` and `maxClicks` are ignored; link expires in 24 hours.

**Response** `201`

```json
{
  "id": "cuid",
  "shortCode": "aBc1234",
  "originalUrl": "https://example.com",
  "userId": null,
  "expiresAt": "2025-01-02T00:00:00.000Z",
  "maxClicks": null,
  "clickCount": 0,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### User

> All user endpoints require `Authorization: Bearer <token>`.

#### `GET /api/v1/user/me`

Get the current user's profile.

**Response** `200`

```json
{
  "id": "cuid",
  "email": "user@example.com",
  "registeredAt": "2025-01-01T00:00:00.000Z",
  "lastLoginAt": "2025-01-02T00:00:00.000Z",
  "totalLinks": 5
}
```

---

#### `GET /api/v1/user/links`

Get all short links belonging to the current user.

**Response** `200`

```json
[
  {
    "id": "cuid",
    "shortCode": "aBc1234",
    "originalUrl": "https://example.com",
    "expiresAt": "2025-01-02T00:00:00.000Z",
    "maxClicks": 100,
    "clickCount": 42,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### Redirect

#### `GET /:shortCode`

Redirect to the original URL.

**Response**

| Status | Condition                           |
| ------ | ----------------------------------- |
| `302`  | Redirect to original URL            |
| `404`  | Short code not found                |
| `410`  | Link expired or click limit reached |

---

## API Summary

| Method | Path                    | Auth     | Description              |
| ------ | ----------------------- | -------- | ------------------------ |
| GET    | `/health`               | None     | Health check             |
| POST   | `/api/v1/auth/register` | None     | Register                 |
| POST   | `/api/v1/auth/login`    | None     | Login                    |
| POST   | `/api/v1/urls`          | Optional | Create short link        |
| GET    | `/api/v1/user/me`       | Required | Get profile              |
| GET    | `/api/v1/user/links`    | Required | List own links           |
| GET    | `/:shortCode`           | None     | Redirect to original URL |

## Architecture Notes

- Redis is used as a **cache only** — the source of truth is PostgreSQL. If Redis is down, all operations continue via the database.
- Short codes are 7-character alphanumeric strings generated with `crypto.randomBytes`.
- Click-limited links always validate against the database to ensure accurate counts; time-only links can be served from cache.
