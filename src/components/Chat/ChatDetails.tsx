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
import {termination_socket} from "sockets";
import * as data from "data";
import {close_all_popovers} from "popover";
import {Chat} from "./Chat";
import {close_friend_list} from "FriendList/FriendIndicator";
import cached from "cached";
import {ChatChannelProxy} from "chat_manager";
import {emitNotification} from "Notifications";

interface ChatDetailsProperties {
    chatChannelId: string;
}

export class ChatDetails extends React.PureComponent<ChatDetailsProperties, any> {
    constructor(props) {
        super(props);
        let channel = this.props.chatChannelId;
        if (channel) {
            this.state = {
                channelId: channel,
            };
        }
    }

    // UNSAFE_componentWillMount()  {
    // }
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
        // this.emit("part", this.state.channelId);
        console.log(_ev);
        // _ev.on("disconnect", this.state.channelId);
        // ChatChannelProxy(this.state.channelId).part();
        // <Chat channel={this.state.channelId} part={true} updateTitle={false} />;
        console.log("chat call");
        _ev.bind.part(this.state.channelId, false, false);
        //leaveActiveChannel(); //figure out how to ask chat to leave channel
        this.close_all_modals_and_popovers();
    }
    goToGroup = (_ev) => {
        browserHistory.push('/group/' + this.state.channelId.slice(6));
        this.close_all_modals_and_popovers();
    }
    goToTournament = (_ev) => {
        browserHistory.push('/tournament/' + this.state.channelId.slice(11));
        this.close_all_modals_and_popovers();
    }

    render() {
        let group_text = pgettext("Go to the main page for this group.", "Group Page");
        let tournament_text = pgettext("Go to the main page for this tournament.", "Tournament Page");
        let leave_text = pgettext("Leave the selected channel.", "Leave Channel");

        return (
            <div className="ChatDetails">
                <div className="actions">
                    {this.state.channelId.startsWith("group") &&
                        <button
                            className="xs noshadow"
                            onClick={this.goToGroup}>
                                <i className="fa fa-users"/>{" "}{group_text}
                        </button>
                    }
                    {this.state.channelId.startsWith("tournament") &&
                        <button
                            className="xs noshadow"
                            onClick={this.goToTournament}>
                                <i className="fa fa-trophy"/>{" "}{tournament_text}
                        </button>
                    }
                    <button
                        className="xs noshadow reject"
                        onClick={this.leave}>
                            <i className="fa fa-times"/>{" "}{leave_text}
                    </button>
                </div>
            </div>
        );
    }
}
