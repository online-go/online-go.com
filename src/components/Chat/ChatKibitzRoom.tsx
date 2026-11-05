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
import { useMemo } from "react";
import { get } from "@/lib/requests";
import { pgettext } from "@/lib/translate";
import { rankString } from "@/lib/rank_utils";
import { KibitzDirectorySource, useKibitzDirectoryRooms } from "@/lib/useKibitzDirectoryRooms";
import { KibitzRoomCard, KibitzRoomCards } from "@/components/KibitzRoomCard";
import "./ChatKibitzRoom.css";

/** Chat channels that have a channel-scoped kibitz preset room. */
const CHANNEL_PRESET_KEYS: { [channel: string]: string } = {
    "global-english": "english-chat-live",
};

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
 * be fetched. `useKibitzDirectoryRooms` follows the room by preset key, and
 * its subscription stays active also when no matching room exists.
 */
export function ChatKibitzRoom({ channel }: ChatKibitzRoomProps): React.ReactElement | null {
    const preset_key: string | undefined = CHANNEL_PRESET_KEYS[channel];
    const source = useMemo<KibitzDirectorySource<DirectoryRoom> | null>(
        () =>
            preset_key
                ? {
                      fetchRooms: () => get("kibitz/directory"),
                      matches: (room) => room.preset?.preset_key === preset_key,
                  }
                : null,
        [preset_key],
    );
    const room: DirectoryRoom | undefined = useKibitzDirectoryRooms(source)[0];

    if (!room) {
        return null;
    }

    const black = room.current_game?.black;
    const white = room.current_game?.white;
    const vs_word = pgettext(
        "Separator between the two players' names on the chat page's kibitz room card",
        "vs",
    );

    return (
        <KibitzRoomCards>
            <KibitzRoomCard room={room} description={room.description}>
                {black?.username && white?.username ? (
                    <span
                        className="room-matchup"
                        title={`${playerLabel(black)} ${vs_word} ${playerLabel(white)}`}
                    >
                        <span className={playerNameClass(black)}>{black.username}</span>
                        <span className="player-rank">[{rankString(black)}]</span>
                        <span className="vs-word">{vs_word}</span>
                        <span className={playerNameClass(white)}>{white.username}</span>
                        <span className="player-rank">[{rankString(white)}]</span>
                    </span>
                ) : undefined}
            </KibitzRoomCard>
        </KibitzRoomCards>
    );
}
