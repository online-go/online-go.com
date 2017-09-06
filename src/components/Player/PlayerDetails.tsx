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
import {toast} from "toast";
import {browserHistory} from "react-router";
import {_, pgettext} from "translate";
import {post} from "requests";
import {shouldOpenNewTab, errorAlerter, alertModerator, ignore} from "misc";
import {rankString, getUserRating, is_novice} from "rank_utils";
import * as player_cache from "player_cache";
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
import {PlayerComponentProperties, PlayerComponent} from "./PlayerComponent";
import {icon_size_url} from "./PlayerIcon";
import {close_friend_list} from "FriendList/FriendIndicator";
import {RegisteredPlayer, is_registered} from "data/Player";

declare var swal;

interface PlayerDetailsProperties extends PlayerComponentProperties {
    chatId?: string;
    noextracontrols?: boolean;
}

let friends = {};
data.watch("friends", (friends_arr) => {
    friends = {};
    for (let friend of friends_arr) {
        friends[friend.id] = true;
    }
});

let extraActionCallback: (user_id: number, user: any) => JSX.Element = null;

export class PlayerDetails extends PlayerComponent<PlayerDetailsProperties> {
    close_all_modals_and_popovers = () => {
        close_all_popovers();
        close_friend_list();
    }

    challenge = (_ev) => {{{
        challenge(this.state.player.id);
        this.close_all_modals_and_popovers();
    }}}
    message = (_ev) => {{{
        getPrivateChat(this.state.player.id).open();
        this.close_all_modals_and_popovers();
    }}}
    report = (_ev) => {{{
        alertModerator({user: this.state.player.id});
        this.close_all_modals_and_popovers();
    }}}
    block = (ev) => {{{
        let controls = openBlockPlayerControls(ev, this.state.player.id);
        controls.on("close", () => {
            this.close_all_modals_and_popovers();
        });
    }}}
    ban = (_ev) => {{{
        ban(this.state.player.id).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }}}
    shadowban = (_ev) => {{{
        shadowban(this.state.player.id).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }}}
    removeShadowban = (_ev) => {{{
        remove_shadowban(this.state.player.id).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }}}
    removeBan = (_ev) => {{{
        remove_ban(this.state.player.id).then(this.close_all_modals_and_popovers).catch(errorAlerter);
    }}}
    openSupporterAdmin = () => {{{
        this.close_all_modals_and_popovers();
        openSupporterAdminModal(this.state.player.id);
    }}}
    addFriend = () => {{{
        toast(<div>{_("Sent friend request")}</div>, 5000);
        this.close_all_modals_and_popovers();
        post('me/friends', {player_id: this.state.player.id}).then(ignore).catch(errorAlerter);
    }}}
    removeFriend = () => {{{
        toast(<div>{_("Removed friend")}</div>, 5000);
        this.close_all_modals_and_popovers();
        post('me/friends', {"delete": true, player_id: this.state.player.id}).then(ignore).catch(errorAlerter);
    }}}
    removeSingleLine = () => {{{
        termination_socket.send('chat/remove', {uuid: this.props.chatId});
        this.close_all_modals_and_popovers();
    }}}
    removeAllChats = () => {{{
        this.close_all_modals_and_popovers();

        swal({
            text: _(`Are you sure you wish to remove all non-game chats made by user ${this.state.player.id}? This is not reversable.`),
            confirmButtonText: _("Yes"),
            cancelButtonText: _("No"),
            showCancelButton: true,
            focusCancel: true
        })
        .then(() => termination_socket.send('chat/remove_all', {player_id: this.state.player.id}))
        .catch(() => 0);
    }}}
    render() {
        let user = data.get("user");
        let player = this.state.player;

        if (!(player instanceof RegisteredPlayer)) {
            return null;
        }

        let rating = getUserRating(this.state, 'overall', 0);
        return (
            <div className="PlayerDetails">
                <div className="details">
                    <div className="icon" style={{backgroundImage: 'url("' + icon_size_url(player.icon, 64) + '")'}}>
                        <Flag country={player.country}/>
                    </div>
                    <div>
                        <div>
                            <Player user={player.id} nodetails rank={false} using_cache/>
                        </div>
                        {(player.is.professional || null) &&
                            <div>
                                <span className="rank">{rating.rank_label}</span>
                            </div>
                        }
                        {(!player.is.professional || null) &&
                            <div>
                                <span className="rating">{Math.round(rating.rating)} &plusmn; {Math.round(rating.deviation)}</span>
                            </div>
                        }
                        {(!player.is.professional || null) &&
                            <div>
                                <span className="rank">{rating.partial_bounded_rank_label} &plusmn; {rating.rank_deviation.toFixed(1)}</span>
                            </div>
                        }
                    </div>
                </div>
                {(user.id !== player.id || null) &&
                    <div className="actions">
                        <button className="xs noshadow primary" onClick={this.challenge}><i className="ogs-goban"/>{_("Challenge")}</button>
                        <button className="xs noshadow success" onClick={this.message}><i className="fa fa-comment-o"/>{_("Message")}</button>
                        {friends[player.id]
                            ? <button className="xs noshadow reject" onClick={this.removeFriend}><i className="fa fa-frown-o"/>{_("Remove friend")}</button>
                            : <button className="xs noshadow success" onClick={this.addFriend}><i className="fa fa-smile-o"/>{_("Add friend")}</button>
                        }
                        <button className="xs noshadow reject" onClick={this.report}><i className="fa fa-exclamation-triangle"/>{_("Report")}</button>
                        <button className="xs noshadow reject" onClick={this.block}><i className="fa fa-ban"/>{_("Block")}</button>
                    </div>
                }
                {is_registered(user) && !this.props.noextracontrols && extraActionCallback && extraActionCallback(this.state.player.id, this.state)}
                { ((user.is.moderator) || null) &&
                    <div className="actions">
                        {(this.props.chatId || null) &&
                            <button className="xs noshadow reject" onClick={this.removeSingleLine}><i className="fa fa-times"/>{pgettext("Remove chat line", "Remove chat line")}</button>
                        }
                        <button className="xs noshadow reject" onClick={this.removeAllChats}><i className="fa fa-times-circle"/>{pgettext("Remove all chat lines from this user", "Remove all chats")}</button>
                    </div>
                }
                { ((user.is.moderator && is_registered(this.state.player)) || null) &&
                    <div className="actions">
                        <button className="xs noshadow reject" onClick={this.ban}><i className="fa fa-gavel"/>{pgettext("Ban user from the server", "Ban")}</button>
                        <button className="xs noshadow danger" onClick={this.shadowban}><i className="fa fa-commenting"/>{pgettext("Disallow user to chat", "Shadowban")}</button>
                    </div>
                }
                { ((user.is.moderator) || null) &&
                    <div className="actions">
                        <button className="xs noshadow" onClick={this.removeBan}><i className="fa fa-thumbs-o-up"/>{pgettext("Allow user on the server", "Un-Ban")}</button>
                        <button className="xs noshadow" onClick={this.removeShadowban}><i className="fa fa-commenting-o"/>{pgettext("Remove chat ban", "Un-Shadowban")}</button>
                    </div>
                }
                { ((user.is.admin) || null) &&
                    <div className="actions">
                        <button className="xs noshadow" onClick={this.openSupporterAdmin}><i className="fa fa-star"/>Supporter Admin</button>
                    </div>
                }
            </div>
        );
    }
}

export function setExtraActionCallback(cb: (user_id: number, user: any) => JSX.Element) {{{
    extraActionCallback = cb;
}}}
