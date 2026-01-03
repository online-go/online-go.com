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
import { useGobanController } from "@/views/Game/goban_context";
import { _, interpolate } from "@/lib/translate";

interface MoveListPopoverProps {
    moves: number[];
    category: string;
    color: "black" | "white";
    onClose: () => void;
    showFullReviewPrompt?: boolean;
    onStartFullReview?: () => void;
    showBecomeSupporterText?: boolean;
}

export function MoveListPopover({
    moves,
    category,
    color,
    onClose,
    showFullReviewPrompt,
    onStartFullReview,
    showBecomeSupporterText,
}: MoveListPopoverProps): React.ReactElement {
    const goban_controller = useGobanController();

    const renderContent = () => {
        if (showFullReviewPrompt && onStartFullReview) {
            return (
                <div className="full-review-prompt">
                    <button className="primary" onClick={onStartFullReview}>
                        {_("Full AI Review")}
                    </button>
                    {showBecomeSupporterText && (
                        <div
                            className="fakelink become-a-site-supporter-line"
                            onClick={onStartFullReview}
                        >
                            {_("Become a site supporter today for in-depth interactive AI reviews")}
                        </div>
                    )}
                </div>
            );
        }

        if (moves.length > 0) {
            return (
                <div className="move-numbers">
                    {moves.map((move) => (
                        <span
                            key={move}
                            className="move-number"
                            onClick={() => {
                                goban_controller.gotoMove(move - 1);
                            }}
                        >
                            {move}
                        </span>
                    ))}
                </div>
            );
        }

        return <div className="no-moves">{_("No moves in this category")}</div>;
    };

    return (
        <div className={`category-move-popover popover-${category.toLowerCase()}`}>
            <div className="category-move-header">
                <span>
                    {interpolate(_("{{category}} Moves ({{color}})"), {
                        category: _(category),
                        color: _(color),
                    })}
                </span>
                <button className="close-button" onClick={onClose}>
                    <i className="fa fa-times" />
                </button>
            </div>
            <div className="category-move-content">{renderContent()}</div>
        </div>
    );
}
