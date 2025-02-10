/*
 * Copyright (C)  Online-Go.com
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
import { toast } from "@/lib/toast";
import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext } from "@/lib/translate";
import { post } from "@/lib/requests";
import { shouldOpenNewTab, errorAlerter, ignore } from "@/lib/misc";
import { getUserRating, humble_rating } from "@/lib/rank_utils";
import * as player_cache from "@/lib/player_cache";
import { icon_size_url } from "@/components/PlayerIcon";
import { socket } from "@/lib/sockets";
import * as data from "@/lib/data";
import { close_all_popovers } from "@/lib/popover";
import { Flag } from "@/components/Flag";
import { ban, shadowban, remove_shadowban, remove_ban } from "@/views/Moderator/ban_functions";
import { challenge } from "@/components/ChallengeModal";
import { getPrivateChat } from "@/components/PrivateChat";
import { openBlockPlayerControls } from "@/components/BlockPlayer";
import { Player } from "./Player";
import * as preferences from "@/lib/preferences";
import { close_friend_list } from "@/components/FriendList/close_friend_list";
import cached from "@/lib/cached";
import { openPlayerNotesModal } from "@/components/PlayerNotesModal";
import { alert } from "@/lib/swal_config";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { openReport } from "@/components/Report";

interface PlayerDetailsProperties {
    playerId: number;
    chatId?: string;
    gameChatId?: string;
    reviewChatId?: string;
    noextracontrols?: boolean;
    nochallenge?: boolean; // don't show challenge options for this player - typically due to ladder considerations
}

let friends: { [id: number]: true } = {};
data.watch(cached.friends, (friends_arr) => {
    friends = {};
    for (const friend of friends_arr) {
        friends[friend.id] = true;
    }
});

let extraActionCallback:
    | ((user_id: number, user: any) => React.ReactElement | null | undefined)
    | null
    | undefined;

interface PlayerDetailsState {
    id?: PlayerCacheEntry["id"];
    resolved: boolean;
    username: string | PlayerCacheEntry["username"];
    icon: PlayerCacheEntry["icon"];
    ranking: PlayerCacheEntry["ranking"];
    rating: string | PlayerCacheEntry["rating"];
    ratings?: PlayerCacheEntry["ratings"];
    ui_class: string | PlayerCacheEntry["ui_class"];
    country: string | PlayerCacheEntry["country"];
    error?: string;
}

export class PlayerDetails extends React.PureComponent<
    PlayerDetailsProperties,
    PlayerDetailsState
> {
    constructor(props: PlayerDetailsProperties) {
        super(props);
        this.state = this.blankState();
        const player = player_cache.lookup(this.props.playerId);
        if (player) {
            this.state = Object.assign(this.state, player);
        }
    }

    componentDidMount() {
        this.resolve(this.props.playerId);
    }

    blankState(): PlayerDetailsState {
        return {
            resolved: false,
            username: "...",
            //icon: data.get('config.cdn_release') + '/img/default-user.svg',
            icon: "",
            ranking: 0,
            rating: "...",
            ui_class: "...",
            country: "un",
            error: undefined,
        };
    }
    resolve(player_id: number) {
        this.setState({ resolved: false });
        player_cache
            .fetch(this.props.playerId, [
                "username",
                "icon",
                "ratings",
                "pro",
                "country",
                "ui_class",
            ])
            .then((player) => {
                this.setState(Object.assign({}, player as any, { resolved: true }));
            })
            .catch((err) => {
                if (player_id === this.props.playerId) {
                    this.setState({
                        resolved: false,
                        error: _("Error loading player information"),
                    });
                    console.error(err);
                }
            });
    }
    componentDidUpdate(prev_props: PlayerDetailsProperties) {
        if (prev_props.playerId !== this.props.playerId) {
            const player = player_cache.lookup(this.props.playerId);
            let new_state = this.blankState();
            if (player) {
                new_state = Object.assign(new_state, this.state, player);
            }
            this.setState(new_state);
            setTimeout(() => {
                this.resolve(this.props.playerId);
            }, 1);
        }
    }

    close_all_modals_and_popovers = () => {
        close_all_popovers();
        close_friend_list();
    };

    gotoPlayerView = (ev: React.MouseEvent<HTMLButtonElement>) => {
        this.close_all_modals_and_popovers();

        const url = `/player/${this.props.playerId}/${this.state.username}`;
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    };
    challenge = () => {
        challenge(this.props.playerId);
        this.close_all_modals_and_popovers();
    };
    message = () => {
        getPrivateChat(this.props.playerId).open();
        this.close_all_modals_and_popovers();
    };
    report = () => {
        openReport({ reported_user_id: this.props.playerId });
        this.close_all_modals_and_popovers();
    };
    block = (ev: React.MouseEvent<HTMLButtonElement>) => {
        const controls = openBlockPlayerControls(ev, this.props.playerId);
        controls.on("close", () => {
            this.close_all_modals_and_popovers();
        });
    };
    ban = () => {
        const promise = ban(this.props.playerId);
        if (promise) {
            promise.then(this.close_all_modals_and_popovers).catch(errorAlerter);
        }
        this.close_all_modals_and_popovers();
    };
    shadowban = () => {
        shadowban(this.props.playerId).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    };
    removeShadowban = () => {
        remove_shadowban(this.props.playerId)
            .then(this.close_all_modals_and_popovers)
            .catch(errorAlerter);
    };
    removeBan = () => {
        remove_ban(this.props.playerId)
            .then(this.close_all_modals_and_popovers)
            .catch(errorAlerter);
    };
    openSupporterPage = (ev: React.MouseEvent<HTMLButtonElement>) => {
        this.close_all_modals_and_popovers();
        const url = `/supporter/${this.props.playerId}/${this.state.username}`;
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    };

    editPlayerNotes = () => {
        this.close_all_modals_and_popovers();
        openPlayerNotesModal(this.props.playerId);
    };

    addFriend = () => {
        toast(<div>{_("Sent friend request")}</div>, 5000);
        this.close_all_modals_and_popovers();
        post("me/friends", { player_id: this.props.playerId }).then(ignore).catch(errorAlerter);
    };
    removeFriend = () => {
        toast(<div>{_("Removed friend")}</div>, 5000);
        this.close_all_modals_and_popovers();
        post("me/friends", { delete: true, player_id: this.props.playerId })
            .then(ignore)
            .catch(errorAlerter);
    };
    removeSingleLine = () => {
        const m = this.props.chatId?.match(/^([gr]).([^.]+).([^.]+).(.+)/);
        if (m) {
            const game = m[1] === "g";
            const id = parseInt(m[2]);
            const channel = m[3];
            const chat_id = m[4];

            console.log(game ? "game" : "review", id, channel, chat_id);
            if (game) {
                socket.send("game/chat/remove", {
                    game_id: id,
                    channel: channel,
                    chat_id: chat_id,
                });
            } else {
                // review
                socket.send("review/chat/remove", {
                    review_id: id,
                    channel: channel,
                    chat_id: chat_id,
                });
            }
        } else {
            if (this.props.chatId) {
                socket.send("chat/remove", { uuid: this.props.chatId });
            }
        }

        this.close_all_modals_and_popovers();
    };

    removeAllChats = () => {
        this.close_all_modals_and_popovers();

        void alert
            .fire({
                text: _(
                    `Are you sure you wish to remove all non-game chats made by user ${this.props.playerId}? This is not reversible.`,
                ),
                confirmButtonText: _("Yes"),
                cancelButtonText: _("No"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: yes }) => {
                if (yes) {
                    socket.send("chat/remove_all", { player_id: this.props.playerId });
                }
            });
    };

    render() {
        const user = data.get("user");

        const rating =
            !preferences.get("hide-ranks") &&
            (this.state.ratings ? getUserRating(this.state, "overall", 0) : null);

        const add_note_label = data.get(`player-notes.${user.id}.${this.props.playerId}`)
            ? _("Player notes")
            : _("Add notes");

        return (
            <div className="PlayerDetails">
                <div className="details">
                    <div
                        className="icon"
                        style={{
                            backgroundImage:
                                'url("' + icon_size_url(this.state.icon || "", 64) + '")',
                        }}
                    >
                        <span style={{ position: "absolute", bottom: -4, right: 0 }}>
                            <Flag country={this.state.country || ""} />
                        </span>
                    </div>
                    <div className="player-info">
                        <div>
                            <Player user={this.state} nodetails rank={false} />
                        </div>
                        {rating && !!rating.professional && (
                            <div>
                                <span className="rank">{rating.rank_label}</span>
                            </div>
                        )}
                        {rating && !rating.professional && (
                            <div>
                                <span className="rating">
                                    {Math.round(humble_rating(rating.rating, rating.deviation))}{" "}
                                    &plusmn; {Math.round(rating.deviation)}
                                </span>
                            </div>
                        )}
                        {rating && !rating.professional && !rating.provisional && (
                            <div>
                                <span className="rank">
                                    {rating.partial_bounded_rank_label} &plusmn;{" "}
                                    {rating.rank_deviation.toFixed(1)}
                                </span>
                            </div>
                        )}
                        {rating && !rating.professional && rating.provisional && (
                            <div>
                                <span className="rank">{_("Provisional rank")}</span>
                            </div>
                        )}
                    </div>
                </div>
                {!user.anonymous && (user.id !== this.props.playerId || null) && (
                    <div className="actions">
                        {!this.props.nochallenge && (
                            <button
                                className="xs no-shadow primary"
                                disabled={!this.state.resolved}
                                onClick={this.challenge}
                            >
                                <i className="ogs-goban" />
                                {_("Challenge")}
                            </button>
                        )}
                        {this.props.nochallenge && <div style={{ width: "48%" }}></div>}

                        <button
                            className="xs no-shadow success"
                            disabled={!this.state.resolved}
                            onClick={this.editPlayerNotes}
                        >
                            <i className="fa fa-clipboard" />
                            {add_note_label}
                        </button>

                        <button
                            className="xs no-shadow success"
                            disabled={!this.state.resolved}
                            onClick={this.message}
                        >
                            <i className="fa fa-comment-o" />
                            {_("Message")}
                        </button>
                        {friends[this.props.playerId] ? (
                            <button
                                className="xs no-shadow reject"
                                disabled={!this.state.resolved}
                                onClick={this.removeFriend}
                            >
                                <i className="fa fa-frown-o" />
                                {_("Remove friend")}
                            </button>
                        ) : (
                            <button
                                className="xs no-shadow success"
                                disabled={!this.state.resolved}
                                onClick={this.addFriend}
                            >
                                <i className="fa fa-smile-o" />
                                {_("Add friend")}
                            </button>
                        )}
                        <button
                            className="xs no-shadow reject"
                            disabled={!this.state.resolved}
                            onClick={this.report}
                        >
                            <i className="fa fa-exclamation-triangle" />
                            {_("Report")}
                        </button>
                        <button
                            className="xs no-shadow reject"
                            disabled={!this.state.resolved}
                            onClick={this.block}
                        >
                            <i className="fa fa-ban" />
                            {_("Block")}
                        </button>
                    </div>
                )}
                {!user.anonymous &&
                    !this.props.noextracontrols &&
                    extraActionCallback &&
                    extraActionCallback(this.props.playerId, this.state)}
                {(user.is_moderator || null) && (
                    <div className="actions">
                        {(this.props.chatId || null) && (
                            <button className="xs no-shadow reject" onClick={this.removeSingleLine}>
                                <i className="fa fa-times" />
                                {pgettext("Remove chat line", "Remove chat line")}
                            </button>
                        )}
                        <button className="xs no-shadow reject" onClick={this.removeAllChats}>
                            <i className="fa fa-times-circle" />
                            {pgettext("Remove all chat lines from this user", "Remove all chats")}
                        </button>
                    </div>
                )}
                {((user.is_moderator && this.props.playerId > 0) || null) && (
                    <div className="actions">
                        <button className="xs no-shadow reject" onClick={this.ban}>
                            <i className="fa fa-gavel" />
                            {pgettext("Ban user from the server", "Ban")}
                        </button>
                        <button className="xs no-shadow danger" onClick={this.shadowban}>
                            <i className="fa fa-commenting" />
                            {pgettext("Disallow user to chat", "Shadowban")}
                        </button>
                    </div>
                )}
                {((user.is_moderator && this.props.playerId > 0) || null) && (
                    <div className="actions">
                        <button className="xs no-shadow" onClick={this.removeBan}>
                            <i className="fa fa-thumbs-o-up" />
                            {pgettext("Allow user on the server", "Un-Ban")}
                        </button>
                        <button className="xs no-shadow" onClick={this.removeShadowban}>
                            <i className="fa fa-commenting-o" />
                            {pgettext("Remove chat ban", "Un-Shadowban")}
                        </button>
                    </div>
                )}
                {((user.is_superuser && this.props.playerId > 0) || null) && (
                    <div className="actions">
                        <button className="xs no-shadow" onClick={this.openSupporterPage}>
                            <i className="fa fa-star" />
                            Supporter Page
                        </button>
                    </div>
                )}
            </div>
        );
    }
}

export function setExtraActionCallback(cb?: typeof extraActionCallback) {
    extraActionCallback = cb;
}
