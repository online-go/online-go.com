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
import { pgettext, interpolate } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import type { CustomBoardGridBackgrounds } from "goban";
import { LineText } from "../misc-ui";
import "./GobanCustomBoardGridBackgroundPicker.css";

const grid_background_sizes: (keyof CustomBoardGridBackgrounds)[] = ["9", "13", "19"];

// Compact label shown next to each input, e.g. "9×9".
function getGridSizeLabel(size: keyof CustomBoardGridBackgrounds): string {
    return `${size}×${size}`;
}

// Full descriptive label used for the input placeholder and accessibility.
function getGridBackgroundLabel(size: keyof CustomBoardGridBackgrounds): string {
    return interpolate(
        pgettext(
            "Custom board baked-grid background URL, {{size}} is a board dimension like 9x9",
            "{{size}} grid background URL",
        ),
        { size: getGridSizeLabel(size) },
    );
}

function getResetGridBackgroundLabel(size: keyof CustomBoardGridBackgrounds): string {
    return interpolate(
        pgettext(
            "Reset custom board baked-grid background URL, {{size}} is a board dimension like 9x9",
            "Reset {{size}} grid background",
        ),
        { size: getGridSizeLabel(size) },
    );
}

export function GobanCustomBoardGridBackgroundPicker(): React.ReactElement {
    const [grid_backgrounds, setGridBackgrounds] = usePreference(
        "goban-theme-custom-board-grid-backgrounds",
    );
    const grid_backgrounds_ref = React.useRef(grid_backgrounds);

    React.useEffect(() => {
        grid_backgrounds_ref.current = grid_backgrounds;
    }, [grid_backgrounds]);

    function setGridBackground(size: keyof CustomBoardGridBackgrounds, url: string): void {
        /*
         * usePreference setters currently accept concrete values, not React
         * functional updates. Making this a normal functional update would mean
         * widening that shared hook interface for one component, so keep the
         * latest value locally instead. Updating the ref synchronously preserves
         * batched multi-field edits, such as browser autofill updating several
         * URLs in the same render.
         */
        const next_grid_backgrounds = {
            ...grid_backgrounds_ref.current,
            [size]: url,
        };

        grid_backgrounds_ref.current = next_grid_backgrounds;
        setGridBackgrounds(next_grid_backgrounds);
    }

    return (
        <div className="GobanCustomBoardGridBackgroundPicker">
            <LineText className="customize">
                {pgettext("Customize custom board baked-grid backgrounds", "Grid backgrounds")}
            </LineText>

            <div className="grid-background-url-selection">
                {grid_background_sizes.map((size) => {
                    const label = getGridBackgroundLabel(size);
                    const reset_label = getResetGridBackgroundLabel(size);
                    const input_id = `custom-board-grid-background-${size}`;
                    return (
                        <div className="grid-background-url-row" key={size}>
                            <label className="grid-size-label" htmlFor={input_id}>
                                {getGridSizeLabel(size)}
                            </label>
                            <input
                                id={input_id}
                                className="gridBackgroundUrlSelector"
                                type="text"
                                value={grid_backgrounds[size]}
                                placeholder={label}
                                aria-label={label}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setGridBackground(size, e.target.value)}
                            />
                            <button
                                type="button"
                                className="color-reset"
                                title={reset_label}
                                aria-label={reset_label}
                                onClick={() => setGridBackground(size, "")}
                            >
                                <i className="fa fa-undo" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
