# Performance Management System (績效管理系統) REST API Documentation

*Note*: Below is just an outline of the APIs we might need, with some examples written. Please ignore the content of the examples and focus on the format instead.

[TOC]

---

## Base URL

Base URL: `/api/v1`

---

## Authentication

Uses JWT (JSON Web Tokens) via `djangorestframework-simplejwt`.

Include the access token in requests: `Authorization: Bearer <access_token>`

### Obtain Token (Login)

```
POST /api/v1/auth/token/
```

**Request Body:**

```json
{
  "username": "john_doe",
  "password": "secretpassword"
}
```

**Response:** `200 OK`

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response Cookie:**

```
Set-Cookie: refresh_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...; HttpOnly; Path=/api/v1/auth/; SameSite=Lax; Secure
```

> **Note:** The refresh token is stored in an HttpOnly cookie and is not accessible via JavaScript. The `Secure` flag is set in production only.

### Refresh Token

```
POST /api/v1/auth/token/refresh/
```

**Request Cookie:** `refresh_token` (HttpOnly cookie set during login)

**Response:** `200 OK`

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
}
```

> **Note:** In production, the refresh token is rotated and a new `refresh_token` cookie is set. In development, the refresh token is not rotated.

### Logout

```
POST /api/v1/auth/logout/
```

**Request Cookie:** `refresh_token` (HttpOnly cookie set during login)

**Request Header:** `Authorization: Bearer <access_token>`

**Response:** `205 Reset Content`

> **Note:** The refresh token is blacklisted and the `refresh_token` cookie is cleared.

---

## Users

### Get all users from User

```
GET /api/v1/users/
```

**Required Permission:** `admin`

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "username": "user1",
    },
    {
      "id": 2,
      "username": "johndoe",
    }
  ]
}
```


### Get User info

```
GET /api/v1/users/me/
```

**Required Permission:** logged-in users

**Response:**
```json
{
    "id": 1,
    "username": "user1",
}
```


### Get User's Groups (user_groups)

```
GET /api/v1/users/me/user-groups/
```

**Required Permission:** logged-in users

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": 1,
      "name": "",
      "permissions": "admin"
    },
    {
      "id": 2,
      "name": "522",
      "permissions": "member"
    }
  ]
}
```

`id` is group_id

---

## Goal Management



---

## Performance Evaluation



---

## Notifications

### List All Notifications (NEW)

```
GET /api/v1/notifications/
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `unread`, `read`, `archived` |
| `page` | int | Page number |

**Response:** `200 OK`
```json
{
  "count": 25,
  "next": "/api/v1/notifications/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "description": "Your room registration has been approved.",
      "status": "unread",
      "created_at": "2026-01-20T10:30:00Z"
    }
  ]
}
```

### Mark Notification as Viewed

```
PATCH /api/v1/notifications/{id}/
```

**Request Body:**
```json
{
  "status": "read"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "status": "read"
}
```

### Archive Notification

```
PATCH /api/v1/notifications/{id}/
```

**Request Body:**
```json
{
  "status": "archived"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "status": "archived"
}
```

---

## Compliance & Audit



---

## I18N (Internationalization)



---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "start_time": ["Start time must be before end time"],
    "date": ["Date cannot be in the past"]
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication credentials were not provided",
  "code": "NOT_AUTHENTICATED"
}
```

### 403 Forbidden

```json
{
  "error": "You do not have permission to perform this action",
  "code": "PERMISSION_DENIED"
}
```

### 404 Not Found

```json
{
  "error": "Registration not found",
  "code": "NOT_FOUND"
}
```

### 409 Conflict

```json
{
  "error": "Room is already booked for the requested time",
  "code": "CONFLICT",
  "details": {
    "existing_registration_id": 99
  }
}
```
