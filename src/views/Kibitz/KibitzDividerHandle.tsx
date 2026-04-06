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
import type { KibitzSecondaryPaneState } from "@/models/kibitz";
import "./KibitzDividerHandle.css";

interface KibitzDividerHandleProps {
    secondaryPane: KibitzSecondaryPaneState;
    onIncrease: () => void;
    onDecrease: () => void;
}

export function KibitzDividerHandle({
    secondaryPane,
    onIncrease,
    onDecrease,
}: KibitzDividerHandleProps): React.ReactElement {
    const mode = secondaryPane.collapsed ? "hidden" : (secondaryPane.size ?? "small");
    const canIncrease = mode !== "equal";
    const canDecrease = mode !== "hidden";

    return (
        <div className={`KibitzDividerHandle mode-${mode}`}>
            {canIncrease ? (
                <button
                    type="button"
                    className="divider-arrow increase"
                    onClick={onIncrease}
                    aria-label={pgettext(
                        "Aria label for making the kibitz secondary board larger",
                        "Increase secondary board size",
                    )}
                    title={pgettext(
                        "Tooltip for making the kibitz secondary board larger",
                        "Increase secondary board size",
                    )}
                >
                    <i className="fa fa-caret-left" />
                </button>
            ) : null}
            {canDecrease ? (
                <button
                    type="button"
                    className="divider-arrow decrease"
                    onClick={onDecrease}
                    aria-label={pgettext(
                        "Aria label for making the kibitz secondary board smaller",
                        "Decrease secondary board size",
                    )}
                    title={pgettext(
                        "Tooltip for making the kibitz secondary board smaller",
                        "Decrease secondary board size",
                    )}
                >
                    <i className="fa fa-caret-right" />
                </button>
            ) : null}
        </div>
    );
}
