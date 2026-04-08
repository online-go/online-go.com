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
import type {
    KibitzMode,
    KibitzRoomSummary,
    KibitzRoomUser,
    KibitzStreamItem,
    KibitzVariationSummary,
} from "@/models/kibitz";
import "./KibitzRoomStream.css";
import "@/components/Chat/ChatLog.css";

interface KibitzRoomStreamProps {
    mode: KibitzMode;
    room: KibitzRoomSummary;
    roomUsers: KibitzRoomUser[];
    items: KibitzStreamItem[];
    variations: KibitzVariationSummary[];
    onOpenVariation: (variationId: string) => void;
    onSendMessage: (text: string) => void;
}

function getUserInitials(username: string | undefined): string {
    const trimmedUsername = (username ?? "").trim();

    if (!trimmedUsername) {
        return "?";
    }

    const parts = trimmedUsername.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function KibitzRoomStream({
    mode,
    room,
    roomUsers,
    items,
    variations,
    onOpenVariation,
    onSendMessage,
}: KibitzRoomStreamProps): React.ReactElement {
    const user = useUser();
    const [proxy, setProxy] = React.useState<ChatChannelProxy | null>(null);
    const [, refresh] = React.useState(0);
    const [channelName, setChannelName] = React.useState(
        cachedChannelInformation(room.channel)?.name,
    );

    React.useEffect(() => {
        if (mode === "demo") {
            setProxy(null);
            setChannelName(room.title);
            return;
        }

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
    }, [mode, room.channel, room.title]);

    const onKeyPress = React.useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.charCode !== 13) {
                return;
            }

            const input = event.target as HTMLInputElement;
            const value = input.value.trim();
            if (!value || !proxy) {
                if (mode === "demo") {
                    onSendMessage(value);
                    input.value = "";
                }
                return false;
            }

            proxy.channel.send(value);
            input.value = "";
            return false;
        },
        [mode, onSendMessage, proxy],
    );

    const chatLog = proxy?.channel.chat_log.slice(-200) ?? [];
    const demoChatLog: ChatMessage[] = items
        .map((item) => {
            if (
                item.type === "variation_posted" ||
                (!item.author && item.type !== "system" && item.type !== "proposal_result")
            ) {
                return null;
            }

            return {
                channel: room.channel,
                username: item.author?.username ?? "",
                id: item.author?.id ?? 0,
                ranking: item.author?.ranking ?? 0,
                professional: item.author?.professional ?? false,
                ui_class: item.author?.ui_class ?? "",
                country: item.author?.country,
                system: item.type !== "chat",
                message: {
                    i: item.id,
                    t: Math.floor(item.created_at / 1000),
                    m: item.text,
                },
            };
        })
        .filter(Boolean) as ChatMessage[];
    const variationPosts = items.filter((item) => item.type === "variation_posted");
    const visibleUsers = roomUsers.slice(0, 5);
    const overflowCount = Math.max(0, roomUsers.length - visibleUsers.length);
    let lastLine: ChatMessage | undefined;

    return (
        <div className="KibitzRoomStream">
            <div className="KibitzRoomStream-title">
                {pgettext("Heading for the main message stream in a kibitz room", "Room stream")}
            </div>
            {room.viewer_count > 0 || visibleUsers.length > 0 ? (
                <div className="KibitzRoomStream-social">
                    <div className="stream-social-copy">
                        <span className="stream-social-label">
                            {interpolate(
                                pgettext(
                                    "Compact room-presence label shown above the kibitz room stream",
                                    "{{count}} here now",
                                ),
                                { count: room.viewer_count },
                            )}
                        </span>
                    </div>
                    {visibleUsers.length > 0 ? (
                        <div className="stream-avatar-stack" aria-hidden="true">
                            {visibleUsers.map((roomUser) => (
                                <span
                                    key={roomUser.id}
                                    className="stream-avatar"
                                    title={roomUser.username}
                                >
                                    {getUserInitials(roomUser.username)}
                                </span>
                            ))}
                            {overflowCount > 0 ? (
                                <span className="stream-avatar stream-avatar-overflow">
                                    +{overflowCount}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            ) : null}
            <div className="KibitzRoomStream-items">
                {(mode === "demo" ? demoChatLog.length > 0 : chatLog.length > 0) ? (
                    <div className="chat-lines">
                        {(mode === "demo" ? demoChatLog : chatLog).map((line) => {
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
                        {mode === "demo"
                            ? variationPosts.map((item) => {
                                  const variation = variations.find(
                                      (entry) => entry.id === item.variation_id,
                                  );
                                  const label = `${item.author?.username ?? ""} ${pgettext(
                                      "Lead-in for a variation post line in the kibitz stream",
                                      "posted variation",
                                  )}: ${
                                      variation?.title ??
                                      pgettext(
                                          "Fallback title for a variation link in the kibitz stream",
                                          "Open variation",
                                      )
                                  }`;
                                  return (
                                      <button
                                          key={item.id}
                                          type="button"
                                          className="variation-post"
                                          onClick={() =>
                                              item.variation_id &&
                                              onOpenVariation(item.variation_id)
                                          }
                                      >
                                          {label}
                                      </button>
                                  );
                              })
                            : null}
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
