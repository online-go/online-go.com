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
import { usePreference } from "@/lib/preferences";
import type { CustomBoardGridBackgrounds } from "goban";
import { LineText } from "../misc-ui";
import "./GobanCustomBoardGridBackgroundPicker.css";

const grid_background_sizes: (keyof CustomBoardGridBackgrounds)[] = ["9", "13", "19"];

function getGridBackgroundLabel(size: keyof CustomBoardGridBackgrounds): string {
    switch (size) {
        case "9":
            return pgettext("Custom board baked-grid background URL", "9x9 grid background URL");
        case "13":
            return pgettext("Custom board baked-grid background URL", "13x13 grid background URL");
        case "19":
            return pgettext("Custom board baked-grid background URL", "19x19 grid background URL");
    }
}

function getResetGridBackgroundLabel(size: keyof CustomBoardGridBackgrounds): string {
    switch (size) {
        case "9":
            return pgettext(
                "Reset custom board baked-grid background URL",
                "Reset 9x9 grid background",
            );
        case "13":
            return pgettext(
                "Reset custom board baked-grid background URL",
                "Reset 13x13 grid background",
            );
        case "19":
            return pgettext(
                "Reset custom board baked-grid background URL",
                "Reset 19x19 grid background",
            );
    }
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
                    const input_id = `custom-board-grid-background-${size}`;
                    return (
                        <div className="grid-background-url-row" key={size}>
                            <label htmlFor={input_id}>{label}</label>
                            <input
                                id={input_id}
                                className="gridBackgroundUrlSelector"
                                type="text"
                                value={grid_backgrounds[size]}
                                placeholder={label}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setGridBackground(size, e.target.value)}
                            />
                            <button
                                type="button"
                                className="color-reset"
                                title={getResetGridBackgroundLabel(size)}
                                aria-label={getResetGridBackgroundLabel(size)}
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
