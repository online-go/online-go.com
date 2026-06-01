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

import { llm_pgettext } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import { Toggle } from "@/components/Toggle";
import { PreferenceLine } from "@/lib/SettingsCommon";

import "./AccessibilityPreferences.css";

export function AccessibilityPreferences(): React.ReactElement {
    const [crosshair, setCrosshair] = usePreference("accessibility.last-move-crosshair");
    const [color, setColor] = usePreference("accessibility.last-move-crosshair-color");
    const [thickness, setThickness] = usePreference("accessibility.last-move-crosshair-thickness");

    return (
        <div className="AccessibilityPreferences">
            <PreferenceLine
                title={llm_pgettext(
                    "Accessibility setting that highlights the last move with crossed lines",
                    "Highlight the last move with a crosshair",
                )}
                description={llm_pgettext(
                    "Description of the last-move crosshair accessibility setting",
                    "Draws a high-contrast horizontal and vertical line through the last played stone on every board, to make it easy to find.",
                )}
            >
                <Toggle checked={crosshair} onChange={setCrosshair} />
            </PreferenceLine>

            {crosshair && (
                <>
                    <PreferenceLine title={llm_pgettext("Crosshair line color", "Crosshair color")}>
                        <input
                            type="color"
                            value={color}
                            onChange={(ev) => setColor(ev.target.value)}
                        />
                    </PreferenceLine>
                    <PreferenceLine
                        title={llm_pgettext("Crosshair line thickness", "Crosshair thickness")}
                    >
                        <input
                            type="range"
                            value={thickness}
                            min={0.02}
                            max={0.4}
                            step={0.01}
                            onChange={(ev) => setThickness(parseFloat(ev.target.value))}
                        />
                    </PreferenceLine>
                </>
            )}
        </div>
    );
}
