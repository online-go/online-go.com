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

export class BL4Joseki2 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-joseki-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning joseki", "Joseki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on joseki 2", "Play joseki");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If Black has a stone at A, Black should build a wall on that side. Play this joseki with White, starting at 3.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cldpjp",
                white: "cn",
            },
            marks: {
                A: "jp",
                1: "cn",
                2: "cl",
                3: "cq",
                4: "dq",
                5: "cp",
                6: "do",
                7: "bn",
                8: "em",
            },
            move_tree: this.makePuzzleMoveTree(["cqdqcpdobnem"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Play this joseki with Black, starting at 4.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cldpjp",
                white: "cncq",
            },
            marks: {
                1: "cn",
                2: "cl",
                3: "cq",
                4: "dq",
                5: "cp",
                6: "do",
                7: "bn",
                8: "em",
            },
            move_tree: this.makePuzzleMoveTree(["dqcpdobnem"], [], 19, 19),
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
            "If Black 2 attacks the white kakari, White bends at 3. In this version both White and Black play large extensions at 7 and 8. Play this joseki with White, starting at 3.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpfp",
                white: "fq",
            },
            marks: {
                1: "fq",
                2: "fp",
                3: "gp",
                4: "fo",
                5: "eq",
                6: "dq",
                7: "jq",
                8: "cj",
            },
            move_tree: this.makePuzzleMoveTree(["gpfoeqdqjqcj"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Play this joseki with Black, starting at 2.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dp",
                white: "fq",
            },
            marks: {
                1: "fq",
                2: "fp",
                3: "gp",
                4: "fo",
                5: "eq",
                6: "dq",
                7: "jq",
                8: "cj",
            },
            move_tree: this.makePuzzleMoveTree(["fpgpfoeqdqjqcj"], [], 19, 19),
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
            "This is a different version of the previous joseki, where White and Black cover the cuts with 7 and 8. Play this joseki with White, starting at 3.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpfp",
                white: "fq",
            },
            marks: {
                1: "fq",
                2: "fp",
                3: "gp",
                4: "fo",
                5: "eq",
                6: "dq",
                7: "hq",
                8: "dn",
            },
            move_tree: this.makePuzzleMoveTree(["gpfoeqdqhqdn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Play the same joseki with Black, starting at 2.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dp",
                white: "fq",
            },
            marks: {
                1: "fq",
                2: "fp",
                3: "gp",
                4: "fo",
                5: "eq",
                6: "dq",
                7: "hq",
                8: "dn",
            },
            move_tree: this.makePuzzleMoveTree(["fpgpfoeqdqhqdn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "eocpepcq",
                white: "dpfpdqeq",
            },
            marks: { A: "co", B: "do", C: "dr", 1: "dp" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fq",
                white: "dpeq",
            },
            marks: { A: "fp", B: "er", C: "fr", 1: "eq" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpfp",
                white: "dqfq",
            },
            marks: { A: "ep", B: "cq", C: "eq", 1: "dq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fodpfp",
                white: "gpcqfq",
            },
            marks: { A: "cp", B: "dq", C: "eq", 1: "cq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpfp",
                white: "fqgq",
            },
            marks: { A: "gp", B: "hp", C: "eq", 1: "gq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpfp",
                white: "eqfq",
            },
            marks: { A: "ep", B: "dq", C: "gq", 1: "eq" },
            move_tree: this.makePuzzleMoveTree(["dq", "ep"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "gpeqfq",
                white: "fogodpfp",
            },
            marks: { A: "ho", B: "hp", C: "hq", 1: "go" },
            move_tree: this.makePuzzleMoveTree(["hp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dmcnco",
                white: "dnendodp",
            },
            marks: { A: "cl", B: "cp", C: "cq", 1: "do" },
            move_tree: this.makePuzzleMoveTree(["cp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fodpfpdq",
                white: "gpeqfqdr",
            },
            marks: { A: "ep", B: "gq", C: "cr", 1: "dr" },
            move_tree: this.makePuzzleMoveTree(["cr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fodpfp",
                white: "gpfqgq",
            },
            marks: { A: "go", B: "dq", C: "eq", 1: "gq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "gpeqfq",
                white: "fodpfpgq",
            },
            marks: { A: "dq", B: "hq", C: "gr", 1: "gq" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dnencpdp",
                white: "dmcncofq",
            },
            marks: { A: "cm", B: "ep", C: "fp", 1: "fq" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
