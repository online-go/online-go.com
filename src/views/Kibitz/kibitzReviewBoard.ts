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

import type { MoveTree } from "goban";
import type { GobanController } from "@/lib/GobanController";
import { pgettext } from "@/lib/translate";

/**
 * A room on a review follows its presenter: the review's controller, whose
 * current node (`cur_review_move`) is the review's position. That node plays
 * the part the trunk tail plays for a live game. It can be anywhere in the
 * tree, since the presenter branches, steps back and deletes moves.
 */

type ReviewGoban = Pick<GobanController["goban"], "review_id" | "engine">;

export function isReviewGoban(goban: ReviewGoban | null | undefined): boolean {
    return Boolean(goban?.review_id);
}

/** The presenter's node on a review goban, or null for any other goban. */
export function reviewPresenterNode(goban: ReviewGoban | null | undefined): MoveTree | null {
    if (!goban || !isReviewGoban(goban)) {
        return null;
    }
    return goban.engine.cur_review_move ?? null;
}

/** Moves a review goban back to the presenter's node. False for any other
 *  goban, or while the review has not loaded. */
export function returnToReviewPresenter(
    goban: GobanController["goban"] | null | undefined,
): boolean {
    const node = reviewPresenterNode(goban);
    if (!goban || !node) {
        return false;
    }
    goban.engine.jumpTo(node);
    goban.redraw(true);
    return true;
}

/** The label of the chat that belongs to the room's board: the game's chat,
 *  or the chat of the demo board or review. */
export function boardChatLabel(onReview: boolean): string {
    return onReview
        ? pgettext(
              "Kibitz chat tab for the chat of the demo board or review the room watches",
              "Board chat",
          )
        : pgettext("Kibitz chat tab for the watched game's chat", "Game chat");
}

/** True when `userId` is the presenter of the review on `goban`: its current
 *  controller, who may have been handed control by the owner. */
export function isReviewPresenter(
    goban: Pick<GobanController["goban"], "review_id" | "review_controller_id"> | null | undefined,
    userId: number | null | undefined,
): boolean {
    return Boolean(
        goban?.review_id && userId && userId > 0 && goban.review_controller_id === userId,
    );
}
