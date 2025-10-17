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

export class BL3Skills4 extends LearningHubSection {
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
        return "bl3-skills-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning defend", "Skills");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on defend", "Defend");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "dnenbocoeo",
                white: "bndocpdpdq",
            },
            marks: { 1: "bo", A: "cn", B: "bp", C: "bq" },
            move_tree: this.makePuzzleMoveTree(["cn"], ["bpcn", "bqcn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "codpepeqeres",
                white: "cmcpbqdqdrds",
            },
            marks: { 1: "co", A: "bn", B: "bo", C: "bp" },
            move_tree: this.makePuzzleMoveTree(["bo"], ["bnbo", "bpbo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "dqfqcrbs",
                white: "cmcncpcqbr",
            },
            marks: { 1: "bs", A: "aq", B: "bq", C: "dr" },
            move_tree: this.makePuzzleMoveTree(["dr"], ["bqdr", "aqdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "bpcpdqeqbr",
                white: "cododpbqcq",
            },
            marks: { 1: "br", A: "bo", B: "ar", C: "cr" },
            move_tree: this.makePuzzleMoveTree(["cr"], ["bocr", "arcr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "dofoeqfqfr",
                white: "cmcnendpepdqdrer",
            },
            marks: { 1: "do", A: "dn", B: "co", C: "eo" },
            move_tree: this.makePuzzleMoveTree(["eo"], ["coeo", "dneo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "eoepdqeqcr",
                white: "cmdncpdpcq",
            },
            marks: { 1: "cr", A: "bq", B: "br", C: "dr" },
            move_tree: this.makePuzzleMoveTree(["br"], ["bqbr", "drbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "bncnaococp",
                white: "bobpcqdqeq",
            },
            marks: { 1: "ao", A: "ap", B: "bq", C: "br" },
            move_tree: this.makePuzzleMoveTree(["bq"], ["brap", "apbq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "epdqeq",
                white: "dpcqcr",
            },
            marks: { 1: "ep", A: "dn", B: "do", C: "cp" },
            move_tree: this.makePuzzleMoveTree(["do"], ["dndo", "cpdo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "doepeq",
                white: "cndnendpcqdq",
            },
            marks: { 1: "do", B: "co", C: "eo", A: "bp" },
            move_tree: this.makePuzzleMoveTree(["eo"], ["coeo", "bpeo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "dmbndnfncpdpepfp",
                white: "cobpcqdqeqfqgq",
            },
            marks: { 1: "bn", A: "cn", B: "bo", C: "bq" },
            move_tree: this.makePuzzleMoveTree(["bo"], ["cnbo", "bqbo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "enfobpcpfpdqeq",
                white: "dmdnbocodpepcqgqcr",
            },
            marks: { 1: "en", A: "em", B: "do", C: "fq" },
            move_tree: this.makePuzzleMoveTree(["do"], ["emdo", "fqdo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best defense against black 1: A, B or C.");
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
                black: "frfqcqbqfpepdp",
                white: "crbreqdqcpcocn",
            },
            marks: { 1: "fr", C: "er", A: "bp", B: "ds" },
            move_tree: this.makePuzzleMoveTree(["dsesdr"], ["bpdr", "eres"], 19, 19),
            /* cSpell:enable */
        };
    }
}
