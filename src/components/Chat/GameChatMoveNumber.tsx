/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of the
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
import { LineText } from "@/components/misc-ui";
import { useGobanControllerOrNull } from "@/components/GobanView/GobanViewContext";
import { pgettext } from "@/lib/translate";
import { protocol } from "goban";

/** The part of a chat line that says which move it was written at. */
type GameChatMoveReference = Pick<protocol.GameChatLine, "move_number" | "from" | "moves">;

interface GameChatMoveNumberProps {
    line: GameChatMoveReference;
    lastLine?: GameChatMoveReference;
}

/**
 * The "Move N" control above a game chat line, which takes the board to the
 * move the line was written at. It renders nothing while the line sits at the
 * same move as the line before it, so a run of comments on one move carries
 * a single heading.
 */
export function GameChatMoveNumber({
    line,
    lastLine,
}: GameChatMoveNumberProps): React.ReactElement | null {
    const goban_controller = useGobanControllerOrNull();

    if (
        lastLine &&
        line.move_number === lastLine.move_number &&
        line.from === lastLine.from &&
        line.moves === lastLine.moves
    ) {
        return null;
    }

    const jumpToMove = () => {
        if (!goban_controller) {
            return;
        }

        const goban = goban_controller.goban;
        goban_controller.stopEstimatingScore();

        if ((line.from ?? -1) >= 0 && "moves" in line) {
            goban.engine.followPath(line.from as number, line.moves as string);
            goban.syncReviewMove();
            goban.drawPenMarks(goban.engine.cur_move.pen_marks);
            goban.redraw();
        } else if ("move_number" in line) {
            if (!goban.isAnalysisDisabled()) {
                goban.setMode("analyze");
            }

            goban.engine.followPath(line.move_number, "");
            goban.redraw();

            if (goban.isAnalysisDisabled()) {
                goban.updatePlayerToMoveTitle();
            }

            goban.emit("update");
        }
    };

    return (
        <LineText className="move-number" onClick={jumpToMove}>
            {pgettext("Label for a jump-to-move control in game chat", "Move")} {line.move_number}
        </LineText>
    );
}
