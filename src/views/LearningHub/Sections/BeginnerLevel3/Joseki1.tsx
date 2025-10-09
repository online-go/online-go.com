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

export class BL3Joseki1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-joseki-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning after a joseki", "Joseki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on after a joseki", "Simple josekis");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "In the opening, specific patterns of moves are often played in the corners. These patterns are called joseki. It does not make sense to memorize a lot of josekis. It is better to start with understanding the principles when playing a joseki. We will show some simple josekis and explain the ideas behind the moves. To start with we look at a joseki where a stone at the 4-4 point is attacked (kakari, corner approach) by a knight's move at 1. This is the usual approach of a stone at the 4-4 point. Black can respond in different ways. Here we look at a quiet, defensive response: black 2 on the 3th line. White moves with 3 into the corner, Black blocks with 4 and White creates a base with 5. Play this joseki with White.",
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
                black: "dp",
                white: "",
            },
            marks: { 1: "fq", 2: "cn", 3: "dr", 4: "cq", 5: "iq" },
            move_tree: this.makePuzzleMoveTree(["fqcndrcqiq"], [], 19, 19),
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
            "Here Black plays 2 on the 4th line. In this case Black should play 6 to defend Black's territory. Play this joseki with Black.",
        );
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
            marks: { 1: "fq", 2: "dn", 3: "dr", 4: "cq", 5: "iq", 6: "cj" },
            move_tree: this.makePuzzleMoveTree(["dndrcqiqcj"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Play this joseki with White.");
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
                black: "cp",
                white: "",
            },
            marks: { 1: "ep", 2: "eq", 3: "fq", 4: "dq", 5: "fp", 6: "cn", 7: "jq" },
            move_tree: this.makePuzzleMoveTree(["epeqfqdqfpcnjq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Play this joseki with White.");
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
                black: "cp",
                white: "",
            },
            marks: { 1: "ep", 2: "eq", 3: "fq", 4: "dq", 5: "gp", 6: "cn", 7: "kq" },
            move_tree: this.makePuzzleMoveTree(["epeqfqdqgpcnkq"], [""], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Play this joseki with White.");
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
                black: "cq",
                white: "",
            },
            marks: { 1: "dp", 2: "dq", 3: "ep", 4: "bo", 5: "dm", 6: "fr", 7: "hp" },
            move_tree: this.makePuzzleMoveTree(["dpdqepbodmfrhp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Play this joseki with Black.");
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
                black: "cq",
                white: "fp",
            },
            marks: { 1: "fp", 2: "dn", 3: "jq", 4: "cj" },
            move_tree: this.makePuzzleMoveTree(["dnjqcj"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Play this joseki with Black.");
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
                white: "cq",
            },
            marks: {
                1: "cq",
                2: "cp",
                3: "dq",
                4: "eq",
                5: "er",
                6: "fq",
                7: "fr",
                8: "gq",
                9: "bp",
                10: "bo",
                11: "bq",
                12: "cn",
            },
            move_tree: this.makePuzzleMoveTree(["cpdqeqerfqfrgqbpbobqcn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndphpcq",
                white: "fqiqdr",
            },
            marks: { A: "ip", B: "gq", C: "hq", 1: "hp" },
            move_tree: this.makePuzzleMoveTree(["hqfpeq"], ["iphq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndpgpcq",
                white: "fqiqdr",
            },
            marks: { A: "dq", B: "gq", C: "hq", 1: "gp" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndpfpcq",
                white: "fqiqdr",
            },
            marks: { A: "eq", B: "gq", C: "cr", 1: "fp" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "bpepbqcqdqerfr",
                white: "cnbocpdpeqfqgq",
            },
            marks: { A: "do", B: "eo", C: "fo", 1: "ep" },
            move_tree: this.makePuzzleMoveTree(
                ["foeoendndmfndo"],
                [
                    "foeoendndoco",
                    "foeoendnfpdocodm",
                    "foeoendnfpdodmco",
                    "foeodoen",
                    "eofpgodocofo",
                    "eofpfogp",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndpcqhr",
                white: "fqiqdr",
            },
            marks: { A: "hq", B: "gr", C: "ir", 1: "hr" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndpcqhq",
                white: "fqiqdr",
            },
            marks: { A: "hp", B: "hr", C: "ir", 1: "hq" },
            move_tree: this.makePuzzleMoveTree(
                ["hrgrgqhpjr"],
                ["hrgrgqhpfrir", "hrgrgqhpipir", "hrgrhpgq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndphpcqeq",
                white: "fqhqiqdr",
            },
            marks: { A: "ep", B: "dq", C: "er", 1: "eq" },
            move_tree: this.makePuzzleMoveTree(
                ["erfpgpgogq"],
                ["erfpgpgocrgq", "erfpgpgoipgq", "erfpcrgq", "eper", "dqer"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "eobpbqcqdqerfr",
                white: "cnbocpdpeqfqgq",
            },
            marks: { A: "do", B: "ep", C: "gr", 1: "eo" },
            move_tree: this.makePuzzleMoveTree(["ep"], ["grep", "doep"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndpcqeq",
                white: "fqiqdr",
            },
            marks: { A: "dq", B: "cr", C: "er", 1: "eq" },
            move_tree: this.makePuzzleMoveTree(["erfpgq"], ["dqer", "crer"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndpcqer",
                white: "fqiqdr",
            },
            marks: { A: "dq", B: "eq", C: "fr", 1: "er" },
            move_tree: this.makePuzzleMoveTree(
                ["eqdqcrbrfr"],
                ["eqdqcrbrbsds", "eqdqcrbrbqcs", "eqdqfrcr", "eqdqdscr", "dqeq", "freq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "dobpbqcqdqerfr",
                white: "cnbocpdpeqfqgq",
            },
            marks: { A: "co", B: "eo", C: "ep", 1: "do" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
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
                black: "cndpcqgr",
                white: "fqiqdr",
            },
            marks: { A: "gq", B: "cr", C: "fr", 1: "gr" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
