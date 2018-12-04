/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {LearningPage, DummyPage} from './LearningPage';
import {_, pgettext, interpolate} from "translate";
import {LearningHubSection} from './LearningHubSection';


export class Ladders extends LearningHubSection {
    static pages():Array<typeof LearningPage> {
        return [
            Page1,
            Page2,
            Page3,
            //Page5,
            //Page6,
            //Page7,
        ];
    }

    static section():string { return "ladders"; }
    static title():string { return pgettext("Tutorial section on ladders", "Ladders!"); }
    //static subtext():string { return pgettext("Tutorial section on ladders", ""); }
    static subtext():string { return ""; }
}

class Page1 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("This zig zag pattern is called a \"ladder\". Capture the white stones by continuing the ladder.");
    }
    config() {
        return {
            mode: "puzzle",

            initial_state: {black: "fceddegedfffeg", white: "fdgdeefeef"},
            move_tree: this.makePuzzleMoveTree(
                [
                    "h6g7g8h7j7h8h9j8j9"
                ],
                [
                    ""
                ]
            )
        };
    }
}

class Page2 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("Capture the white stones using a ladder.");
    }
    config() {
        return {
            mode: "puzzle",

            initial_state: {black: "gccecfdg", white: "df"},
            move_tree: this.makePuzzleMoveTree(
                [
                    "e4d5d6e5f5e6e7f6g6f7f8"
                ],
                [
                    "d5e4"
                ]
            )
        };
    }
}

class Page3 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("Stones in the path of a ladder break the ladder. Stay alive!");
    }
    config() {
        return {
            mode: "puzzle",

            initial_state: {black: "fcef", white: "eedfegfg"},
            move_tree: this.makePuzzleMoveTree(
                [
                    "f4g4f5f6g5h5g6e6"
                ],
                [
                    "f4g4f5f6g6g5",
                    "g4f4",
                    "f5f4",
                    "g5f4"
                ]
            )
        };
    }
}

