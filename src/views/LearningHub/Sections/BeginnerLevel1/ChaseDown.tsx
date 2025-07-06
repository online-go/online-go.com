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

export class BL1ChaseDown extends LearningHubSection {
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
            Page13,
        ];
    }
    static section(): string {
        return "bl1-chase-down";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning chase down", "Chase Down");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on chase down",
            "Capture by chasing down",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Sometimes it is possible to capture stones by isolating them from other stones. You can chase these isolated stones down until there is nowhere to go for them. Black to play. Capture the marked isolated stone by chasing it down.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dqeqfp",
                white: "cpcqeoepfq",
            },
            marks: { triangle: "fq", cross: "gq" },
            move_tree: this.makePuzzleMoveTree(["gqfrgrerdr"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cogocpgpipdqeqfq",
                white: "fndpepfpaqbqcqgqgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foeoen"],
                ["doen", "hqfr", "frdr", "crfr"],
                19,
                19,
            ),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fogoepfpdqdrds",
                white: "cncpdpgpipeqgqbreres",
            },
            move_tree: this.makePuzzleMoveTree(["fqfrgr"], ["cqbq"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eqfqcrdr",
                white: "bqcqdqerfr",
            },
            move_tree: this.makePuzzleMoveTree(["gr"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture a stone by chasing it down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dncocpdqeq",
                white: "dpepfpcqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["crbqbrbpbo"],
                ["bqcrbrer", "bqcrdrer", "bqcrerfr"],
                19,
                19,
            ),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "drcrbrdqfpcpeodocodm",
                white: "frhqeqcqbqepdpbpbocn",
            },
            move_tree: this.makePuzzleMoveTree(["fqergr"], ["erfq"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture a stone by chasing it down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clcmcncodpdqgqdrer",
                white: "bmbnbodofocpepcqeqbrfr",
            },
            move_tree: this.makePuzzleMoveTree(["fqgrhr"], ["crcs"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeocpepcqcr",
                white: "emdngnbocodpgpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(["fqerfr"], ["drfq"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cncoeocpfpdqgqdr",
                white: "clflcmbnbobpdpepcqeqcr",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["fqer", "doer"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture a stone by chasing it down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpeqerfr",
                white: "epfpdqfqgrfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drcqbq", "drcqcrbqbpbrbsarap", "drcqcrbqbpbrbsarcsesap", "drcqcrbqbrbpbo"],
                [
                    "drcqcrbqbpbrbsarascs",
                    "drcqcrbqbpbrbsaraqap",
                    "drcqcrbqbpbraqbsares",
                    "drcqcrbqbpbraqbscses",
                    "cqdr",
                    "crdr",
                ],
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
        return _("Black to play. Capture a stone by chasing it down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elcmcndodpfpeqfq",
                white: "dneneogoepgpdqgqhr",
            },
            move_tree: this.makePuzzleMoveTree(["cqdrcrerfr"], ["drcqcrco"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codobpbqcrbs",
                white: "eocpdpcqdr",
            },
            move_tree: this.makePuzzleMoveTree(["epdqeqerfr"], [], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture a stone by chasing it down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dncpdpdq",
                white: "fpcqeqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["crbqbrbpbo"], ["bqcr"], 19, 19),
        };
    }
}
