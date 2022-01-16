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
import { browserHistory } from "ogsHistory";
import { _, pgettext } from "translate";
import { shouldOpenNewTab } from "misc";
import { close_all_popovers } from "popover";
import { close_friend_list } from "FriendList/FriendIndicator";
import * as data from "data";
import {
    getUnreadChatPreference,
    getMentionedChatPreference,
    watchChatSubscriptionChanged,
    unwatchChatSubscriptionChanged,
} from "Chat";

interface ChatDetailsProperties {
    chatChannelId: string;
    partFunc?: any;
    subscribable?: boolean;
}

interface ChatDetailsState {
    channelId: string;
    subscribable: boolean;
    notify_unread: boolean;
    notify_mentioned: boolean;
}

export class ChatDetails extends React.PureComponent<ChatDetailsProperties, ChatDetailsState> {
    constructor(props) {
        super(props);
        const channel = this.props.chatChannelId;
        if (channel) {
            this.state = {
                channelId: channel,
                subscribable: props.subscribable,
                notify_unread: false,
                notify_mentioned: false,
            };
        }
    }

    componentDidMount() {
        watchChatSubscriptionChanged(this.onChatSubscriptionChanged);
    }

    componentWillUnmount() {
        unwatchChatSubscriptionChanged(this.onChatSubscriptionChanged);
    }

    onChatSubscriptionChanged = () => {
        this.setState({
            notify_unread: getUnreadChatPreference(this.state.channelId),
            notify_mentioned: getMentionedChatPreference(this.state.channelId),
        });
    };

    close_all_modals_and_popovers = () => {
        close_all_popovers();
        close_friend_list();
    };

    leave = (_ev) => {
        const c = this.state.channelId;
        this.props.partFunc(c, false, false);
        this.close_all_modals_and_popovers();
    };
    goToGroup = (ev) => {
        this.close_all_modals_and_popovers();

        const url: string = "/group/" + this.state.channelId.slice(6);
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    };
    goToTournament = (ev) => {
        this.close_all_modals_and_popovers();

        const url: string = "/tournament/" + this.state.channelId.slice(11);
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    };

    toggleNewMessageNotification = (ev) => {
        const n_list: { [channel: string]: { [option: string]: Boolean } } = data.get(
            "chat-indicator.chat-subscriptions",
            {},
        );
        if (!(this.state.channelId in n_list)) {
            n_list[this.state.channelId] = {};
        }
        if (this.state.notify_unread) {
            n_list[this.state.channelId].unread = false;
        } else {
            n_list[this.state.channelId].unread = true;
        }
        data.set("chat-indicator.chat-subscriptions", n_list);
    };

    toggleMentionNotification = (ev) => {
        const n_list: { [channel: string]: { [option: string]: Boolean } } = data.get(
            "chat-indicator.chat-subscriptions",
            {},
        );
        if (!(this.state.channelId in n_list)) {
            n_list[this.state.channelId] = {};
        }
        if (this.state.notify_mentioned) {
            n_list[this.state.channelId].mentioned = false;
        } else {
            n_list[this.state.channelId].mentioned = true;
        }
        data.set("chat-indicator.chat-subscriptions", n_list);
    };

    render() {
        const group_text = pgettext("Go to the main page for this group.", "Group Page");
        const tournament_text = pgettext(
            "Go to the main page for this tournament.",
            "Tournament Page",
        );
        const leave_text = pgettext("Leave the selected channel.", "Leave Channel");

        return (
            <div className="ChatDetails">
                <div className="actions">
                    {this.state.channelId.startsWith("group") && (
                        <button
                            className="xs noshadow"
                            onAuxClick={this.goToGroup}
                            onClick={this.goToGroup}
                        >
                            <i className="fa fa-users" /> {group_text}
                        </button>
                    )}
                    {this.state.channelId.startsWith("tournament") && (
                        <button
                            className="xs noshadow"
                            onAuxClick={this.goToTournament}
                            onClick={this.goToTournament}
                        >
                            <i className="fa fa-trophy" /> {tournament_text}
                        </button>
                    )}
                    {this.state.subscribable && (
                        <button
                            className={"xs noshadow "} // + this.state.notify_mentioned ? "active" : "inactive"}
                            onClick={this.toggleMentionNotification}
                        >
                            <i className="fa fa-comment" />
                            {" " +
                                (this.state.notify_mentioned
                                    ? _("unfollow mentioned")
                                    : _("follow mentioned"))}
                        </button>
                    )}
                    {this.state.subscribable && (
                        <button
                            className={"xs noshadow "} // + this.state.notify_unread ? "active" : "inactive"}
                            onClick={this.toggleNewMessageNotification}
                        >
                            <i className="fa fa-comment" />
                            {" " +
                                (this.state.notify_unread
                                    ? _("unfollow unread")
                                    : _("follow unread"))}
                        </button>
                    )}
                    {this.props.partFunc ? (
                        <button className="xs noshadow reject" onClick={this.leave}>
                            <i className="fa fa-times" /> {leave_text}
                        </button>
                    ) : null}
                </div>
            </div>
        );
    }
}
