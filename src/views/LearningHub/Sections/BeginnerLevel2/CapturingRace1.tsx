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

export class BL2CapturingRace1 extends LearningHubSection {
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
        return "bl2-capturing-race-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning approach move", "Capturing Race");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on approach move", "Approach move");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "When counting liberties, you should be aware that you can't always fill the liberties directly. If you put yourself in atari in filling a liberty, your stone will be captured. In order to avoid this, you should first play an approach move, or first connect your stones. In this example White can not play at C immediately, because he puts his stone in atari. White must first approach point C with an approach move at D. This will cost an extra move. That is why it takes three moves to capture the marked black chain. So, effectively Black has three liberties. Similarly, Black can't immediately fill a liberty of the marked white chain at B. Black must first connect his stones at A. So, the marked white chain also has effectively three liberties. White to play. Play an approach move and win the capturing race.",
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
                black: "arbpbqcncpdqdrdser",
                white: "brbscqcrdodpeqfqfrhr",
            },
            marks: { triangle: "brbscqcrdqdrdser", A: "aq", B: "as", C: "es", D: "fs" },
            move_tree: this.makePuzzleMoveTree(["fs"], ["esfs", "csas"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnepaqbqcqdqarerfrgrbsfs",
                white: "goeqfqgqiqbrcrdrhrds",
            },
            move_tree: this.makePuzzleMoveTree(["hs"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldndoapbpcpdqeqcrerdses",
                white: "fmdpepgpbqcqfqbrfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blbncngncodoeoepcqdqbrcrbs",
                white: "boapbpcpdpfpgpbqeqardrfr",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hodpepfpdqhqbrcrfrbsfs",
                white: "cmdmbobqcqeqardrer",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["dsfq"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fpgphpcqdqeqiqbrdrfriresfs",
                white: "enbofocpdpepbqfqgqarcrgrcsgs",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepbqcqfqarcrfrhrcs",
                white: "bmcodobpcpdqdrbsds",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], [], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpdpepgpbqcqarbrfrbs",
                white: "cmbocoapcpdqcrdrcs",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], [], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gnfphpcqdqeqgqbrcrgrbsgs",
                white: "dmbpcpdpepbqfqardrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["dsfs"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlcmcnbodoeobpdpbqdqgqdrerfrdsfs",
                white: "fmdnencofocpephpaqcqfqarbrcrgrhrircsgs",
            },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmdoeocpepgpcqfqcrgrbscsfs",
                white: "cmdnbocobpdpbqdqeqbrerfrds",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], [], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnbocobpcqdqcrerfrcsds",
                white: "gncpdpepgpbqeqfqbrgrbsfs",
            },
            move_tree: this.makePuzzleMoveTree(["gs"], [], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play an approach move and win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dleneobpcpdpbqeqfqbrdrergres",
                white: "epfphpcqdqgqcrhrbscsfs",
            },
            move_tree: this.makePuzzleMoveTree(["gs"], ["hsar"], 19, 19),
        };
    }
}
