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

export class BL2Endgame5 extends LearningHubSection {
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
        return "bl2-endgame5";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning defend territory", "Endgame 5");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on defend territory",
            "Defend territory",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dkblcldmdnfneofpfqerfrds",
                white: "bmcmcncodoepcqeqdr",
            },
            marks: { 1: "ds" },
            move_tree: this.makePuzzleMoveTree(["cs"], ["crcs"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblclcmcndnfneofpfqerfrcsds",
                white: "ambmbnbocodoepcqeqdres",
            },
            marks: { 1: "cs" },
            move_tree: this.makePuzzleMoveTree(["bs"], ["crbs", "brbs"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bkckcleldmdneoepeqdr",
                white: "blamcmcnbododpdq",
            },
            marks: { 1: "dr" },
            move_tree: this.makePuzzleMoveTree(["cr"], ["cqcr"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcldmemenfofpeqfqdrcs",
                white: "bmcmdnbodoeoepcqdqcr",
            },
            marks: { 1: "cs" },
            move_tree: this.makePuzzleMoveTree(["er"], ["bses", "brds"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmcndnfneoepeqcrergrds",
                white: "anbnaocodobpdpdqdrcs",
            },
            marks: { 1: "cr" },
            move_tree: this.makePuzzleMoveTree(["es"], ["bses", "brbs", "cqbs"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcleldmenfngogpcqfqgqdrer",
                white: "bmcmandnbocoeofpdqeqcrfr",
            },
            marks: { 1: "cq" },
            move_tree: this.makePuzzleMoveTree(
                ["ds", "es"],
                ["bqcs", "grbr", "brgr", "csgr"],
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
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ckblglcmdmemfmgngogpfqhqerfr",
                white: "bmancndnenfnbofofpcqeq",
            },
            marks: { 1: "er" },
            move_tree: this.makePuzzleMoveTree(["dr"], ["dqdr", "crdr", "epdr", "dpdr"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmcndoeofogpgqfrhresfs",
                white: "bnaocobpcpdpepfpfqer",
            },
            marks: { 1: "es" },
            move_tree: this.makePuzzleMoveTree(["dr"], ["dsdr", "crdr", "csdr", "eqds"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcldmemfnfofpfqfresfs",
                white: "bmcmancndnboeoepeqer",
            },
            marks: { 1: "es" },
            move_tree: this.makePuzzleMoveTree(
                ["crcsbsdsbr", "crcsbsdsbq"],
                ["crcsbsdsardrdqcq", "crcsbrbs", "dsdr", "drds"],
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
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmenfngogphphqhrfsgs",
                white: "bncndnaodobpcpepfqgqgr",
            },
            marks: { 1: "fs" },
            move_tree: this.makePuzzleMoveTree(
                ["erescrcsbsdsbr", "erescrcsbsdsar", "erescrcsbsdsbq"],
                ["erescrcsbsdsdrbr", "erescrcsdsdr", "erescrcsbrbs", "eresdrds", "frer", "eser"],
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
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcldmemfnfofpeqfqdrer",
                white: "bmcmbndncoeoepdq",
            },
            marks: { 1: "dr" },
            move_tree: this.makePuzzleMoveTree(
                ["cqcrbrbqbp"],
                ["cqcrbrbqaqbp", "cqcrbqbr", "crcq", "bqcrcqbr", "bqcrbrcq"],
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
        return _("White to play. Defend White's territory after Black's move 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmenfngohogqiqgrdsesfs",
                white: "bncndnaodoeobpcpfpfqerfr",
            },
            marks: { 1: "ds" },
            move_tree: this.makePuzzleMoveTree(["cr"], ["drcr", "cscr"], 19, 19),
        };
    }
}
