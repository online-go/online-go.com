/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {comm_socket} from "sockets";
import data from "data";
import preferences from "preferences";
import {_, interpolate, pgettext} from "translate";
import {ogs_has_focus, shouldOpenNewTab, dup, deepEqual} from "misc";
import {isLiveGame} from "TimeControl";
import {post, del} from "requests";
import {browserHistory} from "react-router";
import {challenge_text_description} from "ChallengeModal";
import {Player} from "Player";
import {FabX, FabCheck} from "material";
import {EventEmitter} from "eventemitter3";
import {toast} from 'toast';


declare let Notification: any;

// null or id of game that we're current viewing
function getCurrentGameId() {
    let m = window.location.pathname.match(/game\/(view\/)?([0-9]+)/);
    if (m) {
        return parseInt(m[2]);
    }
    return null;
}

function formatTime(seconds) { /* {{{ */
    let days = Math.floor(seconds / 86400); seconds -= days * 86400;
    let hours = Math.floor(seconds / 3600); seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60); seconds -= minutes * 60;

    function plurality(num, single, plural) {
        if (num > 0) {
            if (num === 1) {
                return num + " " + single;
            }
            return num + " " + plural;
        }
        return "";
    }

    if (days > 1) {
        return plurality(days + 1, _("day"), _("days"));
    }

    if (hours > 4) {
        return (hours + 1) + " " + _("hours");
    }

    if (hours) {
        return hours + ":" + (minutes < 10 ? "0" : "") + minutes;
    }

    if (minutes) {
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }
    return _("no time left");
} /* }}} */



let boot_time = Date.now();
let already_asked_for_permission = false;
let notification_timeout = null;
let sent = {};
$(window).on("storage", (event) => {
    //console.log(event);
    let ev: any = event.originalEvent;
    if (ev.key === "lastNotificationSent") {
        let key = ev.newValue;
        sent[key] = true;
        setTimeout(() => {
            delete sent[key];
        }, 5000); /* duplicate looking messages are possible so we don't want to possibly block them for very long */
    }
});

export function emitNotification(title, body, cb?) {{{
    try {
        if (!preferences.get('desktop-notifications')) {
            return;
        }

        if (!preferences.get("asked-to-enable-desktop-notifications") && Notification.permission === "default") {
            preferences.set("asked-to-enable-desktop-notifications", true);
            let t = toast(
                <div>
                    {_("Hi! While you're using OGS, you can enable Desktop Notifications to be notified when your name is mentioned in chat or you receive a game challenge. Would you like to enable them? (You can always change your answer under settings)")}
                    <FabCheck onClick={() => {
                        Notification.requestPermission().then((perm) => {
                            emitNotification(title, body, cb);
                        }).catch((err) => console.error(err));
                        t.close();
                    }}/>
                    <FabX onClick={() => t.close()}/>
                </div>
            );

            return;
        }

        if (ogs_has_focus()) {
            //console.log('Not emitting notification, ogs has focus');
            return;
        }
        if ((Date.now()) - boot_time > 5000) {
            /* We're going to debounce floods of notifications by waiting a minimum of 1/20th
             * of a second before showing a notification. We then further debounce notifications
             * of the same thing coming from multiple tabs by delaying a random amount of time
             * past that (up to an additional 1/10th of a second) and checking to see if another
             * tab sent it before us. This inter-tab communication is hacked in by piggybacking
             * on the localStorage event framework, we set the 'lastNotificationSent' item and
             * watch for the associated 'storage' event in other tabs. We hope that we get this
             * before our timer is up to send the notification ourselves.
             *
             * This is not a full proof system, but it doesn't need to be as duplicate notifications
             * are handled just fine by the browser, but this reduces flicker and reduces the chance
             * that the browser will cut us off from sending desktop notifications.
             */
            if (notification_timeout) {
                clearTimeout(notification_timeout);
            }
            let delay = Math.round((Math.random() * 0.2 + 0.05) * 1000); /* sleep 0.05-0.15 seconds */
            notification_timeout = setTimeout(() => {
                notification_timeout = null;
                if ((title + body) in sent) {
                    //console.log("Debouncing notification")
                    return;
                }
                try {
                    localStorage.setItem("lastNotificationSent", title + body);
                } catch (e) {
                    console.error(e);
                }

                let notification = new Notification(title,
                    {
                        body: body,
                        icon: "https://cdn.online-go.com/favicon.ico",
                        dir: "auto",
                        lang: "",
                        tag: "ogs"
                    }
                );
                if (cb) {
                    notification.onclick = cb;
                }

                setTimeout(() => {
                    notification.close();
                }, preferences.get("notification-timeout") * 1000);
            }, delay);
        } else {
            //console.log("Ignoring notificaiton sent within the first few seconds of page load", title, body);
        }
    } catch (e) {
        console.log("Error emitting notification: ", e);
    }
}}}
function silenceNotificationsFor5Seconds() {{{
    boot_time = Date.now();
}}}


class NotificationManager {
    user;
    notifications;
    ordered_notifications;
    unread_notification_count;
    boards_to_move_on;
    turn_offset;
    auth;
    event_emitter: EventEmitter;

    constructor() {{{
        window["notification_manager"] = this;
        this.event_emitter = new EventEmitter();

        this.notifications = {};
        this.ordered_notifications = [];

        this.boards_to_move_on = {};
        this.turn_offset = 0;
        browserHistory.listen(this.onNavigate);
    }}}
    setUser(user) {{{
        if (this.user && (user.id === this.user.id)) {
            return;
        }
        if (user && user.id <= 0) {
            return;
        }
        this.user = user;
        this.auth = data.get("config.notification_auth");
        this.connect();
    }}}
    advanceToNextBoard(ev?) {{{
        let game_id = getCurrentGameId() || 0;
        let board_ids = [];
        //notificationPermissionRequest();
        for (let k in this.boards_to_move_on) {
            board_ids.push(parseInt(this.boards_to_move_on[k].id));
        }
        board_ids.sort((a, b) => { return a - b; });

        if (board_ids.length === 0) {
            return;
        }

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
        if (ev && shouldOpenNewTab(ev)) {
            ++this.turn_offset;
            window.open("/game/" + board_ids[idx], "_blank");
        } else {
            //window.open("/game/" + board_ids[idx]);
            if (window.location.pathname !== "/game/" + board_ids[idx]) {
                browserHistory.push("/game/" + board_ids[idx]);
            }
        }
    }}}
    deleteNotification(notification, dont_rebuild?: boolean) {{{
        comm_socket.send("notification/delete", {"player_id": this.user.id, "auth": this.auth, "notification_id": notification.id});
        delete this.notifications[notification.id];
        if (!dont_rebuild) {
            this.rebuildNotificationList();
        }
    }}}
    clearAllNonActionableNotifications() {{{
        console.log("Should be clearing notifs");
        for (let id in this.notifications) {
            let notification = this.notifications[id];
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
            comm_socket.send("notification/delete", {"player_id": this.user.id, "auth": this.auth, "notification_id": notification.id});
        }
        this.rebuildNotificationList();
    }}}
    connect() {{{
        comm_socket.on("connect", () => {
            comm_socket.send("notification/connect", {"player_id": this.user.id, "auth": this.auth});
        });
        comm_socket.on("disconnect", () => {
            //console.log("Notifier disconnected from " + server);
        });
        comm_socket.on("active_game", (game) => {
            delete this.boards_to_move_on[game.id];

            if (game.phase === "stone removal") {
                if ((game.black.id === data.get("user").id && !game.black.accepted)
                    || (game.white.id === data.get("user").id && !game.white.accepted)
                ) {
                    this.boards_to_move_on[game.id] = game;
                }
            }
            else if (game.phase === "play") {
                if (game.player_to_move === data.get("user").id) {
                    this.boards_to_move_on[game.id] = game;
                }
            }

            if (this.boards_to_move_on[game.id]) {
                let current_game_id = getCurrentGameId();
                if ((current_game_id !== game.id || !document.hasFocus())) {
                    if (game.avg_move_time > 3600) { // don't notify for realtime games ever
                        emitNotification(_("Your Turn"), interpolate("It's your turn in game {{game_id}}", {'game_id': game.id}),
                            () => {
                                if (window.location.pathname !== "/game/" + game.id) {
                                    browserHistory.push("/game/" + game.id);
                                }
                            }
                        );
                    }
                }
            }

            this.event_emitter.emit("turn-count", Object.keys(this.boards_to_move_on).length);
        });

        comm_socket.on("notification", (notification) => {
            if (notification.type === "delete") {
                if (!(notification.id in this.notifications)) {
                    return;
                }
                delete this.notifications[notification.id];
            }
            else {
                this.notifications[notification.id] = notification;
            }

            if (notification.type === "gameStarted") {
                //console.info('Game started');
            }

            if (notification.type === "challenge") {
                emitNotification(_("Challenge Received"), interpolate("You have received a challenge from {{username}}", {'username':  notification.user.username}));
            }

            if (notification.type === "gameDeclined") {
                emitNotification(_("Game Declined"), _("Your game request has been declined"));
            }

            if (notification.type === "friendRequest") {
                emitNotification(_("Friend Request"), _("You have received a new friend request"));
            }

            if (notification.type === "friendAccepted") {
                emitNotification(_("Friend Request Accepted"), _("Your friend request has been accepted"));
            }

            if (notification.type === "friendDeclined") {
                emitNotification(_("Friend Request Declined"), _("Your friend request has been declined"));
            }

            if (notification.type === "gameStarted" ||
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
                }
            }

            this.rebuildNotificationList();

            this.event_emitter.emit("notification", notification);
        });

        return comm_socket;
    }}}
    onNavigate = (location) => {{{
        let current_game_id = getCurrentGameId();
        if (current_game_id) {
            let found = false;
            for (let k in this.notifications) {
                let notification = this.notifications[k];
                if (notification.game_id === current_game_id) {
                    this.deleteNotification(notification, true);
                    found = true;
                }
            }
            if (found) {
                this.rebuildNotificationList();
            }
        }
    }}}
    rebuildNotificationList() {{{
        this.ordered_notifications = [];

        this.unread_notification_count = 0;
        for (let k in this.notifications) {
            this.unread_notification_count += !(this.notifications[k].read) ? 1 : 0;
            this.ordered_notifications.push(this.notifications[k]);
        }

        this.ordered_notifications.sort((a, b) => {
            return (b.timestamp || b.time) - (a.timestamp || a.time); /* wtf why is this not uniform */
        });

        this.event_emitter.emit("notification-count", this.unread_notification_count);
        this.event_emitter.emit("notification-list-updated");
    }}}
}



export let notification_manager: NotificationManager = new NotificationManager();

export class TurnIndicator extends React.Component<{}, any> { /* {{{ */
    constructor(props) {
        super(props);
        this.state = {
            count: Object.keys(notification_manager.boards_to_move_on).length
        };

        this.advanceToNextBoard = this.advanceToNextBoard.bind(this);

        notification_manager.event_emitter.on("turn-count", (ct, next_board) => {
            this.setState({count: ct, next_board: next_board});
        });
    }

    advanceToNextBoard(ev) {
        notification_manager.advanceToNextBoard(ev);
    }

    render() {
        return (
            <span className="turn-indicator" onClick={this.advanceToNextBoard}>
                <span className={this.state.count > 0 ? "active count" : "count"}><span>{this.state.count}</span></span>
            </span>
       );
    }
}; /* }}} */

export class NotificationIndicator extends React.Component<{}, any> { /* {{{ */
    constructor(props) {
        super(props);
        this.state = {
            count: notification_manager.unread_notification_count
        };
        this.setCount = this.setCount.bind(this);
    }

    setCount(ct) {
        this.setState({count: ct});
    }

    componentDidMount() {
        notification_manager.event_emitter.on("notification-count", this.setCount);
    }
    componentWillUnmount() {
        notification_manager.event_emitter.off("notification-count", this.setCount);
    }

    render() {
        return (
            <span>
                <span className={"notification-indicator " + (this.state.count ? "active" : "")}/>
                <span className={"notification-indicator-count " + (this.state.count ? "active" : "")}>{this.state.count}</span>
            </span>
        );
    }
} /* }}} */

export class NotificationList extends React.Component<{}, any> { /* {{{ */
    constructor(props) {
        super(props);
        this.state = {
            list: dup(notification_manager.ordered_notifications)
        };

        let update_debounce = null;
        notification_manager.event_emitter.on("notification-list-updated", () => {
            if (update_debounce) {
                return;
            }

            update_debounce = setTimeout(() => {
                update_debounce = null;
                this.setState({list: dup(notification_manager.ordered_notifications)});
            }, 10);
        });

        this.markAllAsRead = this.markAllAsRead.bind(this);
        this.clearNotifications = this.clearNotifications.bind(this);
    }

    markAllAsRead() {
        notification_manager.event_emitter.emit("notification-count", 0);
    }

    clearNotifications() {
        console.log("Clear notifications");
        notification_manager.clearAllNonActionableNotifications();
    }

    render() {
        return (
            <div className="NotificationList">
                {this.state.list.length === 0 && <div className="no-notifications">{_("No notifications")}</div>}
                {this.state.list.length !== 0 &&
                    <div className="contents">
                        <div className="list">
                            {this.state.list.map((notification, idx) => (
                                <NotificationEntry key={notification.id} notification={notification} />
                            ))}
                        </div>
                        <div className="clear clickable" onClick={this.clearNotifications}>
                            {pgettext("Clear notifications", "Clear Notifications")}
                        </div>
                    </div>
                }
            </div>
        );
    }
} /* }}} */

class NotificationEntry extends React.Component<{notification}, any> { /* {{{ */
    constructor(props) {
        super(props);
        this.state = {
            message: null
        };

        this.del = this.del.bind(this);
        this.onError = this.onError.bind(this);

        if (this.props.notification.type === 'gameOfferRejected') {
            setTimeout(this.del, 1);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (deepEqual(this.props, nextProps) && deepEqual(this.state, nextState)) {
            return false;
        }
        return true;
    }

    del() {
        notification_manager.deleteNotification(this.props.notification);
    }

    onError(err) {
        console.error(err);
        if (err.status === 404) {
            notification_manager.deleteNotification(this.props.notification);
        } else {
            this.setState({message: _("An error has occurred")});
        }
    }



    open = (ev) => {
        if (!$(ev.target).hasClass("fab") && !$(ev.target).hasClass("fa")) {
            let url = this.getOpenUrl();
            if (url) {
                browserHistory.push(url);
            }
        }
    }
    isClickable() {
        return !!this.getOpenUrl();
    }
    getOpenUrl() {
        let notification = this.props.notification;

        switch (notification.type) {
            case "gameStarted":
            case "gameEnded":
            case "timecop":
            case "gameEnteredStoneRemoval":
            case "gameResumedFromStoneRemoval":
                return `/game/${notification.game_id}`;

            case "friendAccepted":
            case "friendDeclined":
            case "groupRequest":
                return `/user/view/${notification.user.id}`;

            case "groupInvitation":
                return `/group/${notification.groupid}`;

            case "groupNews":
                /* Should probably link to the actual posted news content
                 * someday, which is identified by notification.newsid */
                return `/group/${notification.groupid}`;

            case "tournamentInvitation":
            case "tournamentStarted":
            case "tournamentEnded":
                return `/tournament/${notification.tournamentid}`;
        }

        return null;
    }

    render() {
        if (this.state.message) {
            return <div>{this.state.message + "..."}</div>;
        }

        let inner = this.renderNotification();
        if (!inner) {
            return null;
        }

        return <div className={`notification ${this.props.notification.type} ${this.isClickable() ? "clickable" : ""}`} onClick={this.open} >
            <i className="fa fa-times-circle" onClick={this.del} />
            {inner}
        </div>;
    }


    renderNotification() {
        let notification = this.props.notification;

        switch (notification.type) {
            case "test":
                return <div dangerouslySetInnerHTML={{__html: notification.html}}/>;

            case "yourMove":
                console.warn("yourMove notification received");
                return null;

            case "challenge":
                return (
                    <div>
                        {_("Challenge from")} <Player user={notification.user}/>
                        <div className="description">{challenge_text_description(notification)}</div>
                        <div className="buttons">
                            <FabX onClick={() => {
                                this.setState({message: _("Declining")});
                                del("me/challenges/" + notification.challenge_id)
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                            <FabCheck onClick={() => {
                                this.setState({message: _("Accepting")});
                                post(`me/challenges/${notification.challenge_id}/accept`, {})
                                .then(() => {
                                    this.del();
                                    if (isLiveGame(notification.time_control)) {
                                        browserHistory.push("/game/" + notification.game_id);
                                    }
                                })
                                .catch(this.onError);
                            }}/>
                        </div>
                    </div>
                );

            case "gameStarted":
                return <div>{_("Game has started")}: {notification.black} v {notification.white} - {notification.name}</div>;

            case "gameEnded":
                let outcome = notification.outcome;
                if (notification.black_lost && !notification.white_lost) {
                    outcome = interpolate(pgettext("Game outcome: <player that won> by <result>", "%s by %s"), [notification.white, outcome]);
                }
                if (!notification.black_lost && notification.white_lost) {
                    outcome = interpolate(pgettext("Game outcome: <player that won> by <result>", "%s by %s"), [notification.black, outcome]);
                }
                if (notification.annulled) {
                    outcome += ", " + _("game annulled");
                }

                return (
                    <div>
                        <div>
                            {_("Game has ended")}: {notification.black} v {notification.white} - {notification.name}
                        </div>
                        <div>
                            {outcome}
                        </div>
                    </div>
                );

            case "timecop":
                let now = (Date.now()) / 1000;
                let left = Math.floor(notification.time / 1000 - now);
                return <div>{interpolate(_("You have {{time_left}} to make your move!"), {"time_left": formatTime(left)})}</div>;

            case "gameEnteredStoneRemoval":
                return <div>{_("Game has entered the stone removal phase")}</div>;

            case "gameResumedFromStoneRemoval":
                return <div>{_("Game has resumed from the stone removal phase")}</div>;

            case "gameDeclined":
                return null;
                //e.html(_("Game has been declined") + ": " +
                //    notification.challenger + " " + _("vs") + " " + notification.challenged + (notification.name ? " - " + notification.name : ""));

            case "friendRequest":
                return (
                    <div>
                        {_("Friend request from") /* translators: friend request from <user> */} <Player user={notification.user}/>

                        <div className="buttons">
                            <FabX onClick={() => {
                                this.setState({message: _("Declining")});
                                post("me/friends/invitations", { "delete": true, "from_user": notification.user.id })
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                            <FabCheck onClick={() => {
                                this.setState({message: _("Accepting")});
                                post("me/friends/invitations", { "from_user": notification.user.id })
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                        </div>
                    </div>
                );

            case "friendAccepted":
                return <div>{_("Friend request accepted")}: <Player user={notification.user} /></div>;

            case "friendDeclined":
                return <div>{_("Friend request declined")}: <Player user={notification.user} /></div>;

            case "groupRequest":
                return (
                    <div>
                        {_("Group join request from") /* translators: Group join request from <user> */} <Player user={notification.user}/>

                        <div className="buttons">
                            <FabX onClick={() => {
                                this.setState({message: _("Declining")});
                                post("me/groups/invitations", { "delete": true, request_id: notification.rqid })
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                            <FabCheck onClick={() => {
                                this.setState({message: _("Accepting")});
                                post("me/groups/invitations", { request_id: notification.rqid })
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                        </div>
                    </div>
                );

            case "groupAcceptRequest":
                return null;

            case "groupDeclineRequest":
                return null;

            case "groupInvitation":
                return (
                    <div>
                        {interpolate(_("You've received an invitation to join the group {{group_name}}"), {group_name: notification.groupname})}

                        <div className="buttons">
                            <FabX onClick={() => {
                                this.setState({message: _("Declining")});
                                post("me/groups/invitations", { "delete": true, request_id: notification.grouprqid })
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                            <FabCheck onClick={() => {
                                this.setState({message: _("Accepting")});
                                post("me/groups/invitations", { request_id: notification.grouprqid })
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                        </div>
                    </div>
                );

            case "groupAcceptInvite":
                //send invitation acceptance to interested parties
                return null;

            case "groupDeclineInvite":
                //send invitation decline to interested parties
                return null;

            case "groupNews":
                return (
                    <div>
                        <div className="group-name">{notification.groupname}</div>
                        <div className="news-title">{notification.newstitle}</div>
                    </div>
                );

            case "mail":
                return null;

            case "tournamentInvitation":
                return (
                    <div>
                        {interpolate(_("{{username}} has sent you an invitation to join the tournament: {{tournament_name}}"),
                                     {username: notification.invitingUser, tournament_name: notification.tournamentname})}

                        <div className="buttons">
                            <FabX onClick={() => {
                                this.setState({message: _("Declining")});
                                post("me/tournaments/invitations", {"delete": true, "request_id": notification.tournamentrqid})
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                            <FabCheck onClick={() => {
                                this.setState({message: _("Accepting")});
                                post("me/tournaments/invitations", {"request_id": notification.tournamentrqid})
                                .then(this.del)
                                .catch(this.onError);
                            }}/>
                        </div>
                    </div>
                );

            case "tournamentStarted":
                return <div>{interpolate(_("Tournament {{tournament_name}} has started"), {tournament_name: notification.tournamentname})}</div>;

            case "tournamentEnded":
                return <div>{interpolate(_("Tournament {{tournament_name}} has ended"), {tournament_name: notification.tournamentname})}</div>;

            case "gameOfferRejected":
                return null;

            default:
                console.error("Unsupported notification: ", notification.type, notification);
                break;
        }
    }
} /* }}} */


data.watch("config.user", (user) => notification_manager.setUser(user));
