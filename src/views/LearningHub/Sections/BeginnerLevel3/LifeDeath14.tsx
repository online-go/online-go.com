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

export class BL3LifeDeath14 extends LearningHubSection {
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
        return "bl3-life-death-14";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture", "Life&Death");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture", "Capture group");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbrcpdpepfpgphqhrfshobo",
                white: "crcqeqgqcserfqgrgs",
            },
            move_tree: this.makePuzzleMoveTree(["dqdres"], ["esdq", "drdq", "dses"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bsbrbpcpdpeqfrfpbnhr",
                white: "araqbqcqdqdreres",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cs"],
                ["crcsdsas", "ascs", "dscs", "fscs", "apcs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "asbsbraobodqdrdofrcofp",
                white: "cscrcqbqbpap",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["cpar", "aqar", "dsar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "crbpcpdpepeqeresbn",
                white: "bsbqcqdqdrds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["araqbr"],
                ["brar", "aqar", "asar", "csbr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbrcrdrerblcmdneofpfqendlbk",
                white: "apbpcqdqepdococnbnbm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpcpeqamao"],
                ["eqdp", "ameq", "aoeq", "cpdp", "aneq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dqdrdsbrbqbpcodoeofpgqhqiripfnbn",
                white: "escscrcqcpdpepeqfqgrfs",
            },
            move_tree: this.makePuzzleMoveTree(["erfrdr"], ["frer", "hrer"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbqcqcserdpephqhrhpgpenco",
                white: "brcrdqeqfqgqgrgsfsesds",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["drbs", "asbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brcqdpblcmdndmckepcrbo",
                white: "aqbqcpcocnbnbmam",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ao"],
                ["apaoanbp", "bpao", "arao", "doao", "alao"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bncocpdqdrdscsbldn",
                white: "bscrbqcqbpbo",
            },
            move_tree: this.makePuzzleMoveTree(["araqao"], ["aoar", "aqar", "apar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brdsereqdpcobnaodnbm",
                white: "arbqbpbocpcrdrdq",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["csbs", "apbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "ereqdpcpcn",
                white: "brcqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcsbqdqar", "bpbqcsdsaqarbs"],
                ["csbpboaqdsbs", "csbpboaqbsds", "bqbp", "dsbpbocsdqes"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brbqhrhqcpdpepfphpbodserfrfshofn",
                white: "cscrcqdqeqfqgqgrgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdres"],
                ["dres", "hsdr", "bsdr", "gpdr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "csdrbqcqdqeqfqgqhrhpboir",
                white: "arbrcrdseserfrgrgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsascs"],
                ["bsasaqcs", "aqbs", "asbs", "hsbs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbocpdpeoeqergranbn",
                white: "brcqdqdrdsbpapao",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                ["aqarcsbs", "aqarbscs", "bsaraqcs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbshrhqgqfpepdpcqbqcohogsir",
                white: "brcrdsdqeqfqfrgrfs",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["hser"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bqaoanbncndodpdrerenfp",
                white: "bsbrcrcqcpcoboap",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["aqarbpap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bocodpdqerdseqdn",
                white: "arbrdrcqcpbpap",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["csbs", "crbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brbqbpcodnenfngogpfqfrbngq",
                white: "cpcqcrcsdoeofofpeqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpepesdsdq", "dpepdq"],
                ["dpepesdsfsdq", "esdp", "dqdp", "drdq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "craqapbpcpdqeqfrfphr",
                white: "arbrbqcqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["bscs", "escs", "dscs", "fscs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbralblcmdmdodpcqdrfoek",
                white: "aqbqcpcobocnbmam",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ao"],
                ["anbnapbp", "anbnaoap", "apbpanbn", "apbpaoan", "dnao"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brcqcodpeoenemdlclbmbleqcr",
                white: "aqbqbpcpaododnbncm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cnbocn"],
                ["cnbodmcn", "cnbococn", "bocn", "dmcn"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bsbqcrdrereqepeodncnbnanem",
                white: "arbrcqdqdpdocobobp",
            },
            move_tree: this.makePuzzleMoveTree(["apaqao"], ["aqap", "aoap", "csaq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "anbncodoepeqeresdscsenar",
                white: "asbsbrbqcpdpdqdrboao",
            },
            move_tree: this.makePuzzleMoveTree(["craqbpapcq"], ["aqap", "apbp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "anbncodpdqdrfrdn",
                white: "bscrcqbqcpapbo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["araoaq"],
                ["araobraq", "araoasaq", "aoar", "dsar"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
