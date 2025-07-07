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

export class BL1Seki2 extends LearningHubSection {
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
        return "bl1-seki-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning make seki", "Make Seki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on make seki", "");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Black can save the marked stones by making seki. Make seki and rescue the marked stones.",
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
                black: "ambmcmdmcoapbpcp",
                white: "anbncndodpaqbqcqdq",
            },
            marks: { triangle: "apbpcpco", cross: "dn" },
            move_tree: this.makePuzzleMoveTree(["dn"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdmdnapbpcp",
                white: "anbncndodpaqbqcqdq",
            },
            marks: { triangle: "apbpcp" },
            move_tree: this.makePuzzleMoveTree(["co"], ["boco", "aoco"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fpgphpdqeqhqdrhrdshs",
                white: "cpdpepcqfqgqcrgrcsfsgs",
            },
            marks: { triangle: "dqeqdrds" },
            move_tree: this.makePuzzleMoveTree(["er"], ["eser", "frer"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdmemeneoapbpcp",
                white: "anbncndndoepaqbqcqdqeq",
            },
            marks: { triangle: "apbpcp" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["codp", "bodp", "aodp"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eneodpfpgpdqgqcrgrcsgs",
                white: "fogohoephpeqhqdrerfrhrdshs",
            },
            marks: { triangle: "fpgpgqgrgs" },
            move_tree: this.makePuzzleMoveTree(["fs"], ["esfs", "fqfs"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofocpfpcqfqcrfrfs",
                white: "cncobpdpepbqeqbrerbses",
            },
            marks: { triangle: "cpcqcr" },
            move_tree: this.makePuzzleMoveTree(["cs"], ["dscs", "drcs", "dqcs"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codocpepfpcqfqfrfs",
                white: "eofohodpgpdqgqdrgrdsgs",
            },
            marks: { triangle: "epfpfqfrfs" },
            move_tree: this.makePuzzleMoveTree(
                ["creqcs"],
                ["creqeres", "creqeser", "eser", "eres", "eqer"],
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
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcldldmcncoapbpcp",
                white: "bmcmanbndndodpaqbqdqcr",
            },
            marks: { triangle: "cncoapbpcp" },
            move_tree: this.makePuzzleMoveTree(
                ["alcqam"],
                [
                    "alcqboao",
                    "alcqaobo",
                    "cqbo",
                    "bocq",
                    "aocq",
                    "amalakcq",
                    "amalcqbo",
                    "amalbocq",
                    "amalaocq",
                ],
                19,
                19,
            ),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmcncodpaqbqcqdq",
                white: "alblcldldmdnbodoapbpcp",
            },
            marks: { triangle: "ambmcmcnco" },
            move_tree: this.makePuzzleMoveTree(["an"], ["bnan", "aoan"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdmdndodpcqbrcrbs",
                white: "anbncnaocoapbpcpepaqdqfqdrcsds",
            },
            marks: { triangle: "cqbrcrbs" },
            move_tree: this.makePuzzleMoveTree(["ar"], ["bqar", "asar"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncodoeofoapbpfpfqergrbscses",
                white: "cpdpepaqbqcqeqcrdrds",
            },
            marks: { triangle: "bscs" },
            move_tree: this.makePuzzleMoveTree(["ar"], ["brar", "asbr"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdmemendobpcpdp",
                white: "anbncndneoepaqbqcqdqer",
            },
            marks: { triangle: "dobpcpdp" },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aoap", "boap", "coap"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmemenapbpcpdp",
                white: "anbndncoeoepaqbqcqdqer",
            },
            marks: { triangle: "apbpcpdp" },
            move_tree: this.makePuzzleMoveTree(
                ["docnam"],
                [
                    "docnboao",
                    "docnaobo",
                    "cndoambo",
                    "cndoboao",
                    "cndoaobo",
                    "bodo",
                    "aobo",
                    "amdoboao",
                    "amdoaobo",
                    "amdocnbo",
                ],
                19,
                19,
            ),
        };
    }
}
