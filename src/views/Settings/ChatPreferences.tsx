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

import { _ } from "@/lib/translate";

import { usePreference } from "@/lib/preferences";

import { Toggle } from "@/components/Toggle";

import { PreferenceLine } from "@/lib/SettingsCommon";

export function ChatPreferences(): React.ReactElement {
    const [show_empty_chat_notification, toggleEmptyChatNotification] = usePreference(
        "show-empty-chat-notification",
    );
    const [group_chat_unread, toggleGroupChatUnread] = usePreference(
        "chat-subscribe-group-chat-unread",
    );
    const [group_chat_mentions, toggleGroupChatMentions] = usePreference(
        "chat-subscribe-group-mentions",
    );
    const [tournament_chat_unread, toggleTournamentChatUnread] = usePreference(
        "chat-subscribe-tournament-chat-unread",
    );
    const [tournament_chat_mentions, toggleTournamentChatMentions] = usePreference(
        "chat-subscribe-tournament-mentions",
    );

    return (
        <div>
            <PreferenceLine
                title={_("Show chat notification icon when there are no unread messages.")}
            >
                <Toggle
                    checked={show_empty_chat_notification}
                    onChange={toggleEmptyChatNotification}
                />
            </PreferenceLine>

            <PreferenceLine
                title={_("Notify me when I'm mentioned in group chats I'm a member of.")}
            >
                <Toggle checked={group_chat_mentions} onChange={toggleGroupChatMentions} />
            </PreferenceLine>

            <PreferenceLine
                title={_("Notify me about unread messages in group chats I'm a member of.")}
            >
                <Toggle checked={group_chat_unread} onChange={toggleGroupChatUnread} />
            </PreferenceLine>

            <PreferenceLine
                title={_("Notify me when I'm mentioned in tournament chats I'm a member of.")}
            >
                <Toggle
                    checked={tournament_chat_mentions}
                    onChange={toggleTournamentChatMentions}
                />
            </PreferenceLine>

            <PreferenceLine
                title={_("Notify me about unread messages in tournament chats I'm a member of.")}
            >
                <Toggle checked={tournament_chat_unread} onChange={toggleTournamentChatUnread} />
            </PreferenceLine>
        </div>
    );
}
