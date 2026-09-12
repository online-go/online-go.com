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
import { useEffect, useState } from "react";
import { get } from "@/lib/requests";
import { browserHistory } from "@/lib/ogsHistory";
import { socket } from "@/lib/sockets";
import { interpolate, pgettext } from "@/lib/translate";
import { rankString } from "@/lib/rank_utils";
import { push_manager } from "@/components/UIPush/UIPush";
import "./ChatKibitzRoom.css";

/** Chat channels that have a channel-scoped kibitz preset room. */
const CHANNEL_PRESET_KEYS: { [channel: string]: string } = {
    "global-english": "english-chat-live",
};

/** UIPush channel carrying kibitz directory events (viewer counts, room
 * updates). Matches DIRECTORY_BROADCAST_CHANNEL on the server. */
const KIBITZ_DIRECTORY_CHANNEL = "kibitz-rooms";

interface DirectoryPlayer {
    username: string;
    ranking: number;
    professional: boolean;
}

interface DirectoryCurrentGame {
    black?: DirectoryPlayer | null;
    white?: DirectoryPlayer | null;
}

interface DirectoryRoom {
    id: string;
    channel: string;
    title: string;
    description?: string | null;
    viewer_count?: number;
    current_game?: DirectoryCurrentGame | null;
    preset?: { preset_key?: string } | null;
}

interface ChatKibitzRoomProps {
    channel: string;
}

function playerLabel(player: DirectoryPlayer): string {
    return `${player.username} [${rankString(player)}]`;
}

/* Names longer than this may shrink (with ellipsis) under space pressure;
   shorter names always render whole at natural width. */
const TRUNCATABLE_NAME_LENGTH = 12;

function playerNameClass(player: DirectoryPlayer): string {
    return "player-name" + (player.username.length > TRUNCATABLE_NAME_LENGTH ? " truncatable" : "");
}

/**
 * Footer card for the chat page's user column, linking to the kibitz preset
 * room scoped to this chat channel (e.g. #English -> english-chat-live).
 * Renders nothing when the channel has no such room, the kibitz feature is
 * nav-disabled, or the directory cannot be fetched.
 *
 * State is push-driven after one initial directory fetch: board changes
 * arrive as `board-changed` on the room's own UIPush channel (and as
 * `room-updated` on the directory channel where the server publishes
 * them there), viewer counts as `viewer-count-changed` on the directory
 * channel. The fetch re-runs on socket reconnect to cover events missed
 * while disconnected.
 */
export function ChatKibitzRoom({ channel }: ChatKibitzRoomProps): React.ReactElement | null {
    const preset_key: string | undefined = CHANNEL_PRESET_KEYS[channel];
    const [enabled, setEnabled] = useState(false);
    const [room, setRoom] = useState<DirectoryRoom | null>(null);

    useEffect(() => {
        if (!preset_key) {
            return;
        }
        let cancelled = false;
        get("kibitz/nav-config")
            .then((res: { show_in_nav?: boolean }) => {
                if (!cancelled) {
                    setEnabled(Boolean(res?.show_in_nav));
                }
            })
            .catch(() => {
                // Kibitz stays hidden when the flag cannot be fetched.
            });
        return () => {
            cancelled = true;
        };
    }, [preset_key]);

    useEffect(() => {
        if (!preset_key || !enabled) {
            return;
        }
        let cancelled = false;
        const refresh = () => {
            get("kibitz/directory")
                .then((rooms: DirectoryRoom[]) => {
                    if (cancelled) {
                        return;
                    }
                    const match = (rooms ?? []).find((r) => r.preset?.preset_key === preset_key);
                    setRoom(match ?? null);
                })
                .catch(() => {
                    if (!cancelled) {
                        setRoom(null);
                    }
                });
        };
        refresh();
        socket.on("connect", refresh);
        return () => {
            cancelled = true;
            socket.off("connect", refresh);
        };
    }, [preset_key, enabled]);

    const room_id = room?.id;
    const room_channel = room?.channel;

    useEffect(() => {
        if (!preset_key || !enabled || !room_id || !room_channel) {
            return;
        }

        const mergeRoomPayload = (payload: DirectoryRoom) => {
            if (!payload || payload.id !== room_id) {
                return;
            }
            setRoom((prev) => (prev ? { ...prev, ...payload } : prev));
        };

        const onViewerCountChanged = (payload: { channel?: string; viewer_count?: number }) => {
            if (payload?.channel !== room_channel || typeof payload.viewer_count !== "number") {
                return;
            }
            const viewer_count = payload.viewer_count;
            setRoom((prev) => (prev ? { ...prev, viewer_count } : prev));
        };

        const onRoomRemoved = (payload: { id?: string } | string | undefined) => {
            const id = typeof payload === "string" ? payload : payload?.id;
            if (id === room_id) {
                setRoom(null);
            }
        };

        const handlers = [
            push_manager.on("board-changed", mergeRoomPayload),
            push_manager.on("room-updated", mergeRoomPayload),
            push_manager.on("viewer-count-changed", onViewerCountChanged),
            push_manager.on("room-removed", onRoomRemoved),
        ];
        push_manager.subscribe(KIBITZ_DIRECTORY_CHANNEL);
        push_manager.subscribe(room_channel);

        return () => {
            for (const handler of handlers) {
                push_manager.off(handler);
            }
            push_manager.unsubscribe(room_channel);
            push_manager.unsubscribe(KIBITZ_DIRECTORY_CHANNEL);
        };
    }, [preset_key, enabled, room_id, room_channel]);

    if (!preset_key || !enabled || !room) {
        return null;
    }

    const black = room.current_game?.black;
    const white = room.current_game?.white;
    const has_matchup = Boolean(black?.username && white?.username);
    const vs_word = pgettext(
        "Separator between the two players' names on the chat page's kibitz room card",
        "vs",
    );
    const line_tooltip =
        has_matchup && black && white
            ? `${playerLabel(black)} ${vs_word} ${playerLabel(white)}`
            : (room.description ?? "");
    const viewer_count = room.viewer_count ?? 0;

    return (
        <div className="ChatKibitzRoom">
            <div className="kibitz-header">
                {pgettext("Heading above the kibitz room card on the chat page", "Kibitz")}
                <i className="fa fa-comments" aria-hidden="true" />
            </div>
            <button
                type="button"
                className="kibitz-room-card"
                onClick={() => browserHistory.push(`/kibitz/${room.id}`)}
            >
                <span className="room-title">{room.title}</span>
                <span className="room-info-row">
                    {has_matchup && black && white ? (
                        <span className="room-matchup" title={line_tooltip}>
                            <span className={playerNameClass(black)}>{black.username}</span>
                            <span className="player-rank">[{rankString(black)}]</span>
                            <span className="vs-word">{vs_word}</span>
                            <span className={playerNameClass(white)}>{white.username}</span>
                            <span className="player-rank">[{rankString(white)}]</span>
                        </span>
                    ) : (
                        <span className="room-live-line" title={line_tooltip}>
                            {line_tooltip}
                        </span>
                    )}
                    <span
                        className="room-viewer-count"
                        title={interpolate(
                            pgettext(
                                "Tooltip for the viewer count shown on the chat page's kibitz room card",
                                "{{count}} people here",
                            ),
                            { count: viewer_count },
                        )}
                    >
                        <span className="room-viewer-number">{viewer_count}</span>
                        <span className="room-viewer-icon" aria-hidden="true">
                            <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                                <path
                                    d="M8 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 1c-2.7 0-5 1.4-5 3.2V14h10v-1.8C13 10.4 10.7 9 8 9Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </span>
                    </span>
                </span>
            </button>
        </div>
    );
}
