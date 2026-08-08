# Web Push Notifications - Backend Handoff

This document outlines the API contracts and push payload schemas required from the OGS backend to support Web Push Notifications.

## 1. REST API Endpoints

All endpoints must be protected by standard OGS authentication (session cookies) and require standard CSRF headers.

### `GET /api/v1/push/config`

Retrieves the public VAPID key required for the browser's `PushManager.subscribe()` call.

**Response:** `{ "vapid_public_key": "..." }`

### `POST /api/v1/push/subscriptions`

Registers a new device subscription for the authenticated user.

**Request Body:** `{ "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } }`

**Response:** `201 Created` or `200 OK`

### `DELETE /api/v1/push/subscriptions`

Removes a specific device subscription.

**Request Body:** `{ "endpoint": "..." }`

**Response:** `204 No Content`

### `GET /api/v1/push/preferences`

_(Required for the settings page to load initial state)_

Retrieves the user's current push notification settings.

**Response:** `{ "turn": true, "time": true, "challenge": false }`

### `PUT /api/v1/push/preferences`

Updates the user's push notification settings.

**Request Body:** `{ "turn": true, "time": true, "challenge": true }`

**Response:** `200 OK`

---

## 2. Web Push Payload Schema

The frontend `service-worker.js` strictly expects this JSON format for incoming push events:

```json
{
    "title": "It's your turn!",
    "body": "Your game against username is waiting for your move.",
    "icon": "/static/images/logo-192.png",
    "tag": "game-12345",
    "data": {
        "url": "/game/12345"
    }
}
```

- **title / body:** Pre-localized by the backend.
- **icon / tag:** Optional, but `tag` is highly recommended for deduplication.
- **data.url:** Required. Relative or absolute OGS path to focus/open on click.
