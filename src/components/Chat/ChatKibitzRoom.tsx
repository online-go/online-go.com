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
import { interpolate, npgettext, pgettext } from "@/lib/translate";
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
 * Renders nothing when the channel has no such room or the directory cannot
 * be fetched.
 *
 * State comes from one initial directory fetch and then from pushes on the
 * `kibitz-rooms` directory channel only. The subscription stays active
 * also when no matching room exists.
 * `room-created` and `room-updated` (sent for each board change) adopt the
 * room by preset key, `viewer-count-changed` updates the count and
 * `room-removed` hides the card. `rooms-refresh` and socket reconnect
 * fetch the directory again.
 */
export function ChatKibitzRoom({ channel }: ChatKibitzRoomProps): React.ReactElement | null {
    const preset_key: string | undefined = CHANNEL_PRESET_KEYS[channel];
    const [room, setRoom] = useState<DirectoryRoom | null>(null);

    useEffect(() => {
        if (!preset_key) {
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

        const onRoomPayload = (payload: DirectoryRoom) => {
            if (payload?.preset?.preset_key !== preset_key) {
                return;
            }
            setRoom((prev) => (prev?.id === payload.id ? { ...prev, ...payload } : payload));
        };

        const onViewerCountChanged = (payload: { channel?: string; viewer_count?: number }) => {
            if (typeof payload?.viewer_count !== "number") {
                return;
            }
            const viewer_count = payload.viewer_count;
            setRoom((prev) =>
                prev && prev.channel === payload.channel ? { ...prev, viewer_count } : prev,
            );
        };

        const onRoomRemoved = (payload: { id?: string } | undefined) => {
            setRoom((prev) => (prev && prev.id === payload?.id ? null : prev));
        };

        const handlers = [
            push_manager.on("room-created", onRoomPayload),
            push_manager.on("room-updated", onRoomPayload),
            push_manager.on("viewer-count-changed", onViewerCountChanged),
            push_manager.on("room-removed", onRoomRemoved),
            push_manager.on("rooms-refresh", refresh),
        ];
        /* Subscribe before the first fetch so that no event published
           between the fetch and the subscription is lost. */
        push_manager.subscribe(KIBITZ_DIRECTORY_CHANNEL);
        refresh();
        socket.on("connect", refresh);

        return () => {
            cancelled = true;
            for (const handler of handlers) {
                push_manager.off(handler);
            }
            push_manager.unsubscribe(KIBITZ_DIRECTORY_CHANNEL);
            socket.off("connect", refresh);
        };
    }, [preset_key]);

    if (!preset_key || !room) {
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
                            npgettext(
                                "Tooltip for the viewer count shown on the chat page's kibitz room card",
                                "{{count}} person here",
                                "{{count}} people here",
                                viewer_count,
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
