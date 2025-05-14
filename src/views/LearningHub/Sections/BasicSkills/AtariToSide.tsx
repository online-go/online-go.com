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

export class AtariToSide extends LearningHubSection {
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
        return "atari-to-side";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning atari to side", "Atari To Side");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on atari to side",
            "Give atari towards the edge",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Driving the marked white stone to the side of the board makes it easier to capture it. Choose the point to play to push the marked white stone to the edge, A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bdbf",
                white: "ccbe",
            },
            marks: { A: "ae", B: "ce", triangle: "be" },
            move_tree: this.makePuzzleMoveTree(["ce"], ["aece"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dbfbdcfc",
                white: "ebeccecg",
            },
            marks: { A: "ea", B: "ed", triangle: "eceb" },
            move_tree: this.makePuzzleMoveTree(["ed"], ["eaed"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bccddd",
                white: "bdcecf",
            },
            marks: { A: "ad", B: "be", triangle: "bd" },
            move_tree: this.makePuzzleMoveTree(["be"], ["adbe"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dgegchdi",
                white: "fgggdheh",
            },
            marks: { A: "fh", B: "ei", triangle: "ehdh" },
            move_tree: this.makePuzzleMoveTree(["fh"], ["eifh"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "becfcgggdheh",
                white: "cdceeebfdfdg",
            },
            marks: { A: "af", B: "bg", triangle: "bf" },
            move_tree: this.makePuzzleMoveTree(["bg"], ["afbgchbd"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfcgegch",
                white: "dgfgggdh",
            },
            marks: { A: "eh", B: "di", triangle: "dhdg" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["dieheffh"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccegfh",
                white: "fggh",
            },
            marks: { triangle: "fh" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["fieh"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccefgdhfh",
                white: "ffeggggh",
            },
            marks: { triangle: "fhfg" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["fieh"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcddeecfdfffcgggdh",
                white: "bdbfefbgdgegbhch",
            },
            marks: { triangle: "dh" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["dieh"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bfdfefcgegbhfhci",
                white: "geffdgfgchdheh",
            },
            marks: { triangle: "fh" },
            move_tree: this.makePuzzleMoveTree(["gh"], ["figh"], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dbcdddcebfcgdgeg",
                white: "gcfdbedecfdfff",
            },
            marks: { triangle: "bf" },
            move_tree: this.makePuzzleMoveTree(["bg"], ["afbg"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccfbgdgdh",
                white: "dfcgegeh",
            },
            marks: { triangle: "dhdg" },
            move_tree: this.makePuzzleMoveTree(["ch"], ["dich"], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccdgegchfhgh",
                white: "fgggdhehfi",
            },
            marks: { triangle: "ghfh" },
            move_tree: this.makePuzzleMoveTree(["hh"], ["gihhhgdi"], 9, 9),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccgcddbecfdfef",
                white: "bdbfbgcgdgfg",
            },
            marks: { triangle: "be" },
            move_tree: this.makePuzzleMoveTree(["ce"], ["aece"], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gchddfefbgcgegbheh",
                white: "eecfffdgfgchdhfh",
            },
            marks: { triangle: "ehegefdf" },
            move_tree: this.makePuzzleMoveTree(["de"], ["eideddcebfbe"], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdcecfdgeg",
                white: "dfefcgdh",
            },
            marks: { triangle: "egdg" },
            move_tree: this.makePuzzleMoveTree(
                ["fgehfh", "fgeheifhgh"],
                ["fgeheifhfigh", "ehfg"],
                9,
                9,
            ),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccfdfcgeg",
                white: "eeefdgdh",
            },
            marks: { triangle: "eg" },
            move_tree: this.makePuzzleMoveTree(["fgehfh", "fgeheifhgh"], ["fgeheifhfigh"], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bfdfdggg",
                white: "bebgcg",
            },
            marks: { triangle: "bf" },
            move_tree: this.makePuzzleMoveTree(["cf"], ["afcf"], 9, 9),
        };
    }
}
