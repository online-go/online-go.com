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

export class BL2Atari extends LearningHubSection {
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
        return "bl2-atari";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning atari", "Atari");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on atari",
            "Choose correct side for atari",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcncoapbpbq",
                white: "bnbocpcqeqarbr",
            },
            marks: { triangle: "apbpbq" },
            move_tree: this.makePuzzleMoveTree(["aq"], ["aoan"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stone in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dndpbqcqdrer",
                white: "bpcpfpdqeqfr",
            },
            marks: { triangle: "dp" },
            move_tree: this.makePuzzleMoveTree(["do"], ["epdo"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnenaocobpcqcr",
                white: "cpdpbqdqhqdr",
            },
            marks: { triangle: "cqcr" },
            move_tree: this.makePuzzleMoveTree(["br"], ["csbr"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stone in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fpgpeqgqgr",
                white: "dpepcqfqfr",
            },
            marks: { triangle: "eq" },
            move_tree: this.makePuzzleMoveTree(["er"], ["dqer"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbododpbqcq",
                white: "cpdqeqbrcr",
            },
            marks: { triangle: "bqcq" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["aqbp"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndnbobpcqdqeq",
                white: "coapcpbqarcrdr",
            },
            marks: { triangle: "bobp" },
            move_tree: this.makePuzzleMoveTree(["bn"], ["aobn"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpaqcqeqfqardrbsds",
                white: "dodpepdqbrcrer",
            },
            marks: { triangle: "drds" },
            move_tree: this.makePuzzleMoveTree(["es"], ["csbq"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnfndobpdpcqeqfqcr",
                white: "dmcnencocpdqdrer",
            },
            marks: { triangle: "dndodp" },
            move_tree: this.makePuzzleMoveTree(["ep"], ["eoep"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcnaodoeoapcpbqdq",
                white: "clembndnbocobp",
            },
            marks: { triangle: "cmcn" },
            move_tree: this.makePuzzleMoveTree(["bm"], ["dmbm"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndoeocpepcqfqgqbrcr",
                white: "embocofobpdpfpbqdqeq",
            },
            marks: { triangle: "doeoep" },
            move_tree: this.makePuzzleMoveTree(["dn"], ["endn"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldlbmdmdndobpcp",
                white: "cmcncodpepbqcq",
            },
            marks: { triangle: "bpcp" },
            move_tree: this.makePuzzleMoveTree(["bo"], ["apbo"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Put the marked stones in atari at the correct side and capture them.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpdqgqerfr",
                white: "codoepcqfqdr",
            },
            marks: { triangle: "dpdq" },
            move_tree: this.makePuzzleMoveTree(["eq"], ["cpeq"], 19, 19),
        };
    }
}
