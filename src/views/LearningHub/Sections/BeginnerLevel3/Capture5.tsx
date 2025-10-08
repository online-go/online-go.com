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

export class BL3Capture5 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-capture-5";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning throw in", "Capture");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on throw in", "Throw in");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White can capture five stones by throwing in twice: first White throws in at A and, after Black has captured the two stones, White can throw in again. Black will end up with a shortage of liberties. White to play. Capture the five stones by throwing in.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqbrcocpcsdldrerfrgrgs",
                white: "cqcrdqeqesfqgqhohrir",
            },
            marks: { A: "ds" },
            move_tree: this.makePuzzleMoveTree(["dsfsdseshs"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofpgphpcqeqarbrcrergrhrdses",
                white: "cmbpcpdpepdqfqdrfrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csascsbsfs"],
                ["csascsbsbqfs", "fscs", "ascs", "bqcs"],
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
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmembocofoapfpbqfqbrfrbs",
                white: "bpcpdpcqeqarcrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqasaqarcs", "aqasaqaocs", "aqaocsasaq"],
                ["csaq"],
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
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eogphphqcrdrerfrhrgs",
                white: "cnbpcqdqeqfqgqbrgrbses",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsdsfsescs"],
                ["fsdscsfs", "csfs", "dsfs"],
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
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmbocodoeoepbqdqbrdrcsds",
                white: "apbpcpdpfpcqeqfqhqcrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsasesbsaq", "bsasesbsar"],
                ["bsasaqao", "bsasarao", "esbs", "asbs", "aqbs", "arbs"],
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
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fleneogoapbpcpdpaqfqgqbrcrdrergrcsgs",
                white: "clbmbocodoepfpbqcqdqeqfrases",
            },
            move_tree: this.makePuzzleMoveTree(["arbsarasao"], ["bsar", "aoar", "dsfs"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blbncndneneodpaqbqdqeqfqbrdrfrcsfs",
                white: "codogoapbpcpepfpcqgqcrgrires",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dserdsesgs"],
                ["dsergsds", "bsasdsbo", "gsds", "asbo"],
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
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eogpgqiqarcrdrerfrhrasbs",
                white: "cnbqcqdqeqfqbrgrds",
            },
            move_tree: this.makePuzzleMoveTree(["csescs"], ["gscs", "escs", "fsgs"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmeofodpipcqdqgqcrercs",
                white: "cldnbodocpepbqeqbrbs",
            },
            move_tree: this.makePuzzleMoveTree(["dsdrfr"], ["drds", "esfq"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elcmbnbocpcqbrdrds",
                white: "codofobpdphpbqeqercses",
            },
            move_tree: this.makePuzzleMoveTree(
                ["crbscrcsdq"],
                ["crbscrcsarap", "crbsdqcr", "bscr", "dqcr", "arcr"],
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
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aofoapbpepcqdqfqbrfrhrfs",
                white: "clanbndnbocpdpeqcrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqaqdrbqbs", "bqaqdrbqcs"],
                ["bqaqbsdr", "drbqbscsdses", "aqbq"],
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
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpaqeqgqbrcrdrfrcs",
                white: "bmenbococpbqcqdqeras",
            },
            move_tree: this.makePuzzleMoveTree(["arbsar"], ["arbsesar", "esar", "bsar"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmdoeofohobpcpcqdqeqhqbrfrgr",
                white: "elcndnaobocodpepfpbqfqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["craqapbqbs"], ["apcr", "aqcr"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmaobocodoapbqbrbscs",
                white: "bpcpepaqcqcrerds",
            },
            move_tree: this.makePuzzleMoveTree(["arasaq"], ["arasaraq", "asar"], 19, 19),
        };
    }
}
