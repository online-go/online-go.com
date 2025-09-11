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

export class BL2Net extends LearningHubSection {
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
        return "bl2-net";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning net", "Net");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on net", "Capture in a net");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elgmdnbodocpfphpcqcr",
                white: "cmcncoeodpdqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["em"],
                ["dmenemfn", "dmenfnem", "dmenfmem", "endm"],
                19,
                19,
            ),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlcmfmboeobpcpepdqbrcrdr",
                white: "dncododpfpbqcqeqer",
            },
            move_tree: this.makePuzzleMoveTree(["fn"], ["bnen", "enfo", "foen"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clelfmbodoapcpcqcr",
                white: "bncncodpdqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eneofo"],
                ["eodnemen", "eodndmen", "dneo", "fnen"],
                19,
                19,
            ),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gnbpephpbqcqdqhqdr",
                white: "cnbocpdpeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foeoendoco"],
                [
                    "foeoendodnco",
                    "foeofpen",
                    "eofpfogp",
                    "eofpgpfo",
                    "eofpgogp",
                    "fpeofnfogoen",
                    "enfo",
                ],
                19,
                19,
            ),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmboeohoapcpepbqdqhqdr",
                white: "dmbncododpfpeqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fn"],
                ["foenemfn", "foenfnem", "enfogofn", "enfofngo", "enfogngo"],
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
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clbncnbohocpdpepdqhqerfrgr",
                white: "dncodoapbpcqeqfqgqbrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fo"],
                ["gogp", "eofpgpfofngo", "eofpgpfogofn", "eofpfogp", "fpeoenfo"],
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
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clelgldoeocpepcqbrdr",
                white: "cncofodpdqeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["en"],
                ["dnenemfm", "fpen", "emfnenfp", "emfnfpen", "fmemendn"],
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
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlelbmcmdmcpdpeqfqhqcrdr",
                white: "emfmdneogoepbqcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bo"],
                ["bpcocnbobnan", "cobpbobr", "cobpbrbobnan", "dobocobpbnan", "dobobpco"],
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
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hobpepbqcqdqhqcrerds",
                white: "cnbocpdpeqfqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foeoendoco"],
                ["foeoendodnco", "eofpgpfofngo", "eofpgpfogofn", "fpeo"],
                19,
                19,
            ),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elglcmgnbodoepfpgpfr",
                white: "eneobpcpdpcqbrdrcs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cncobn"],
                ["cncodnbn", "codnbnem", "dncocnbn", "bndncnem"],
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
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bldlfmfnaodofoapfpbqcqdqeq",
                white: "gngobpcpgpaqfqgqarbrcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bn"],
                [
                    "cnam",
                    "cobn",
                    "boanbmam",
                    "boanambnbmcn",
                    "boanambncnbm",
                    "anbobnco",
                    "anbocnco",
                    "anbocobn",
                ],
                19,
                19,
            ),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpepfpdqfqcrdr",
                white: "cndodpcqeqgqerfrgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["go"],
                ["fogphohpipgognhniofn", "gpfo", "eogo"],
                19,
                19,
            ),
        };
    }
}
