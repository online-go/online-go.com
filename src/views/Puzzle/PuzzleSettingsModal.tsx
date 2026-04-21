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
import * as preferences from "@/lib/preferences";
import { _ } from "@/lib/translate";
import "./PuzzleSettingsModal.css";

export function PuzzleSettingsModal(): React.ReactElement {
    const [randomize_transform, setRandomizeTransform] = React.useState(
        preferences.get("puzzle.randomize.transform"),
    );
    const [randomize_color, setRandomizeColor] = React.useState(
        preferences.get("puzzle.randomize.color"),
    );

    const toggleTransform = () => {
        const next = !randomize_transform;
        preferences.set("puzzle.randomize.transform", next);
        setRandomizeTransform(next);
    };

    const toggleColor = () => {
        const next = !randomize_color;
        preferences.set("puzzle.randomize.color", next);
        setRandomizeColor(next);
    };

    return (
        <div className="PuzzleSettingsModal">
            <div className="details">
                <div className="option">
                    <input
                        id="transform"
                        type="checkbox"
                        checked={randomize_transform}
                        onChange={toggleTransform}
                    />
                    <label htmlFor="transform">{_("Randomly transform puzzles")}</label>
                </div>
                <div className="option">
                    <input
                        id="color"
                        type="checkbox"
                        checked={randomize_color}
                        onChange={toggleColor}
                    />
                    <label htmlFor="color">{_("Randomize colors")}</label>
                </div>
            </div>
        </div>
    );
}
