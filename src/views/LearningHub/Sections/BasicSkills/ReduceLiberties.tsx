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

export class ReduceLiberties extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "reduce-liberties";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning reduce liberties", "Reduce Liberties");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on reduce liberties",
            "Reduce or increase liberties",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "You can attack a chain by taking away a liberty. In doing so, try to achieve other goals as well, such as connecting your stones or protecting territory. White to play. Choose the best way to reduce liberties, A, B or C.",
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
                black: "dpepfp",
                white: "cocpdqfq",
            },
            marks: { A: "do", B: "gp", C: "eq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Another goal while taking away a liberty is to cut opponent's stones. White to play. Choose the best way to reduce liberties, A, B or C.",
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
                black: "hmgohodpepfp",
                white: "dncocpgpdqeqfqgr",
            },
            marks: { A: "do", B: "eo", C: "fo" },
            move_tree: this.makePuzzleMoveTree(["fo"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to reduce liberties, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmep",
                white: "cpgpdq",
            },
            marks: { A: "eo", B: "dp", C: "eq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Yet another goal is to block the advance of stones of your opponent. White to play. Choose the best way to reduce liberties, A, B or C.",
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
                black: "epdqeq",
                white: "cldodpcqcr",
            },
            marks: { A: "eo", B: "dr", C: "er" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to reduce liberties, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dodpdq",
                white: "clcofocphpcqfq",
            },
            marks: { A: "dn", C: "eq", B: "dr" },
            move_tree: this.makePuzzleMoveTree(["dn"], [], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to reduce liberties, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dndodp",
                white: "cocpepfpcq",
            },
            marks: { A: "dm", B: "cn", C: "dq" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to reduce liberties, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmbpcpdp",
                white: "eoepbqcqgq",
            },
            marks: { A: "co", B: "do", C: "dq" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to reduce liberties, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epdqeq",
                white: "bncpdpgpcqhq",
            },
            marks: { A: "eo", B: "fp", C: "dr" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to reduce liberties, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmdpepfpdq",
                white: "cmcocpcqeqfqgq",
            },
            marks: { A: "do", B: "gp", C: "dr" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to reduce liberties, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dqeqfq",
                white: "cmcodpepfpcq",
            },
            marks: { A: "gq", B: "dr", C: "er" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Increase the number of liberties of the marked chain.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hqer",
                white: "cqeqdr",
            },
            marks: { triangle: "er" },
            move_tree: this.makePuzzleMoveTree(["fr"], [], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Increase the number of liberties of the marked chain.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqdqgq",
                white: "cncpbqcrdr",
            },
            marks: { triangle: "dqcq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Increase the number of liberties of the marked chain.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpephq",
                white: "dndocpdqeq",
            },
            marks: { triangle: "epdp" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Increase the number of liberties of the marked chain.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdpcqbrcrdr",
                white: "bpcpbqdqeqfqhq",
            },
            marks: { triangle: "dp" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Increase the number of liberties of the marked chain.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epcqdqeq",
                white: "bncpdpbqfqcrdrergr",
            },
            marks: { triangle: "eqdqcqep" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Increase the number of liberties of the marked chain.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldodpdqdrds",
                white: "bncofocphpcqfqarcrfr",
            },
            marks: { triangle: "dsdrdqdpdo" },
            move_tree: this.makePuzzleMoveTree(["dn"], [], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has filled his own liberty with move 1. Punish this.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpbqeqfqdrer",
                white: "epfpcqdqbrcrfrgr",
            },
            marks: { 1: "fq" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has filled his own liberty with move 1. Punish this.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpdpcqeqfqbrfrgrbsfs",
                white: "epfpdqgqhqcrdrerires",
            },
            marks: { 1: "fs" },
            move_tree: this.makePuzzleMoveTree(["hr", "gshshr"], [], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has filled his own liberty with move 1. Punish this.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepgpcqfqcrdrfrcs",
                white: "bocpbqdqeqbreres",
            },
            marks: { 1: "dr" },
            move_tree: this.makePuzzleMoveTree(["bs"], ["dsfs", "fsgs"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has filled his own liberty with move 1. Punish this.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpbqfqgqcrercsdses",
                white: "cqdqeqdrfrfs",
            },
            marks: { 1: "er" },
            move_tree: this.makePuzzleMoveTree(["br"], ["bsbr"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has filled his own liberty with move 1. Punish this.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpbqcrdrercsds",
                white: "cqdqeqgqfres",
            },
            marks: { 1: "er" },
            move_tree: this.makePuzzleMoveTree(["brfsbs"], ["brfsgsar", "fsbr", "bsbr"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has filled his own liberty with move 1. Punish this.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fnfoepaqbqdqeqfqarcrbscs",
                white: "dneoapbpcpdpfpgpcqgqdr",
            },
            marks: { 1: "ep" },
            move_tree: this.makePuzzleMoveTree(["fr", "erfrgr", "erfrfsgrhr"], [], 19, 19),
        };
    }
}
