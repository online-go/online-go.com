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

export class BL1Cut extends LearningHubSection {
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
            Page16,
            Page17,
            Page18,
            Page19,
            Page20,
            Page21,
            Page22,
            Page23,
            Page24,
        ];
    }
    static section(): string {
        return "bl1-cut";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning cut", "4.15 Cut");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on cut", "Cut opponent's stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White can cut the black stones and separate them into two weak groups. White to play. Cut the marked stones.",
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
                black: "cmcocpdqdr",
                white: "eobqcqeqgqcr",
            },
            marks: { triangle: "cmcocpdqdr", cross: "dp" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["dodp", "epdp", "cndp"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eldnencocpbq",
                white: "cmdodpcqdqgqbr",
            },
            marks: { triangle: "eldnencocpbq" },
            move_tree: this.makePuzzleMoveTree(["cn"], ["dmcn", "bpcn"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpepfpeqdrds",
                white: "cnencocqfqcrerfr",
            },
            marks: { triangle: "bpcpdpepfpeqdrds" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcncoeodpdrer",
                white: "bnbocpfpcqfqcrfr",
            },
            marks: { triangle: "cmcncoeodpdrer" },
            move_tree: this.makePuzzleMoveTree(["dqeqep"], ["doepdnem", "epdq", "eqdq"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emdncoeocpbqbr",
                white: "dlbmdmcnbocqeqcr",
            },
            marks: { triangle: "emdncoeocpbqbr" },
            move_tree: this.makePuzzleMoveTree(["bp", "dpdobp"], [], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fnfobpcpdpfphpfq",
                white: "bndnbqcqdqeqfrgr",
            },
            marks: { triangle: "fnfobpcpdpfphpfq" },
            move_tree: this.makePuzzleMoveTree(["epeodo"], ["gqep", "gpep"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emdoeodpdrer",
                white: "cncocpepcqfqhqcrfr",
            },
            marks: { triangle: "emdoeodpdrer" },
            move_tree: this.makePuzzleMoveTree(["dqeqfp"], ["eqdq", "endq", "dndq"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cofocpepgp",
                white: "cmdmeneobqcqdq",
            },
            marks: { triangle: "cofocpepgp" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["dodp"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnencpdpeq",
                white: "cmdmcncofpfq",
            },
            marks: { triangle: "dnencpdpeq" },
            move_tree: this.makePuzzleMoveTree(["doeoep"], ["epdo", "eodo"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmcncofpfq",
                white: "dnendocpdpeq",
            },
            marks: { triangle: "dmcnco" },
            move_tree: this.makePuzzleMoveTree(["cm"], [], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmemcndoeoepeq",
                white: "cldldmcocpdpdq",
            },
            marks: { triangle: "cmemcndoeoepeq" },
            move_tree: this.makePuzzleMoveTree(["dn"], ["endn"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epcqeqgqdr",
                white: "cncpdpdq",
            },
            marks: { triangle: "cqdr" },
            move_tree: this.makePuzzleMoveTree(["crbqbr", "crbqer"], [], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqeqgqfr",
                white: "dndpdq",
            },
            marks: { triangle: "frgqeqcqbq" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcocpcqeqfqcr",
                white: "dndofodpdq",
            },
            marks: { triangle: "crfqeqcqcpcocm" },
            move_tree: this.makePuzzleMoveTree(["dr"], ["cndr"], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocqdqbr",
                white: "cpdpepeq",
            },
            marks: { triangle: "brdqcqbo" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bqbp"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cocqcrerfr",
                white: "epgpdqhqdr",
            },
            marks: { triangle: "frercrcqco" },
            move_tree: this.makePuzzleMoveTree(
                ["ds", "cs", "es"],
                ["cpbpdpds", "cpbpdsdp"],
                19,
                19,
            ),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "crcmdmfmbncncoapbqcq",
                white: "drdnbodofobpcpdq",
            },
            marks: { triangle: "crcqbqapcocnbnfmdmcm" },
            move_tree: this.makePuzzleMoveTree(["ao"], ["anamaodp", "anamdpao"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmbnboaqbqcqcr",
                white: "dnbpcpdpdqdr",
            },
            marks: { triangle: "crcqbqaqbobncm" },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aoap"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gogqarbrcrfrgres",
                white: "bqcqdqeqfqer",
            },
            marks: { triangle: "esgrfrcrbrargqgo" },
            move_tree: this.makePuzzleMoveTree(["dsdrfs"], ["drds"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eocpdpeqfr",
                white: "bqcqfqgqdrhr",
            },
            marks: { triangle: "freqdpcpeo" },
            move_tree: this.makePuzzleMoveTree(["er"], ["dqer"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dncobqcqdqeq",
                white: "cpdpepfpfq",
            },
            marks: { triangle: "eqdqcqbqcodn" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bobp"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocodpepgpeqdr",
                white: "bmcnenbpcpcqdqbr",
            },
            marks: { triangle: "dreqgpepdpcobo" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcnbpcpbq",
                white: "dncodpcqeqcr",
            },
            marks: { triangle: "bqcpbpcncm" },
            move_tree: this.makePuzzleMoveTree(["bo"], [], 19, 19),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gpdqfqhqfr",
                white: "dofofpeqgq",
            },
            marks: { triangle: "frhqfqdqgp" },
            move_tree: this.makePuzzleMoveTree(["er"], [], 19, 19),
        };
    }
}
