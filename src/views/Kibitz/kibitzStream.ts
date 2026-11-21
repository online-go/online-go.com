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
import * as data from "@/lib/data";
import type { KibitzRoomBroadcast } from "@/models/kibitz";

/** One viewer's own choice for a room's stream. Nothing set means "show
 *  whatever the room recommends". */
export interface KibitzStreamChoice {
    hidden?: boolean;
    channel?: string;
}

/** What this viewer sees: the channel to play, whether it is the room's own
 *  recommendation, and whether a stream exists at all that they hid. */
export interface KibitzResolvedStream {
    channel: string | null;
    isRoomStream: boolean;
    hidden: boolean;
}

// Twitch channel names are 4-25 letters, digits and underscores. Anything
// else never reaches an embed URL.
const CHANNEL_PATTERN = /^[A-Za-z0-9_]{1,25}$/;

export function isValidStreamChannel(channel: string | null | undefined): channel is string {
    return !!channel && CHANNEL_PATTERN.test(channel);
}

export function resolveKibitzStream(
    broadcast: KibitzRoomBroadcast | null | undefined,
    choice: KibitzStreamChoice | undefined,
): KibitzResolvedStream {
    const roomChannel = isValidStreamChannel(broadcast?.channel) ? broadcast.channel : null;
    const ownChannel = isValidStreamChannel(choice?.channel) ? choice.channel : null;
    const channel = ownChannel ?? roomChannel;
    if (!channel) {
        return { channel: null, isRoomStream: false, hidden: false };
    }
    if (choice?.hidden) {
        return { channel: null, isRoomStream: false, hidden: true };
    }
    return {
        channel,
        isRoomStream: !!roomChannel && channel.toLowerCase() === roomChannel.toLowerCase(),
        hidden: false,
    };
}

function readChoices(): Record<string, KibitzStreamChoice> {
    try {
        return data.get("kibitz.stream_choice", {}) ?? {};
    } catch {
        return {};
    }
}

export function readStreamChoice(roomId: string): KibitzStreamChoice | undefined {
    return readChoices()[roomId];
}

export function writeStreamChoice(roomId: string, choice: KibitzStreamChoice | undefined): void {
    const next = { ...readChoices() };
    if (!choice || (!choice.hidden && !choice.channel)) {
        delete next[roomId];
    } else {
        next[roomId] = choice;
    }
    try {
        data.set("kibitz.stream_choice", next);
    } catch {
        // Storage can be unavailable; the choice then lasts for this visit.
    }
}

/** The viewer's stream for a room, and the ways to change their own view of
 *  it. Nothing here changes the room for anyone else. */
export function useKibitzStream(
    roomId: string,
    broadcast: KibitzRoomBroadcast | null | undefined,
): KibitzResolvedStream & {
    hide: () => void;
    show: () => void;
    watch: (channel: string) => void;
    useRoomStream: () => void;
} {
    const [choice, setChoice] = React.useState(() => readStreamChoice(roomId));
    React.useEffect(() => {
        setChoice(readStreamChoice(roomId));
    }, [roomId]);

    const update = React.useCallback(
        (next: KibitzStreamChoice | undefined) => {
            writeStreamChoice(roomId, next);
            setChoice(next);
        },
        [roomId],
    );

    const resolved = resolveKibitzStream(broadcast, choice);
    return {
        ...resolved,
        hide: () => update({ ...choice, hidden: true }),
        show: () => update({ ...choice, hidden: false }),
        watch: (channel: string) => update({ channel }),
        useRoomStream: () => update(undefined),
    };
}

/** The host the page is served from: Twitch refuses to play inside a page
 *  whose host is not named as `parent`. */
function parentHost(): string {
    return window.location.hostname;
}

export function twitchPlayerUrl(channel: string): string {
    const params = new URLSearchParams({ channel, parent: parentHost(), muted: "false" });
    return `https://player.twitch.tv/?${params.toString()}`;
}

export function twitchChatUrl(channel: string, dark: boolean): string {
    const params = new URLSearchParams({ parent: parentHost() });
    if (dark) {
        params.set("darkpopout", "");
    }
    return `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?${params.toString()}`;
}
