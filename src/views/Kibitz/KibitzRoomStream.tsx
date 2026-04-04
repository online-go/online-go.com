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
    KibitzStreamItem,
    KibitzVariationSummary,
} from "@/models/kibitz";
import "./KibitzRoomStream.css";
import "@/components/Chat/ChatLog.css";

interface KibitzRoomStreamProps {
    mode: KibitzMode;
    room: KibitzRoomSummary;
    items: KibitzStreamItem[];
    variations: KibitzVariationSummary[];
    onOpenVariation: (variationId: string) => void;
    onSendMessage: (text: string) => void;
}

export function KibitzRoomStream({
    mode,
    room,
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
    let lastLine: ChatMessage | undefined;

    return (
        <div className="KibitzRoomStream">
            <div className="KibitzRoomStream-title">
                {pgettext("Heading for the main message stream in a kibitz room", "Room stream")}
            </div>
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
                                          <span className="variation-post-title">
                                              {variation?.title ??
                                                  pgettext(
                                                      "Fallback title for a variation link in the kibitz stream",
                                                      "Open variation",
                                                  )}
                                          </span>
                                          <span className="variation-post-meta">{item.text}</span>
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
