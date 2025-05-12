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

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";
// import { InstructionalGobanProps } from "../../InstructionalGoban";

export class Ko extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05];
    }

    static section(): string {
        return "ko";
    }
    static title(): string {
        return pgettext("Tutorial section on ko", "Ko");
    }
    static subtext(): string {
        return pgettext("Tutorial section on ko", "The recapture rule");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            'To prevent endlessly re-capturing the same space, there\'s a special rule called the "Ko rule" which prevents immediately recapturing the same position. Black can capture the marked white stone. White is not allowed to recapture the black stone immediately. White has to play elsewhere first. Capture the marked stone.',
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            /* cspell: disable-next-line */
            initial_state: { black: "e8e6f7", white: "c7d8e7d6" },
            marks: { triangle: "e7" },
            move_tree: this.makePuzzleMoveTree(["d7"], []),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Capture the white group by exploiting the Ko rule.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            /* cspell: disable-next-line */
            initial_state: { black: "afbfcfcgdhcidi", white: "agbgahchbi" },
            move_tree: this.makePuzzleMoveTree(["b2d3a1"], []),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Connect your black stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            /* cspell: disable-next-line */
            initial_state: { black: "ecedeedfegehfh", white: "fdcedefeefgfcgdgfg" },
            move_tree: this.makePuzzleMoveTree(["f4c4e4"], ["c4b4", "g3c4"]),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Capture two white stones by exploiting the Ko rule.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            /* cspell: disable-next-line */
            initial_state: { black: "fcfdgehfggfhgh", white: "edfeefgffgeh" },
            move_tree: this.makePuzzleMoveTree(["f4e3e5"], ["e3d3", "e5d5", "h5f4", "g6f4"]),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White just captured a black stone by playing 1. To move past the ko rule, find a place to play for Black where White must capture. This is called a 'ko threat'. Next, Black can capture White's marked group.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            width: 13,
            height: 13,
            initial_player: "black",
            bounds: { top: 3, left: 0, bottom: 12, right: 7 },
            /* cspell: disable-next-line */
            initial_state: { black: "bgcgchcicjbkalclbm", white: "bebfagbhaibibjak" },
            move_tree: this.makePuzzleMoveTree(
                ["a8a9a4a6a8"],
                ["a4", "a9a8a4a6", "c3a8a4a6", "b2a8a4a6", "c1a8a4a6", "a1a8a4a6", "c8a8a4a6"],
                13,
                13,
            ),
            marks: { triangle: "a5b4b5b6", 1: "a3" },
        };
    }
}
