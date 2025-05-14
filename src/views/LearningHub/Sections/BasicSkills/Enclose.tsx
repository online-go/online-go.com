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

export class Enclose extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "enclose";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning enclose", "Enclose");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on enclose", "Capture by enclosing");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "You can not always capture stones by putting them in atari immediately. Sometimes you need to prepare the capture by first preventing an escape. White to play. Capture black stones by enclosing them.",
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
                black: "codoepbqeqcr",
                white: "eofodpdqgq",
            },
            marks: { cross: "er" },
            move_tree: this.makePuzzleMoveTree(["er"], ["drer"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture black stones by enclosing them.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clbncogobpdpbqdqgqdrgr",
                white: "emendocpepcqcrcs",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["eseq", "eqerfrfs", "dseq"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture black stones by enclosing them.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnbocpgpbqdqeqar",
                white: "fodpepcqbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture black stones by enclosing them.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clcmbndnbodoepfpgpbqeqcrdr",
                white: "emengneoapbpcpdpdqfqhqerfr",
            },
            move_tree: this.makePuzzleMoveTree(["hp"], ["gohp", "hocq", "gqhp"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture black stones by enclosing them.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cncodocpdqeqgqbrcrer",
                white: "gmdneneobpdpepbqcq",
            },
            move_tree: this.makePuzzleMoveTree(["cm"], [], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture black stones by enclosing them.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eoepbqdqeqfqiqbrcrgrhr",
                white: "dmhndogobpcpdpcqgqhqdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["foen", "fnfs", "aqds", "csfs"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture black stones by enclosing them.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fofpdqeqfqiqbrcrgrhr",
                white: "cngocpdpgpcqgqdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["fn"], ["enfn", "eofn", "bqds"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture black stones by enclosing them.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "coeocpdpepbqfqbrfrhrbses",
                white: "cndnbofobpfpcqeqcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["aqds", "csdq"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture black stones by enclosing them.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmbndneodpepbqcqeqfq",
                white: "enfncodohocpdqdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["gq"], ["fogq", "hqbp"], 19, 19),
        };
    }
}
