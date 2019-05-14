/*
 * Copyright (C) 2012-2019  Online-Go.com
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

export class Ko extends LearningHubSection {
    static pages():Array<typeof LearningPage> {
        return [
            Page1,
            Page2,
            Page3,
            Page4,
            //Page5,
            //Page6,
            //Page7,
        ];
    }

    static section():string { return "ko"; }
    static title():string { return pgettext("Tutorial section on ko", "Ko!"); }
    static subtext():string { return pgettext("Tutorial section on ko", "The recapture rule"); }
}


class Page1 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("To prevent endlessly re-capturing the same space, there's a special rule called the \"Ko rule\" which prevents immediately recapturing the same position.  Capture the white group by exploiting the Ko rule.");
    }
    config() {
        return {
            mode: "puzzle",

            initial_state: {black: "afbfcfcgdhcidi", white: "agbgahchbi"},
            move_tree: this.makePuzzleMoveTree(
                [
                    "b2d3a1"
                ],
                [
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
        return _("Connect your black stones");
    }
    config() {
        return {
            mode: "puzzle",

            initial_state: {black: "ecedeedfegehfh", white: "fdcedefeefgfcgdgfg"},
            move_tree: this.makePuzzleMoveTree(
                [
                    "f4c4e4"
                ],
                [
                    "c4b4",
                    "g3c4",
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
        return _("Capture two White stones by exploiting the Ko rule");
    }
    config() {
        return {
            mode: "puzzle",

            initial_state: {black: "fcfdgehfggfhgh", white: "edfeefgffgeh"},
            move_tree: this.makePuzzleMoveTree(
                [
                    "f4e3e5"
                ],
                [
                    "e3d3",
                    "e5d5",
                    "h5f4",
                    "g6f4",
                ]
            )
        };
    }
}

class Page4 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("White just captured a stone with A3. Find a place to play where white must capture to move past the ko rule and take whites group at B5. This is called a \"ko threat\"");
    }
    config() {
        return {
            mode: "puzzle",
            width: 13,
            height: 13,

            initial_state: {black: "bgcgchcicjbkalclbm", white: "bebfagbhaibibjak"},
            move_tree: this.makePuzzleMoveTree(
                [
                    "a8a9a4a6a8"
                ],
                [
                    "a4",
                    "a9a8a4a6",
                    "c3a8a4a6",
                    "b2a8a4a6",
                    "c1a8a4a6",
                    "a1a8a4a6",
                    "c8a8a4a6",
                ]
            , 13, 13)
        };
    }
}

