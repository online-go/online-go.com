/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
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
import { useMoveTreeLineColors } from "@/lib/move_tree_line_colors";
import "./KibitzVariationSwatch.css";

interface KibitzVariationSwatchProps {
    /** The variation's move-tree line colour, or null when the variation is
     *  not currently drawn on the board. */
    colorIndex: number | null | undefined;
    className?: string;
}

/**
 * A small square in a variation's move-tree line colour, so a row in the
 * variation list, a post in the chat and the line on the board can be matched
 * by eye. Renders nothing for a variation that is not on the board, which is
 * what distinguishes a listed variation from a visible one.
 */
export function KibitzVariationSwatch({
    colorIndex,
    className,
}: KibitzVariationSwatchProps): React.ReactElement | null {
    // The site theme swaps the palette, so the colour is read per render
    // rather than captured once.
    const colors = useMoveTreeLineColors();

    if (typeof colorIndex !== "number" || colorIndex < 0 || colorIndex >= colors.length) {
        return null;
    }

    return (
        <span
            className={"KibitzVariationSwatch" + (className ? ` ${className}` : "")}
            data-color-index={colorIndex}
            style={{ backgroundColor: colors[colorIndex] }}
            aria-hidden="true"
        />
    );
}
