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
import type { KibitzSecondaryPaneState } from "@/models/kibitz";
import "./KibitzDividerHandle.css";

interface KibitzDividerHandleProps {
    secondaryPane: KibitzSecondaryPaneState;
    onCycle: () => void;
}

export function KibitzDividerHandle({
    secondaryPane,
    onCycle,
}: KibitzDividerHandleProps): React.ReactElement {
    const mode = secondaryPane.collapsed ? "hidden" : (secondaryPane.size ?? "small");
    const nextMode =
        mode === "hidden"
            ? pgettext("Next kibitz divider mode label", "small")
            : mode === "small"
              ? pgettext("Next kibitz divider mode label", "equal")
              : pgettext("Next kibitz divider mode label", "hidden");

    return (
        <button
            type="button"
            className={`KibitzDividerHandle mode-${mode}`}
            onClick={onCycle}
            aria-label={pgettext(
                "Aria label for the kibitz divider handle that cycles secondary pane sizes",
                "Resize secondary board",
            )}
            title={interpolate(
                pgettext(
                    "Tooltip for the kibitz divider handle that cycles secondary pane sizes",
                    "Switch secondary board size (next: {{mode}})",
                ),
                { mode: nextMode },
            )}
        >
            <span className="handle-bars" aria-hidden="true">
                <span />
                <span />
                <span />
            </span>
        </button>
    );
}
