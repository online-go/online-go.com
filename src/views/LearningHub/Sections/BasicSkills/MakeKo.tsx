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
/* cSpell:disable */

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class MakeKo extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [
            Page01,
            Page02,
            Page03,
            Page04,
            Page05,
            Page06,
            Page07,
            Page08,
            Page09,
            Page10,
            Page11,
            Page12,
        ];
    }
    static section(): string {
        return "make-ko";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning to make ko", "Make Ko");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on to make ko", "Make a Ko");
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black has played 1. White can connect his stones by playing at A, but sometimes it is better to make a ko by playing at B. Make a ko.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gceegefd",
                white: "feefgf",
            },
            marks: { 1: "fd", A: "ff", B: "fg" },
            move_tree: this.makePuzzleMoveTree(["fg"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "efegdhei",
                white: "fgehgh",
            },
            marks: { 1: "ei" },
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ffgffgehhg",
                white: "ccggfhhh",
            },
            marks: { 1: "hg" },
            move_tree: this.makePuzzleMoveTree(["gi"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "heffgfdgfgehif",
                white: "ccgchfggfhhh",
            },
            marks: { 1: "if" },
            move_tree: this.makePuzzleMoveTree(["ig"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hffgggig",
                white: "hgghhi",
            },
            marks: { 1: "ig" },
            move_tree: this.makePuzzleMoveTree(["ih"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fegfgghhgi",
                white: "ccfgehgh",
            },
            marks: { 1: "gi" },
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fegeheieffifdgfgih",
                white: "ccgcgfhfggigfhgh",
            },
            marks: { 1: "ih" },
            move_tree: this.makePuzzleMoveTree(["hh"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dfefffcggghgbhhhci",
                white: "ccgcdgegfgchehgh",
            },
            marks: { 1: "ci" },
            move_tree: this.makePuzzleMoveTree(["di"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "heffgfegif",
                white: "cchfgghh",
            },
            marks: { 1: "if" },
            move_tree: this.makePuzzleMoveTree(["ig"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "geefffegeheifihi",
                white: "ccgcfggghgfhgi",
            },
            marks: { 1: "hi" },
            move_tree: this.makePuzzleMoveTree(["hh"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gdhedfefffgfdgdhdieigi",
                white: "fbcceccehfegfgggehfi",
            },
            marks: { 1: "gi" },
            move_tree: this.makePuzzleMoveTree(["gh"], [], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has played 1. Make a ko.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hfcgegfgggig",
                white: "gdhgfhghhi",
            },
            marks: { 1: "ig" },
            move_tree: this.makePuzzleMoveTree(["ih"], [], 9, 9),
        };
    }
}
