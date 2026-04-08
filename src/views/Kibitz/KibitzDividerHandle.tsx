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

type DividerMode = "hidden" | "small" | "equal";

interface KibitzDividerHandleProps {
    secondaryPane: KibitzSecondaryPaneState;
    onSetMode: (mode: DividerMode) => void;
}

const MODE_OPTIONS: Array<{ id: DividerMode; label: string; className: string }> = [
    {
        id: "hidden",
        label: pgettext("Kibitz divider mode label", "Focus main"),
        className: "focus-main",
    },
    {
        id: "small",
        label: pgettext("Kibitz divider mode label", "Split"),
        className: "split-view",
    },
    {
        id: "equal",
        label: pgettext("Kibitz divider mode label", "Compare"),
        className: "compare-view",
    },
];

export function KibitzDividerHandle({
    secondaryPane,
    onSetMode,
}: KibitzDividerHandleProps): React.ReactElement {
    const mode: DividerMode = secondaryPane.collapsed ? "hidden" : (secondaryPane.size ?? "small");

    return (
        <div
            className={`KibitzDividerHandle mode-${mode}`}
            role="group"
            aria-label={pgettext("Aria label for kibitz divider mode switch", "Board layout")}
        >
            <div className="divider-mode-switch">
                {MODE_OPTIONS.map((option) => {
                    const active = option.id === mode;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            className={
                                `divider-mode-button ${option.className}` +
                                (active ? " active" : "")
                            }
                            onClick={() => onSetMode(option.id)}
                            aria-pressed={active}
                            aria-label={option.label}
                            title={option.label}
                        >
                            <span className="layout-glyph" aria-hidden="true">
                                <span className="pane pane-main" />
                                <span className="pane pane-secondary" />
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
