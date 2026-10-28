# Push notifications for third party apps

Online-Go.com can send push notifications (your move, challenges, game
results, messages, and so on) to your iOS and Android app through Apple Push
Notification service (APNs) and Firebase Cloud Messaging (FCM). Pushes are
signed with your app's own credentials, so you need to give OGS those, and
your app needs to tell OGS which device tokens belong to which player.

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
checks the key in both and shows which it works in. Devices registered for an
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
  includes `title` and `body`, plus `collapse_key` and `thread_id` when the
  push has them: use `collapse_key` as the notification tag to replace the
  previous push for the same game, as `notification` messages do.

Either way, Apple also keeps only the latest push for your app while an iOS
device is offline. Don't treat pushes as a complete record: when your app
opens, fetch the player's notifications from `GET /api/v1/me/notifications`.

Players choose which notification types they want pushed under Settings.
`yourMove` is only sent when the player isn't online.

## When something goes wrong

The developer page shows how many devices are registered, how many pushes
were sent or failed over the last week, and the recent errors Apple or Google
returned. **Send test push** sends a push to your own devices registered with
the app, and shows the provider's answer for each. If Apple or Google are slow
to answer, the test stops after about 20 seconds; any errors still show up in
the recent errors list.

If Apple or Google reject your credentials 10 times in a row, OGS stops
sending for that platform and emails the application's owner. Upload new
credentials, or press Resume if the problem was on the provider's side.
Problems that only affect some devices don't count towards this: a device in
an environment your APNs key isn't enabled for, or an iOS device Firebase
can't reach because the APNs credentials in your Firebase project are missing
or invalid. Those show up in the recent errors list instead.
