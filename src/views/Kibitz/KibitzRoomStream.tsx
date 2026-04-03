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
import { ChatLine } from "@/components/Chat";
import { TabCompleteInput } from "@/components/TabCompleteInput";
import {
    cachedChannelInformation,
    chat_manager,
    ChatChannelProxy,
    ChatMessage,
} from "@/lib/chat_manager";
import { interpolate, pgettext } from "@/lib/translate";
import { useUser } from "@/lib/hooks";
import type { KibitzRoomSummary, KibitzStreamItem } from "@/models/kibitz";
import "./KibitzRoomStream.css";
import "@/components/Chat/ChatLog.css";

interface KibitzRoomStreamProps {
    room: KibitzRoomSummary;
    items: KibitzStreamItem[];
}

export function KibitzRoomStream({ room, items }: KibitzRoomStreamProps): React.ReactElement {
    const user = useUser();
    const [proxy, setProxy] = React.useState<ChatChannelProxy | null>(null);
    const [, refresh] = React.useState(0);
    const [channelName, setChannelName] = React.useState(
        cachedChannelInformation(room.channel)?.name,
    );

    React.useEffect(() => {
        const nextProxy = chat_manager.join(room.channel);
        setProxy(nextProxy);

        const sync = () => {
            nextProxy.channel.markAsRead();
            refresh((value) => value + 1);
        };

        nextProxy.on("chat", sync);
        nextProxy.on("chat-removed", sync);
        nextProxy.on("join", sync);
        nextProxy.on("part", sync);

        setChannelName(cachedChannelInformation(room.channel)?.name ?? room.title);
        sync();

        return () => {
            nextProxy.off("chat", sync);
            nextProxy.off("chat-removed", sync);
            nextProxy.off("join", sync);
            nextProxy.off("part", sync);
            nextProxy.part();
        };
    }, [room.channel, room.title]);

    const onKeyPress = React.useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.charCode !== 13) {
                return;
            }

            const input = event.target as HTMLInputElement;
            const value = input.value.trim();
            if (!value || !proxy) {
                return false;
            }

            proxy.channel.send(value);
            input.value = "";
            return false;
        },
        [proxy],
    );

    const chatLog = proxy?.channel.chat_log.slice(-200) ?? [];
    let lastLine: ChatMessage | undefined;

    return (
        <div className="KibitzRoomStream">
            <div className="KibitzRoomStream-title">
                {pgettext("Heading for the main message stream in a kibitz room", "Room stream")}
            </div>
            <div className="KibitzRoomStream-items">
                {chatLog.length > 0 ? (
                    <div className="chat-lines">
                        {chatLog.map((line) => {
                            const previousLine = lastLine;
                            lastLine = line;
                            return (
                                <ChatLine
                                    key={line.message.i || `system-${line.message.t}`}
                                    line={line}
                                    lastLine={previousLine}
                                />
                            );
                        })}
                    </div>
                ) : items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.id} className={"stream-item " + item.type}>
                            {item.text}
                        </div>
                    ))
                ) : (
                    <div className="stream-empty">
                        {pgettext(
                            "Placeholder when a kibitz room has no stream items yet",
                            "Messages, proposals, and variation posts for this room will appear here.",
                        )}
                    </div>
                )}
            </div>
            <div className="KibitzRoomStream-footer">
                <TabCompleteInput
                    id={`kibitz-chat-input-${room.id}`}
                    autoComplete="off"
                    placeholder={interpolate(
                        pgettext(
                            "Placeholder text for the kibitz room chat input",
                            "Message {{who}}",
                        ),
                        { who: channelName || room.title },
                    )}
                    disabled={user.anonymous || !user.email_validated}
                    onKeyPress={onKeyPress}
                />
            </div>
        </div>
    );
}
