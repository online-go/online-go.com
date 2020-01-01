/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {toast} from "toast";
import {browserHistory} from "ogsHistory";
import {_, pgettext} from "translate";
import {post} from "requests";
import {shouldOpenNewTab, errorAlerter, alertModerator, ignore} from "misc";
import {rankString, getUserRating, is_novice, humble_rating} from "rank_utils";
import * as player_cache from "player_cache";
import {icon_size_url} from "PlayerIcon";
import {termination_socket} from "sockets";
import * as data from "data";
import {close_all_popovers} from "popover";
import {Flag} from "Flag";
import {ban, shadowban, remove_shadowban, remove_ban} from "Moderator";
import {openSupporterAdminModal} from "SupporterAdmin";
import {challenge} from "ChallengeModal";
import {getPrivateChat} from "PrivateChat";
import {openBlockPlayerControls} from "BlockPlayer";
import {Player} from "./Player";
import * as preferences from "preferences";
import {close_friend_list} from 'FriendList/FriendIndicator';
import cached from 'cached';

declare var swal;

interface PlayerDetailsProperties {
    playerId: number;
    chatId?: string;
    gameChatId?: string;
    reviewChatId?: string;
    noextracontrols?: boolean;
    nochallenge?: boolean;
}

let friends = {};
data.watch(cached.friends, (friends_arr) => {
    friends = {};
    for (let friend of friends_arr) {
        friends[friend.id] = true;
    }
});

let extraActionCallback: (user_id: number, user: any) => JSX.Element = null;

export class PlayerDetails extends React.PureComponent<PlayerDetailsProperties, any> {
    constructor(props) {
        super(props);
        this.state = this.blankState();
        let player = player_cache.lookup(this.props.playerId);
        if (player) {
            this.state = Object.assign(this.state, player);
        }
    }

    UNSAFE_componentWillMount()  {
        this.resolve(this.props.playerId);
    }

    blankState() {
        return {
            resolved: false,
            resolving: 0,
            username: "...",
            //icon: data.get('config.cdn_release') + '/img/default-user.svg',
            icon: "",
            ranking: "...",
            rating: "...",
            ui_class: "...",
            country: "un",
            error: null,
        };
    }
    resolve(player_id) {
        this.setState({resolved: false});
        player_cache.fetch(
            this.props.playerId,
            [
                "username",
                "icon",
                "ratings",
                "pro",
                "country",
                "ui_class",
            ]
        )
        .then((player) => {
            this.setState(Object.assign({resolved: true}, player as any));
        })
        .catch((err) => {
            if (player_id === this.props.playerId) {
                this.setState({resolved: true, error: _("Error loading player information")});
                console.error(err);
            }
        });
    }
    UNSAFE_componentWillReceiveProps(new_props) {
        if (new_props.playerId !== this.props.playerId) {
            let player = player_cache.lookup(new_props.playerId);
            let new_state = this.blankState();
            if (player) {
                new_state = Object.assign(new_state, this.state, player);
            }
            this.setState(new_state);
            setTimeout(() => {
                this.resolve(new_props.playerId);
            }, 1);
        }
    }
    componentWillUnmount() {
    }

    close_all_modals_and_popovers = () => {
        close_all_popovers();
        close_friend_list();
    }

    gotoPlayerView = (ev) => {
        this.close_all_modals_and_popovers();

        let url = `/player/${this.props.playerId}/${this.state.username}`;
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    }
    challenge = (_ev) => {
        challenge(this.props.playerId);
        this.close_all_modals_and_popovers();
    }
    message = (_ev) => {
        getPrivateChat(this.props.playerId).open();
        this.close_all_modals_and_popovers();
    }
    report = (_ev) => {
        alertModerator({user: this.props.playerId});
        this.close_all_modals_and_popovers();
    }
    block = (ev) => {
        let controls = openBlockPlayerControls(ev, this.props.playerId);
        controls.on("close", () => {
            this.close_all_modals_and_popovers();
        });
    }
    ban = (_ev) => {
        ban(this.props.playerId).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }
    shadowban = (_ev) => {
        shadowban(this.props.playerId).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }
    removeShadowban = (_ev) => {
        remove_shadowban(this.props.playerId).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }
    removeBan = (_ev) => {
        remove_ban(this.props.playerId).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }
    openSupporterAdmin = () => {
        this.close_all_modals_and_popovers();
        openSupporterAdminModal(this.props.playerId);
    }
    addFriend = () => {
        toast(<div>{_("Sent friend request")}</div>, 5000);
        this.close_all_modals_and_popovers();
        post('me/friends', {player_id: this.props.playerId}).then(ignore).catch(errorAlerter);
    }
    removeFriend = () => {
        toast(<div>{_("Removed friend")}</div>, 5000);
        this.close_all_modals_and_popovers();
        post('me/friends', {"delete": true, player_id: this.props.playerId}).then(ignore).catch(errorAlerter);
    }
    removeSingleLine = () => {
        let m = this.props.chatId.match(/^([gr]).([^.]+).([^.]+).(.+)/);
        if (m) {
            let game    = m[1] === 'g';
            let id      = parseInt(m[2]);
            let channel = m[3];
            let chat_id = m[4];

            console.log(game ? 'game' : 'review', id, channel, chat_id);
            if (game) {
                termination_socket.send('game/chat/remove', {
                    game_id: id,
                    channel: channel,
                    chat_id: chat_id,
                });
            } else {  // review
                termination_socket.send('review/chat/remove', {
                    review_id: id,
                    channel: channel,
                    chat_id: chat_id,
                });
            }
        } else {
            termination_socket.send('chat/remove', {uuid: this.props.chatId});
        }

        this.close_all_modals_and_popovers();
    }
    removeAllChats = () => {
        this.close_all_modals_and_popovers();

        swal({
            text: _(`Are you sure you wish to remove all non-game chats made by user ${this.props.playerId}? This is not reversible.`),
            confirmButtonText: _("Yes"),
            cancelButtonText: _("No"),
            showCancelButton: true,
            focusCancel: true
        })
        .then(() => termination_socket.send('chat/remove_all', {player_id: this.props.playerId}))
        .catch(() => 0);
    }
    render() {
        let user = data.get("user");

        let rating = !preferences.get("hide-ranks") && (this.state.ratings ? getUserRating(this.state, 'overall', 0) : null);

        return (
            <div className="PlayerDetails">
                <div className="details">
                    <div className="icon" style={{backgroundImage: 'url("' + icon_size_url(this.state.icon, 64) + '")'}}>
                        <Flag country={this.state.country}/>
                    </div>
                    <div>
                        <div>
                            <Player user={this.state} nodetails rank={false} />
                        </div>
                        {rating && !!rating.professional &&
                            <div>
                                <span className="rank">{rating.rank_label}</span>
                            </div>
                        }
                        {rating && !rating.professional &&
                            <div>
                                <span className="rating">{Math.round(humble_rating(rating.rating, rating.deviation))} &plusmn; {Math.round(rating.deviation)}</span>
                            </div>
                        }
                        {rating && !rating.professional && !rating.provisional &&
                            <div>
                                <span className="rank">{rating.partial_bounded_rank_label} &plusmn; {rating.rank_deviation.toFixed(1)}</span>
                            </div>
                        }
                        {rating && !rating.professional && rating.provisional &&
                            <div>
                                <span className="rank">{_("Provisional rank")}</span>
                            </div>
                        }
                    </div>
                </div>
                {!user.anonymous && (user.id !== this.props.playerId || null) &&
                    <div className="actions">
                        {!this.props.nochallenge &&
                            <button className="xs noshadow primary" disabled={this.state.resolved} onClick={this.challenge}><i className="ogs-goban"/>{_("Challenge")}</button>
                        }
                        {!this.props.nochallenge &&
                            <div style={{width: '48%'}}></div>
                        }
                        <button className="xs noshadow success" disabled={this.state.resolved} onClick={this.message}><i className="fa fa-comment-o"/>{_("Message")}</button>
                        {friends[this.props.playerId]
                            ? <button className="xs noshadow reject" disabled={this.state.resolved} onClick={this.removeFriend}><i className="fa fa-frown-o"/>{_("Remove friend")}</button>
                            : <button className="xs noshadow success" disabled={this.state.resolved} onClick={this.addFriend}><i className="fa fa-smile-o"/>{_("Add friend")}</button>
                        }
                        <button className="xs noshadow reject" disabled={this.state.resolved} onClick={this.report}><i className="fa fa-exclamation-triangle"/>{_("Report")}</button>
                        <button className="xs noshadow reject" disabled={this.state.resolved} onClick={this.block}><i className="fa fa-ban"/>{_("Block")}</button>
                    </div>
                }
                {!user.anonymous && !this.props.noextracontrols && extraActionCallback && extraActionCallback(this.props.playerId, this.state)}
                { ((user.is_moderator) || null) &&
                    <div className="actions">
                        {(this.props.chatId || null) &&
                            <button className="xs noshadow reject" onClick={this.removeSingleLine}><i className="fa fa-times"/>{pgettext("Remove chat line", "Remove chat line")}</button>
                        }
                        <button className="xs noshadow reject" onClick={this.removeAllChats}><i className="fa fa-times-circle"/>{pgettext("Remove all chat lines from this user", "Remove all chats")}</button>
                    </div>
                }
                { ((user.is_moderator && this.props.playerId > 0) || null) &&
                    <div className="actions">
                        <button className="xs noshadow reject" onClick={this.ban}><i className="fa fa-gavel"/>{pgettext("Ban user from the server", "Ban")}</button>
                        <button className="xs noshadow danger" onClick={this.shadowban}><i className="fa fa-commenting"/>{pgettext("Disallow user to chat", "Shadowban")}</button>
                    </div>
                }
                { ((user.is_moderator && this.props.playerId > 0) || null) &&
                    <div className="actions">
                        <button className="xs noshadow" onClick={this.removeBan}><i className="fa fa-thumbs-o-up"/>{pgettext("Allow user on the server", "Un-Ban")}</button>
                        <button className="xs noshadow" onClick={this.removeShadowban}><i className="fa fa-commenting-o"/>{pgettext("Remove chat ban", "Un-Shadowban")}</button>
                    </div>
                }
                { ((user.is_superuser && this.props.playerId > 0) || null) &&
                    <div className="actions">
                        <button className="xs noshadow" onClick={this.openSupporterAdmin}><i className="fa fa-star"/>Supporter Admin</button>
                    </div>
                }
            </div>
        );
    }
}

export function setExtraActionCallback(cb: (user_id: number, user: any) => JSX.Element) {
    extraActionCallback = cb;
}
