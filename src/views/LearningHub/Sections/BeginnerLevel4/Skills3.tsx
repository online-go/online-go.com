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

export class BL4Skills3 extends LearningHubSection {
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
        return "bl4-skills-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning important stones", "Skills");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on important stones",
            "Important stones",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "aqapbpcpdodndmdqck",
                white: "arbrbqcqdpeoenfqgo",
            },
            marks: { A: "ep", B: "dr" },
            move_tree: this.makePuzzleMoveTree(["dr"], ["epdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "gpfpdocqdqeqcpbncmbohpfrgr",
                white: "dldpepfofmcofqgqhqiqekcndm",
            },
            marks: { A: "dn", B: "eo" },
            move_tree: this.makePuzzleMoveTree(["eodnio"], ["dneo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbpcphqgpepdqdrerfrgrjq",
                white: "crcqeqfqgqdpcobofoenclbr",
            },
            marks: { A: "do", B: "fp" },
            move_tree: this.makePuzzleMoveTree(["do"], ["fpdo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbrcrdrerfrgrgqfphpiqjqjr",
                white: "cqdqeqfqgphqhriripjp",
            },
            marks: { A: "eo", B: "ho" },
            move_tree: this.makePuzzleMoveTree(["ho"], ["eogo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "bnfqflendrdqdpepfpgpcocn",
                white: "brcrcqcpbpbododmclfrgqhqipeq",
            },
            marks: { A: "dn", B: "er" },
            move_tree: this.makePuzzleMoveTree(["dn"], ["erdn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "brbqbocpdpepeqclfpfr",
                white: "bscrdserdqcqbpcofqiq",
            },
            marks: { A: "bn", B: "gq" },
            move_tree: this.makePuzzleMoveTree(["gq"], ["bnap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fqgqhqepdoapbpfoiphojpcqdqeq",
                white: "brbqaobocpdpeofpgphpenfndlgn",
            },
            marks: { A: "co", B: "go" },
            move_tree: this.makePuzzleMoveTree(["co"], ["goco"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "eqerdrfpgqgr",
                white: "crdqdpepfrfq",
            },
            marks: { A: "fo", B: "gp" },
            move_tree: this.makePuzzleMoveTree(["fo"], ["gpfo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cmdndobrbqcqcpeofpgphqiqgrjpapblcl",
                white: "crdrdqbpbococnbmhogofoenemdmglfqjnhp",
            },
            marks: { A: "dp", B: "ep" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["epdp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fmfnhncrdrcqcphqhpdoeofpgqhk",
                white: "eqgpgofoendncncocldkdq",
            },
            marks: { A: "dp", B: "ep" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["epdp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "drcqcpbpdpcmfqdl",
                white: "bscrbqaqdqhq",
            },
            marks: { A: "eq", B: "ar" },
            move_tree: this.makePuzzleMoveTree(["ar"], ["eqer"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcpcmbmdodnfpepfnck",
                white: "cncodmdpdqeqfqgpip",
            },
            marks: { A: "en", B: "fo" },
            move_tree: this.makePuzzleMoveTree(["en"], ["foen"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Which stones are important? Where should you play? Choose A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dqdrepfpfqdodnemgogngmhriqipin",
                white: "crcqcpdpeqeofogphqbn",
            },
            marks: { B: "fr", A: "er" },
            move_tree: this.makePuzzleMoveTree(["fr"], ["erfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}
