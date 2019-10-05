/*
 * Copyright (C) 2012-2019  Online-Go.com
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
// import {rankString, getUserRating, is_novice, humble_rating} from "rank_utils";
// import * as player_cache from "player_cache";
// import {icon_size_url} from "PlayerIcon";
import {termination_socket} from "sockets";
import * as data from "data";
import {close_all_popovers} from "popover";
// import {Flag} from "Flag";
// import {ban, shadowban, remove_shadowban, remove_ban} from "Moderator";
// import {openSupporterAdminModal} from "SupporterAdmin";
// import {challenge} from "ChallengeModal";
// import {getPrivateChat} from "PrivateChat";
// import {openBlockPlayerControls} from "BlockPlayer";
// import {Player} from "./Player";
import {Chat} from "./Chat";
import {close_friend_list} from 'FriendList/FriendIndicator';
import cached from 'cached';

//declare var swal;

interface ChatDetailsProperties {
    chatChannelId: string;
//     playerId: number;
//     chatId?: string;
//     gameChatId?: string;
//     reviewChatId?: string;
//     noextracontrols?: boolean;
//     nochallenge?: boolean;
}

let extraActionCallback: (user_id: number, user: any) => JSX.Element = null;

export class ChatDetails extends React.PureComponent<ChatDetailsProperties, any> {
    constructor(props) {
        super(props);
        //this.state = this.blankState();
        //let player = player_cache.lookup(this.props.playerId);
        let channel = this.props.chatChannelId;
        if (channel) {
            this.state = {
                channelId: channel,
            };
        }

        ////if (player) {
        //    this.state = Object.assign(this.state, player);
        //}
    }

    // UNSAFE_componentWillMount()  {
        //this.resolve(this.props.playerId);
        // this.resolve(this.props.chatChannel);
    // }

    //blankState() {
        //return {
        //    resolved: false,
        //    resolving: 0,
        //    username: "...",
        //    //icon: data.get('config.cdn_release') + '/img/default-user.svg',
        //    icon: "",
        //    ranking: "...",
        //    rating: "...",
        //    ui_class: "...",
        //    country: "un",
        //    error: null,
        //};
    //}
    //resolve(player_id) {
        //this.setState({resolved: false});
        //player_cache.fetch(
        //    this.props.playerId,
        //    [
        //        "username",
        //        "icon",
        //        "ratings",
        //        "pro",
        //        "country",
        //        "ui_class",
        //    ]
        //)
        //.then((player) => {
        //    this.setState(Object.assign({resolved: true}, player as any));
        //})
        //.catch((err) => {
        //    if (player_id === this.props.playerId) {
        //        this.setState({resolved: true, error: _("Error loading player information")});
        //        console.error(err);
        //    }
        //});
    //}
    //UNSAFE_componentWillReceiveProps(new_props) {
        //if (new_props.playerId !== this.props.playerId) {
        //    let player = player_cache.lookup(new_props.playerId);
        //    let new_state = this.blankState();
        //    if (player) {
        //        new_state = Object.assign(new_state, this.state, player);
        //    }
        //    this.setState(new_state);
        //    setTimeout(() => {
        //        this.resolve(new_props.playerId);
        //    }, 1);
        //}
    //}
    //componentWillUnmount() {
    //}

    close_all_modals_and_popovers = () => {
        close_all_popovers();
        close_friend_list();
    }

    leave = (_ev) => {
        //Chat.part(this.channel, false, false);
        //leaveActiveChannel(); //figure out how to ask chat to leave channel
        this.close_all_modals_and_popovers();
    }
    goToGroup = (_ev) => {
        browserHistory.push('/group/' + this.state.channelId);
        this.close_all_modals_and_popovers();
    }
    goToTournament = (_ev) => {
        browserHistory.push('/tournament/' + this.state.channelId);
        this.close_all_modals_and_popovers();
    }

    render() {
        let user = data.get("user");

        return (
           <div className="ChatDetails">
                    {!user.anonymous &&
                     <div className="actions">
                        <button
                            className="xs noshadow"
                            onClick={this.leave}>
                            <i className="fa fa-times"/>{_("Leave Channel")}
                        </button>
                        <button
                            className="xs noshadow"
                            onClick={this.goToGroup}>
                            <i className="fa fa-users"/>{_("Go to Group")}
                        </button>
                        <button
                            className="xs noshadow"
                            onClick={this.goToTournament}>
                            <i className="fa fa-trophy"/>{_("Go to Tournament")}
                        </button>
                     </div>
                    }
           </div>
        );
    }
}

// export function setExtraActionCallback(cb: (user_id: number, user: any) => JSX.Element) {
//     extraActionCallback = cb;
// }
