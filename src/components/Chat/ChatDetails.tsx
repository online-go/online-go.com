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
import {browserHistory} from "ogsHistory";
import {_, pgettext} from "translate";
import {shouldOpenNewTab} from "misc";
import {close_all_popovers} from "popover";
import {close_friend_list} from "FriendList/FriendIndicator";
import * as data from "data";

interface ChatDetailsProperties {
    chatChannelId: string;
    partFunc: any;
}


export class ChatDetails extends React.PureComponent<ChatDetailsProperties, any> {
    constructor(props) {
        super(props);
        let channel = this.props.chatChannelId;
        let notify_messages:Array<string> = data.get("chat-indicator.notify_messages", []);
        let notify_mentions:Array<string> = data.get("chat-indicator.notify_mentions", []);
        if (channel) {
            this.state = {
                channelId: channel,
                notify_messages: notify_messages.indexOf(channel) >= 0,
                notify_mentions: notify_mentions.indexOf(channel) >= 0
            };
        }
    }

    close_all_modals_and_popovers = () => {
        close_all_popovers();
        close_friend_list();
    }

    leave = (_ev) => {
        let c = this.state.channelId;
        this.props.partFunc(c, false, false);
        this.close_all_modals_and_popovers();
    }
    goToGroup = (ev) => {
        this.close_all_modals_and_popovers();

        let url: string = '/group/' + this.state.channelId.slice(6);
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    }
    goToTournament = (ev) => {
        this.close_all_modals_and_popovers();

        let url: string = '/tournament/' + this.state.channelId.slice(11);
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    }

    toggleNewMessageNotification = (ev) => {
        let n_list: Array<string> = data.get("chat-indicator.notify_messages", []);
        if (this.state.notify_messages) {
            n_list.splice(n_list.indexOf(this.state.channelId), 1);
        } else {
            n_list.push(this.state.channelId);
        }
        data.set("chat-indicator.notify_messages", n_list);
        this.close_all_modals_and_popovers();
    }

    toggleMentionNotification = (ev) => {
        let n_list: Array<string> = data.get("chat-indicator.notify_mentions", []);
        if (this.state.notify_mentions) {
            n_list.splice(n_list.indexOf(this.state.channelId), 1);
        } else {
            n_list.push(this.state.channelId);
        }
        data.set("chat-indicator.notify_mentions", n_list);
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
                            onAuxClick={this.goToGroup}
                            onClick={this.goToGroup}>
                                <i className="fa fa-users"/>{" "}{group_text}
                        </button>
                    }
                    {this.state.channelId.startsWith("tournament") &&
                        <button
                            className="xs noshadow"
                            onAuxClick={this.goToTournament}
                            onClick={this.goToTournament}>
                                <i className="fa fa-trophy"/>{" "}{tournament_text}
                        </button>
                    }
                    <button
                        className={"xs noshadow " + this.state.notify_mentions ? "active" : "inactive"}
                        onClick={this.toggleMentionNotification}>
                            <i className="fa fa-comment">{this.state.notify_mentions ? _("don't notify if mentioned") : _("notify if mentioned")}</i>
                    </button>
                    <button
                        className={"xs noshadow " + this.state.notify_messages ? "active" : "inactive"}
                        onClick={this.toggleNewMessageNotification}>
                            <i className="fa fa-comment">{this.state.notify_messages ? _("don't notify if there are unread messages") : _("notify if there are unread")}</i>
                    </button>
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
