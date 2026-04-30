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
}

export interface KibitzAnalysisGameLike {
    live?: boolean;
    ended?: string | null;
    analysis_disabled?: boolean | null;
    disable_analysis?: boolean | null;
    gamedata?: {
        analysis_disabled?: boolean | null;
        disable_analysis?: boolean | null;
    } | null;
    players?: {
        black?: unknown;
        white?: unknown;
    } | null;
    black?: unknown;
    white?: unknown;
}

export type KibitzAccessPolicyResult =
    | {
          allowed: true;
          reason?: "analysis-disabled-spectator";
      }
    | {
          allowed: false;
          reason: "own-active-analysis-disabled-game";
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

export function isActiveAnalysisDisabledGame(
    game: KibitzAnalysisGameLike | null | undefined,
): boolean {
    if (!game) {
        return false;
    }

    const active = game.ended == null && game.live !== false;
    const analysisDisabled = Boolean(
        game.analysis_disabled ||
        game.disable_analysis ||
        game.gamedata?.analysis_disabled ||
        game.gamedata?.disable_analysis,
    );

    return active && analysisDisabled;
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

    return userId === blackId || userId === whiteId;
}

export function getKibitzAccessPolicyForUser(
    user: KibitzAnalysisUser | null | undefined,
    game: KibitzAnalysisGameLike | null | undefined,
): KibitzAccessPolicyResult {
    if (!user || user.anonymous || !game) {
        return { allowed: true };
    }

    if (!isActiveAnalysisDisabledGame(game)) {
        return { allowed: true };
    }

    if (isCurrentUserGamePlayer(user, game)) {
        return {
            allowed: false,
            reason: "own-active-analysis-disabled-game",
        };
    }

    return {
        allowed: true,
        reason: "analysis-disabled-spectator",
    };
}

export function isKibitzAccessBlockedForUser(
    user: KibitzAnalysisUser | null | undefined,
    game: KibitzAnalysisGameLike | null | undefined,
): boolean {
    return !getKibitzAccessPolicyForUser(user, game).allowed;
}
