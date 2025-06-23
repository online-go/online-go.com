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

export class BL1CapturingRace2 extends LearningHubSection {
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
        return "bl1-capturing-race-2";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning choose correct chain",
            "4.23 Capturing Race",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on choose correct chain",
            "Attack important chain first",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. You can attack each of the two marked chains. You must always attack the most important chain first. If you attack the two marked stones first, you will loose the three stones under attack. But if you first capture the chain of four stones, your three stones are safe.",
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
                black: "brbscqdqdseqerfpgqhphr",
                white: "aqarbpbqcpcrdpepfqfrfs",
            },
            marks: { square: "brbs", triangle: "cqdqeqer", cross: "es" },
            move_tree: this.makePuzzleMoveTree(["es"], ["asgr"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aoapgpbqcqeqardrerds",
                white: "dmanbncobpdpdqbrcrbs",
            },
            move_tree: this.makePuzzleMoveTree(["cpaqbo"], ["bocs"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eoephpcqdqfqbrcrfrhr",
                white: "fobpcpdpfpbqeqarer",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["bses", "drds", "dres", "gqes"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "embncnbobpdpcqcrdrercs",
                white: "gmcodoeogocpbqfqbrfrbses",
            },
            move_tree: this.makePuzzleMoveTree(["eq"], ["epaq", "apar"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dodpcqeqfqarbrcrfr",
                white: "cmboeocpepaqbqdqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["dn"], ["cses", "fsds"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dqeqgqhqcrdrfrfs",
                white: "bpdpepfpcqfqbrgrgs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["cshr"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hoepfpgpdqeqhqiqarbrcrgrfs",
                white: "coeofodpaqbqcqfqgqdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["hr"], ["cses"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eneoepdqfqbrcrdrgr",
                white: "cmdndodpbqcqeqarerfr",
            },
            move_tree: this.makePuzzleMoveTree(["gqfphr"], ["dsfs", "bsfs"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmhmfnaobocodofoepfpdqbrdr",
                white: "clelbmfmengneoapbpcpdpeqgqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["go"],
                ["gpgo", "fqgo", "bnbq", "anbq", "cnbq", "dnbq", "dsbq", "cqcr", "crcq"],
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
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hpbqcqfqgqbrdrerhr",
                white: "cnbpcpaqdqeqarfrgres",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["bsgs", "hsfsgsis"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gneodpepcqdqarbrerfr",
                white: "dmdnbodocpaqbqeqfqgqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["grds", "grcs"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dncpdpcqeqfqbrergr",
                white: "epfphpdqgqcrdrhr",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["gsds", "gscs"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Attack the correct chain and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gndoeodqeqarbrcrfrgr",
                white: "dmcncohpaqbqcqfqgqdrerhr",
            },
            move_tree: this.makePuzzleMoveTree(["gs", "fs"], ["cses"], 19, 19),
        };
    }
}
