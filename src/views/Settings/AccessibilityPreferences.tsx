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

import { GobanEngineConfig } from "goban";

import { pgettext } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import { Toggle } from "@/components/Toggle";
import { MiniGoban } from "@/components/MiniGoban";
import { PreferenceLine } from "@/lib/SettingsCommon";

import "./AccessibilityPreferences.css";

// A small board whose last move (the final entry) sits at the centre, with
// stones on its row and column, so the crosshair preview shows the lines
// running the full board and passing under the stones.
const crosshair_sample_board: GobanEngineConfig = {
    width: 5,
    height: 5,
    // Five moves (B W B W B) so the last move is a black stone at the centre —
    // the more common case for contrast against the default blue crosshair.
    moves: [
        { x: 0, y: 2 },
        { x: 4, y: 2 },
        { x: 2, y: 0 },
        { x: 2, y: 4 },
        { x: 2, y: 2 },
    ],
};

export function AccessibilityPreferences(): React.ReactElement {
    const [crosshair, setCrosshair] = usePreference("accessibility.last-move-crosshair");
    const [color, setColor] = usePreference("accessibility.last-move-crosshair-color");
    const [thickness, setThickness] = usePreference("accessibility.last-move-crosshair-thickness");

    return (
        <div className="AccessibilityPreferences">
            <PreferenceLine
                title={pgettext(
                    "Accessibility setting that highlights the last move with crossed lines",
                    "Highlight the last move with a crosshair",
                )}
                description={pgettext(
                    "Description of the last-move crosshair accessibility setting",
                    "Draws a high-contrast horizontal and vertical line through the last played stone on every board, to make it easy to find.",
                )}
            >
                <Toggle checked={crosshair} onChange={setCrosshair} />
            </PreferenceLine>

            {crosshair && (
                <div className="crosshair-options">
                    <div className="crosshair-controls">
                        <PreferenceLine title={pgettext("Crosshair line color", "Crosshair color")}>
                            <input
                                type="color"
                                value={color}
                                onChange={(ev) => setColor(ev.target.value)}
                            />
                        </PreferenceLine>
                        <PreferenceLine
                            title={pgettext("Crosshair line thickness", "Crosshair thickness")}
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
                    </div>

                    <MiniGoban
                        className="crosshair-preview"
                        // Re-mount when the colour/thickness change so the
                        // freshly created board reads the new preference.
                        key={`${color}-${thickness}`}
                        json={crosshair_sample_board}
                        noLink={true}
                        width={5}
                        height={5}
                        displayWidth={150}
                        labels_positioning={"none"}
                        lastMoveCrosshair={true}
                    />
                </div>
            )}
        </div>
    );
}
