/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { Toggle } from "@/components/Toggle";
import {
    board3dStyleOptions,
    board3dTiltOptions,
    nextBoard3dRotation,
    parseBoard3dTilt,
} from "@/lib/board3d";
import "./GameBoard3dSettings.css";

/**
 * The 3D toggle in the board settings popover. While 3D is on, the most used
 * 3D options sit in a group under it; the rest are on the Settings page.
 */
export function GameBoard3dSettings(): React.ReactElement {
    const [enabled, setEnabled] = usePreference("board-renderer-3d");
    const [style, setStyle] = usePreference("board-renderer-3d-style");
    const [room, setRoom] = usePreference("board-renderer-3d-room");
    const [rotation, setRotation] = usePreference("board-renderer-3d-rotation");
    const [tilt, setTilt] = usePreference("board-renderer-3d-tilt");

    return (
        <>
            <div className="GameSidebarPanel-labeled-row">
                <label htmlFor="game-settings-board-3d">
                    <i className="fa fa-cube" aria-hidden="true" />
                    <span>{pgettext("Board display setting", "Use a 3D board")}</span>
                </label>
                <Toggle id="game-settings-board-3d" checked={enabled} onChange={setEnabled} />
            </div>

            {enabled && (
                <div
                    className="GameBoard3dSettings-group"
                    role="group"
                    aria-label={pgettext("Board display setting", "3D board options")}
                >
                    <div className="GameSidebarPanel-labeled-row">
                        <label htmlFor="game-settings-board-3d-style">
                            {pgettext("3D board setting", "Style")}
                        </label>
                        <select
                            id="game-settings-board-3d-style"
                            value={style}
                            onChange={(event) =>
                                setStyle(event.target.value === "tabletop" ? "tabletop" : "floor")
                            }
                        >
                            {board3dStyleOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="GameSidebarPanel-labeled-row">
                        <label htmlFor="game-settings-board-3d-room">
                            {pgettext("3D board setting", "Table and bowls")}
                        </label>
                        <Toggle
                            id="game-settings-board-3d-room"
                            checked={room}
                            onChange={setRoom}
                        />
                    </div>

                    <div className="GameSidebarPanel-labeled-row">
                        <label htmlFor="game-settings-board-3d-tilt">
                            {pgettext("3D board camera setting", "View")}
                        </label>
                        <div className="GameBoard3dSettings-view">
                            <select
                                id="game-settings-board-3d-tilt"
                                aria-label={pgettext("3D board camera setting", "Viewing angle")}
                                value={tilt}
                                onChange={(event) => setTilt(parseBoard3dTilt(event.target.value))}
                            >
                                {board3dTiltOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                title={pgettext(
                                    "3D board camera setting",
                                    "Rotate the view a quarter turn",
                                )}
                                aria-label={pgettext(
                                    "3D board camera setting",
                                    "Rotate the view a quarter turn",
                                )}
                                onClick={() => setRotation(nextBoard3dRotation(rotation))}
                            >
                                <i className="fa fa-repeat" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
