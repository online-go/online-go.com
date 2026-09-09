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
import { GameChatLine } from "@/components/Chat/GameChatLine";
import { ChatDateLine } from "@/components/Chat/ChatDateLine";
import { GameChatMoveNumber } from "@/components/Chat/GameChatMoveNumber";
import { TabCompleteInput } from "@/components/TabCompleteInput";
import { ChatUserList } from "@/components/ChatUserList";
import { Player } from "@/components/Player";
import {
    cachedChannelInformation,
    chat_manager,
    ChatChannelProxy,
    ChatMessage,
} from "@/lib/chat_manager";
import * as data from "@/lib/data";
import { useUser } from "@/lib/hooks";
import type { GobanController } from "@/lib/GobanController";
import { interpolate, moment, pgettext } from "@/lib/translate";
import { protocol } from "goban";
import type {
    KibitzRoomSummary,
    KibitzStreamItem,
    KibitzStreamItemSource,
    KibitzVariationSummary,
} from "@/models/kibitz";
import { formatVariationBranchLabel, formatVariationLengthLabel } from "./kibitzVariationQuickList";
import { KibitzVariationSwatch } from "./KibitzVariationSwatch";
import "./KibitzChatPanel.css";
import "@/components/Chat/ChatLog.css";

type ChatTab = "room" | "game";

type PaneEntry =
    | {
          kind: "chat";
          key: string;
          createdAt: number;
          line: ChatMessage;
          source: KibitzStreamItemSource;
          // For game-chat entries this is the goban channel ("main" or
          // "spectator"); rendered as an extra class on the wrapper so the
          // CSS can color spectator chat differently from player chat,
          // matching GameChat.css's .chat-line.spectator rule.
          gobanChannel?: string;
          gobanLine?: protocol.GameChatLine;
      }
    | {
          kind: "variation";
          key: string;
          createdAt: number;
          item: KibitzStreamItem;
      };

export interface KibitzChatPanelProps {
    room: KibitzRoomSummary;
    items: KibitzStreamItem[];
    variations: KibitzVariationSummary[];
    onOpenVariation: (variationId: string, focusVariation?: boolean) => void;
    /** Live game controller whose chat_log feeds the Game tab. */
    gameController: GobanController | null;
    /** Move-tree line colour of each variation that is on the board, by id. */
    variationColorIndexes: Record<string, number>;
    /** Whether the people column is switched on, from the action bar. */
    showPeople: boolean;
    /** Portrait only: which chat to show. The panel renders no tab strip when
     *  this is set, because the tab bar switches between the two instead. */
    mode?: ChatTab;
    /** False while the pane holding this panel is hidden. A hidden pane
     *  measures as zero, so the log cannot be scrolled to the latest line
     *  until it is shown again. */
    visible?: boolean;
    /** Reports the unread state of both chats so the tab bar can show a dot
     *  on the chat that is not on screen. */
    onUnreadChange?: (unread: { room: boolean; game: boolean }) => void;
}

/** Below this the log has no room to share, so the people list is not shown
 *  as a column even when it is switched on. A Kibitz sidebar is about 400px
 *  wide on a 1366px screen and 409px on a 1600px one, so the threshold has to
 *  sit below that: the People action is the only route to the room's people
 *  list, and above 22rem the 10rem list still leaves the log about 240px. */
const PEOPLE_COLUMN_MIN_REM = 22;

const DEFAULT_TAB: ChatTab = "room";

function readTab(): ChatTab {
    return data.get("kibitz.chat_tab", DEFAULT_TAB);
}

// Goban chat lines come off goban.chat_log (fed by game-server / Scylla).
// Kibitz users are functionally spectators of the watched game, so we
// surface both player ("main") and spectator chat. Malkovich is a
// player-only side channel and is hidden while the game is live; once the
// game ends, Kibitz may surface it in the transcript. Shadowban is per-user.
export function createChatLineFromGobanLine(
    roomChannel: string,
    line: protocol.GameChatLine,
    includeMalkovich: boolean,
): PaneEntry | null {
    if (
        line.channel !== "main" &&
        line.channel !== "spectator" &&
        !(includeMalkovich && line.channel === "malkovich")
    ) {
        return null;
    }
    const body = line.body;
    const text =
        typeof body === "string"
            ? body
            : body.type === "analysis"
              ? (body.name ?? "Analysis")
              : "Review";
    return {
        kind: "chat",
        key: `goban-${line.channel}-${line.chat_id}`,
        createdAt: line.date * 1000,
        source: "game-chat",
        gobanChannel: line.channel,
        gobanLine: line,
        line: {
            channel: roomChannel,
            username: line.username ?? "",
            id: line.player_id,
            ranking: 0,
            professional: false,
            ui_class: "",
            country: undefined,
            system: false,
            message: {
                i: line.chat_id,
                t: line.date,
                m: text,
            },
        },
    };
}

function buildGobanGameEntries(
    roomChannel: string,
    chatLog: protocol.GameChatLine[] | undefined,
    includeMalkovich: boolean,
): PaneEntry[] {
    if (!chatLog) {
        return [];
    }

    const entries: PaneEntry[] = [];

    for (const line of chatLog) {
        const entry = createChatLineFromGobanLine(roomChannel, line, includeMalkovich);
        if (entry) {
            entries.push(entry);
        }
    }

    return entries.sort(sortEntries);
}

function appendGobanGameEntry(
    current: PaneEntry[],
    roomChannel: string,
    line: protocol.GameChatLine,
    includeMalkovich: boolean,
): PaneEntry[] {
    const entry = createChatLineFromGobanLine(roomChannel, line, includeMalkovich);
    if (!entry) {
        return current;
    }

    if (current.some((candidate) => candidate.key === entry.key)) {
        return current;
    }

    return [...current, entry].sort(sortEntries);
}

function createChatLineFromItem(
    room: KibitzRoomSummary,
    item: KibitzStreamItem,
    source: KibitzStreamItemSource,
): PaneEntry | null {
    if (!item.author && item.type !== "system" && item.type !== "proposal_result") {
        return null;
    }

    return {
        kind: "chat",
        key: item.id,
        createdAt: item.created_at,
        source,
        line: {
            channel: room.channel,
            username: item.author?.username ?? "system",
            id: item.author?.id ?? -1,
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
}

function sortEntries(left: PaneEntry, right: PaneEntry): number {
    if (left.createdAt === right.createdAt) {
        return left.key.localeCompare(right.key);
    }

    return left.createdAt - right.createdAt;
}

function isAtBottom(container: HTMLDivElement | null): boolean {
    if (!container) {
        return true;
    }

    return container.scrollHeight - container.scrollTop - 10 < container.clientHeight;
}

export function KibitzChatPanel({
    room,
    items,
    variations,
    onOpenVariation,
    gameController,
    variationColorIndexes,
    showPeople,
    mode,
    visible,
    onUnreadChange,
}: KibitzChatPanelProps): React.ReactElement {
    const user = useUser();
    const chatDisabled = user.anonymous || !user.email_validated;
    // The watched-game's GobanController is passed in by KibitzInner. The
    // game tab reads chat off goban.chat_log (which is fed by game-server
    // via Scylla — the real game chat path). chat_manager.join("game-X")
    // would join an unrelated comm-server Redis channel and stay empty.
    const watchedController = gameController;
    const roomScrollRef = React.useRef<HTMLDivElement | null>(null);
    const gameScrollRef = React.useRef<HTMLDivElement | null>(null);
    const [roomProxy, setRoomProxy] = React.useState<ChatChannelProxy | null>(null);
    const [, refresh] = React.useState(0);
    const [gobanGameEntries, setGobanGameEntries] = React.useState<PaneEntry[]>([]);
    const gobanGameEntryKeysRef = React.useRef<Set<string>>(new Set());
    const [internalTab, setTab] = React.useState<ChatTab>(readTab);
    const tab: ChatTab = mode ?? internalTab;
    const bodyRef = React.useRef<HTMLDivElement | null>(null);
    const [hasRoomForPeople, setHasRoomForPeople] = React.useState(false);
    const [roomFollowLatest, setRoomFollowLatest] = React.useState(true);
    const [gameFollowLatest, setGameFollowLatest] = React.useState(true);
    const [roomUnread, setRoomUnread] = React.useState(false);
    const [gameUnread, setGameUnread] = React.useState(false);
    const roomChannel = room.channel;
    const includeMalkovich = room.current_game?.live === false;
    const roomPreviousEntryCountRef = React.useRef(0);
    const gamePreviousEntryCountRef = React.useRef(0);
    // Read by the resize observer, which must not re-subscribe on every
    // change of the two flags.
    const followLatestRef = React.useRef({ room: roomFollowLatest, game: gameFollowLatest });
    followLatestRef.current = { room: roomFollowLatest, game: gameFollowLatest };
    const paneVisible = visible ?? true;
    const roomVisible = paneVisible && tab === "room";
    const gameVisible = paneVisible && tab === "game";
    const channelName = cachedChannelInformation(room.channel)?.name ?? room.title;
    const roomEntries = React.useMemo<PaneEntry[]>(() => {
        const entries: PaneEntry[] = [];

        for (const item of items) {
            const source = item.source ?? "room-stream";
            if (source === "game-chat") {
                continue;
            }

            if (item.type === "variation_posted") {
                entries.push({
                    kind: "variation",
                    key: item.id,
                    createdAt: item.created_at,
                    item,
                });
                continue;
            }

            const chatEntry = createChatLineFromItem(room, item, source);
            if (chatEntry) {
                entries.push(chatEntry);
            }
        }

        return entries.sort(sortEntries);
    }, [items, room]);
    const gameEntries = React.useMemo<PaneEntry[]>(() => {
        const entries: PaneEntry[] = [];

        // Mock/demo game-chat items still come through the room stream.
        for (const item of items) {
            if ((item.source ?? "room-stream") !== "game-chat") {
                continue;
            }

            const chatEntry = createChatLineFromItem(room, item, "game-chat");
            if (chatEntry) {
                entries.push(chatEntry);
            }
        }

        entries.push(...gobanGameEntries);

        return entries.sort(sortEntries);
    }, [gobanGameEntries, items, room]);

    React.useEffect(() => {
        const body = bodyRef.current;
        if (!body || typeof ResizeObserver === "undefined") {
            return;
        }
        const root_font_size =
            parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const measure = () => {
            setHasRoomForPeople(body.clientWidth >= PEOPLE_COLUMN_MIN_REM * root_font_size);
            // A shorter log leaves the last line off screen, and the browser
            // reports that as a scroll, which would stop the log following.
            // Pin it again for whichever log is still following.
            const follow = followLatestRef.current;
            if (follow.room && roomScrollRef.current) {
                roomScrollRef.current.scrollTop = roomScrollRef.current.scrollHeight;
            }
            if (follow.game && gameScrollRef.current) {
                gameScrollRef.current.scrollTop = gameScrollRef.current.scrollHeight;
            }
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(body);
        return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
        const nextRoomProxy = chat_manager.join(room.channel);
        setRoomProxy(nextRoomProxy);

        const sync = () => {
            nextRoomProxy.channel.markAsRead();
            refresh((value) => value + 1);
        };

        nextRoomProxy.on("chat", sync);
        nextRoomProxy.on("chat-removed", sync);
        nextRoomProxy.on("join", sync);
        nextRoomProxy.on("part", sync);
        nextRoomProxy.on("user-metadata-update", sync);
        sync();

        return () => {
            nextRoomProxy.off("chat", sync);
            nextRoomProxy.off("chat-removed", sync);
            nextRoomProxy.off("join", sync);
            nextRoomProxy.off("part", sync);
            nextRoomProxy.off("user-metadata-update", sync);
            nextRoomProxy.part();
        };
    }, [room.channel]);

    // Subscribe to the watched game's chat. The chat lives on the goban
    // instance (fed by game-server / Scylla), so we append one entry for
    // normal chat events and only rebuild from chat_log for resets/removals.
    React.useEffect(() => {
        const goban = watchedController?.goban;
        if (!goban) {
            gobanGameEntryKeysRef.current = new Set();
            setGobanGameEntries([]);
            return;
        }

        const initialEntries = buildGobanGameEntries(roomChannel, goban.chat_log, includeMalkovich);
        gobanGameEntryKeysRef.current = new Set(initialEntries.map((entry) => entry.key));
        setGobanGameEntries(initialEntries);

        const rebuild = () => {
            const rebuilt = buildGobanGameEntries(roomChannel, goban.chat_log, includeMalkovich);
            gobanGameEntryKeysRef.current = new Set(rebuilt.map((entry) => entry.key));
            setGobanGameEntries(rebuilt);
        };

        const onChat = (line?: protocol.GameChatLine) => {
            if (line) {
                const entry = createChatLineFromGobanLine(roomChannel, line, includeMalkovich);
                if (!entry) {
                    return;
                }

                if (gobanGameEntryKeysRef.current.has(entry.key)) {
                    return;
                }

                gobanGameEntryKeysRef.current.add(entry.key);
                setGobanGameEntries((current) =>
                    appendGobanGameEntry(current, roomChannel, line, includeMalkovich),
                );
                return;
            }

            const latest = goban.chat_log?.[goban.chat_log.length - 1];
            if (latest) {
                const entry = createChatLineFromGobanLine(roomChannel, latest, includeMalkovich);
                if (!entry) {
                    rebuild();
                    return;
                }

                if (gobanGameEntryKeysRef.current.has(entry.key)) {
                    return;
                }

                gobanGameEntryKeysRef.current.add(entry.key);
                setGobanGameEntries((current) =>
                    appendGobanGameEntry(current, roomChannel, latest, includeMalkovich),
                );
                return;
            }

            rebuild();
        };

        const onChatRemove = () => {
            // Rare path: if goban removes chat, rebuild from source of truth.
            rebuild();
        };

        const onChatReset = () => {
            rebuild();
        };

        goban.on("chat", onChat);
        goban.on("chat-remove", onChatRemove);
        goban.on("chat-reset", onChatReset);
        return () => {
            goban.off("chat", onChat);
            goban.off("chat-remove", onChatRemove);
            goban.off("chat-reset", onChatReset);
            gobanGameEntryKeysRef.current = new Set();
        };
    }, [roomChannel, watchedController, includeMalkovich]);

    React.useEffect(() => {
        const previous = roomPreviousEntryCountRef.current;
        const current = roomEntries.length;
        const visible = roomVisible;

        if (current > previous && (!visible || !roomFollowLatest)) {
            setRoomUnread(true);
        }

        roomPreviousEntryCountRef.current = current;
    }, [roomFollowLatest, roomVisible, roomEntries.length]);

    React.useEffect(() => {
        const previous = gamePreviousEntryCountRef.current;
        const current = gameEntries.length;
        const visible = gameVisible;

        if (current > previous && (!visible || !gameFollowLatest)) {
            setGameUnread(true);
        }

        gamePreviousEntryCountRef.current = current;
    }, [gameEntries.length, gameFollowLatest, gameVisible]);

    React.useEffect(() => {
        if (roomVisible && roomFollowLatest) {
            setRoomUnread(false);
        }
    }, [roomFollowLatest, roomVisible]);

    React.useEffect(() => {
        if (gameVisible && gameFollowLatest) {
            setGameUnread(false);
        }
    }, [gameFollowLatest, gameVisible]);

    React.useEffect(() => {
        if (!mode) {
            data.set("kibitz.chat_tab", internalTab);
        }
    }, [internalTab, mode]);

    React.useEffect(() => {
        onUnreadChange?.({ room: roomUnread, game: gameUnread });
    }, [roomUnread, gameUnread, onUnreadChange]);

    const onRoomScroll = React.useCallback(() => {
        const container = roomScrollRef.current;
        setRoomFollowLatest(isAtBottom(container));
        if (isAtBottom(container)) {
            setRoomUnread(false);
        }
    }, []);

    const onGameScroll = React.useCallback(() => {
        const container = gameScrollRef.current;
        setGameFollowLatest(isAtBottom(container));
        if (isAtBottom(container)) {
            setGameUnread(false);
        }
    }, []);

    React.useLayoutEffect(() => {
        const container = roomScrollRef.current;
        if (!container || !roomVisible || !roomFollowLatest) {
            return;
        }

        container.scrollTop = container.scrollHeight;
        requestAnimationFrame(() => {
            if (roomScrollRef.current) {
                roomScrollRef.current.scrollTop = roomScrollRef.current.scrollHeight;
            }
        });
    }, [roomEntries.length, roomFollowLatest, roomVisible]);

    React.useLayoutEffect(() => {
        const container = gameScrollRef.current;
        if (!container || !gameVisible || !gameFollowLatest) {
            return;
        }

        container.scrollTop = container.scrollHeight;
        requestAnimationFrame(() => {
            if (gameScrollRef.current) {
                gameScrollRef.current.scrollTop = gameScrollRef.current.scrollHeight;
            }
        });
    }, [gameEntries.length, gameFollowLatest, gameVisible]);

    const onRoomKeyPress = React.useCallback(
        (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key !== "Enter") {
                return;
            }

            const input = event.target as HTMLTextAreaElement;
            const value = input.value.trim();
            if (!value) {
                return false;
            }

            if (!roomProxy) {
                return false;
            }

            roomProxy.channel.send(value);
            input.value = "";
            return false;
        },
        [roomProxy],
    );

    // Both line components show a date separator whenever the previous line
    // fell on another day, and unconditionally when there is no previous
    // line — so the log always opened with today's date, which says nothing.
    // Seeding the "previous line" with now suppresses that separator for a
    // first message sent today and keeps it for an older one.
    const nowSeconds = Math.floor(Date.now() / 1000);
    let roomLastLine: ChatMessage | undefined = {
        message: { t: nowSeconds },
    } as ChatMessage;
    let gameLastLine: protocol.GameChatLine | undefined = {
        date: nowSeconds,
    } as protocol.GameChatLine;

    const renderEntries = (entries: PaneEntry[], source: "room" | "game") => {
        if (entries.length === 0) {
            return (
                <div className="stream-empty">
                    {source === "room"
                        ? pgettext(
                              "Placeholder when a kibitz room has no room stream items yet",
                              "Messages, proposals, and variation posts for this room will appear here.",
                          )
                        : pgettext(
                              "Placeholder when a kibitz room has no watched game chat yet",
                              "Messages from the watched game will appear here.",
                          )}
                </div>
            );
        }

        return (
            <div
                ref={source === "room" ? roomScrollRef : gameScrollRef}
                className="chat-lines"
                onScroll={source === "room" ? onRoomScroll : onGameScroll}
            >
                {entries.map((entry) => {
                    if (entry.kind === "variation") {
                        const variation = variations.find(
                            (candidate) => candidate.id === entry.item.variation_id,
                        );
                        const timeLabel = moment(entry.createdAt).format("HH:mm");
                        const metaParts: string[] = [];
                        if (variation) {
                            metaParts.push(formatVariationBranchLabel(variation));
                            const lengthLabel = formatVariationLengthLabel(variation);
                            if (lengthLabel) {
                                metaParts.push(lengthLabel);
                            }
                        }
                        const name = variation?.title ?? metaParts.join(" ");
                        const label = interpolate(
                            pgettext("Posted analysis variation label", "Variation: {{name}}"),
                            { name },
                        );

                        return (
                            <div
                                key={entry.key}
                                className="variation-post-entry"
                                data-variation-id={entry.item.variation_id}
                            >
                                <time
                                    className="variation-post-time"
                                    dateTime={new Date(entry.createdAt).toISOString()}
                                >
                                    {timeLabel}
                                </time>
                                <div className="variation-post-line">
                                    {entry.item.author && (
                                        <>
                                            <span className="variation-post-author">
                                                <Player
                                                    user={entry.item.author}
                                                    disableCacheUpdate
                                                />
                                            </span>
                                            {": "}
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        className="variation-post variation"
                                        data-variation-post="true"
                                        data-variation-id={entry.item.variation_id}
                                        onClick={() =>
                                            entry.item.variation_id &&
                                            onOpenVariation(entry.item.variation_id, true)
                                        }
                                    >
                                        <KibitzVariationSwatch
                                            colorIndex={
                                                entry.item.variation_id
                                                    ? (variationColorIndexes[
                                                          entry.item.variation_id
                                                      ] ?? null)
                                                    : null
                                            }
                                        />
                                        {label}
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    const previousRoomLine = roomLastLine;
                    const previousGameLine = gameLastLine;
                    if (source === "room") {
                        roomLastLine = entry.line;
                    } else if (entry.gobanLine) {
                        gameLastLine = entry.gobanLine;
                    }

                    // The date and the move number head a run of lines, so
                    // they stand outside the row the line shares with its
                    // time. Inside it they would push the time down to the
                    // separator instead of the name beside it.
                    return (
                        <React.Fragment key={entry.key}>
                            {entry.gobanLine ? (
                                <>
                                    <ChatDateLine
                                        timestamp={entry.gobanLine.date}
                                        previousTimestamp={previousGameLine?.date}
                                        hasPreviousLine={Boolean(previousGameLine)}
                                    />
                                    <GameChatMoveNumber
                                        line={entry.gobanLine}
                                        lastLine={previousGameLine}
                                    />
                                </>
                            ) : (
                                <ChatDateLine
                                    timestamp={entry.line.message.t}
                                    previousTimestamp={previousRoomLine?.message.t}
                                    hasPreviousLine={Boolean(previousRoomLine)}
                                />
                            )}
                            <div
                                className={
                                    "kibitz-chat-entry " +
                                    entry.source +
                                    (entry.gobanChannel ? " " + entry.gobanChannel : "")
                                }
                            >
                                <time
                                    className="kibitz-chat-entry-time"
                                    dateTime={new Date(entry.createdAt).toISOString()}
                                >
                                    {moment(entry.createdAt).format("HH:mm")}
                                </time>

                                {entry.gobanLine ? (
                                    <GameChatLine
                                        line={entry.gobanLine}
                                        lastLine={previousGameLine}
                                        gameId={watchedController?.goban.game_id}
                                        separators={false}
                                    />
                                ) : (
                                    <ChatLine
                                        line={entry.line}
                                        lastLine={previousRoomLine}
                                        showDate={false}
                                    />
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    const roomPlaceholder = interpolate(
        pgettext("Placeholder text for the kibitz room chat input", "Message {{who}}"),
        { who: channelName },
    );

    const roomDisabledPlaceholder = pgettext(
        "Placeholder shown in the Kibitz room chat input when the user cannot chat",
        "Sign in with a validated email to chat",
    );

    return (
        <div className="KibitzChatPanel">
            {!mode && (
                <div className="KibitzChatPanel-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "game"}
                        className={"KibitzChatPanel-tab" + (tab === "game" ? " active" : "")}
                        onClick={() => setTab("game")}
                    >
                        <i className="fa fa-comment" />{" "}
                        {pgettext("Kibitz chat tab for the watched game's chat", "Game chat")}
                        {gameUnread && tab !== "game" ? (
                            <span className="KibitzChatPanel-unread" />
                        ) : null}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "room"}
                        className={"KibitzChatPanel-tab" + (tab === "room" ? " active" : "")}
                        onClick={() => setTab("room")}
                    >
                        <i className="fa fa-comments" />{" "}
                        {pgettext("Kibitz chat tab for the kibitz room's chat", "Kibitz chat")}
                        {roomUnread && tab !== "room" ? (
                            <span className="KibitzChatPanel-unread" />
                        ) : null}
                    </button>
                </div>
            )}
            <div className="KibitzChatPanel-body" ref={bodyRef}>
                <div className="KibitzChatPanel-log">
                    {tab === "game"
                        ? renderEntries(gameEntries, "game")
                        : renderEntries(roomEntries, "room")}
                </div>
                {showPeople && hasRoomForPeople ? <ChatUserList channel={room.channel} /> : null}
            </div>
            {tab === "room" ? (
                <div className="KibitzChatPanel-composer chat-input-container input-group">
                    <TabCompleteInput
                        id={"kibitz-chat-input-" + room.id}
                        className="chat-input"
                        placeholder={chatDisabled ? roomDisabledPlaceholder : roomPlaceholder}
                        disabled={chatDisabled}
                        onKeyPress={onRoomKeyPress}
                    />
                </div>
            ) : null}
        </div>
    );
}
