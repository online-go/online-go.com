# Web Push Notifications - Backend Handoff

This document describes the backend work required by the frontend Web Push implementation.

## 1. Existing Configuration

Add `vapid_public_key` to the response from the existing authenticated or anonymous
`GET /api/v1/ui/config` endpoint. The frontend reads this value from its normal
config state when it calls `PushManager.subscribe()`.

Do not add a separate push configuration endpoint.

## 2. Subscription Resource

Both endpoints use standard OGS session authentication and CSRF protection.

### `POST /api/v1/me/push_subscriptions`

Upsert the subscription for the authenticated user by `(user, endpoint)`.

Request body:

```json
{
    "endpoint": "https://push.example/endpoint",
    "keys": {
        "p256dh": "...",
        "auth": "..."
    }
}
```

Return `200 OK`. Optional device label and user-agent metadata may be stored if
the backend requires it.

### `POST /api/v1/me/push_subscriptions/delete`

Remove the authenticated user's subscription with the specified endpoint.

Request body:

```json
{
    "endpoint": "https://push.example/endpoint"
}
```

Use POST instead of DELETE because some clients and proxies remove DELETE request
bodies. Return `200 OK` or `204 No Content`.

## 3. Existing Notification Preferences

Extend every notification type returned by `GET /api/v1/me/settings` with a
`web_push` boolean alongside the existing `email` and `mobile` values. Examples
include `yourMove`, `timecop`, `challenge`, `gameStarted`, and
`tournamentStarted`.

The existing `PUT /api/v1/me/settings` endpoint must accept updates such as:

```json
{
    "notifications": {
        "yourMove": {
            "description": "It is my turn to move",
            "value": {
                "email": true,
                "mobile": true,
                "web_push": true
            }
        }
    }
}
```

Do not add a separate push preference resource. Push delivery must be gated by
the notification type's `web_push` value.

## 4. Delivery Behavior

Integrate Web Push delivery into the existing auxiliary/offline notification
delivery path. Use the existing localized notification renderers for the push
title and body. Send this payload to the browser service worker:

```json
{
    "title": "It's your turn!",
    "body": "Your game against username is waiting for your move.",
    "icon": "/static/images/logo-192.png",
    "tag": "internal-notification-id",
    "data": {
        "url": "/game/12345"
    }
}
```

`title` and `body` must be localized for the recipient. Use the internal
notification ID as `tag`. `data.url` is required and must open the relevant OGS
page when the notification is clicked.

Add VAPID configuration and `pywebpush` support. Delete a stored subscription
when the push service returns HTTP `404` or `410`. Make the auxiliary delivery
delay configurable so staging can use a short delay during testing.

## 5. Deployment Sequence

1. Deploy the VAPID configuration, notification preference field, subscription
   endpoints, and auxiliary delivery support.
2. Confirm `ui/config` includes `vapid_public_key` and settings include
   `web_push` for all notification types.
3. Enable the frontend `ENABLE_WEB_PUSH` flag.

Until the backend work is deployed, the frontend feature flag remains disabled.
