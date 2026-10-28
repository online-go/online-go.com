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

import type { GobanController } from "@/lib/GobanController";

export async function openKibitzChatMove({
    controller,
    gameId,
    moveNumber,
    isCurrentGame,
    confirmDiscardDraft,
    closeVariation,
}: {
    controller: GobanController;
    gameId: number;
    moveNumber: number;
    isCurrentGame: () => boolean;
    confirmDiscardDraft: () => Promise<boolean>;
    closeVariation: () => void;
}): Promise<boolean> {
    const canOpen = () =>
        isCurrentGame() &&
        !controller.destroyed &&
        controller.goban.game_id === gameId &&
        Number.isSafeInteger(moveNumber) &&
        moveNumber >= 0 &&
        moveNumber <= controller.goban.engine.last_official_move.move_number;
    if (!canOpen() || !(await confirmDiscardDraft()) || !canOpen()) {
        return false;
    }
    closeVariation();
    controller.stopEstimatingScore();
    const goban = controller.goban;
    if (!goban.isAnalysisDisabled()) {
        goban.setMode("analyze");
    }
    goban.engine.followPath(moveNumber, "");
    goban.drawPenMarks(goban.engine.cur_move.pen_marks);
    if (goban.isAnalysisDisabled()) {
        goban.updatePlayerToMoveTitle();
    }
    goban.redraw(true);
    goban.emit("update");
    return true;
}
