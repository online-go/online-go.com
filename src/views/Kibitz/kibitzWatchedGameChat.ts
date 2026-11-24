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

import type { ChatSystemLink } from "@/lib/chat_manager";
import { rankString } from "@/lib/rank_utils";
import { _, interpolate, pgettext } from "@/lib/translate";
import type { KibitzRoomUser, KibitzStreamItem, KibitzWatchedGame } from "@/models/kibitz";
import { boardHref } from "./kibitzBoardRef";
import { isPendingGameChangeNotice } from "./kibitzVisibleStreamItems";

const GAME_LINK = /^\/game\/(?:view\/)?([1-9]\d*)\/?(?:[?#][^\s\\]*)?$/;
const LEGACY_SWITCH_PREFIX = "The watched game changed to ";
const RECENT_HISTORY_GAME_LIMIT = 10;

export function watchedGameChatLink(
    item: KibitzStreamItem,
): { gameId: number; link: ChatSystemLink } | undefined {
    if (
        item.type !== "system" ||
        item.source === "game-chat" ||
        item.move_number != null ||
        isPendingGameChangeNotice(item)
    ) {
        return undefined;
    }

    if (Array.isArray(item.links) && item.links.length) {
        for (const link of item.links) {
            const match = typeof link?.href === "string" && GAME_LINK.exec(link.href);
            const gameId = match ? Number(match[1]) : 0;
            if (
                gameId > 0 &&
                Number.isSafeInteger(gameId) &&
                (item.game_id == null || item.game_id === gameId) &&
                typeof link.text === "string" &&
                link.text.length > 0 &&
                item.text.includes(link.text)
            ) {
                return { gameId, link };
            }
        }
        return undefined;
    }

    // Older automatic switch messages have a game id but no link span.
    // The server's completion message puts the title after this fixed prefix.
    const gameId = item.game_id ?? 0;
    if (gameId > 0 && Number.isSafeInteger(gameId) && item.text.startsWith(LEGACY_SWITCH_PREFIX)) {
        const text = item.text.slice(LEGACY_SWITCH_PREFIX.length);
        // The shared renderer links the first occurrence of the span.
        if (text.trim() && item.text.indexOf(text) === LEGACY_SWITCH_PREFIX.length) {
            return { gameId, link: { text, href: boardHref(`game:${gameId}`) } };
        }
    }
    return undefined;
}

export function recentWatchedGameChatIds(
    items: readonly KibitzStreamItem[],
    roomId: string,
): Set<number> {
    const ids = new Set<number>();
    for (let i = items.length - 1; i >= 0 && ids.size < RECENT_HISTORY_GAME_LIMIT; i--) {
        const item = items[i];
        const match = item.room_id === roomId ? watchedGameChatLink(item) : undefined;
        if (match) {
            ids.add(match.gameId);
        }
    }
    return ids;
}

function rankedName(player: KibitzRoomUser, hideRanks: boolean): string {
    return !hideRanks && Number.isFinite(player.ranking)
        ? interpolate(pgettext("Kibitz watched-game player and rank", "{{name}} [{{rank}}]"), {
              name: player.username,
              rank: rankString(player),
          })
        : player.username;
}

function normalizeTitle(title: string): string {
    return title.trim().replace(/\s+/g, " ").toLowerCase();
}

export function watchedGameChatLabel(
    item: KibitzStreamItem,
    link: ChatSystemLink,
    game: KibitzWatchedGame | undefined,
    hideRanks: boolean,
): string | undefined {
    if (!game) {
        return undefined;
    }
    const title = link.text;
    const normalized = normalizeTitle(title);
    if (
        normalized !== normalizeTitle(game.title) &&
        normalized !== `#${game.game_id}` &&
        !item.text.startsWith(LEGACY_SWITCH_PREFIX)
    ) {
        return undefined;
    }

    return formatWatchedGameLabel(title, game, hideRanks);
}

export function formatWatchedGameLabel(
    title: string,
    game: KibitzWatchedGame,
    hideRanks = false,
): string | undefined {
    if (!game.black.username || !game.white.username) {
        return undefined;
    }

    const matchup = interpolate(pgettext("Kibitz watched-game players", "{{black}} vs {{white}}"), {
        black: rankedName(game.black, hideRanks),
        white: rankedName(game.white, hideRanks),
    });
    const black = normalizeTitle(game.black.username);
    const white = normalizeTitle(game.white.username);
    const redundantTitles = [
        "",
        "friendly match",
        normalizeTitle(_("Friendly Match")),
        `#${game.game_id}`,
        `${black} vs ${white}`,
        `${white} vs ${black}`,
        `${black} vs. ${white}`,
        `${white} vs. ${black}`,
    ];
    return redundantTitles.includes(normalizeTitle(title))
        ? matchup
        : interpolate(pgettext("Kibitz watched-game title and players", "{{title}}: {{players}}"), {
              title,
              players: matchup,
          });
}
