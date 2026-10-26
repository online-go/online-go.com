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
import { rankString } from "@/lib/rank_utils";
import { interpolate, pgettext } from "@/lib/translate";
import "./RankRangeSlider.css";

interface RankRangeSliderProps {
    min: number;
    max: number;
    allowedMin: number;
    allowedMax: number;
    onChange: (min: number, max: number) => void;
}

/** Two native range inputs over whole ranks. A handle pushed past the other collapses the range onto it. */
export function RankRangeSlider({
    min,
    max,
    allowedMin,
    allowedMax,
    onChange,
}: RankRangeSliderProps): React.ReactElement {
    const setMin = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseInt(ev.target.value);
        onChange(Math.min(v, max), max);
    };
    const setMax = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseInt(ev.target.value);
        onChange(min, Math.max(v, min));
    };
    return (
        <div className="RankRangeSlider">
            <div className="label">
                {interpolate(
                    pgettext(
                        "Requester rank range a reviewer wants to see",
                        "Requester ranks: {{weakest}} to {{strongest}}",
                    ),
                    {
                        weakest: rankString(min),
                        strongest: rankString(max),
                    },
                )}
            </div>
            <div className="inputs">
                <input
                    type="range"
                    step="1"
                    min={allowedMin}
                    max={allowedMax}
                    value={min}
                    onChange={setMin}
                    aria-label={pgettext("Slider handle", "Weakest requester rank")}
                    aria-valuetext={rankString(min)}
                />
                <input
                    type="range"
                    step="1"
                    min={allowedMin}
                    max={allowedMax}
                    value={max}
                    onChange={setMax}
                    aria-label={pgettext("Slider handle", "Strongest requester rank")}
                    aria-valuetext={rankString(max)}
                />
            </div>
        </div>
    );
}
