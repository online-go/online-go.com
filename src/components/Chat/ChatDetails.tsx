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
import { pgettext } from "@/lib/translate";
import { close_all_popovers } from "@/lib/popover";
import { close_friend_list } from "@/components/FriendList/close_friend_list";
import * as data from "@/lib/data";
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

export function ChatDetails(props: ChatDetailsProperties): React.ReactElement {
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

    const leave = () => {
        const c = channelId;
        props.partFunc(c, false, false);
        close_all_modals_and_popovers();
    };

    const setNotify = (level: "none" | "mentioned" | "all") => {
        const n_list: { [channel: string]: { [option: string]: boolean } } = data.get(
            "chat-indicator.chat-subscriptions",
            {},
        );
        if (!(channelId in n_list)) {
            n_list[channelId] = {};
        }
        if (level === "none") {
            n_list[channelId].mentioned = false;
            n_list[channelId].unread = false;
        } else if (level === "mentioned") {
            n_list[channelId].mentioned = true;
            n_list[channelId].unread = false;
        } else if (level === "all") {
            n_list[channelId].mentioned = true;
            n_list[channelId].unread = true;
        }
        data.set("chat-indicator.chat-subscriptions", n_list);
    };

    const leave_text = pgettext("Leave the selected channel.", "Leave channel");

    const group_url =
        (channelId.startsWith("group-") || undefined) && "/group/" + channelId.slice(6);
    const tournament_url =
        (channelId.startsWith("tournament-") || undefined) && "/tournament/" + channelId.slice(11);

    return (
        <div className="ChatDetails">
            <div className="actions">
                {Boolean(group_url) && (
                    <a href={group_url} target="_blank" rel="noopener noreferrer">
                        View Group <i className="fa fa-external-link" />
                    </a>
                )}
                {Boolean(tournament_url) && (
                    <a href={tournament_url} target="_blank" rel="noopener noreferrer">
                        View Tournament <i className="fa fa-external-link" />
                    </a>
                )}
                {Boolean(group_url || tournament_url) && <hr />}
                {subscribable && (
                    <>
                        <h4>
                            {pgettext(
                                "When should a chat message cause the channel name to be highlighted",
                                "Notification Settings",
                            )}
                        </h4>
                        <div>
                            <div className="notify-option">
                                <label htmlFor="notify_all">
                                    {pgettext(
                                        "Notify the user when any new chats are sent to the channel",
                                        "All messages",
                                    )}
                                </label>
                                <input
                                    type="radio"
                                    id="notify_all"
                                    name="notify"
                                    checked={notify_unread}
                                    onChange={() => setNotify("all")}
                                />
                            </div>
                            <div className="notify-option">
                                <label htmlFor="notify_mentioned">
                                    {pgettext(
                                        "Notify the user when any new chats are sent to the channel that include @username",
                                        "Only @mentions",
                                    )}
                                </label>
                                <input
                                    type="radio"
                                    id="notify_mentioned"
                                    name="notify"
                                    checked={notify_mentioned && !notify_unread}
                                    onChange={() => setNotify("mentioned")}
                                />
                            </div>

                            <div className="notify-option">
                                <label htmlFor="notify_none">
                                    {pgettext(
                                        "Don't notify the user when any chats are sent to the channel",
                                        "Nothing",
                                    )}
                                </label>
                                <input
                                    type="radio"
                                    id="notify_none"
                                    name="notify"
                                    checked={!notify_unread && !notify_mentioned}
                                    onChange={() => setNotify("none")}
                                />
                            </div>
                        </div>
                        <hr />
                    </>
                )}
                {props.partFunc ? (
                    <button className="xs no-shadow reject" onClick={leave}>
                        <i className="fa fa-times" /> {leave_text}
                    </button>
                ) : null}
            </div>
        </div>
    );
}
