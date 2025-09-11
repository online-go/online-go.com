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

export class BL2Endgame1 extends LearningHubSection {
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
        return "bl2-endgame1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning defend weak spot", "Endgame 1");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on defend weak spot",
            "Defend weak spot",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "In the endgame the exact borders of the territories get laid down. With move 1 white has established the border between the white and black territories. But now Black must take care, because White can catch the two marked black stones by playing at A. Black can avoid that by playing at A himself. In this way black defends against a small intrusion in his territory. Black to play. Defend Black's weak spot.",
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
                black: "anbnbrcocpcqdrds",
                white: "ambmckclcndndodpdqeres",
            },
            marks: { 1: "am", triangle: "anbn", A: "bo" },
            move_tree: this.makePuzzleMoveTree(["bo"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdnbododpcqeqeres",
                white: "alblcldmemeneoepfpdqfqdrfr",
            },
            marks: { 1: "ep" },
            move_tree: this.makePuzzleMoveTree(["cr", "ds", "cs"], ["fsgs", "cpcr"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdnbodoeocpepcqeqcreres",
                white: "dkalblcldmemcnenfodpfpdqfqdrfrfs",
            },
            marks: { 1: "al" },
            move_tree: this.makePuzzleMoveTree(["bn", "co", "an"], ["dsbn"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmandndocpdpbqdqcr",
                white: "dkalblclamdmemeneoepeqdrer",
            },
            marks: { 1: "dm" },
            move_tree: this.makePuzzleMoveTree(["cn", "bn", "bo", "ao"], ["dsbn", "csbn"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocododpcqdreres",
                white: "anbncndneoepdqeqfqfrfs",
            },
            marks: { 1: "dq" },
            move_tree: this.makePuzzleMoveTree(
                ["cr", "cs", "br"],
                ["cpcr", "bscr", "bqcr", "dscr"],
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
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmcnbocpcqarcrbs",
                white: "blcldmdncododpbqdqdrcsds",
            },
            marks: { 1: "cs" },
            move_tree: this.makePuzzleMoveTree(
                ["bp", "br", "aq"],
                ["apbr", "asbp", "albr"],
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
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndnaododpcqeqdrerds",
                white: "elambmcmdmaneneoepfqfresfs",
            },
            marks: { 1: "am" },
            move_tree: this.makePuzzleMoveTree(
                ["bp", "ap", "bq", "bo", "br", "aq"],
                ["dqbo", "cpbo"],
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
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmcnbocpbqcqcrcs",
                white: "alblcldmdncodobpdpdqdrds",
            },
            marks: { 1: "co" },
            move_tree: this.makePuzzleMoveTree(["ap", "ao", "an", "bn"], ["aqan"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmcncocpdqcrdrcs",
                white: "alblcldmdndodpcqeqerdses",
            },
            marks: { 1: "ds" },
            move_tree: this.makePuzzleMoveTree(["bq", "bp", "br", "ar"], ["apbqbrar"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblcldmcndnbobpdpcqdqdrds",
                white: "akbkckdkdlemencodoeocpepeqeres",
            },
            marks: { 1: "do" },
            move_tree: this.makePuzzleMoveTree(
                ["bn", "bm", "cm", "an"],
                ["ambncman", "bqbn", "brbn", "aqbn"],
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
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpdqcrerfrdsfs",
                white: "aobocoeodpgpaqeqfqbrgrhr",
            },
            marks: { 1: "ao" },
            move_tree: this.makePuzzleMoveTree(["cq"], [], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpdqeqgqhqdrfrhrgshs",
                white: "aobocodoiodpepfpgphpfqiqeriris",
            },
            marks: { 1: "fq" },
            move_tree: this.makePuzzleMoveTree(
                ["cq", "cr", "br", "cs", "es", "dscqbqcrbr"],
                ["bscqbqcr", "bscqcrbq", "dscqbqcrcsbr", "dscqcrbq"],
                19,
                19,
            ),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. White has played stone 1. Defend Black's weak spot.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocoapdpepbqfqgqergrfs",
                white: "anbncnfnaodoeofpgpiphqbrhr",
            },
            marks: { 1: "ao" },
            move_tree: this.makePuzzleMoveTree(
                ["cp", "cq", "bp", "crcpbp"],
                ["hscp", "eqcp", "drcp"],
                19,
                19,
            ),
        };
    }
}
