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

import { type GobanConfig, type MoveTreeJson } from "goban";

export type KibitzBoardLoadConfig = Record<string, unknown> & {
    move_tree?: MoveTreeJson;
    moves?: GobanConfig["moves"];
};

export interface KibitzCurrentGameBaseSnapshot {
    gameId: number;
    roomId?: string | null;
    trunkTailMoveNumber: number;
    moveTreeId: number | string | null;
    movePath: string;
    source: "main-board" | "room-base-broker" | "game-details" | "selected-game-details";
    fetchedMoveCount?: number | null;
    config: KibitzBoardLoadConfig;
}
