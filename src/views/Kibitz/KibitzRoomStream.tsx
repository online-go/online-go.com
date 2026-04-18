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
    scrollToVariationId?: string | null;
    scrollToVariationRequestId?: number | null;
    onScrolledToVariation?: () => void;
    compact?: boolean;
}

type DemoStreamEntry =
    | {
          kind: "chat";
          key: string;
          createdAt: number;
          line: ChatMessage;
      }
    | {
          kind: "variation";
          key: string;
          createdAt: number;
          item: KibitzStreamItem;
      };

export function KibitzRoomStream({
    mode,
    room,
    items,
    variations,
    onOpenVariation,
    onSendMessage,
    scrollToVariationId,
    scrollToVariationRequestId,
    onScrolledToVariation,
    compact = false,
}: KibitzRoomStreamProps): React.ReactElement {
    const user = useUser();
    const chatDisabled = user.anonymous || !user.email_validated;
    const chatLinesRef = React.useRef<HTMLDivElement | null>(null);
    const [proxy, setProxy] = React.useState<ChatChannelProxy | null>(null);
    const [, refresh] = React.useState(0);
    const [followLatest, setFollowLatest] = React.useState(true);
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
    const demoEntries: DemoStreamEntry[] = items
        .map<DemoStreamEntry | null>((item) => {
            if (item.type === "variation_posted") {
                return {
                    kind: "variation",
                    key: item.id,
                    createdAt: item.created_at,
                    item,
                };
            }

            if (!item.author && item.type !== "system" && item.type !== "proposal_result") {
                return null;
            }

            return {
                kind: "chat",
                key: item.id,
                createdAt: item.created_at,
                line: {
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
                },
            };
        })
        .filter((entry): entry is DemoStreamEntry => entry !== null)
        .sort((left, right) => left.createdAt - right.createdAt);
    const renderedLineCount = mode === "demo" ? demoEntries.length : chatLog.length;
    let lastLine: ChatMessage | undefined;

    const updateFollowLatest = React.useCallback(() => {
        const container = chatLinesRef.current;
        if (!container) {
            return;
        }

        const pinnedToBottom =
            container.scrollHeight - container.scrollTop - 10 < container.clientHeight;
        setFollowLatest(pinnedToBottom);
    }, []);

    React.useEffect(() => {
        if (!scrollToVariationId || scrollToVariationRequestId == null) {
            return;
        }

        const container = chatLinesRef.current;
        if (!container) {
            return;
        }

        const selectorValue = window.CSS?.escape
            ? window.CSS.escape(scrollToVariationId)
            : scrollToVariationId.replace(/["\\]/g, "\\$&");
        const target = container.querySelector(
            `[data-variation-id="${selectorValue}"]`,
        ) as HTMLElement | null;
        if (!target) {
            return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
        target.classList.add("variation-post-flash");

        const timeout = window.setTimeout(() => {
            target.classList.remove("variation-post-flash");
            onScrolledToVariation?.();
        }, 1400);

        return () => {
            window.clearTimeout(timeout);
            target.classList.remove("variation-post-flash");
        };
    }, [items, onScrolledToVariation, scrollToVariationId, scrollToVariationRequestId]);

    React.useLayoutEffect(() => {
        const container = chatLinesRef.current;
        if (!container || !followLatest) {
            return;
        }

        container.scrollTop = container.scrollHeight;

        requestAnimationFrame(() => {
            if (chatLinesRef.current) {
                chatLinesRef.current.scrollTop = chatLinesRef.current.scrollHeight;
            }
        });
    }, [followLatest, renderedLineCount]);

    return (
        <div className={"KibitzRoomStream" + (compact ? " compact" : "")}>
            {compact ? null : (
                <div className="KibitzRoomStream-title">
                    {pgettext(
                        "Heading for the main message stream in a kibitz room",
                        "Room stream",
                    )}
                </div>
            )}
            <div className="KibitzRoomStream-items">
                {(mode === "demo" ? demoEntries.length > 0 : chatLog.length > 0) ? (
                    <div ref={chatLinesRef} className="chat-lines" onScroll={updateFollowLatest}>
                        {mode === "demo"
                            ? demoEntries.map((entry) => {
                                  if (entry.kind === "variation") {
                                      const variation = variations.find(
                                          (variationEntry) =>
                                              variationEntry.id === entry.item.variation_id,
                                      );
                                      const label = `${entry.item.author?.username ?? ""} ${pgettext(
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
                                              key={entry.key}
                                              type="button"
                                              className="variation-post"
                                              data-variation-id={entry.item.variation_id}
                                              onClick={() =>
                                                  entry.item.variation_id &&
                                                  onOpenVariation(entry.item.variation_id)
                                              }
                                          >
                                              {label}
                                          </button>
                                      );
                                  }

                                  const previousLine = lastLine;
                                  lastLine = entry.line;
                                  return (
                                      <ChatLine
                                          key={entry.key}
                                          line={entry.line}
                                          lastLine={previousLine}
                                      />
                                  );
                              })
                            : chatLog.map((line) => {
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
                    disabled={chatDisabled}
                    onKeyPress={onKeyPress}
                />
                {chatDisabled ? (
                    <div className="KibitzRoomStream-disabled-note">
                        {pgettext(
                            "Message shown below the kibitz chat input when chatting is disabled",
                            "Need to be logged in to chat",
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
