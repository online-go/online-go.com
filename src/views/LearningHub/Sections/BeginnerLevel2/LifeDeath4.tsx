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

export class BL2LifeDeath4 extends LearningHubSection {
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
        return "bl2-life-death-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning life and death 1", "Life&Death");
    }
    static subtext(): string {
        return "";
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocoapcpbqbrbs",
                white: "anbncndnenaoeqfqarcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["aqcq"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbnbocobqcqarbr",
                white: "clambmcndndocpepdqcrerbs",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["bpap"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpdpepaqbqcqeqcrdrbs",
                white: "fmdnbocofofpfqarergrds",
            },
            move_tree: this.makePuzzleMoveTree(["cp"], ["cscp", "brcp"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcrbs",
                white: "dmbobpcqdqdrfr",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["csar", "aqar", "apar", "dsar"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bobpbqeqarbrerascsds",
                white: "bmbncocpepfpcqfqfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["cr"], ["aocr", "apcr", "ancr", "dqcr"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqardrcs",
                white: "boeobpcpdqeqeres",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscrds"],
                ["bscrbrds", "brds", "crbs", "dsbs", "apbs"],
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
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnbocodoapbqarbrcr",
                white: "ambmcmdneocpepcqeqdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bp", "dpdqbp"],
                ["anbp", "csbp", "dsbp", "bsbp", "dpdqanbp", "dpdqbsbp", "dpdqcsbp", "dpdqdsbp"],
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
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncnaocobpbqarasbs",
                white: "ambmcmdmdndodpcqbrcrer",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["anaq", "cpaq"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobpbqarbrcr",
                white: "bmbococpgpcqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["csap", "bsap", "dsap"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbobpbqcqcrbs",
                white: "bmdmbnaococpdqdrcsds",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["apar", "aqar"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobobpbqarbrdrcsds",
                white: "bmbncncocpcqdqfqcrer",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["esbsasfs", "ases"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make two eyes and make the black group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocodocpaqbqcqdq",
                white: "anbncndnenfobpfpfqarbrcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["ep"], ["eoep", "eqep", "apep"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqarcrdrbsesfs",
                white: "boapcpaqcqdqeqergr",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["bpds", "frds", "gsds", "csds"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmbncncobpbq",
                white: "alblclcmdndodpaqdqbrcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ao"],
                ["apaocparaqap", "apaocparapaq", "apaoarcp", "cpao", "cqao"],
                19,
                19,
            ),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobobparbqbrcs",
                white: "bncncocpcqcrer",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["dsbs", "asbs", "anbs"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpepbqcqarcrbs",
                white: "bncoeofoapbpdqfqdrgrcsds",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["fpaq", "doaq", "eqaq"], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "amanbobpbqcqarcrcs",
                white: "blbncnaococpepdqdrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apaqao"],
                ["apaqapao", "brap", "aqap", "asap", "alap", "bmap", "dsap"],
                19,
                19,
            ),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeobpcpepaqcqdqbrbs",
                white: "cmdnenfnaobocoapfpeqfqdr",
            },
            move_tree: this.makePuzzleMoveTree(["cr", "arascr"], ["focr", "cscr"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncnbodobpcpdpaqbrbs",
                white: "bmcmdmdneoepbqcqdqeqcrcs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apaoar"],
                ["apaoasar", "apaoamar", "aoar", "amar", "arap", "asar"],
                19,
                19,
            ),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcncobpdpbqcqdqeqcrbs",
                white: "cldlbmbnenbodoapepfpfqdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                ["dnar", "dmar", "aqar", "dsar", "brar", "aoar"],
                19,
                19,
            ),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepfpcqeqgqcrdrfrgrgs",
                white: "codoeofobpgphpbqhqbrhrcsdseshs",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["cper", "fser", "bser"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dndodpepcqeqarbrdrcs",
                white: "cmdmemcncoeofobpfpbqfqerfrdses",
            },
            move_tree: this.makePuzzleMoveTree(["cp"], ["aqcp", "encp", "bscp", "ascp"], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dqeqfqarbrcrercsfs",
                white: "cpdpepfpbqgqfrgrhrds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdres"],
                ["esdrgses", "esdrdses", "cqes", "gses"],
                19,
                19,
            ),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Kill the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blclambnaocobpdpbqcqdq",
                white: "bkckdlcmemcneoapepaqeqarbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["bm"], ["dobm", "akbm"], 19, 19),
        };
    }
}
