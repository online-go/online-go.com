/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { TypedEventEmitter } from "TypedEventEmitter";
import { Goban } from "goban";

interface Events {
    stopEstimatingScore: void; // emitted when we want to stop estimating the score
    gotoMove: number; // emitted when we want to go to a specific move
}

/** The Game interface is a complex hierarchy of components. This GameControl
 * system enables us to send messages from one component to another without
 * passing a bunch of lambdas and state around. */

class GameControl extends TypedEventEmitter<Events> {
    public goban?: Goban;
    public in_pushed_analysis: boolean = false;
    public onPushAnalysisLeft?: () => void;
    public last_variation_number: number = 0;
    public creator_id?: number;
    constructor() {
        super();
    }
}

export const game_control = new GameControl();
