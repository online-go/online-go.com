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
import { useCallback } from "react";
import { _ } from "@/lib/translate";
import { parseNumberInput } from "./ChallengeModal.utils";

type ChallengeModalBoardSizeSettingsProps = {
    conf: any;
    mode: string;
    game: any;
    updateBoardSize: (selection: string) => void;
    updateBoardWidth: (width: number | null) => void;
    updateBoardHeight: (height: number | null) => void;
};

export const ChallengeModalBoardSizeSettings = ({
    conf,
    mode,
    game,
    updateBoardSize,
    updateBoardWidth,
    updateBoardHeight,
}: ChallengeModalBoardSizeSettingsProps) => {
    const enable_custom_board_sizes = mode === "computer" || !game.ranked;
    const showCustomBoardSizeSettings = conf.selected_board_size === "custom";

    const cb_update_board_size = useCallback(
        (ev: React.ChangeEvent<HTMLSelectElement>) => {
            const selection = ev.target.value;
            updateBoardSize(selection);
        },
        [updateBoardSize],
    );

    const cb_update_board_width = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const width = parseNumberInput(ev.target.value);
            updateBoardWidth(width);
        },
        [updateBoardWidth],
    );

    const cb_update_board_height = useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const height = parseNumberInput(ev.target.value);
            updateBoardHeight(height);
        },
        [updateBoardHeight],
    );

    return (
        <>
            <div className="form-group" id="challenge-board-size-group">
                <label className="control-label" htmlFor="challenge-board-size">
                    {_("Board Size")}
                </label>
                <div className="controls">
                    <div className="checkbox">
                        <select
                            id="challenge-board-size"
                            value={conf.selected_board_size}
                            onChange={cb_update_board_size}
                            className="challenge-dropdown form-control"
                        >
                            <optgroup label={_("Normal Sizes")}>
                                <option value="19x19">19x19</option>
                                <option value="13x13">13x13</option>
                                <option value="9x9">9x9</option>
                            </optgroup>
                            <optgroup label={_("Extreme Sizes")}>
                                <option disabled={!enable_custom_board_sizes} value="25x25">
                                    25x25
                                </option>
                                <option disabled={!enable_custom_board_sizes} value="21x21">
                                    21x21
                                </option>
                                <option disabled={!enable_custom_board_sizes} value="5x5">
                                    5x5
                                </option>
                            </optgroup>
                            <optgroup label={_("Non-Square")}>
                                <option disabled={!enable_custom_board_sizes} value="19x9">
                                    19x9
                                </option>
                                <option disabled={!enable_custom_board_sizes} value="5x13">
                                    5x13
                                </option>
                            </optgroup>
                            <optgroup label={_("Custom")}>
                                <option disabled={!enable_custom_board_sizes} value="custom">
                                    {_("Custom Size")}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>
            {showCustomBoardSizeSettings && (
                <div className="form-group">
                    <label className="control-label" htmlFor="challenge-board-size-custom"></label>
                    <div className="controls">
                        <div className="checkbox">
                            <input
                                type="number"
                                value={game.width ?? ""}
                                onChange={cb_update_board_width}
                                id="challenge-goban-width"
                                className="form-control"
                                style={{ width: "3em" }}
                                min="1"
                                max="25"
                            />
                            x
                            <input
                                type="number"
                                value={game.height ?? ""}
                                onChange={cb_update_board_height}
                                id="challenge-goban-height"
                                className="form-control"
                                style={{ width: "3em" }}
                                min="1"
                                max="25"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
