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

export class BL2CapturingRace3 extends LearningHubSection {
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
        return "bl2-capturing-race-3";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning one eye against no eye 2",
            "Capturing Race",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on one eye against no eye 2",
            "One eye against no eye",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clcodoapbpcpdqdrercs",
                white: "dpephpaqbqcqeqfqarfr",
            },
            move_tree: this.makePuzzleMoveTree(["bscres"], ["esbs"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobococpepbqdqeqhqdrds",
                white: "bmcmdnfndobpdpaqcqcrbscs",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["brap"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlbndncoapbpcqdqdrerfrds",
                white: "eocpdpgpaqbqeqfqarcrgrasbs",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], [], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmcnaobocobpfpaqcqdqeqfqhqareres",
                white: "blclelamdmdnfncpdpepbqbrcrdrbsds",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["doan"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlbncnapbpcpdqeqfqarcrerds",
                white: "dofodpgpaqbqcqgqbrfrgrbsfs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["epes", "fpes", "ases"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fphpcqdqeqgqcrgrcsgs",
                white: "bocpdpepbqfqbrerfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["bsds"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlenaobocodoapepaqeqcrdres",
                white: "gobpcpdpbqdqgqarbrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["csbsasds", "dsbsfscs"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlfmaobocodoeoepdqcrdrerasbsds",
                white: "goapbpcpdpgpcqeqfqbrgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqarcsbsar"],
                ["aqarcsbsfrar", "arbq", "frar"],
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
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpaqdqeqfqarfrfs",
                white: "engodpepgpcqhqbrcrdrhrds",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmdmcncododpcqbrcrbsds",
                white: "anbnboeoapbpcpepdqdrergr",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["esar", "bqar", "aqar"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncnbobpaqcqdqhqdrfrds",
                white: "blcmdmdncocpepbqbrcrcs",
            },
            move_tree: this.makePuzzleMoveTree(["apaoas"], ["apaoaras", "asap", "arap"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnbodoeoapbpcpephpbqeqarerases",
                white: "clbmemancndncodpcqdqbrdrds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csbsaqarbs"],
                ["csbsaqarambs", "csbsaqarasbs", "bscr", "ambs"],
                19,
                19,
            ),
        };
    }
}
