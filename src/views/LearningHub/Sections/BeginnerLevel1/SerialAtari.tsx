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

export class BL1SerialAtari extends LearningHubSection {
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
            Page14,
            Page15,
            Page16,
            Page17,
            Page18,
            Page19,
            Page20,
            Page21,
            Page22,
            Page23,
            Page24,
        ];
    }
    static section(): string {
        return "bl1-serial-atari";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning serial atari", "4.33 Serial Atari");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on serial atari",
            "Capture with serial atari",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "A well-known way to capture stones is serial atari (oi-otoshi) them. Here White can capture the marked stones with an atari. If Black tries to save them by connecting, White can play atari again. White to play. Capture the marked stones with a serial atari.",
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
                black: "ambmanbobpcqdq",
                white: "blcmbncncocp",
            },
            marks: { triangle: "ambman", cross: "al" },
            move_tree: this.makePuzzleMoveTree(["alaobq"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcnbobpaqbrasbs",
                white: "cocpbqcqcr",
            },
            marks: { triangle: "brasbs" },
            move_tree: this.makePuzzleMoveTree(["cs"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmanbnaobpaqbqdqcrerbs",
                white: "alblcmcnbococpcqbr",
            },
            marks: { triangle: "bmanbnao" },
            move_tree: this.makePuzzleMoveTree(["am"], ["arasamap"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofodpfpeqhqcrdrfrgr",
                white: "dnenfngncogocpgpcqdqgqbr",
            },
            marks: { triangle: "doeofodpfp" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmbncndnaobpaqcqbr",
                white: "blcmdmenbocodoeo",
            },
            marks: { triangle: "bmbncndn" },
            move_tree: this.makePuzzleMoveTree(["am", "anamal"], [], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fneodpfpdqeq",
                white: "dnendocpgpcqfqdrfr",
            },
            marks: { triangle: "dpdqeq" },
            move_tree: this.makePuzzleMoveTree(["er"], [], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocodobpaqbrasbs",
                white: "cpbqcqeqfqcr",
            },
            marks: { triangle: "brasbs" },
            move_tree: this.makePuzzleMoveTree(["cs"], [], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnbobpbqcqdrergrdsfsgs",
                white: "bmcmcncocpdqeqfqgqhqfrhr",
            },
            marks: { triangle: "grfsgs" },
            move_tree: this.makePuzzleMoveTree(["hsescr"], ["hsescscr"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnbpcpdpaqbrasbscs",
                white: "bqcqeqfqcrdr",
            },
            marks: { triangle: "brasbscs" },
            move_tree: this.makePuzzleMoveTree(["ds"], [], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eodpfphpaqbqdqeqgqhqbrcrascs",
                white: "gocpgpcqfqdrerfr",
            },
            marks: { triangle: "dpdqeq" },
            move_tree: this.makePuzzleMoveTree(["doepen"], ["doepfoen", "foco"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "amanbnboapdpbqcqeq",
                white: "flbmcmcncobpcp",
            },
            marks: { triangle: "amanbnbo" },
            move_tree: this.makePuzzleMoveTree(["al"], [], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdmcnboapcpdpbqcq",
                white: "dndoepaqdqfqarbrcr",
            },
            marks: { triangle: "cpdpbqcq" },
            move_tree: this.makePuzzleMoveTree(["cobpbn"], ["cobpaoan"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epbqcqdqdrcsds",
                white: "cnbpcpaqbrcras",
            },
            marks: { triangle: "brcras" },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblclcmcncobpcp",
                white: "bmanbnboapdpbqcqeq",
            },
            marks: { triangle: "bmanbnbo" },
            move_tree: this.makePuzzleMoveTree(["am"], [], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepfpcqgqhqcrdrhr",
                white: "engobpcpgpbqdqeqfqbrergr",
            },
            marks: { triangle: "dqeqfqer" },
            move_tree: this.makePuzzleMoveTree(
                ["esfrgs", "esfrfs"],
                ["gsds", "fsds", "dses"],
                19,
                19,
            ),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmcndndobpcpdp",
                white: "anbnbocoapbqcqdqfq",
            },
            marks: { triangle: "anbnboco" },
            move_tree: this.makePuzzleMoveTree(["am"], [], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbnaocodoapdpdq",
                white: "bocpbqeqcrdr",
            },
            marks: { triangle: "bocp" },
            move_tree: this.makePuzzleMoveTree(["cqbpbr"], ["cqbpaqbr", "bpcq", "aqbp"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndoapbpdpcqcr",
                white: "epaqdqfqarbrdrascs",
            },
            marks: { triangle: "aqarbras" },
            move_tree: this.makePuzzleMoveTree(["bq"], [], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpepfpcqfqfrfs",
                white: "bncobpbqdqeqcrerds",
            },
            marks: { triangle: "dqeqer" },
            move_tree: this.makePuzzleMoveTree(["esdrbr", "brbses"], [], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epbqcqdqcrcs",
                white: "cnbpcpaqbras",
            },
            marks: { triangle: "bras" },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbnfnaodoepfpcqdq",
                white: "cmcnboapcpdpbqeqer",
            },
            marks: { triangle: "bocpdp" },
            move_tree: this.makePuzzleMoveTree(["cobpbr"], ["brco"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "coeoepcqdqbrdrgrfs",
                white: "fpeqgqcrerfrhrcsds",
            },
            marks: { triangle: "crcsds" },
            move_tree: this.makePuzzleMoveTree(["bs"], ["gses"], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpepbqcqdrcsds",
                white: "cmcnbobpaqbrcras",
            },
            marks: { triangle: "brcras" },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Atari and capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bndncododpdqarbrcr",
                white: "bmcmdmcnboapcpbqcq",
            },
            marks: { triangle: "cpbqcq" },
            move_tree: this.makePuzzleMoveTree(["aq", "anamaq"], [], 19, 19),
        };
    }
}
