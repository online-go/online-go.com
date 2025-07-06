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

export class BL1LifeDeath3 extends LearningHubSection {
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
        return "bl1-life-death-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning play at vital point", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on play at vital point",
            "Play at vital point",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codoeofocpgpbqgqbrfrgr",
                white: "dpepfpcqdqfqcrer",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["esds", "csds"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocoeoapdpcqdqfq",
                white: "bpcpbqarcr",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["drbs", "csbs"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocodoeofohoapfqfresfs",
                white: "bpcpepbqarbrcrdrercs",
            },
            move_tree: this.makePuzzleMoveTree(["dq"], ["dpdq", "eqdq"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndnenfngnincohobphpbqhqbrcrfrgr",
                white: "dofogocpdpgpcqfqgqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["epeoeq"], ["eqep", "eoep"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpfpgpipbqcqhqbrdrhr",
                white: "dqeqgqcrgrcsdsesgs",
            },
            move_tree: this.makePuzzleMoveTree(["frfqer"], ["fqfr", "erfr", "epfq"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocoeodpdqdrds",
                white: "apbpcpcqarcr",
            },
            move_tree: this.makePuzzleMoveTree(["bscsbr"], ["brbs", "bqcs", "csbs"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codpepfpbqcqfqgqhqarhr",
                white: "dqeqbrcrerfrgrbs",
            },
            move_tree: this.makePuzzleMoveTree(["dsgses"], ["esds", "fsgs", "gsds"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "encodobpepfpbqfqhqbrgr",
                white: "cpdpcqeqcrerfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["dscsdr"], ["drds", "csds"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofohocpdpgpbqgqbrhrgs",
                white: "epfpcqdqfqcrfrgrcs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eresdr"],
                ["fseresds", "fserdses", "eserdsfs", "eserfsds", "drer"],
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
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codpepaqbqcqfqgqhqarhr",
                white: "dqeqbrcrerfrgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsgses", "dsgscsbses"],
                ["dsgscsbsdres", "dsgsdres", "bsds", "csds", "esds", "gsds", "fsgs"],
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
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpgpbqeqfqhq",
                white: "aqcqdqbrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "csbsdseresfsfrcresdsar",
                    "csbsdseresfsfrcrar",
                    "csbsdseresfsar",
                    "csbsdserar",
                    "csbsdserfresar",
                    "csbsar",
                    "csbserdsar",
                ],
                [
                    "csbsdseresfsfrcresdsgsar",
                    "csbsdseresfsfrcrgsar",
                    "ercs",
                    "dscs",
                    "arcsaserfres",
                    "arcsaseresfr",
                    "arcseras",
                    "bscs",
                    "asarcsbsdser",
                    "asarcsbserds",
                    "asarercs",
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
        return _("Black to play. Play at the vital point and capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpfpeqer",
                white: "bqcqdqardr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscsbr"],
                [
                    "bscsasbr",
                    "bscsesbr",
                    "dsbscscr",
                    "dsbscrcs",
                    "csbscrds",
                    "csbsdscr",
                    "crcs",
                    "brbs",
                ],
                19,
                19,
            ),
        };
    }
}
