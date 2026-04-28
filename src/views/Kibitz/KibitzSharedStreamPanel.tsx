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
import { useUser } from "@/lib/hooks";
import { useGobanControllerOrNull } from "@/components/GobanView";
import { interpolate, moment, pgettext } from "@/lib/translate";
import type { protocol } from "goban";
import type {
    KibitzMode,
    KibitzRoomSummary,
    KibitzStreamItem,
    KibitzStreamItemSource,
    KibitzVariationSummary,
} from "@/models/kibitz";
import "./KibitzSharedStreamPanel.css";
import "@/components/Chat/ChatLog.css";

type DesktopSplitState =
    | "game-only"
    | "game-70-room-30"
    | "game-50-room-50"
    | "game-30-room-70"
    | "room-only";

type MobileTab = "room" | "game";

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
      }
    | {
          kind: "variation";
          key: string;
          createdAt: number;
          item: KibitzStreamItem;
      };

interface KibitzSharedStreamPanelProps {
    mode: KibitzMode;
    room: KibitzRoomSummary;
    items: KibitzStreamItem[];
    variations: KibitzVariationSummary[];
    onOpenVariation: (variationId: string, focusVariation?: boolean) => void;
    onSendMessage: (text: string) => void;
    isMobileLayout: boolean;
    compact?: boolean;
}

const DESKTOP_SPLIT_STORAGE_KEY = "kibitz.shared_stream.desktop_split";
const MOBILE_TAB_STORAGE_KEY = "kibitz.shared_stream.mobile_tab";
const DEFAULT_DESKTOP_SPLIT: DesktopSplitState = "game-30-room-70";
const DESKTOP_SPLITS: DesktopSplitState[] = [
    "game-only",
    "game-70-room-30",
    "game-50-room-50",
    "game-30-room-70",
    "room-only",
];
const DEFAULT_MOBILE_TAB: MobileTab = "room";

function isDesktopSplitState(value: string | null): value is DesktopSplitState {
    return (
        value === "game-only" ||
        value === "game-70-room-30" ||
        value === "game-50-room-50" ||
        value === "game-30-room-70" ||
        value === "room-only"
    );
}

function isMobileTab(value: string | null): value is MobileTab {
    return value === "room" || value === "game";
}

function readDesktopSplit(): DesktopSplitState {
    const stored = window.localStorage.getItem(DESKTOP_SPLIT_STORAGE_KEY);
    return isDesktopSplitState(stored) ? stored : DEFAULT_DESKTOP_SPLIT;
}

function readMobileTab(): MobileTab {
    const stored = window.localStorage.getItem(MOBILE_TAB_STORAGE_KEY);
    return isMobileTab(stored) ? stored : DEFAULT_MOBILE_TAB;
}

function splitPercentage(split: DesktopSplitState): { game: number; room: number } {
    switch (split) {
        case "game-only":
            return { game: 100, room: 0 };
        case "game-70-room-30":
            return { game: 70, room: 30 };
        case "game-50-room-50":
            return { game: 50, room: 50 };
        case "game-30-room-70":
            return { game: 30, room: 70 };
        case "room-only":
            return { game: 0, room: 100 };
    }
}

function snapDesktopSplitFromRatio(gameRatio: number): DesktopSplitState {
    const nearest = DESKTOP_SPLITS.reduce<{
        split: DesktopSplitState;
        distance: number;
    } | null>((best, split) => {
        const distance = Math.abs(splitPercentage(split).game - gameRatio);
        if (!best || distance < best.distance) {
            return { split, distance };
        }

        return best;
    }, null);

    return nearest?.split ?? DEFAULT_DESKTOP_SPLIT;
}

function clampPercentage(value: number): number {
    return Math.min(100, Math.max(0, value));
}

function ratioFromPointerPosition(
    clientY: number,
    dragState: {
        top: number;
        height: number;
        dividerHeight: number;
    },
): number {
    const availableHeight = dragState.height - dragState.dividerHeight;
    if (availableHeight <= 0) {
        return splitPercentage(DEFAULT_DESKTOP_SPLIT).game;
    }

    const centeredPosition = clientY - dragState.top - dragState.dividerHeight / 2;
    return clampPercentage((centeredPosition / availableHeight) * 100);
}

// Goban chat lines come off goban.chat_log (fed by game-server / Scylla).
// Kibitz users are functionally spectators of the watched game, so we
// surface both player ("main") and spectator chat. Malkovich is a
// player-only side channel and shadowban is per-user — neither belongs in
// a kibitz pane.
function createChatLineFromGobanLine(
    room: KibitzRoomSummary,
    line: protocol.GameChatLine,
): PaneEntry | null {
    if (line.channel !== "main" && line.channel !== "spectator") {
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
        key: `goban-${line.chat_id}`,
        createdAt: line.date * 1000,
        source: "game-chat",
        gobanChannel: line.channel,
        line: {
            channel: room.channel,
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

export function KibitzSharedStreamPanel({
    mode,
    room,
    items,
    variations,
    onOpenVariation,
    onSendMessage,
    isMobileLayout,
    compact = false,
}: KibitzSharedStreamPanelProps): React.ReactElement {
    const user = useUser();
    const chatDisabled = user.anonymous || !user.email_validated;
    // The watched-game's GobanController is provided by KibitzInner via
    // GobanControllerContext. The game pane reads chat off goban.chat_log
    // (which is fed by game-server via Scylla — the real game chat path).
    // chat_manager.join("game-X") would join an unrelated comm-server Redis
    // channel and stay empty.
    const watchedController = useGobanControllerOrNull();
    const roomScrollRef = React.useRef<HTMLDivElement | null>(null);
    const gameScrollRef = React.useRef<HTMLDivElement | null>(null);
    const [roomProxy, setRoomProxy] = React.useState<ChatChannelProxy | null>(null);
    const [, refresh] = React.useState(0);
    const [desktopSplit, setDesktopSplit] = React.useState<DesktopSplitState>(readDesktopSplit);
    const [desktopDragRatio, setDesktopDragRatio] = React.useState<number | null>(null);
    const [desktopDragging, setDesktopDragging] = React.useState(false);
    const [mobileTab, setMobileTab] = React.useState<MobileTab>(readMobileTab);
    const [roomFollowLatest, setRoomFollowLatest] = React.useState(true);
    const [gameFollowLatest, setGameFollowLatest] = React.useState(true);
    const [roomUnread, setRoomUnread] = React.useState(false);
    const [gameUnread, setGameUnread] = React.useState(false);
    const desktopStackRef = React.useRef<HTMLDivElement | null>(null);
    const desktopDragStateRef = React.useRef<{
        pointerId: number;
        top: number;
        height: number;
        dividerHeight: number;
    } | null>(null);
    const roomPreviousEntryCountRef = React.useRef(0);
    const gamePreviousEntryCountRef = React.useRef(0);
    const desktopGameRatio = desktopDragRatio ?? splitPercentage(desktopSplit).game;
    const desktopRoomRatio = 100 - desktopGameRatio;
    const roomVisible = isMobileLayout ? mobileTab === "room" : desktopRoomRatio > 0;
    const gameVisible = isMobileLayout ? mobileTab === "game" : desktopGameRatio > 0;
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

    const gameChatLog = watchedController?.goban?.chat_log;
    const gameChatLogLength = gameChatLog?.length ?? 0;
    const gameEntries = React.useMemo<PaneEntry[]>(() => {
        const entries: PaneEntry[] = [];

        // Mock-mode items get filtered for game-chat source; live mode uses
        // the watched goban's chat_log instead (game chat doesn't flow
        // through the room's stream items in live mode).
        for (const item of items) {
            if ((item.source ?? "room-stream") !== "game-chat") {
                continue;
            }

            const chatEntry = createChatLineFromItem(room, item, "game-chat");
            if (chatEntry) {
                entries.push(chatEntry);
            }
        }

        if (gameChatLog) {
            for (const line of gameChatLog) {
                const entry = createChatLineFromGobanLine(room, line);
                if (entry) {
                    entries.push(entry);
                }
            }
        }

        return entries.sort(sortEntries);
        // gameChatLogLength tracks in-place mutations of goban.chat_log so
        // the memo recomputes when new chat lines arrive (the array
        // reference itself is stable across pushes).
    }, [items, room, gameChatLog, gameChatLogLength]);

    React.useEffect(() => {
        if (mode === "demo") {
            setRoomProxy(null);
            return;
        }

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
    }, [mode, room.channel]);

    // Subscribe to the watched game's chat. The chat lives on the goban
    // instance (fed by game-server / Scylla), so we re-render whenever the
    // goban emits a chat event; gameEntries reads goban.chat_log directly.
    React.useEffect(() => {
        const goban = watchedController?.goban;
        if (!goban) {
            return;
        }
        const onChat = () => refresh((value) => value + 1);
        goban.on("chat", onChat);
        goban.on("chat-remove", onChat);
        // Initial refresh in case chat_log was already populated.
        onChat();
        return () => {
            goban.off("chat", onChat);
            goban.off("chat-remove", onChat);
        };
    }, [watchedController]);

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
        window.localStorage.setItem(DESKTOP_SPLIT_STORAGE_KEY, desktopSplit);
    }, [desktopSplit]);

    React.useEffect(() => {
        if (!isMobileLayout) {
            return;
        }

        window.localStorage.setItem(MOBILE_TAB_STORAGE_KEY, mobileTab);
    }, [isMobileLayout, mobileTab]);

    const showDesktopSplitControl = !isMobileLayout;
    const showMobileSwitcher = isMobileLayout;

    const finishDesktopDrag = React.useCallback((clientY: number) => {
        const dragState = desktopDragStateRef.current;

        if (!dragState) {
            setDesktopDragging(false);
            setDesktopDragRatio(null);
            return;
        }

        const nextSplit = snapDesktopSplitFromRatio(ratioFromPointerPosition(clientY, dragState));
        desktopDragStateRef.current = null;
        setDesktopDragging(false);
        setDesktopDragRatio(null);
        setDesktopSplit(nextSplit);
    }, []);

    const handleDesktopDividerPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLButtonElement>) => {
            if (event.button !== 0 || isMobileLayout) {
                return;
            }

            const stack = desktopStackRef.current;
            const divider = event.currentTarget;
            if (!stack) {
                return;
            }

            const stackRect = stack.getBoundingClientRect();
            const dividerRect = divider.getBoundingClientRect();
            desktopDragStateRef.current = {
                pointerId: event.pointerId,
                top: stackRect.top,
                height: stackRect.height,
                dividerHeight: dividerRect.height,
            };
            setDesktopDragging(true);
            setDesktopDragRatio(
                ratioFromPointerPosition(event.clientY, desktopDragStateRef.current),
            );
            divider.setPointerCapture(event.pointerId);
            event.preventDefault();
        },
        [isMobileLayout],
    );

    React.useEffect(() => {
        if (!desktopDragging) {
            return;
        }

        const handlePointerMove = (event: PointerEvent) => {
            const dragState = desktopDragStateRef.current;
            if (!dragState || event.pointerId !== dragState.pointerId) {
                return;
            }

            setDesktopDragRatio(ratioFromPointerPosition(event.clientY, dragState));
        };

        const handlePointerEnd = (event: PointerEvent) => {
            const dragState = desktopDragStateRef.current;
            if (!dragState || event.pointerId !== dragState.pointerId) {
                return;
            }

            finishDesktopDrag(event.clientY);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerEnd);
        window.addEventListener("pointercancel", handlePointerEnd);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerEnd);
            window.removeEventListener("pointercancel", handlePointerEnd);
        };
    }, [desktopDragging, finishDesktopDrag]);

    const handleMobileTabChange = React.useCallback((tab: MobileTab) => {
        setMobileTab(tab);
    }, []);

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

            if (mode === "demo") {
                onSendMessage(value);
                input.value = "";
                return false;
            }

            if (!roomProxy) {
                return false;
            }

            roomProxy.channel.send(value);
            input.value = "";
            return false;
        },
        [mode, onSendMessage, roomProxy],
    );

    let roomLastLine: ChatMessage | undefined;
    let gameLastLine: ChatMessage | undefined;

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
                        const label = `${moment(entry.createdAt).format("HH:mm")} ${entry.item.author?.username ?? pgettext("Fallback username for a variation post in the kibitz stream", "Someone")} shared variation: ${
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
                                    onOpenVariation(entry.item.variation_id, true)
                                }
                            >
                                {label}
                            </button>
                        );
                    }

                    const previousLine = source === "room" ? roomLastLine : gameLastLine;
                    if (source === "room") {
                        roomLastLine = entry.line;
                    } else {
                        gameLastLine = entry.line;
                    }

                    return (
                        <div
                            key={entry.key}
                            className={
                                "kibitz-chat-entry " +
                                entry.source +
                                (entry.gobanChannel ? " " + entry.gobanChannel : "")
                            }
                        >
                            <ChatLine line={entry.line} lastLine={previousLine} />
                        </div>
                    );
                })}
            </div>
        );
    };

    const roomPane = (
        <div
            className={
                "KibitzSharedStreamPanel-pane KibitzSharedStreamPanel-roomPane" +
                (roomVisible ? "" : " hidden") +
                (roomUnread ? " has-unread" : "")
            }
            style={!isMobileLayout ? { flexBasis: `${desktopRoomRatio}%` } : undefined}
        >
            <div className="KibitzSharedStreamPanel-paneBody">
                <div className="KibitzSharedStreamPanel-paneFeed">
                    {renderEntries(roomEntries, "room")}
                </div>
                <div className="KibitzSharedStreamPanel-composer">
                    <TabCompleteInput
                        id={`kibitz-chat-input-${room.id}`}
                        className="TabCompleteInput"
                        autoComplete="off"
                        placeholder={interpolate(
                            pgettext(
                                "Placeholder text for the kibitz room chat input",
                                "Message {{who}}",
                            ),
                            { who: channelName },
                        )}
                        disabled={chatDisabled || !roomVisible}
                        onKeyPress={onRoomKeyPress}
                    />
                </div>
            </div>
        </div>
    );

    const gamePane = (
        <div
            className={
                "KibitzSharedStreamPanel-pane KibitzSharedStreamPanel-gamePane" +
                (gameVisible ? "" : " hidden") +
                (gameUnread ? " has-unread" : "")
            }
            style={!isMobileLayout ? { flexBasis: `${desktopGameRatio}%` } : undefined}
        >
            <div className="KibitzSharedStreamPanel-paneBody">
                <div className="KibitzSharedStreamPanel-paneFeed">
                    {renderEntries(gameEntries, "game")}
                </div>
            </div>
        </div>
    );

    const disabledComposer = (
        <div className="KibitzSharedStreamPanel-disabledComposer chat-input-container input-group">
            <TabCompleteInput
                id={`kibitz-chat-disabled-${room.id}`}
                className="TabCompleteInput chat-input"
                autoComplete="off"
                placeholder={pgettext(
                    "Placeholder text shown when the kibitz game chat composer is disabled",
                    "Can't send messages to game chat",
                )}
                disabled={true}
                onKeyPress={() => false}
            />
        </div>
    );

    return (
        <div
            className={
                "KibitzSharedStreamPanel" +
                (isMobileLayout ? " mobile" : " desktop") +
                (compact ? " compact" : "") +
                (desktopDragging ? " is-dragging" : "") +
                " split-" +
                (isMobileLayout ? mobileTab : desktopSplit)
            }
        >
            {showMobileSwitcher ? (
                <div
                    className="KibitzSharedStreamPanel-mobileSwitcher"
                    style={{ background: "var(--mobile-room-bar-bg)" }}
                >
                    <button
                        type="button"
                        className={
                            "KibitzSharedStreamPanel-mobileSwitchButton" +
                            (mobileTab === "room" ? " active" : "")
                        }
                        aria-pressed={mobileTab === "room"}
                        onClick={() => handleMobileTabChange("room")}
                    >
                        <span className="KibitzSharedStreamPanel-mobileSwitchContent">
                            <span
                                className="KibitzSharedStreamPanel-mobileSwitchSpacer"
                                aria-hidden="true"
                            />
                            <span className="KibitzSharedStreamPanel-mobileSwitchLabel">
                                {pgettext("Label for the kibitz mobile room tab", "Room")}
                            </span>
                            <span
                                className={
                                    "KibitzSharedStreamPanel-mobileSwitchIndicator" +
                                    (roomUnread ? " active" : "")
                                }
                                aria-hidden="true"
                            >
                                {roomUnread ? (
                                    <span className="KibitzSharedStreamPanel-unreadDot" />
                                ) : null}
                            </span>
                        </span>
                    </button>
                    <button
                        type="button"
                        className={
                            "KibitzSharedStreamPanel-mobileSwitchButton" +
                            (mobileTab === "game" ? " active" : "")
                        }
                        aria-pressed={mobileTab === "game"}
                        onClick={() => handleMobileTabChange("game")}
                    >
                        <span className="KibitzSharedStreamPanel-mobileSwitchContent">
                            <span
                                className="KibitzSharedStreamPanel-mobileSwitchSpacer"
                                aria-hidden="true"
                            />
                            <span className="KibitzSharedStreamPanel-mobileSwitchLabel">
                                {pgettext("Label for the kibitz mobile game tab", "Game")}
                            </span>
                            <span
                                className={
                                    "KibitzSharedStreamPanel-mobileSwitchIndicator" +
                                    (gameUnread ? " active" : "")
                                }
                                aria-hidden="true"
                            >
                                {gameUnread ? (
                                    <span className="KibitzSharedStreamPanel-unreadDot" />
                                ) : null}
                            </span>
                        </span>
                    </button>
                </div>
            ) : null}

            <div className="KibitzSharedStreamPanel-stack" ref={desktopStackRef}>
                {gamePane}
                {showDesktopSplitControl ? (
                    <button
                        type="button"
                        className={
                            "KibitzSharedStreamPanel-divider" +
                            (desktopDragging ? " is-dragging" : "")
                        }
                        aria-label={pgettext(
                            "Aria label for the kibitz shared stream split control",
                            "Shared stream split",
                        )}
                        onPointerDown={handleDesktopDividerPointerDown}
                    >
                        <span
                            className="KibitzSharedStreamPanel-dividerSide left"
                            aria-hidden="true"
                        >
                            <span className="KibitzSharedStreamPanel-dividerArrow">^</span>
                            <span className="KibitzSharedStreamPanel-dividerLabel">
                                {pgettext(
                                    "Label for the Kibitz game stream in the split divider",
                                    "Game",
                                )}
                            </span>
                        </span>
                        <span className="KibitzSharedStreamPanel-dividerHandle" aria-hidden="true">
                            <span className="KibitzSharedStreamPanel-dividerHandleDot" />
                            <span className="KibitzSharedStreamPanel-dividerHandleDot" />
                            <span className="KibitzSharedStreamPanel-dividerHandleDot" />
                        </span>
                        <span
                            className="KibitzSharedStreamPanel-dividerSide right"
                            aria-hidden="true"
                        >
                            <span className="KibitzSharedStreamPanel-dividerLabel">
                                {pgettext(
                                    "Label for the Kibitz room stream in the split divider",
                                    "Room",
                                )}
                            </span>
                            <span className="KibitzSharedStreamPanel-dividerArrow">v</span>
                        </span>
                    </button>
                ) : null}
                {roomPane}
                {gameVisible && !roomVisible ? disabledComposer : null}
            </div>
        </div>
    );
}
