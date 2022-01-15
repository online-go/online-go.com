/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import * as preferences from "preferences";
import { _ } from "translate";

interface PuzzleSettingsModalState {
    randomize_transform: boolean;
    randomize_color: boolean;
}

export class PuzzleSettingsModal extends React.PureComponent<{}, PuzzleSettingsModalState> {
    constructor(props) {
        super(props);
        this.state = {
            randomize_transform: preferences.get("puzzle.randomize.transform"),
            randomize_color: preferences.get("puzzle.randomize.color"),
        };
    }

    toggleTransform = () => {
        preferences.set("puzzle.randomize.transform", !this.state.randomize_transform);
        this.setState({ randomize_transform: !this.state.randomize_transform });
    };
    toggleColor = () => {
        preferences.set("puzzle.randomize.color", !this.state.randomize_color);
        this.setState({ randomize_color: !this.state.randomize_color });
    };
    render() {
        return (
            <div className="PuzzleSettingsModal">
                <div className="details">
                    <div className="option">
                        <input
                            id="transform"
                            type="checkbox"
                            checked={this.state.randomize_transform}
                            onChange={this.toggleTransform}
                        />
                        <label htmlFor="transform">{_("Randomly transform puzzles")}</label>
                    </div>
                    <div className="option">
                        <input
                            id="color"
                            type="checkbox"
                            checked={this.state.randomize_color}
                            onChange={this.toggleColor}
                        />
                        <label htmlFor="color">{_("Randomize colors")}</label>
                    </div>
                </div>
            </div>
        );
    }
}
