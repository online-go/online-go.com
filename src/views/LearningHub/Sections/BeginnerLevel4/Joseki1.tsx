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

export class BL4Joseki1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-joseki-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning joseki 1", "Joseki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on joseki 1", "Play joseki");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White plays a kakari at 1 and Black plays a pincer at 2. White can jump to the center or jump into the corner at 3. In this joseki Black separates White's 1 and 3. Play this joseki with White, starting at 3.",
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
                black: "dphq",
                white: "fq",
            },
            marks: {
                1: "fq",
                2: "hq",
                3: "cq",
                4: "dq",
                5: "cp",
                6: "do",
                7: "dr",
                8: "er",
                9: "cr",
                10: "eq",
                11: "cn",
            },
            move_tree: this.makePuzzleMoveTree(["cqdqcpdodrercreqcn"], [], 19, 19),
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
                black: "dphq",
                white: "fqcq",
            },
            marks: {
                1: "fq",
                2: "hq",
                3: "cq",
                4: "dq",
                5: "cp",
                6: "do",
                7: "dr",
                8: "er",
                9: "cr",
                10: "eq",
                11: "cn",
            },
            move_tree: this.makePuzzleMoveTree(["dqcpdodrercreqcn"], [], 19, 19),
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
            "Playing 1 at the head of the two white stones is in this case not good. White can threaten with 2 to connect underneath and if Black prevents this with 3, White can cut the three black stones with 4. Play this deviation with White.",
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
                black: "codpdqhq",
                white: "cpcqfq",
            },
            marks: {
                1: "co",
                2: "cr",
                3: "dr",
                4: "do",
                5: "cn",
                6: "ep",
                7: "fr",
                8: "er",
            },
            move_tree: this.makePuzzleMoveTree(["crdrdocnepfrer"], [], 19, 19),
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
            "In this joseki, White jumps into the corner with 3 and Black blocks with 4. This joseki divides the corner between Black and White. Play this joseki with White.",
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
                black: "cpdn",
                white: "ep",
            },
            marks: {
                1: "ep",
                2: "dn",
                3: "cq",
                4: "bq",
                5: "dq",
                6: "bo",
                7: "iq",
            },
            move_tree: this.makePuzzleMoveTree(["cqbqdqboiq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
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
                black: "cpdn",
                white: "epcq",
            },
            marks: {
                1: "ep",
                2: "dn",
                3: "cq",
                4: "bq",
                5: "dq",
                6: "bo",
                7: "iq",
            },
            move_tree: this.makePuzzleMoveTree(["bqdqboiq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cldocpcqbr",
                white: "fpdqcrer",
            },
            marks: { A: "bq", B: "bs", C: "cs", 1: "br" },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cqfqdr",
                white: "dpdqhq",
            },
            marks: { A: "cp", B: "fp", C: "er", 1: "dr" },
            move_tree: this.makePuzzleMoveTree(["er"], [], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fqdr",
                white: "dphq",
            },
            marks: { A: "fp", B: "cq", C: "er", 1: "dr" },
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
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cpcqeqfqdr",
                white: "dodpdqhqer",
            },
            marks: { A: "co", B: "fo", C: "cr", 1: "eq" },
            move_tree: this.makePuzzleMoveTree(["cr"], [], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "focqfq",
                white: "dpdqhq",
            },
            marks: { A: "dn", B: "cp", C: "fp", 1: "fo" },
            move_tree: this.makePuzzleMoveTree(["cp"], [], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dmfpdqcrer",
                white: "cldocpcq",
            },
            marks: { A: "dl", B: "cm", C: "cn", 1: "dm" },
            move_tree: this.makePuzzleMoveTree(["cm"], [], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cocpcqfq",
                white: "dodpdqhq",
            },
            marks: { A: "cn", B: "fp", C: "cr", 1: "co" },
            move_tree: this.makePuzzleMoveTree(["cn"], [], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cncpcqfq",
                white: "dodpdqhq",
            },
            marks: { A: "dn", B: "co", C: "cr", 1: "cn" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cododpdqhqer",
                white: "cpcqfqcrdr",
            },
            marks: { A: "bo", B: "eq", C: "fr", 1: "co" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fpdqbrcr",
                white: "docpcq",
            },
            marks: { A: "cl", B: "bq", C: "hq", 1: "br" },
            move_tree: this.makePuzzleMoveTree(["cl"], [], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "codpepdqhqdr",
                white: "docpcqfqcr",
            },
            marks: { A: "cn", B: "bo", C: "fp", 1: "ep" },
            move_tree: this.makePuzzleMoveTree(["cn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
