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
import { pgettext } from "translate";
import { shouldOpenNewTab } from "misc";
import { close_all_popovers } from "popover";
import { close_friend_list } from "FriendList/close_friend_list";
import * as data from "data";
import {
    getUnreadChatPreference,
    getMentionedChatPreference,
    watchChatSubscriptionChanged,
    unwatchChatSubscriptionChanged,
} from "./state";

interface ChatDetailsProperties {
    chatChannelId: string;
    partFunc?: any;
    subscribable?: boolean;
}

export function ChatDetails(props: ChatDetailsProperties): JSX.Element {
    const channel = props.chatChannelId;

    const [channelId, setChannelId] = React.useState(channel);
    const [subscribable, setSubscribable] = React.useState(props.subscribable);
    const [notify_unread, setNotifyUnread] = React.useState(false);
    const [notify_mentioned, setNotifyMentioned] = React.useState(false);

    React.useEffect(() => {
        setChannelId(channel);
        setSubscribable(props.subscribable);
        setNotifyUnread(getUnreadChatPreference(channel));
        setNotifyMentioned(getMentionedChatPreference(channel));

        const onChatSubscriptionChanged = () => {
            setNotifyUnread(getUnreadChatPreference(channel));
            setNotifyMentioned(getMentionedChatPreference(channel));
        };

        watchChatSubscriptionChanged(onChatSubscriptionChanged);
        return () => {
            unwatchChatSubscriptionChanged(onChatSubscriptionChanged);
        };
    }, [channel, props.subscribable]);

    const close_all_modals_and_popovers = () => {
        close_all_popovers();
        close_friend_list();
    };

    const leave = (_ev) => {
        const c = channelId;
        props.partFunc(c, false, false);
        close_all_modals_and_popovers();
    };
    const goToGroup = (ev) => {
        close_all_modals_and_popovers();

        const url: string = "/group/" + channelId.slice(6);
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    };
    const goToTournament = (ev) => {
        close_all_modals_and_popovers();

        const url: string = "/tournament/" + channelId.slice(11);
        if (shouldOpenNewTab(ev)) {
            window.open(url, "_blank");
        } else {
            browserHistory.push(url);
        }
    };

    const toggleNewMessageNotification = () => {
        const n_list: { [channel: string]: { [option: string]: boolean } } = data.get(
            "chat-indicator.chat-subscriptions",
            {},
        );
        if (!(channelId in n_list)) {
            n_list[channelId] = {};
        }
        if (notify_unread) {
            n_list[channelId].unread = false;
        } else {
            n_list[channelId].unread = true;
        }
        data.set("chat-indicator.chat-subscriptions", n_list);
    };

    const toggleMentionNotification = () => {
        const n_list: { [channel: string]: { [option: string]: boolean } } = data.get(
            "chat-indicator.chat-subscriptions",
            {},
        );
        if (!(channelId in n_list)) {
            n_list[channelId] = {};
        }
        if (notify_mentioned) {
            n_list[channelId].mentioned = false;
        } else {
            n_list[channelId].mentioned = true;
        }
        data.set("chat-indicator.chat-subscriptions", n_list);
    };

    const tournament_text = pgettext("Go to the main page for this tournament.", "Tournament Page");
    const leave_text = pgettext("Leave the selected channel.", "Leave channel");

    const group_url = (channelId.startsWith("group-") || null) && "/group/" + channelId.slice(6);

    return (
        <div className="ChatDetails">
            <div className="actions">
                {group_url && (
                    <div className="fakelink view-group" onClick={goToGroup}>
                        {pgettext("Generic link text to go to a group page", "View group")}
                    </div>
                )}
                {channelId.startsWith("tournament") && (
                    <button
                        className="xs noshadow"
                        onAuxClick={goToTournament}
                        onClick={goToTournament}
                    >
                        <i className="fa fa-trophy" /> {tournament_text}
                    </button>
                )}
                <hr />
                {subscribable && (
                    <div>
                        <div>
                            <input
                                type="checkbox"
                                id="notify_mentioned"
                                checked={notify_mentioned}
                                onChange={toggleMentionNotification}
                            />
                            <label htmlFor="notify_mentioned">
                                {pgettext(
                                    "Don't notify on unread @user mentions in a chat channel",
                                    "Highlight when mentioned",
                                )}
                            </label>
                        </div>

                        <input
                            type="checkbox"
                            id="notify_unread"
                            checked={notify_unread}
                            onChange={toggleNewMessageNotification}
                        />
                        <label htmlFor="notify_unread">
                            {pgettext(
                                "Don't notify on unread messages in a chat channel",
                                "Highlight on unread messages",
                            )}
                        </label>
                    </div>
                )}
                <hr />
                {props.partFunc ? (
                    <button className="xs noshadow reject" onClick={leave}>
                        <i className="fa fa-times" /> {leave_text}
                    </button>
                ) : null}
            </div>
        </div>
    );
}
