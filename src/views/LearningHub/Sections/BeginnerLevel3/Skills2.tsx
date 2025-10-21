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

export class BL3Skills2 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10];
    }
    static section(): string {
        return "bl3-skills-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning efficiency", "Skills");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on efficiency", "Efficiency");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you can capture stones, you should do that in the most efficient way, so that you gain the most profit. Black can capture the two white stones by playing at A, B or C. But only one of the three is efficient. The other two moves have a disadvantage. If Black plays at A or B, the captured white stones still have influence (aji). White can later play at C and get some points in the corner. First, play at A or B to see what happens. Finally, make the most efficient move.",
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
                black: "bqcocqdodp",
                white: "bpcpcrdqeq",
            },
            marks: { A: "bo", B: "ap", C: "br" },
            move_tree: this.makePuzzleMoveTree(["brbobn"], ["bobr", "apbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "bncododpdqcrdrbs",
                white: "bmcmcnbocpcqbr",
            },
            marks: { A: "an", B: "bp", C: "bq" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["anbp", "bqbp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "cocpdqeqcr",
                white: "cnbododpcq",
            },
            marks: { A: "bp", B: "bq", C: "br" },
            move_tree: this.makePuzzleMoveTree(["bq"], ["bpbq", "brbq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "cpdpdqcrercs",
                white: "epcqeqbrdrfrds",
            },
            marks: { A: "bp", B: "bq", C: "es" },
            move_tree: this.makePuzzleMoveTree(["es"], ["bqes", "bpes"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "bmcmcnbo",
                white: "anbncododq",
            },
            marks: { A: "am", B: "ao", C: "bp" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["aobp", "ambp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "cmemdncoeocpdpbqeqfqdr",
                white: "cldldmcnbobpepfpcqdq",
            },
            marks: { A: "bm", B: "bn", C: "cr" },
            move_tree: this.makePuzzleMoveTree(["bn"], ["crbm", "bmbn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "bodocpdpeqfqgq",
                white: "cobpcqdqerfr",
            },
            marks: { A: "bn", B: "cn", C: "bq" },
            move_tree: this.makePuzzleMoveTree(["bq"], ["bnbq", "cnbq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "bmcmcnbobpcpcqbr",
                white: "bncodoapdpbqdqcrdr",
            },
            marks: { A: "an", B: "aq", C: "bs" },
            move_tree: this.makePuzzleMoveTree(["aq"], ["anbs", "bsao"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "bnaocododpcqcr",
                white: "bobpcpepdqfqbrdr",
            },
            marks: { A: "ap", B: "bq", C: "bs" },
            move_tree: this.makePuzzleMoveTree(["bq"], ["apbq", "bsbq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best and most efficient play, A, B or C.");
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
                black: "cmcododpbqcqcr",
                white: "bpcpepdqfqbrdr",
            },
            marks: { A: "bo", B: "aq", C: "bs" },
            move_tree: this.makePuzzleMoveTree(["bs"], ["aqcs", "bocs"], 19, 19),
            /* cSpell:enable */
        };
    }
}
