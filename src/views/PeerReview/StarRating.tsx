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
import { interpolate, pgettext } from "@/lib/translate";
import "./StarRating.css";

interface StarRatingProps {
    value: number | null;
    onChange?: (score: number) => void;
    readOnly?: boolean;
}

/** Five stars as a radio group; read-only mode renders the same look without inputs. */
export function StarRating({ value, onChange, readOnly }: StarRatingProps): React.ReactElement {
    const stars = [1, 2, 3, 4, 5];
    const label = pgettext("Accessible label for a star rating control", "Rating");
    return (
        <span className="StarRating" role={readOnly ? undefined : "radiogroup"} aria-label={label}>
            {stars.map((n) =>
                readOnly ? (
                    <span
                        key={n}
                        className={"star" + (value !== null && n <= value ? " filled" : "")}
                    >
                        <i className="fa fa-star" />
                    </span>
                ) : (
                    <label
                        key={n}
                        className={"star" + (value !== null && n <= value ? " filled" : "")}
                    >
                        <input
                            type="radio"
                            name="star-rating"
                            value={n}
                            checked={value === n}
                            onChange={() => onChange?.(n)}
                            aria-label={interpolate(pgettext("Star rating option", "{{n}} of 5"), {
                                n,
                            })}
                        />
                        <i className="fa fa-star" />
                    </label>
                ),
            )}
        </span>
    );
}
