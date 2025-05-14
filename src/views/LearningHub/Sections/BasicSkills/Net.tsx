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

export class Net extends LearningHubSection {
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
        return "net";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture in net", "Net");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture in net", "Capture in net");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If Black tries to capture the marked white stone by playing a series of ataris, White can escape. But Black can capture the stone in a 'net' by playing at A. Capture the marked stone in a net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "egehfggegfhe",
                white: "edfhgghhhfff",
            },
            marks: { triangle: "ff", A: "ee" },
            move_tree: this.makePuzzleMoveTree(["eefefdefdf"], ["effe", "feef"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gbgchdheefff",
                white: "deeedfegfggg",
            },
            marks: { triangle: "ffef" },
            move_tree: this.makePuzzleMoveTree(
                ["ge"],
                ["gffefdge", "gffegefd", "fegfhfge", "fegfgehf"],
                9,
                9,
            ),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccdfefbgcgdh",
                white: "cecfdgegfg",
            },
            marks: { triangle: "efdf" },
            move_tree: this.makePuzzleMoveTree(
                ["fe"],
                [
                    "eeffgffefddeeddd",
                    "eeffgffefddegedd",
                    "eeffgffegefd",
                    "eefffegf",
                    "ffeeedfegefdfcdd",
                    "defeffee",
                ],
                9,
                9,
            ),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gfghcidi",
                white: "bhchbi",
            },
            marks: { triangle: "dici" },
            move_tree: this.makePuzzleMoveTree(
                ["eheifi"],
                ["eheidhfi", "dheiehfifhgi", "eidhdgehfhegeffg"],
                9,
                9,
            ),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gccedecfdfegfggg",
                white: "bdbebfefffcgdg",
            },
            marks: { triangle: "dfcfdece" },
            move_tree: this.makePuzzleMoveTree(
                ["eddddc"],
                ["ddeefeedecfd", "ddeefeedfdec", "ddeeedfe", "eedddcedfdecebfc", "cdedddeeecfd"],
                9,
                9,
            ),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stone in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcbddfegfggg",
                white: "feefffcgdg",
            },
            marks: { triangle: "df" },
            move_tree: this.makePuzzleMoveTree(["cededd"], ["cfdeddcebecd", "decfbfcecdbe"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stone in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gdefbgdgchdhehgh",
                white: "bccecfdfcgegfg",
            },
            marks: { triangle: "ef" },
            move_tree: this.makePuzzleMoveTree(
                ["feeeed"],
                ["eeffgffe", "ffeeedfe", "ffeefdfegegfhegg"],
                9,
                9,
            ),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dedfbgcgbhdhfh",
                white: "cdbfcfefdgeg",
            },
            marks: { triangle: "dfde" },
            move_tree: this.makePuzzleMoveTree(
                ["ed"],
                ["ddeefeedecfdgdfcfbffgefg", "eedddcedfdecebccdbcebdbe", "ceedddeeecfffdfe"],
                9,
                9,
            ),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcfddfgfcgdggg",
                white: "cebfbgegfgchdh",
            },
            marks: { triangle: "dgcgdf" },
            move_tree: this.makePuzzleMoveTree(
                ["eededd"],
                ["deefffee", "deefeeff", "efdeddee", "cfee"],
                9,
                9,
            ),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dbccgcgddfdggg",
                white: "cecgegbhdheh",
            },
            marks: { triangle: "dgdf" },
            move_tree: this.makePuzzleMoveTree(
                ["ee"],
                ["deefffeeedfe", "efdeddeefeedecfd", "cfeedeefedfe"],
                9,
                9,
            ),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stone in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fddfbgcgbhdh",
                white: "cdbfcfdgeg",
            },
            marks: { triangle: "df" },
            move_tree: this.makePuzzleMoveTree(
                ["eededd"],
                ["deefffee", "efdeddee", "efdeeedddced"],
                9,
                9,
            ),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcfdgedfdgeggggh",
                white: "cecgfgbhdhehfh",
            },
            marks: { triangle: "egdgdf" },
            move_tree: this.makePuzzleMoveTree(["eededd"], ["deee", "efdeddee", "cfee"], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dbecgcgddfef",
                white: "decfdgeggg",
            },
            marks: { triangle: "efdf" },
            move_tree: this.makePuzzleMoveTree(
                ["feffgf"],
                ["geeeedfd", "eeffgffe", "ffeeedfe"],
                9,
                9,
            ),
        };
    }
}
