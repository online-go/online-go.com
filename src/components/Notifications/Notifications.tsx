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
import * as data from "data";

import { _, interpolate, pgettext } from "translate";
import { dup, deepEqual } from "misc";
import { isLiveGame } from "TimeControl";
import { post, del } from "requests";
import { browserHistory } from "ogsHistory";
import { challenge_text_description } from "ChallengeModal";
import { Player } from "Player";
import { FabX, FabCheck } from "material";

import { NotificationManager } from "./NotificationManager";

function formatTime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

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
        return hours + 1 + " " + _("hours");
    }

    if (hours) {
        return hours + ":" + (minutes < 10 ? "0" : "") + minutes;
    }

    if (minutes) {
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }
    return _("no time left");
}

export const notification_manager: NotificationManager = new NotificationManager();

export function TurnIndicator(): JSX.Element {
    const [count, setCount] = React.useState(0);
    const [total, setTotal] = React.useState(0);

    React.useEffect(() => {
        notification_manager.event_emitter.on("turn-count", (ct) => {
            setCount(ct);
        });

        notification_manager.event_emitter.on("total-count", (tt) => {
            setTotal(tt);
        });
    }, []);

    return (
        <span
            className="turn-indicator"
            onAuxClick={advanceToNextBoard}
            onClick={advanceToNextBoard}
        >
            <span className={total > 0 ? (count > 0 ? "active count" : "inactive count") : "count"}>
                <span>{count}</span>
            </span>
        </span>
    );
}

function advanceToNextBoard(ev: React.MouseEvent) {
    notification_manager.advanceToNextBoard(ev);
}

export class NotificationIndicator extends React.Component<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            count: notification_manager.unread_notification_count,
        };
        this.setCount = this.setCount.bind(this);
    }

    setCount(ct) {
        this.setState({ count: ct });
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
                <span className={"notification-indicator " + (this.state.count ? "active" : "")} />
                <span
                    className={"notification-indicator-count " + (this.state.count ? "active" : "")}
                >
                    {this.state.count}
                </span>
            </span>
        );
    }
}

export class NotificationList extends React.Component<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            list: dup(notification_manager.ordered_notifications),
        };

        let update_debounce = null;
        notification_manager.event_emitter.on("notification-list-updated", () => {
            if (update_debounce) {
                return;
            }

            update_debounce = setTimeout(() => {
                update_debounce = null;
                this.setState({ list: dup(notification_manager.ordered_notifications) });
            }, 10);
        });

        this.markAllAsRead = this.markAllAsRead.bind(this);
        this.clearNotifications = this.clearNotifications.bind(this);
    }

    markAllAsRead() {
        notification_manager.event_emitter.emit("notification-count", 0);
    }

    clearNotifications() {
        notification_manager.clearAllNonActionableNotifications();
    }

    render() {
        return (
            <div className="NotificationList">
                {this.state.list.length === 0 && (
                    <div className="no-notifications">{_("No notifications")}</div>
                )}
                {this.state.list.length !== 0 && (
                    <div className="contents">
                        <div className="list">
                            {this.state.list.map((notification) => (
                                <NotificationEntry
                                    key={notification.id}
                                    notification={notification}
                                />
                            ))}
                        </div>
                        <div className="clear clickable" onClick={this.clearNotifications}>
                            {pgettext("Clear notifications", "Clear Notifications")}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

class NotificationEntry extends React.Component<{ notification }, any> {
    constructor(props) {
        super(props);
        this.state = {
            message: null,
        };

        this.del = this.del.bind(this);
        this.onError = this.onError.bind(this);

        if (this.props.notification.type === "gameOfferRejected") {
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
            this.setState({ message: _("An error has occurred") });
        }
    }

    open = (ev) => {
        if (!$(ev.target).hasClass("fab") && !$(ev.target).hasClass("fa")) {
            const url = this.getOpenUrl();
            if (url) {
                browserHistory.push(url);
            }
        }
    };
    isClickable() {
        return !!this.getOpenUrl();
    }
    getOpenUrl() {
        const notification = this.props.notification;

        switch (notification.type) {
            case "gameStarted":
            case "gameEnded":
            case "timecop":
            case "gameEnteredStoneRemoval":
            case "gameResumedFromStoneRemoval":
                if (notification.game_id === undefined) {
                    console.error("Notification Error: game_id not found", notification);
                }
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

            case "aiReviewDone":
                return `/game/${notification.game_id}`;
        }

        return null;
    }

    render() {
        if (this.state.message) {
            return <div>{this.state.message + "..."}</div>;
        }

        const inner = this.renderNotification();
        if (!inner) {
            return null;
        }

        return (
            <div
                className={`notification ${this.props.notification.type} ${
                    this.isClickable() ? "clickable" : ""
                }`}
                onClick={this.open}
            >
                <i className="fa fa-times-circle" onClick={this.del} />
                {inner}
            </div>
        );
    }

    renderNotification() {
        const notification = this.props.notification;

        switch (notification.type) {
            case "test":
                return <div dangerouslySetInnerHTML={{ __html: notification.html }} />;

            case "yourMove":
                console.warn("yourMove notification received");
                return null;

            case "challenge":
                return (
                    <div>
                        {_("Challenge from")} <Player user={notification.user} />
                        <div className="description">
                            {challenge_text_description(notification)}
                        </div>
                        <div className="buttons">
                            <FabX
                                onClick={() => {
                                    this.setState({ message: _("Declining") });
                                    del("me/challenges/%%", notification.challenge_id)
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
                            <FabCheck
                                onClick={() => {
                                    this.setState({ message: _("Accepting") });
                                    post("me/challenges/%%/accept", notification.challenge_id, {})
                                        .then(() => {
                                            this.del();
                                            if (isLiveGame(notification.time_control)) {
                                                browserHistory.push(
                                                    "/game/" + notification.game_id,
                                                );
                                            }
                                        })
                                        .catch(this.onError);
                                }}
                            />
                        </div>
                    </div>
                );

            case "gameStarted":
                return (
                    <div>
                        {_("Game has started")}: {notification.black} v {notification.white} -{" "}
                        {notification.name}
                    </div>
                );

            case "gameEnded": {
                let outcome = notification.outcome;
                if (notification.black_lost && !notification.white_lost) {
                    outcome = interpolate(
                        pgettext("Game outcome: <player that won> by <result>", "%s by %s"),
                        [notification.white, outcome],
                    );
                }
                if (!notification.black_lost && notification.white_lost) {
                    outcome = interpolate(
                        pgettext("Game outcome: <player that won> by <result>", "%s by %s"),
                        [notification.black, outcome],
                    );
                }
                if (notification.annulled) {
                    outcome += ", " + _("game annulled");
                }

                return (
                    <div>
                        <div>
                            {_("Game has ended")}: {notification.black} v {notification.white} -{" "}
                            {notification.name}
                        </div>
                        <div>{outcome}</div>
                    </div>
                );
            }

            case "timecop": {
                const now = Date.now() / 1000;
                const left = Math.floor(notification.time / 1000 - now);
                return (
                    <div>
                        {interpolate(_("You have {{time_left}} to make your move!"), {
                            time_left: formatTime(left),
                        })}
                    </div>
                );
            }

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
                        {_("Friend request from") /* translators: friend request from <user> */}{" "}
                        <Player user={notification.user} />
                        <div className="buttons">
                            <FabX
                                onClick={() => {
                                    this.setState({ message: _("Declining") });
                                    post("me/friends/invitations", {
                                        delete: true,
                                        from_user: notification.user.id,
                                    })
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
                            <FabCheck
                                onClick={() => {
                                    this.setState({ message: _("Accepting") });
                                    post("me/friends/invitations", {
                                        from_user: notification.user.id,
                                    })
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
                        </div>
                    </div>
                );

            case "friendAccepted":
                return (
                    <div>
                        {_("Friend request accepted")}: <Player user={notification.user} />
                    </div>
                );

            case "friendDeclined":
                return (
                    <div>
                        {_("Friend request declined")}: <Player user={notification.user} />
                    </div>
                );

            case "groupRequest":
                return (
                    <div>
                        {
                            _(
                                "Group join request from",
                            ) /* translators: Group join request from <user> */
                        }{" "}
                        <Player user={notification.user} />
                        <div className="buttons">
                            <FabX
                                onClick={() => {
                                    this.setState({ message: _("Declining") });
                                    post("me/groups/invitations", {
                                        delete: true,
                                        request_id: notification.rqid,
                                    })
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
                            <FabCheck
                                onClick={() => {
                                    this.setState({ message: _("Accepting") });
                                    post("me/groups/invitations", { request_id: notification.rqid })
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
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
                        {interpolate(
                            _("You've received an invitation to join the group {{group_name}}"),
                            {
                                group_name: notification.groupname,
                            },
                        )}

                        <div className="buttons">
                            <FabX
                                onClick={() => {
                                    this.setState({ message: _("Declining") });
                                    post("me/groups/invitations", {
                                        delete: true,
                                        request_id: notification.grouprqid,
                                    })
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
                            <FabCheck
                                onClick={() => {
                                    this.setState({ message: _("Accepting") });
                                    post("me/groups/invitations", {
                                        request_id: notification.grouprqid,
                                    })
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
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
                        {interpolate(
                            _(
                                "{{username}} has sent you an invitation to join the tournament: {{tournament_name}}",
                            ),
                            {
                                username: notification.invitingUser,
                                tournament_name: notification.tournamentname,
                            },
                        )}

                        <div className="buttons">
                            <FabX
                                onClick={() => {
                                    this.setState({ message: _("Declining") });
                                    post("me/tournaments/invitations", {
                                        delete: true,
                                        request_id: notification.tournamentrqid,
                                    })
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
                            <FabCheck
                                onClick={() => {
                                    this.setState({ message: _("Accepting") });
                                    post("me/tournaments/invitations", {
                                        request_id: notification.tournamentrqid,
                                    })
                                        .then(this.del)
                                        .catch(this.onError);
                                }}
                            />
                        </div>
                    </div>
                );

            case "tournamentStarted":
                return (
                    <div>
                        {interpolate(_("Tournament {{tournament_name}} has started"), {
                            tournament_name: notification.tournamentname,
                        })}
                    </div>
                );

            case "tournamentEnded":
                return (
                    <div>
                        {interpolate(_("Tournament {{tournament_name}} has ended"), {
                            tournament_name: notification.tournamentname,
                        })}
                    </div>
                );

            case "gameOfferRejected":
                return null;

            case "aiReviewDone":
                return (
                    <div>
                        {interpolate(
                            _("The computer has finished analyzing your game: {{game_name}}"),
                            {
                                game_name: notification.game_name,
                            },
                        )}
                    </div>
                );

            case "lateChatReceivedInGame":
                return (
                    <div className="late-notification">
                        <a href={`/game/${notification.game_id}`}>
                            {interpolate(_("{{username}} added chat to your finished game"), {
                                username: notification.from.username,
                            })}
                        </a>
                    </div>
                );

            default:
                console.error("Unsupported notification: ", notification.type, notification);
                break;
        }
    }
}

data.watch("config.user", (user) => notification_manager.setUser(user));
