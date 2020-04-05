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
    partFunc?: any;
}


export class ChatDetails extends React.PureComponent<ChatDetailsProperties, any> {
    constructor(props) {
        super(props);
        let channel = this.props.chatChannelId;
        if (channel) {
            this.state = {
                channelId: channel,
                notify_unread: false,
                notify_mentioned: false
            };
        }
    }

    componentDidMount() {
        data.watch("chat-indicator.chat-subscriptions", this.onChatSubscriptionChanged);
    }

    componentWillUnmount() {
        data.unwatch("chat-indicator.chat-subscriptions", this.onChatSubscriptionChanged);
    }

    onChatSubscriptionChanged = (obj) => {
        if (obj === undefined) {
            obj = {};
        }
        this.setState({
            notify_unread: this.state.channelId in obj && "unread" in obj[this.state.channelId] && obj[this.state.channelId].unread,
            notify_mentioned: this.state.channelId in obj && "mentioned" in obj[this.state.channelId] && obj[this.state.channelId].mentioned
        });
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
        let n_list: {[channel:string]: {[option: string]: Boolean}} = data.get("chat-indicator.chat-subscriptions", {});
        if (!(this.state.channelId in n_list)) {
            n_list[this.state.channelId] = {};
        }
        if (this.state.notify_unread) {
            n_list[this.state.channelId].unread = false;
        } else {
            n_list[this.state.channelId].unread = true;
        }
        data.set("chat-indicator.chat-subscriptions", n_list);
    }

    toggleMentionNotification = (ev) => {
        let n_list: {[channel:string]: {[option: string]: Boolean}} = data.get("chat-indicator.chat-subscriptions", {});
        if (!(this.state.channelId in n_list)) {
            n_list[this.state.channelId] = {};
        }
        if (this.state.notify_mentioned) {
            n_list[this.state.channelId].mentioned = false;
        } else {
            n_list[this.state.channelId].mentioned = true;
        }
        data.set("chat-indicator.chat-subscriptions", n_list);
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
                        className={"xs noshadow " + this.state.notify_mentioned ? "active" : "inactive"}
                        onClick={this.toggleMentionNotification}>
                            <i className="fa fa-comment">{this.state.notify_mentioned ? _("don't notify if mentioned") : _("notify if mentioned")}</i>
                    </button>
                    <button
                        className={"xs noshadow " + this.state.notify_unread ? "active" : "inactive"}
                        onClick={this.toggleNewMessageNotification}>
                            <i className="fa fa-comment">{this.state.notify_unread ? _("don't notify if there are unread messages") : _("notify if there are unread")}</i>
                    </button>
                    {(this.props.partFunc ? <button
                        className="xs noshadow reject"
                        onClick={this.leave}>
                            <i className="fa fa-times"/>{" "}{leave_text}
                    </button> : null)}
                </div>
            </div>
        );
    }
}
