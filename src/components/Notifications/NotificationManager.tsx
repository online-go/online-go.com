/*
 * Copyright (C) 2012-2022  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import { socket, time_since_connect } from "sockets";
import * as data from "data";
import * as preferences from "preferences";
import { _, interpolate } from "translate";
import { ogs_has_focus, shouldOpenNewTab } from "misc";
import { isLiveGame } from "TimeControl";

import { browserHistory } from "ogsHistory";

import { FabX, FabCheck } from "material";
import { TypedEventEmitter } from "TypedEventEmitter";
import { toast } from "toast";
import { sfx } from "sfx";
import { Goban } from "goban";

declare let Notification: any;

interface Events {
    "turn-count": number;
    "total-count": number;
    notification: any;
    "notification-list-updated": never;
    "notification-count": number;
}

// null or id of game that we're current viewing
function getCurrentGameId() {
    const m = window.location.pathname.match(/game\/(view\/)?([0-9]+)/);
    if (m) {
        return parseInt(m[2]);
    }
    return null;
}

const boot_time = Date.now();
let notification_timeout = null;
const sent = {};

$(window).on("storage", (event) => {
    //console.log(event);
    const ev: any = event.originalEvent;
    if (ev.key === "lastNotificationSent") {
        const key = ev.newValue;
        sent[key] = true;
        setTimeout(() => {
            delete sent[key];
        }, 5000); /* duplicate looking messages are possible so we don't want to possibly block them for very long */
    }
});

export function emitNotification(title, body, cb?) {
    try {
        if (!preferences.get("desktop-notifications")) {
            return;
        }

        if (
            !preferences.get("asked-to-enable-desktop-notifications") &&
            Notification.permission === "default"
        ) {
            preferences.set("asked-to-enable-desktop-notifications", true);
            const t = toast(
                <div>
                    {_(
                        "Hi! While you're using OGS, you can enable Desktop Notifications to be notified when your name is mentioned in chat or you receive a game challenge. Would you like to enable them? (You can always change your answer under settings)",
                    )}
                    <div>
                        <FabCheck
                            onClick={() => {
                                try {
                                    Notification.requestPermission()
                                        .then(() => {
                                            emitNotification(title, body, cb);
                                        })
                                        .catch((err) => console.error(err));
                                } catch (e) {
                                    /* deprecated usage, but only way supported on safari currently */
                                    Notification.requestPermission(() => {
                                        emitNotification(title, body, cb);
                                    });
                                }
                                t.close();
                            }}
                        />
                        <FabX onClick={() => t.close()} />
                    </div>
                </div>,
            );

            return;
        }

        if (ogs_has_focus()) {
            //console.log('Not emitting notification, ogs has focus');
            return;
        }
        if (Date.now() - boot_time > 5000) {
            /* We're going to debounce floods of notifications by waiting a minimum of 1/20th
             * of a second before showing a notification. We then further debounce notifications
             * of the same thing coming from multiple tabs by delaying a random amount of time
             * past that (up to an additional 1/10th of a second) and checking to see if another
             * tab sent it before us. This inter-tab communication is hacked in by piggybacking
             * on the localStorage event framework, we set the 'lastNotificationSent' item and
             * watch for the associated 'storage' event in other tabs. We hope that we get this
             * before our timer is up to send the notification ourselves.
             *
             * This is not a fool-proof system, but it doesn't need to be as duplicate notifications
             * are handled just fine by the browser, but this reduces flicker and reduces the chance
             * that the browser will cut us off from sending desktop notifications.
             */
            if (notification_timeout) {
                clearTimeout(notification_timeout);
            }
            const delay = Math.round(
                (Math.random() * 0.2 + 0.05) * 1000,
            ); /* sleep 0.05-0.15 seconds */
            notification_timeout = setTimeout(() => {
                notification_timeout = null;
                if (title + body in sent) {
                    //console.log("Debouncing notification")
                    return;
                }
                try {
                    localStorage.setItem("lastNotificationSent", title + body);
                } catch (e) {
                    console.error(e);
                }

                try {
                    const notification = new Notification(title, {
                        body: body,
                        icon: "https://cdn.online-go.com/favicon.ico",
                        dir: "auto",
                        lang: "",
                        tag: "ogs",
                    });

                    if (cb) {
                        notification.onclick = cb;
                    }

                    setTimeout(() => {
                        try {
                            /* this isn't supported on MS Edge yet */
                            notification.close();
                        } catch (e) {
                            console.warn(e);
                        }
                    }, preferences.get("notification-timeout") * 1000);
                } catch (e) {
                    console.info(e);
                }
            }, delay);
        } else {
            //console.log("Ignoring notificaiton sent within the first few seconds of page load", title, body);
        }
    } catch (e) {
        console.log("Error emitting notification: ", e);
    }
}
export class NotificationManager {
    user;
    notifications;
    ordered_notifications;
    unread_notification_count;
    boards_to_move_on;
    active_boards;
    turn_offset;
    auth;
    event_emitter: TypedEventEmitter<Events>;

    constructor() {
        window["notification_manager"] = this;
        this.event_emitter = new TypedEventEmitter<Events>();

        this.notifications = {};
        this.ordered_notifications = [];

        this.boards_to_move_on = {};
        this.active_boards = {};
        this.turn_offset = 0;
        browserHistory.listen(this.onNavigate);
    }
    setUser(user) {
        if (this.user && user.id === this.user.id) {
            return;
        }
        if (user && user.id <= 0) {
            return;
        }
        this.user = user;
        this.auth = data.get("config.notification_auth");
        this.connect();
    }

    advanceToNextBoard(ev?) {
        const game_id = getCurrentGameId() || 0;
        const board_ids = [];
        //notificationPermissionRequest();
        for (const k in this.boards_to_move_on) {
            board_ids.push(parseInt(this.boards_to_move_on[k].id));
        }

        if (board_ids.length === 0) {
            for (const k in this.active_boards) {
                board_ids.push(parseInt(this.active_boards[k].id));
            }
        }

        if (board_ids.length === 0) {
            return;
        }

        board_ids.sort((a, b) => {
            return a - b;
        });

        let idx = -1;

        for (let i = 0; i < board_ids.length; ++i) {
            if (game_id === board_ids[i]) {
                idx = i;
                break;
            }
            if (game_id < board_ids[i]) {
                idx = i - 1;
                break;
            }
        }

        idx = (idx + 1 + this.turn_offset) % board_ids.length;

        // open a new tab if the user asked for it, or if we must protect against disconnection from a live game
        // (there's no point in opening a new tab if they only have one game, because it will be this same game)
        if ((ev && shouldOpenNewTab(ev)) || (this.lookingAtOurLiveGame() && board_ids.length > 1)) {
            ++this.turn_offset;
            window.open("/game/" + board_ids[idx], "_blank");
        } else {
            //window.open("/game/" + board_ids[idx]);
            if (window.location.pathname !== "/game/" + board_ids[idx]) {
                browserHistory.push("/game/" + board_ids[idx]);
            }
        }
    }

    lookingAtOurLiveGame = (): boolean => {
        // Is the current page looking at a game we are live playing in...
        const goban = window["global_goban"] as Goban;
        if (!goban) {
            return false;
        }
        const player_id = goban.config.player_id;

        return (
            goban &&
            goban.engine.phase !== "finished" &&
            isLiveGame(goban.engine.time_control) &&
            goban.engine.isParticipant(player_id)
        );
    };

    deleteNotification(notification, dont_rebuild?: boolean) {
        socket.send("notification/delete", {
            player_id: this.user.id,
            auth: this.auth,
            notification_id: notification.id,
        });
        delete this.notifications[notification.id];
        if (!dont_rebuild) {
            this.rebuildNotificationList();
        }
    }
    clearAllNonActionableNotifications() {
        for (const id in this.notifications) {
            const notification = this.notifications[id];
            switch (notification.type) {
                case "challenge":
                case "friendRequest":
                case "groupRequest":
                case "groupInvitation":
                case "tournamentInvitation":
                    /* these are actionable, so skip */
                    continue;
            }
            delete this.notifications[id];
            socket.send("notification/delete", {
                player_id: this.user.id,
                auth: this.auth,
                notification_id: notification.id,
            });
        }
        this.rebuildNotificationList();
    }
    connect() {
        socket.on("connect", () => {
            socket.send("notification/connect", { player_id: this.user.id, auth: this.auth });
        });
        socket.on("disconnect", () => {
            //console.log("Notifier disconnected from " + server);
        });
        socket.on("active_game", (game) => {
            delete this.boards_to_move_on[game.id];
            if (game.phase === "finished") {
                delete this.active_boards[game.id];
            }

            if (game.phase === "stone removal") {
                if (
                    (game.black.id === data.get("user").id && !game.black.accepted) ||
                    (game.white.id === data.get("user").id && !game.white.accepted)
                ) {
                    this.boards_to_move_on[game.id] = game;
                }
            } else if (game.phase === "play") {
                if (game.player_to_move === data.get("user").id) {
                    this.boards_to_move_on[game.id] = game;
                }
            }

            if (game.phase !== "finished") {
                this.active_boards[game.id] = game;
            }

            if (this.boards_to_move_on[game.id]) {
                const current_game_id = getCurrentGameId();
                if (current_game_id !== game.id || !document.hasFocus()) {
                    if (game.avg_move_time > 3600) {
                        // don't notify for realtime games ever
                        emitNotification(
                            _("Your Turn"),
                            interpolate("It's your turn in game {{game_id}}", { game_id: game.id }),
                            () => {
                                if (window.location.pathname !== "/game/" + game.id) {
                                    browserHistory.push("/game/" + game.id);
                                }
                            },
                        );
                    }
                }
            }

            this.event_emitter.emit("turn-count", Object.keys(this.boards_to_move_on).length);
            this.event_emitter.emit("total-count", Object.keys(this.active_boards).length);
        });

        socket.on("notification", (notification) => {
            if (notification.type === "delete") {
                if (!(notification.id in this.notifications)) {
                    return;
                }
                delete this.notifications[notification.id];
            } else {
                this.notifications[notification.id] = notification;
            }

            if (notification.type === "gameStarted") {
                //console.info('Game started');
            }

            if (notification.type === "challenge") {
                emitNotification(
                    _("Challenge Received"),
                    interpolate("You have received a challenge from {{username}}", {
                        username: notification.user.username,
                    }),
                );
                if (time_since_connect() > 5000) {
                    sfx.play("challenge_received");
                }
            }

            if (notification.type === "gameDeclined") {
                emitNotification(_("Game Declined"), _("Your game request has been declined"));
            }

            if (notification.type === "friendRequest") {
                emitNotification(_("Friend Request"), _("You have received a new friend request"));
            }

            if (notification.type === "friendAccepted") {
                emitNotification(
                    _("Friend Request Accepted"),
                    _("Your friend request has been accepted"),
                );
            }

            if (notification.type === "friendDeclined") {
                emitNotification(
                    _("Friend Request Declined"),
                    _("Your friend request has been declined"),
                );
            }

            if (
                notification.type === "gameStarted" ||
                notification.type === "gameEnded" ||
                notification.type === "gameEnteredStoneRemoval" ||
                notification.type === "gameResumedFromStoneRemoval"
            ) {
                /* auto-delete game started / stop events / SR events if we are on, or visit, the game */
                try {
                    if (getCurrentGameId() === notification.game_id) {
                        this.deleteNotification(notification, true);
                    } else {
                        let title = "";
                        let body = "";
                        if (notification.type === "gameStarted") {
                            title = _("Game Started");
                            body = _("Your game has started");
                            if (time_since_connect() > 5000) {
                                sfx.play("game_started");
                                //sfx.play("setup-bowl");
                            }
                        } else if (notification.type === "gameEnded") {
                            title = _("Game Ended");
                            body = _("Your game has ended");
                        } else if (notification.type === "gameEnteredStoneRemoval") {
                            title = _("Game Entered Stone Removal");
                            body = _("Your game has entered Stone Removal Phase");
                        } else if (notification.type === "gameResumedFromStoneRemoval") {
                            title = _("Game Resume from Stone Removal");
                            body = _("Your opponent has resumed from the stone removal phase");
                        } else {
                            title = _("Notification from Online Go");
                            body = _("You have received a new notification from OGS");
                        }
                        emitNotification(title, body);
                    }
                } catch (e) {
                    // ignore error
                }
            }

            if (notification.type === "lateChatReceivedInGame") {
                if (getCurrentGameId() === notification.game_id) {
                    this.deleteNotification(notification, true);
                } else {
                    emitNotification(
                        _("Chat added to finished game"),
                        _("Someone added some chat to your finished game"),
                    );
                }
            }

            this.rebuildNotificationList();

            this.event_emitter.emit("notification", notification);
        });

        return socket;
    }
    onNavigate = () => {
        const current_game_id = getCurrentGameId();
        if (current_game_id) {
            let found = false;
            for (const k in this.notifications) {
                const notification = this.notifications[k];
                if (notification.game_id === current_game_id) {
                    this.deleteNotification(notification, true);
                    found = true;
                }
            }
            if (found) {
                this.rebuildNotificationList();
            }
        }
    };
    rebuildNotificationList() {
        this.ordered_notifications = [];

        this.unread_notification_count = 0;
        for (const k in this.notifications) {
            this.unread_notification_count += !this.notifications[k].read ? 1 : 0;
            this.ordered_notifications.push(this.notifications[k]);
        }

        this.ordered_notifications.sort((a, b) => {
            return (
                (b.timestamp || b.time) - (a.timestamp || a.time)
            ); /* wtf why is this not uniform */
        });

        this.event_emitter.emit("notification-count", this.unread_notification_count);
        this.event_emitter.emit("notification-list-updated");
    }
    anyYourMove() {
        if (Object.keys(this.boards_to_move_on).length === 0) {
            return false;
        }
        return true;
    }
}
