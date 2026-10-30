# Push notifications for third party apps

Online-Go.com can send push notifications (your move, challenges, game
results, messages, and so on) to your iOS and Android app through Apple Push
Notification service (APNs) and Firebase Cloud Messaging (FCM). Pushes are
signed with your app's own credentials, so you need to give OGS those, and
your app needs to tell OGS which device tokens belong to which player. Sites
can also have notifications POSTed to their own server; see
[Webhooks](#webhooks).

## 1. Create an OAuth application

Every app that receives pushes is identified by an OAuth application's
`client_id`, even if your app signs players in some other way. Create one in
the [OAuth2 Application Manager](https://online-go.com/oauth2/applications/)
if you don't have one. The account that owns the application is the one that
manages its push credentials.

## 2. Upload your credentials

On the [developer page](https://online-go.com/developer), under Push
notifications, upload either or both of:

- **APNs (iOS):** a `.p8` key with APNs enabled, its 10 character key ID,
  your team ID, and your app's bundle ID. If you can, create a key restricted
  to just this app's bundle ID.
- **FCM (Android, and iOS apps that use Firebase):** a service account key
  file (JSON) from your Firebase project. Give the service account only the
  "Firebase Cloud Messaging API Admin" role (`roles/firebasecloudmessaging.admin`).

OGS checks the credentials with Apple or Google before saving them, stores the
secret parts encrypted, and never shows them again. If Apple or Google can't
confirm them right then, nothing is changed and you can try again. Uploading
credentials for a different bundle ID or Firebase project drops the devices
registered for the old one, because their tokens can't be reached with the new
credentials.

APNs keys can be restricted to the sandbox or production environment. OGS
checks the key in both and shows which it works in. If Apple can't be
reached about one of them at the time, the key is saved for the other; save
it again later to add the missing one. Devices registered for an
environment the key doesn't cover aren't sent to.

## 3. Register the device

Every time your app starts with a signed in player (tokens can change), and
whenever the OS gives you a new token, register it:

```
POST https://online-go.com/api/v1/me/push_devices
{
    "client_id": "<your OAuth application's client_id>",
    "provider": "apns" | "fcm",
    "token": "<the device token: hex for APNs, the FCM registration token for FCM>",
    "apns_environment": "production" | "sandbox",
    "fcm_message_type": "notification" | "data"
}
```

Authenticate it the same way as the rest of your API calls (session or OAuth
access token). `apns_environment` is required for APNs: use `sandbox` for
development builds and `production` for TestFlight and App Store builds. If
another player signs in on the same install, registering again moves the token
to them, and pushes still queued for the previous player are dropped. A token
belongs to one install, so registering it with a different `client_id` moves
it to that application too. APNs tokens can be sent in either case.
`fcm_message_type` is optional and only applies to FCM; see
[How pushes are shown](#how-pushes-are-shown).

Devices that haven't registered in 90 days are forgotten, as are devices whose
tokens Apple or Google report as no longer valid.

## 4. Unregister on sign out

Before signing the player out, while the request is still authenticated:

```
DELETE https://online-go.com/api/v1/me/push_devices?token=<the device token>
```

Players can also remove devices themselves under Settings.

## When notifications are sent

A notification is pushed, and sent to webhooks, as soon as it's created.

While the player has something connected to Online-Go.com, such as an open
page or an app's websocket, nothing is pushed to their devices, since they'll
see it there, and a skipped push isn't sent later. Webhooks still get each
notification then, saying the player was connected, except `yourMove`, which is
only sent while the player is away.

`yourMove` is sent once per turn. Chat after a game is pushed to an away
player's devices once per game until they connect again, so a run of chat lines
is one push; webhooks get every line.

Email for `yourMove` goes out with its push. Other email notifications wait
about 2 minutes, in case the player reads them on the site first. Players
choose which notification types are pushed to their devices under Settings.

## What a push contains

The alert's title is the same localized one line summary used for the email
notification, for example "It's your move: alice vs bob". Custom data, which
for FCM is `message.data` and for APNs sits next to `aps`:

| key               | value                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| `type`            | the notification type, e.g. `yourMove`, `challenge`, `gameEnded`, `mail` |
| `notification_id` | the notification's id, when it has one                                   |
| `game_id`         | for game related notifications                                           |
| `notification`    | the full notification as a JSON string, when it is small enough          |

`yourMove` and `timecop` are sent at high priority. If an earlier one for the
same game is still showing, the new one replaces it (`apns-collapse-id` on
iOS, the notification `tag` on Android). They expire when the player's clock
runs out, or after a day when the game has no clock deadline, so a phone that
comes back online late doesn't show a stale "your move". On iOS, pushes about
the same game share a `thread-id`. All of this applies to iOS devices reached
through FCM as well as through APNs directly.

## How pushes are shown

**iOS**, through APNs directly or through FCM: pushes are alerts, which iOS
shows itself while your app isn't in the foreground. While it is, iOS hands
the push to your app's `userNotificationCenter(_:willPresent:withCompletionHandler:)`,
which decides whether to show it. Pushes are sent with `mutable-content`, so a
Notification Service Extension in your app can rewrite the title and body, or
add attachments, before iOS shows them.

**Android**, through FCM, depends on the `fcm_message_type` the device
registered with:

- `notification` (the default) sends notification messages. Android shows
  them itself while your app is in the background, with no code in your app.
  While your app is in the foreground they go to your
  `FirebaseMessagingService.onMessageReceived` instead, and nothing is shown
  unless your app shows it. While a device is offline, FCM keeps only the most
  recent notification message for your app, and it throttles them to a burst
  of 20 per device, then one every 3 minutes.
- `data` sends data-only messages, which always go to `onMessageReceived`,
  even in the background, and are never collapsed or throttled that way.
  Android shows nothing unless your app builds the notification. The data
  includes `title` and `body`, plus `tag` and `thread_id` when the
  push has them: use `tag` as the notification tag to replace the
  previous push for the same game, as `notification` messages do.

Either way, Apple also keeps only the latest push for your app while an iOS
device is offline. Don't treat pushes as a complete record: when your app
opens, fetch the player's notifications from `GET /api/v1/me/notifications`.

## When something goes wrong

The developer page shows, for each platform and the webhook, how many devices
are registered, how many sends succeeded or failed over the last week, and
the recent errors Apple, Google or your server returned. **Send test push**
sends a push to your own devices registered with the app, and a `test` event
to the webhook if your own account is subscribed to it. It goes out like any
other push, so check your phone, and look for problems under recent errors a
few seconds later.

If Apple or Google reject your credentials 10 times in a row, OGS stops
sending for that platform and emails the application's owner. Upload new
credentials, or press Resume if the problem was on the provider's side.
Problems that only affect some devices don't count towards this. An iOS device
Firebase can't reach, because the APNs credentials in your Firebase project are
missing or invalid, shows up in the recent errors list, and is kept so it works
again once you fix them.

## Webhooks

A site that uses Online-Go.com as its backend can have players' notifications
POSTed to its own server instead of, or as well as, pushed to devices.

### Setting it up

On the [developer page](https://online-go.com/developer), under your
application's Webhook section, enter an `https://` URL. OGS only sends to
public addresses, and doesn't follow redirects. When you save, OGS POSTs a
`ping` event to the URL, which has to answer with any 2xx status. The ping is
signed with the secret your server already has, so it can check it, except on
first setup, when your server hasn't seen the secret yet.

The signing secret is shown once: when the webhook is first set up, and when
you generate a new one. Copy it then. Changing only the URL keeps the secret.
Generating a new one stops the old one working immediately: every event after
that is signed with the new secret.

### Subscribing players

Subscribe a player, authenticated as that player:

```
POST https://online-go.com/api/v1/me/push_devices
{
    "client_id": "<your OAuth application's client_id>",
    "provider": "webhook"
}
```

If the request uses an OAuth access token, it has to be one issued to your own
application. A subscription lasts until it's removed; it doesn't need renewing,
and doesn't count towards the player's devices. To unsubscribe the player:

```
DELETE https://online-go.com/api/v1/me/push_devices?webhook=<your client_id>
```

Players see the subscription under Settings, and can remove it there.

### What's sent

Every notification for a subscribed player, whatever their per-type Email,
Mobile and Desktop settings, as described in
[When notifications are sent](#when-notifications-are-sent). The settings only
control what OGS itself sends, so each event includes the player's settings for
that kind of notification, and whether they were connected to Online-Go.com
when it was sent, for you to follow or not as suits your site. Each event is
one request:

```
POST <your URL>
Content-Type: application/json
User-Agent: OGS-Webhooks/1
OGS-Webhook-Id: <event id>
OGS-Webhook-Timestamp: <UNIX time in seconds>
OGS-Webhook-Signature: v1=<hex HMAC-SHA256 of "<timestamp>.<raw body>", keyed with the signing secret>

{
    "id": "<event id>",
    "type": "notification" | "test" | "ping",
    "player_id": <the player's id, or null for a ping>,
    "title": "<localized one line summary, or empty>",
    "body": "<may be empty>",
    "notification": {<the full notification, as in /api/v1/me/notifications>} or null,
    "settings": {"email": true | false, "mobile": true | false, "desktop": true | false} or null,
    "online": true | false or null
}
```

`settings` is null for pings, tests, and the kinds of notification that have
no setting, and `online` is null for pings and tests. `title` is empty for the
kinds of notification OGS doesn't email, such as `friendAccepted`.

`yourMove` notifications include the game's `phase`, which is `stone removal`
once both players have passed, and `your_move_count`, the number of the
player's games waiting on their move or on them accepting the score, counted as
the site counts them, for badging your app; it isn't sent again when the player
moves, so lower it yourself when they do. `lateChatReceivedInGame` includes the
chat line's `channel` and `body`.

The event id is the same on every retry of an event, so use it to drop
duplicates. Check the signature with a constant time comparison, and reject
timestamps more than about 5 minutes old:

```python
import hashlib, hmac, time

def verify(secret: str, headers, raw_body: bytes) -> bool:
    timestamp = headers["OGS-Webhook-Timestamp"]
    if abs(time.time() - int(timestamp)) > 300:
        return False
    expected = "v1=" + hmac.new(secret.encode(), timestamp.encode() + b"." + raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, headers["OGS-Webhook-Signature"])
```

### Responses

| Your response               | What OGS does                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| 2xx                         | Delivered                                                                                  |
| 410                         | Stops sending this player's notifications, unsubscribing them                              |
| 401, 403, 404               | Counts as a broken setup; 10 in a row pause the webhook and email the application's owner  |
| 408, 429, 5xx, or no answer | Retried up to 5 times, backing off from a minute, or after `Retry-After` when you send one |
| Anything else               | Dropped                                                                                    |

Response bodies are never read. Connecting times out after 3 seconds, and
sending or waiting for the answer after 5. When your server doesn't answer at
all, OGS waits a minute before trying it again; events due in the meantime are
retried later rather than dropped.
