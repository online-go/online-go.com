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

export class BL3Haengma1 extends LearningHubSection {
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
        return "bl3-haengma-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning haengma", "Haengma");
    }
    static subtext(): string {
        return "";
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Playing at A in this example is good haengma. You attach a stone to your own, stretching this stone. This is a slow move, but it is also very solid. Often it is a defensive move. In this example Black defends the corner. Black to play. Choose the best continuation after White's 1.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpepiq",
                white: "cmgq",
            },
            marks: { 1: "gq", A: "eq" },
            move_tree: this.makePuzzleMoveTree(["eqgo"], [], 19, 19),
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
            "White attacks the black stone with 1. A diagonal move (kosumi) at A strengthens Black's position. It also attacks stone 1 and prevents that White connects underneath. Black to play. Play a diagonal move to defend the black stone.",
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
                black: "ep",
                white: "cpgq",
            },
            marks: { 1: "gq", A: "fo" },
            move_tree: this.makePuzzleMoveTree(["fo"], [], 19, 19),
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
            "White attacks the black stone with 1. A faster move than the diagonal move is the one-point jump (ikken-tobi) at A. This is still solid: it is very difficult for white to separate the two stones. Often you use this move to escape towards the centre. Black to play. Play a one-point jump to escape towards the centre.",
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
                black: "fq",
                white: "codqhq",
            },
            marks: { 1: "hq", A: "fo" },
            move_tree: this.makePuzzleMoveTree(["fo"], [], 19, 19),
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
            "An even faster move is the two-points jump. Black can make this move at A to make an extension along the side, creating a base. With a base usually you achieve to make a living group. Black to play. Make a base.",
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
                black: "eq",
                white: "cpdo",
            },
            marks: { 1: "do", A: "hq" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
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
            "The knight's move (keima) is a strong and fast move. The name derives from the move of the knight in chess. Often you use the knight's move to attack. Black to play. Play a keima to attack the corner after White's keima at 1.",
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
                black: "fq",
                white: "dpcn",
            },
            marks: { 1: "cn", A: "dr" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
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
            "The diagonal jump is usually not a good move. In Chinese this move is called the elephant move, after the way the elephant moves in Chinese chess. Here, Black plays a diagonal jump 2 after White's 1. The big disadvantage of a diagonal jump is that the stones can be separated easily. By playing at A, White can keep the black stones separated. White to play. Separate the black stones.",
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
                black: "dpfn",
                white: "fq",
            },
            marks: { 1: "fq", 2: "fn", A: "eo" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
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
            "The white stones are surrounded by two strong black groups. If White bends at A after Black's 1, Black will cut at C. In the battle that follows probably one of the three white stones will be separated from the others. Because black is strong at both sides of the white stones, White should avoid a battle. White's best response to the attachment 1 is to stretch at B or C. This makes white's group stronger. White to play. Play a good response to Black's attachment.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "dndpfqkppppqqn",
                white: "hqkqnq",
            },
            marks: { 1: "kp", A: "lp", B: "jq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["jq", "lq"], ["lplq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "cncp",
                white: "dndp",
            },
            marks: { 1: "cp", A: "co", B: "cq" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "cmcnbocpcq",
                white: "bndncododp",
            },
            marks: { 1: "cm", A: "dm", B: "bp" },
            move_tree: this.makePuzzleMoveTree(["bp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "clcn",
                white: "dndpdq",
            },
            marks: { 1: "cn", A: "cm", B: "co" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "cldmcn",
                white: "dncodpdq",
            },
            marks: { 1: "dm", A: "em", B: "bn" },
            move_tree: this.makePuzzleMoveTree(["bn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "clcmdmcn",
                white: "bndncodpdq",
            },
            marks: { 1: "cm", B: "bm", A: "en" },
            move_tree: this.makePuzzleMoveTree(["en"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "cldm",
                white: "dndpdq",
            },
            marks: { 1: "dm", A: "cn", B: "do" },
            move_tree: this.makePuzzleMoveTree(["cn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "cpcqdq",
                white: "dodp",
            },
            marks: { 1: "dq", A: "ep", B: "fp" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "cndndo",
                white: "cocpdq",
            },
            marks: { 1: "dn", A: "dp", B: "fq" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "clcodocp",
                white: "dpcqdq",
            },
            marks: { 1: "do", A: "ep", B: "fp" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "cldp",
                white: "cn",
            },
            marks: { 1: "cl", A: "en", B: "fn" },
            move_tree: this.makePuzzleMoveTree(["en"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "do",
                white: "dq",
            },
            marks: { 1: "do", A: "ep", B: "fp" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best continuation after Black's 1, A or B.");
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
                black: "bocododpeqer",
                white: "bpcpdqdr",
            },
            marks: { 1: "bo", A: "cq", B: "br" },
            move_tree: this.makePuzzleMoveTree(["br"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
