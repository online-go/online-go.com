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

export class BL1LifeDeath7 extends LearningHubSection {
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
        return "bl1-life-death-7";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning reduce eye space", "4.32 Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on reduce eye space",
            "Capture by reducing eye space",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "arbrcrdrds",
                white: "aqbqcqdqfqeras",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["esbs"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqdqdrbsds",
                white: "bpcpdpfpeqbrcrer",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["ascs", "apar", "esar", "csar"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "arbrcrdreres",
                white: "bqcqdqeqgqfrascs",
            },
            move_tree: this.makePuzzleMoveTree(["bsdsbs"], ["aqbs", "fsbs", "dsbs"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqcrdrds",
                white: "bpcpdpeqarbreras",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["apbs", "esbs", "csbs", "dqbs"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqdqeqarbrerases",
                white: "bocodpepgpfqcrfrbsds",
            },
            move_tree: this.makePuzzleMoveTree(["csdrcs"], ["fsdr", "apdr", "bpdr"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpbqbrcr",
                white: "bocodpdqdrds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csbsar", "arcsas"],
                ["bscs", "asar", "aoar", "aqar", "cqar", "cpar"],
                19,
                19,
            ),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpaqdqeqarerasbscsdses",
                white: "bocodoeofpbqcqfqbrfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cr"],
                ["drcr", "aocr", "fscr", "dpcr", "epcr"],
                19,
                19,
            ),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqdqardrds",
                white: "bpcpdpepeqbrcrer",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["csbs", "asbs", "apbs", "esbs"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpaqcqcrcs",
                white: "bocoeodpbqdqardrbs",
            },
            move_tree: this.makePuzzleMoveTree(["brasbr"], ["aobr", "dsbr", "asbr"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpdpbqdqarbrdrds",
                white: "aobocodofoapepeqerbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cpcqcs"],
                ["cscp", "crcs", "cqcp", "ascs", "aqcp", "escp"],
                19,
                19,
            ),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqdqeqarfrasbsdsesfs",
                white: "bpcpdpepfpgqbrcrgrcs",
            },
            move_tree: this.makePuzzleMoveTree(["drercr"], ["fqdr", "gsdr", "apdr"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group by first reducing the eye space.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnbobpbqbrbs",
                white: "bmcmcncocpcqarcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["anaoaq"],
                ["aqan", "csan", "apaq", "asan", "aoan", "aman"],
                19,
                19,
            ),
        };
    }
}
