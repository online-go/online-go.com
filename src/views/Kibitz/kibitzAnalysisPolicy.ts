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

import * as data from "@/lib/data";

export interface KibitzAnalysisUser {
    id?: number | string;
    user_id?: number | string;
    player_id?: number | string;
    username?: string;
    user?: KibitzAnalysisUser | number | string | null;
    anonymous?: boolean;
    is_moderator?: boolean;
    moderator_powers?: number;
}

export interface KibitzAnalysisGameLike {
    live?: boolean;
    ended?: string | null;
    analysis_disabled?: boolean | null;
    disable_analysis?: boolean | null;
    gamedata?: {
        analysis_disabled?: boolean | null;
        disable_analysis?: boolean | null;
        rengo_teams?: KibitzRengoTeams | null;
    } | null;
    rengo_black_team?: unknown[] | null;
    rengo_white_team?: unknown[] | null;
    rengo_teams?: KibitzRengoTeams | null;
    players?: {
        black?: unknown;
        white?: unknown;
    } | null;
    black?: unknown;
    white?: unknown;
}

export interface KibitzRengoTeams {
    black?: unknown[] | null;
    white?: unknown[] | null;
}

export type KibitzAccessPolicyResult =
    | {
          allowed: true;
          reason?: "analysis-disabled-spectator";
      }
    | {
          allowed: false;
          reason: "own-active-game";
      };

function getId(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof value === "object" && value !== null) {
        const record = value as Record<string, unknown>;

        return (
            getId(record.id) ??
            getId(record.user_id) ??
            getId(record.player_id) ??
            getId(record.user)
        );
    }

    return null;
}

export function getCurrentKibitzUser(): KibitzAnalysisUser | null {
    return (data.get("config.user") ?? data.get("user") ?? null) as KibitzAnalysisUser | null;
}

export function isLoggedInKibitzUser(
    user: ReturnType<typeof getCurrentKibitzUser> | null | undefined,
): boolean {
    return Boolean(user && !user.anonymous);
}

export function isActiveGame(game: KibitzAnalysisGameLike | null | undefined): boolean {
    if (!game) {
        return false;
    }
    return game.ended == null && game.live !== false;
}

/**
 * Mirrors the server's `is_user_player_in_active_game`: any game that has not
 * ended counts, live or correspondence.
 */
function isUnfinishedGame(game: KibitzAnalysisGameLike): boolean {
    return game.ended == null;
}

export function isActiveAnalysisDisabledGame(
    game: KibitzAnalysisGameLike | null | undefined,
): boolean {
    if (!isActiveGame(game)) {
        return false;
    }
    return Boolean(
        game!.analysis_disabled ||
        game!.disable_analysis ||
        game!.gamedata?.analysis_disabled ||
        game!.gamedata?.disable_analysis,
    );
}

export function isCurrentUserGamePlayer(
    user: KibitzAnalysisUser | null | undefined,
    game: KibitzAnalysisGameLike | null | undefined,
): boolean {
    const userId = getId(user);
    if (userId == null || !game) {
        return false;
    }

    const blackId = getId(game.players?.black) ?? getId(game.black);
    const whiteId = getId(game.players?.white) ?? getId(game.white);

    if (userId === blackId || userId === whiteId) {
        return true;
    }

    const rengoMembers = [
        game.rengo_black_team,
        game.rengo_white_team,
        game.rengo_teams?.black,
        game.rengo_teams?.white,
        game.gamedata?.rengo_teams?.black,
        game.gamedata?.rengo_teams?.white,
    ];
    return rengoMembers.some(
        (team) => Array.isArray(team) && team.some((member) => getId(member) === userId),
    );
}

export function getKibitzAccessPolicyForUser(
    user: KibitzAnalysisUser | null | undefined,
    game: KibitzAnalysisGameLike | null | undefined,
): KibitzAccessPolicyResult {
    if (!user || user.anonymous || !game) {
        return { allowed: true };
    }

    if (isUnfinishedGame(game) && isCurrentUserGamePlayer(user, game)) {
        return {
            allowed: false,
            reason: "own-active-game",
        };
    }

    if (isActiveAnalysisDisabledGame(game)) {
        return {
            allowed: true,
            reason: "analysis-disabled-spectator",
        };
    }

    return { allowed: true };
}

export function isKibitzAccessBlockedForUser(
    user: KibitzAnalysisUser | null | undefined,
    game: KibitzAnalysisGameLike | null | undefined,
): boolean {
    return !getKibitzAccessPolicyForUser(user, game).allowed;
}
