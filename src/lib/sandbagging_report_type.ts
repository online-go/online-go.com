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

import type { Gamedata } from "@/lib/report_checklist";

/**
 * The two types a sandbagging complaint is filed as. The report dialog offers one
 * or the other, decided by sandbaggingReportType; nothing files the legacy
 * "sandbagging" type any more.
 */
export type SandbaggingReportType = "thrown_game" | "sandbagging_assessment";

export function isSandbaggingReportType(type: string): type is SandbaggingReportType {
    return type === "thrown_game" || type === "sandbagging_assessment";
}

/**
 * True when the accused played in the game, the game has finished and the other
 * player won. The outcome text is not consulted: a resignation, a timeout, a loss
 * on score and a cancellation all count, which is the server's rule too.
 *
 * The game data is an untyped fetch cast to Gamedata, so each field is checked
 * before use: a missing field means "not known to have lost", never a crash.
 */
export function accusedLostFinishedGame(gamedata: Gamedata, accused_id: number): boolean {
    if (gamedata.phase !== "finished" || typeof gamedata.winner !== "number") {
        return false;
    }
    const opponent_id =
        gamedata.black_player_id === accused_id
            ? gamedata.white_player_id
            : gamedata.white_player_id === accused_id
              ? gamedata.black_player_id
              : undefined;
    return typeof opponent_id === "number" && gamedata.winner === opponent_id;
}

/**
 * The type a sandbagging complaint about `accused_id` is filed as. Thrown Game
 * needs a finished game the accused lost; every other case, including no game
 * data at all, is a sandbagging assessment for the moderators.
 */
export function sandbaggingReportType(
    gamedata: Gamedata | undefined,
    accused_id: number | undefined,
): SandbaggingReportType {
    if (gamedata && accused_id !== undefined && accusedLostFinishedGame(gamedata, accused_id)) {
        return "thrown_game";
    }
    return "sandbagging_assessment";
}
