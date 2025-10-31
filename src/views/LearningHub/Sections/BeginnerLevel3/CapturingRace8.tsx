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

export class BL3CapturingRace8 extends LearningHubSection {
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
        return "bl3-capturing-race-8";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capturing race", "Capturing Race");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capturing race",
            "Win capturing race",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "csdrereqdpcpcoboaodmbq",
                white: "brcrcqdqfrfqepeogpbpap",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["bsaq", "aqes"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "brbqcpbodpfrereq",
                white: "epfqgrgqeogobscscrcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsfsar"],
                [
                    "dsfsdres",
                    "dsfsasar",
                    "drfs",
                    "asar",
                    "aresfsdr",
                    "aresdrfs",
                    "aresdsdr",
                    "aresasfs",
                ],
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
        return _("Black to play. Win the capturing race.");
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
                black: "aqbrcqcpdpdodncmbmfp",
                white: "bqbpcocnaoblcldldmfm",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["bnbo", "bobn", "ambn", "arbn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "arbrcqbpcpdpepfpgqgrfrcm",
                white: "bsbqcrdrdqeqfqgpgohrhqhp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esgsdscsaq", "esgsercsaq"],
                [
                    "esgsdscsasaq",
                    "esgsdscserfs",
                    "esgsercsasaq",
                    "esgsercsfsds",
                    "esgsercsdsfs",
                    "eres",
                    "gser",
                    "fses",
                    "dses",
                ],
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
        return _("Black to play. Win the capturing race.");
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
                black: "anbncncobpdpdqdrcrfr",
                white: "asbrcsbqcqcpdodncmbmembk",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqamao", "aqamap"],
                ["aqamdsao", "aoaq", "apaq", "dsao"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "brcqcpcoepfpgpen",
                white: "bpbqcrdrdqfqgqhqiq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arbsbo"],
                ["arbsaqap", "bsar", "ascs", "boar", "aqbs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "doeoepdsbrcqdqdrcocnbnembl",
                white: "dpesereqarbqbpfpgqgrfobocp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsaoaqapan", "bsaoaqapcs", "bsaoaqapcr", "bsaoanaqas"],
                ["bsaoaqapascs", "bsaoascs", "aocs", "aqcs", "csbs", "crbs", "ancs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "cqdqdrepfpfqgqhrhphmir",
                white: "bqbpcpdpeqerfrgrcmdn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscsbr"],
                [
                    "dscsescr",
                    "dscscrbr",
                    "dscsgscr",
                    "dscsbsbr",
                    "escr",
                    "csbrdsbs",
                    "csbrescr",
                    "csbrgscr",
                    "csbrbscr",
                    "csbrcrbs",
                    "gscr",
                ],
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
        return _("Black to play. Win the capturing race.");
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
                black: "brcrdreqfqdpdobpbogq",
                white: "aqbqcqdqanbncndneneoepgn",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["cpap", "apco"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "cpcqdoeofogpgqhn",
                white: "brbqbpcocndpep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drereq"],
                ["drerdqeq", "drercreq", "drerfpcr", "dqeq", "crdr", "fpdq", "eqdq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "arbqbpbocodqcreqerescm",
                white: "bsbrcpcqdpepfqfrfsfohp",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["csds", "aqds", "drcs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "bqbpcodoeofpfqfr",
                white: "bobncmcpdpepfofnelgpgqgrhndrir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqeqer"],
                ["dqeqcqer", "cqer", "eqdq", "fser", "ercr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
