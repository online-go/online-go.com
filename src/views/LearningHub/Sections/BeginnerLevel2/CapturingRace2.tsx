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

export class BL2CapturingRace2 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl2-capturing-race-2";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning one eye against no eye 1",
            "Capturing Race",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on one eye against no eye 1",
            "One eye against no eye",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If your group has an eye and the group of your opponent has none, you have an advantage in a capturing race. In this example White has an eye and Black none. Black has play at 1 and his group has three liberties, while White has only two, but Black still will lose the fight. In a capturing race between a one-eye and no-eye group, the side without eyes must first fill in all common liberties. Only after that he can play inside the eye. So, the player who has an eye has an advantage. White to play. Win the capturing race.",
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
                black: "bqbrcncocpdqeqfqfrgrgsbs",
                white: "cqcrcsdreresdpepfpgphqhr",
            },
            marks: { triangle: "cqcrcsdreresdqeqfqfrgrgs", 1: "bs" },
            move_tree: this.makePuzzleMoveTree(["hsfsgq", "gqfshs"], ["fsds"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobobpcpdqfqdrgrbscs",
                white: "clanbndncodpepcqarbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["dsaq", "bqaq"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdndocpbqcqbrasbs",
                white: "aobocoeodpfpdqcrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["apbp"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you have an eye yourself, you must prevent your opponent from making an eye as well. In this example White should play at the vital point A. Whatever Black tries, he is short on liberties and White wins the capturing race. White to play. Win the capturing race.",
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
                black: "apbobpcocqcrdodqdleneqerfn",
                white: "aqasbqbrcpdpepfqfrgpip",
            },
            marks: { A: "ds" },
            move_tree: this.makePuzzleMoveTree(["dsescs"], ["dsesfscs"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpephpcqfqgqcrhrcs",
                white: "apbpcpdqeqarbrdrfrgrds",
            },
            move_tree: this.makePuzzleMoveTree(["esergs"], ["eserfsgs", "gsbq", "gsbs"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blbncncocpdpepeqbrcrdrds",
                white: "bobpbqcqdqfqhqarerfres",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsaoaq"],
                ["bsaoanaq", "aobs", "aqbs", "asbs"],
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
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmemaocododpbqcqarcrasbs",
                white: "anbnbobpcpepdqeqhqdrcsds",
            },
            move_tree: this.makePuzzleMoveTree(["apaqap"], ["aqap", "cnap"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blclelamdmdnfogocpdpepbqbrcrdrbsds",
                white: "bmcmcnaobocobpfpipaqcqdqeqfqhqareres",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["alap", "doan"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bkdkalclcmcncocpaqbqbrbs",
                white: "blbmbnaobobpdpcqdqgqarcrcs",
            },
            move_tree: this.makePuzzleMoveTree(["am"], ["asam"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you have an eye, you can make it extra difficult for your opponent by making common liberties. Your opponent has to fill in all those common liberties first. White can make an eye by playing at A and at the same time he creates two common liberties. Black must fill in those liberties and is too late to win the capturing race. White to play. Win the capturing race.",
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
                black: "apbpcqdqdrdsfp",
                white: "asbnbqcocpcrcsen",
            },
            marks: { A: "br" },
            move_tree: this.makePuzzleMoveTree(["braqbo", "braqao"], ["aqbr", "araq"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bkdkclcmcncobpbqbrbs",
                white: "bmanbnbodoapcpdpcqgqcrcs",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["aqar", "blaq"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepbqcqeqarergr",
                white: "clcodoapbpcpaqdqdrds",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["esbr", "brbsescs", "brbscscr"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmbnbodoeoepaqdqcrdrerbscses",
                white: "goapbpcpdpcqeqfqbrfrfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arbqaoasar", "arbqcoasar"],
                ["aoarcobq", "coaraobq"],
                19,
                19,
            ),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblclamcmbncocpfpcqhqbrcr",
                white: "akbkckekdldmcndnbobpaqbq",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["arao"], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race with one eye against no eye.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmdmcndodpcqbrcrdrbsds",
                white: "bnboapbpcpgpbqdqeqareres",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["coan"], 19, 19),
        };
    }
}
