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

export class BL1CancelCut extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "bl1-cancel-cut";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture cutting stone", "Cut");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture cutting stone",
            "Capture cutting stone",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcncocpgpcqeqbrdr",
                white: "elemdndodpdqer",
            },
            marks: { 1: "eq" },
            move_tree: this.makePuzzleMoveTree(["fq"], ["fpfr", "epfq"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmeobpcpdpdqbrdr",
                white: "bocodogoepeqer",
            },
            marks: { 1: "eo" },
            move_tree: this.makePuzzleMoveTree(
                ["enfofn"],
                [
                    "enfofpfn",
                    "foen",
                    "fnenemdndmcnbncmclbmblan",
                    "fnenemdncndmdlelfmcldkcmbmaobnbl",
                    "fnenemdncndmdlelfmcldkcmckao",
                ],
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
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqfqdrer",
                white: "cnbpcpipdqeqfrgr",
            },
            marks: { 1: "fq" },
            move_tree: this.makePuzzleMoveTree(
                ["fpgqhqgpgo"],
                ["fpgqhqgphpgo", "fpgqgphqhriq", "gpfpfoepdpeoengo", "gqfp"],
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
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dobpcpfpaqcqbrbs",
                white: "enbocodpdqcrdr",
            },
            marks: { 1: "do" },
            move_tree: this.makePuzzleMoveTree(
                ["eodndmcnbncmcl"],
                ["eodndmcnbncmbmcl", "eodndmcncmbn", "eodncndm", "dneo"],
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
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocpcqeqfqcrdr",
                white: "codobpdpdq",
            },
            marks: { 1: "bo" },
            move_tree: this.makePuzzleMoveTree(["bn"], ["aobn"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gnepbqcqdqardrbscs",
                white: "enbpcpdpeqer",
            },
            marks: { 1: "ep" },
            move_tree: this.makePuzzleMoveTree(
                ["fpeofododncobocncm", "fpeofodocodndmcnbn", "fpeofodocn"],
                [
                    "fpeofododncobocnbncm",
                    "fpeofododncocnbo",
                    "fpeofodocodndmcncmbn",
                    "fpeofodocodncndm",
                    "fpeodofo",
                    "eofp",
                ],
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
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hndpepbqcqdrer",
                white: "cmdobpcpdqeqfq",
            },
            marks: { 1: "dp" },
            move_tree: this.makePuzzleMoveTree(
                ["fo"],
                [
                    "fpeoenfogofn",
                    "fpeoenfofngo",
                    "fpeofoen",
                    "eofpgpfofngo",
                    "eofpgpfogofn",
                    "eofpfogp",
                ],
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
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmeobpcpdpdqbrdr",
                white: "fnbocodoepeqer",
            },
            marks: { 1: "eo" },
            move_tree: this.makePuzzleMoveTree(
                ["enfogo"],
                ["enfofpgo", "foenemdn", "foendnem"],
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
        return _("White to play. Black has cut with 1. Capture this cutting stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codpfphpcqdqbr",
                white: "dobpcpbq",
            },
            marks: { 1: "co" },
            move_tree: this.makePuzzleMoveTree(["cn"], ["bocn"], 19, 19),
        };
    }
}
