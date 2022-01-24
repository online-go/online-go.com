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
import { routes } from "routes";
import { browserHistory } from "ogsHistory";
import * as data from "data";
import { shouldOpenNewTab, errorLogger, unicodeFilter } from "misc";
import { rankString, getUserRating, PROVISIONAL_RATING_CUTOFF } from "rank_utils";
import { close_all_popovers, popover } from "popover";
import { close_friend_list } from "FriendList/FriendIndicator";
import { PlayerDetails } from "./PlayerDetails";
import { openPlayerNotesModal } from "PlayerNotesModal";
import { Flag } from "Flag";
import { PlayerIcon } from "PlayerIcon";
import * as player_cache from "player_cache";
import * as preferences from "preferences";
import online_status from "online_status";

interface PlayerProperties {
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
    icon?: boolean;
    iconSize?: number;
    user: any;
    flag?: boolean;
    rank?: boolean;
    flare?: boolean;
    online?: boolean;
    nolink?: boolean;
    fakelink?: boolean;
    nodetails?: boolean /* don't open the detials box, instead just open player page */;
    nochallenge?: boolean /* don't show the challenge button in the details box */;
    noextracontrols?: boolean /* Disable extra controls */;
    shownotesindicator?: boolean /* add the notes icon if the player has notes */;
    disableCacheUpdate?: boolean;
}

interface PlayerState {
    is_online: boolean;
    user: any;
    has_notes: boolean;
}

export class Player extends React.PureComponent<PlayerProperties, PlayerState> {
    refs: {
    };

    elt: React.RefObject<HTMLSpanElement>;
    online_subscription_user_id = null;
    unmounted: boolean = false;

    constructor(props) {
        super(props);
        const user = data.get("config.user");
        const viewed_user = typeof props.user === "object" ? props.user : null;
        this.state = {
            is_online: false,
            user: viewed_user,
            has_notes: viewed_user && !!data.get(`player-notes.${user.id}.${viewed_user.id}`),
        };
        this.elt = React.createRef();

    }

    componentDidMount() {
        const user = data.get("config.user");
        if (!this.props.disableCacheUpdate) {
            if (this.state.user && this.state.user.id > 0) {
                player_cache.update(this.state.user);
            }

            const player_id =
                typeof this.props.user !== "object"
                    ? this.props.user
                    : this.props.user.id || this.props.user.player_id;
            const username = typeof this.props.user !== "object" ? null : this.props.user.username;
            if (player_id && player_id > 0) {
                player_cache
                    .fetch(player_id, ["username", "ui_class", "ranking", "pro"])
                    .then((user) => {
                        const player_id =
                            typeof this.props.user !== "object"
                                ? this.props.user
                                : this.props.user.id || this.props.user.player_id;
                        if (this.unmounted) {
                            return;
                        }
                        if (player_id === user.id) {
                            this.setState({ user: user });
                        }
                    })
                    .catch((user) => {
                        this.setState({
                            user: {
                                id: player_id,
                                username: "?player" + player_id + "?",
                                ui_class: "provisional",
                                pro: false,
                            },
                        });
                        errorLogger(user);
                    });
            } else if (player_id && player_id <= 0) {
                // do nothing
            } else if (username && username !== "...") {
                player_cache
                    .fetch_by_username(username, ["username", "ui_class", "ranking", "pro"])
                    .then((user) => {
                        if (this.unmounted) {
                            return;
                        }
                        if (username === user.username) {
                            this.setState({ user: user });
                        }
                    })
                    .catch((user) => {
                        this.setState({
                            user: {
                                id: null,
                                username: username,
                                ui_class: "provisional",
                                pro: false,
                            },
                        });
                        errorLogger(user);
                    });
            }
        }

        this.syncUpdateOnline(this.props.user);
        if (this.props.shownotesindicator) {
            data.watch(`player-notes.${user.id}.${this.props.user.id}`, this.updateHasNotes);
        }
    }

    updateHasNotes = () => {
        const user = data.get("config.user");
        const tf = !!data.get(`player-notes.${user.id}.${this.props.user.id}`);
        if (tf !== this.state.has_notes) {
            this.setState({ has_notes: tf });
        }
    };

    updateOnline = (_player_id, tf) => {
        if (this.unmounted) {
            return;
        }
        this.setState({ is_online: tf });
    };

    syncUpdateOnline(user_or_id) {
        const id =
            typeof user_or_id === "number"
                ? user_or_id
                : typeof user_or_id === "object" && user_or_id
                ? user_or_id.id
                : null;

        if (!this.props.online || id !== this.online_subscription_user_id) {
            if (this.online_subscription_user_id) {
                this.online_subscription_user_id = null;
                online_status.unsubscribe(this.online_subscription_user_id, this.updateOnline);
            }
        }
        if (this.props.online && id && id !== this.online_subscription_user_id) {
            this.online_subscription_user_id = id;
            online_status.subscribe(this.online_subscription_user_id, this.updateOnline);
        }
    }

    UNSAFE_componentWillReceiveProps(new_props) {
        const user = data.get("config.user");
        if (this.props.shownotesindicator) {
            data.unwatch(`player-notes.${user.id}.${this.state.user.id}`, this.updateHasNotes);
        }

        if (typeof new_props.user === "object") {
            this.setState({ user: new_props.user });
        } else {
            this.setState({ user: null });
        }

        if (new_props.shownotesindicator) {
            data.watch(`player-notes.${user.id}.${new_props.user.id}`, this.updateHasNotes);
        }

        if (!new_props.disableCacheUpdate) {
            const player_id =
                typeof new_props.user !== "object"
                    ? new_props.user
                    : new_props.user.id || new_props.user.player_id;
            const username = typeof new_props.user !== "object" ? null : new_props.user.username;

            if (typeof new_props.user === "object" && new_props.user.id > 0) {
                player_cache.update(new_props.user);
            }

            if (player_id && player_id > 0) {
                player_cache
                    .fetch(player_id, ["username", "ui_class", "ranking", "pro"])
                    .then((user) => {
                        const player_id =
                            typeof this.props.user !== "object"
                                ? this.props.user
                                : this.props.user.id || this.props.user.player_id;
                        if (this.unmounted) {
                            return;
                        }
                        if (player_id === user.id) {
                            this.setState({ user: user });
                        }
                    })
                    .catch((user) => {
                        this.setState({
                            user: {
                                id: player_id,
                                username: "?player" + player_id + "?",
                                ui_class: "provisional",
                                pro: false,
                            },
                        });
                        errorLogger(user);
                    });
            } else if (player_id && player_id <= 0) {
                // do nothing
            } else if (username && username !== "...") {
                player_cache
                    .fetch_by_username(username, ["username", "ui_class", "ranking", "pro"])
                    .then((user) => {
                        if (this.unmounted) {
                            return;
                        }
                        if (username === user.username) {
                            this.setState({ user: user });
                        }
                    })
                    .catch((user) => {
                        this.setState({
                            user: {
                                id: null,
                                username: username,
                                ui_class: "provisional",
                                pro: false,
                            },
                        });
                        errorLogger(user);
                    });
            }
        }

        this.syncUpdateOnline(new_props.user);
    }
    componentDidUpdate() {
        this.syncUpdateOnline(this.props.user);
    }
    componentWillUnmount() {
        const user = data.get("config.user");
        this.unmounted = true;
        this.syncUpdateOnline(null);
        if (this.props.shownotesindicator) {
            data.unwatch(`player-notes.${user.id}.${this.state.user.id}`, this.updateHasNotes);
        }
    }

    openPlayerNotes = (ev) => {
        openPlayerNotesModal(ev.target.getAttribute("data-id"));
    };

    render() {
        if (!this.state.user) {
            if (typeof this.props.user === "number") {
                return (
                    <span className="Player" data-player-id={0}>
                        ...
                    </span>
                );
            } else {
                return (
                    <span className="Player" data-player-id={0}>
                        [NULL USER]
                    </span>
                );
            }
        }

        const props = this.props;
        const player = this.state.user;
        const player_id = player.id || player.player_id;
        const nolink = !!this.props.nolink;
        let rank: JSX.Element = null;

        const main_attrs: any = {
            className: "Player",
            "data-player-id": player_id,
        };

        if (props.icon) {
            main_attrs.className += " Player-with-icon";
        }

        if (player.ui_class) {
            main_attrs.className += " " + player.ui_class;
        }

        if (player_id < 0) {
            main_attrs.className += " guest";
        }

        if (!player_id || nolink) {
            main_attrs.className += " nolink";
        }

        if (this.props.nodetails) {
            main_attrs.className += " nodetails";
        }

        if (this.props.noextracontrols) {
            main_attrs.className += " noextracontrols";
        }

        if (this.props.rank !== false) {
            const rating = getUserRating(player, "overall", 0);
            let rank_text = "E";

            if (player.pro || player.professional) {
                rank_text = rankString(player);
            } else if (rating.unset && (player.rank > 0 || player.ranking > 0)) {
                /* This is to support displaying archived chat lines */
                rank_text = rankString(player);
            } else if (rating.deviation >= PROVISIONAL_RATING_CUTOFF) {
                rank_text = "?";
            } else {
                rank_text = rating.bounded_rank_label;
            }

            if (!preferences.get("hide-ranks")) {
                rank = <span className="Player-rank">[{rank_text}]</span>;
            }
        }

        if (props.flare) {
            main_attrs.className += " with-flare";
        }

        if (props.online) {
            main_attrs.className += this.state.is_online ? " online" : " offline";
        }

        const username_string = unicodeFilter(player.username || player.name);
        const username = <span className="Player-username">{username_string}</span>;

        const player_note_indicator =
            this.props.shownotesindicator && this.state.has_notes ? (
                <i
                    className={"Player fa fa-clipboard"}
                    onClick={this.openPlayerNotes}
                    data-id={player.id}
                />
            ) : null;

        if (
            this.props.nolink ||
            this.props.fakelink ||
            !(this.state.user.id || this.state.user.player_id) ||
            this.state.user.anonymous ||
            (this.state.user.id || this.state.user.player_id) < 0
        ) {
            return (
                <span ref={this.elt} {...main_attrs} onMouseDown={this.display_details}>
                    {(props.icon || null) && (
                        <PlayerIcon user={player} size={props.iconSize || 16} />
                    )}
                    {(props.flag || null) && <Flag country={player.country} />}
                    {username}
                    {rank}
                    {player_note_indicator}
                </span>
            );
        } else {
            const player_id = this.state.user.id || this.state.user.player_id;
            const uri = `/player/${player_id}/${encodeURIComponent(username_string)}`;

            return (
                // if only we could put {...main_attrs} on the span, we could put the styles in .Player.  But router seems to hate that.
                <span>
                    <a
                        href={uri}
                        ref={this.elt}
                        {...main_attrs}
                        onMouseDown={this.display_details}
                        router={routes}
                    >
                        {(props.icon || null) && (
                            <PlayerIcon user={player} size={props.iconSize || 16} />
                        )}
                        {(props.flag || null) && <Flag country={player.country} />}
                        {username}
                        {rank}
                    </a>
                    {player_note_indicator}
                </span>
            );
        }
    }

    display_details = (event) => {
        if (
            this.props.nolink ||
            !(this.state.user.id || this.state.user.player_id) ||
            this.state.user.anonymous ||
            (this.state.user.id || this.state.user.player_id) < 0
        ) {
            return;
        }

        if (
            ("buttons" in event && event.buttons & 2) ||
            ("button" in event && event.button === 2)
        ) {
            /* on click with right mouse button do nothing.
               buttons uses on bit per button, alowing for multiple buttons pressed at the same time. The bit with value 2 is the right mouse button. https://www.w3schools.com/jsref/event_buttons.asp
               buttons isn't supported in all browsers, so we have to check button as fallback. */
            return;
        }

        if (!this.props.fakelink && shouldOpenNewTab(event)) {
            /* let browser deal with opening the window so we don't get popup warnings */
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        const player_id = this.state.user.id || this.state.user.player_id;
        if (shouldOpenNewTab(event)) {
            let uri = `/player/${player_id}`;
            const player = player_cache.lookup(player_id);
            if (player) {
                uri += "/" + encodeURIComponent(unicodeFilter(player.username));
            }
            window.open(uri, "_blank");
        } else if (this.props.nodetails) {
            close_all_popovers();
            close_friend_list();
            browserHistory.push(`/player/${player_id}/`);
            return;
        } else {
            let chat_id = null;
            try {
                let cur = $(this.elt.current);

                while (cur && cur[0].nodeName !== "BODY") {
                    chat_id = cur.attr("data-chat-id");
                    if (chat_id) {
                        break;
                    }
                    cur = cur.parent();
                }
            } catch (e) {
                console.error(e);
            }

            popover({
                elt: (
                    <PlayerDetails
                        playerId={player_id}
                        noextracontrols={this.props.noextracontrols}
                        nochallenge={this.props.nochallenge}
                        chatId={chat_id}
                    />
                ),
                below: this.elt.current,
                minWidth: 240,
                minHeight: 250,
            });
        }
    };
}
