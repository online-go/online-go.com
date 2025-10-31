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

export class BL3CapturingRace2 extends LearningHubSection {
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
        return "bl3-capturing-race-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning increase liberties", "Capturing Race");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on increase liberties",
            "Increase liberties",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "You can win the capturing race by preventing your opponent from filling your liberties, or by increasing the number of your liberties. Sometimes you can even gain a liberty, while filling an opponent's liberty. Here, White starts with two liberties and Black with three. White will lose the capturing race if they start from the right. But White will gain an extra liberty by playing at A, while Black loses one. The situation is then reversed: White has three liberties, and Black only two. Win the capturing race with White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bpbqbrcpdodqeqfq",
                white: "cqcrdpepfpgogqhq",
            },
            marks: { A: "dr" },
            move_tree: this.makePuzzleMoveTree(["drerfr", "dreres"], ["frdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "bqcqdpepeqergr",
                white: "crdrdqbpcpcodo",
            },
            move_tree: this.makePuzzleMoveTree(["br"], ["dsbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "crcqcpdoeofqgq",
                white: "brbqbpbococmdpdq",
            },
            move_tree: this.makePuzzleMoveTree(["dr"], ["epdr", "eqdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "dqepfqdpbp",
                white: "eqerfpgphqiq",
            },
            move_tree: this.makePuzzleMoveTree(["fr"], ["drfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "aqapbpcpcododq",
                white: "arbrbqcqdpepfqgq",
            },
            move_tree: this.makePuzzleMoveTree(["dr"], ["crdr", "eqer"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "bqbpcpdqeqfqgqgrgp",
                white: "dpepfpdocobocqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["br"], ["erbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "cqdqepeofqfrgp",
                white: "eqerdrdpcpbpcndm",
            },
            move_tree: this.makePuzzleMoveTree(["cr"], ["escr", "bqbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "brapbpcpdpepeqeres",
                white: "aqbqcqdqdrdsboaocndneofofpfqfrhr",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["crar", "csar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "cpdqdrdscseqep",
                white: "bsbrcrcqdpdocnbn",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bqbp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "brbqbpbococmdpepfqfrerdr",
                white: "cpcqcrcsdoeofpgpgqgrgsfsfn",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["dqds", "dsdq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "crcqdpepfpgqhphr",
                white: "brbqbpcpcndqeqfqgr",
            },
            move_tree: this.makePuzzleMoveTree(["dr"], ["frdr", "erdr", "csdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "crcqbpbocodrdndl",
                white: "brbqcpdpeperfqgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                ["aqbsards", "aqbscsdq", "aqbsdses", "csbs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race by increasing the number of liberties or by preventing to lose them.",
        );
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
                black: "aqbqcqdqepbocn",
                white: "apbpcpdpeqfqgqgo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eo"],
                ["doeo", "ereo", "dreo", "coeo", "aoeo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
