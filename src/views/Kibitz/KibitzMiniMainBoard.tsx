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
import { pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import { GobanContainer } from "@/components/GobanContainer";
import "./KibitzMiniMainBoard.css";

interface KibitzMiniMainBoardProps {
    controller: GobanController;
    onClick: () => void;
}

/** Thumbnail of the live game shown while the center displays something
 *  else. Clicking it returns the center to the live game. */
export function KibitzMiniMainBoard({
    controller,
    onClick,
}: KibitzMiniMainBoardProps): React.ReactElement {
    return (
        <button
            type="button"
            className="KibitzMiniMainBoard"
            onClick={onClick}
            title={pgettext(
                "Tooltip on the small live game board in Kibitz",
                "Return to the live game",
            )}
        >
            <GobanContainer goban={controller.goban} respectContainerBounds />
        </button>
    );
}
