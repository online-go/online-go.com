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

export class CorrectSide extends LearningHubSection {
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
        return "correct-side";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture stones", "Correct Side");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture stones",
            "Start capture from correct side",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gchecfdfgfegfggh",
                white: "ccefcgdgchehfhdi",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], ["fiee"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfefcgfgfh",
                white: "ffgfeggggh",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], ["dgeh"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfdfbgegfg",
                white: "efffhfdggg",
            },
            move_tree: this.makePuzzleMoveTree(["dh"], ["cgdhehfh", "cgdhcheh"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bbcbacdcecfddeeeff",
                white: "dadbbccccdddedbfcg",
            },
            move_tree: this.makePuzzleMoveTree(["cebdbe"], ["cebdadbe", "bdce"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fbdcfcfddeeecg",
                white: "ecgcddedgdfege",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cdebdb", "cdebeadbcbccda"],
                ["cdebeadbcbccbcgb", "cdebeadbdacb", "cdebeadbccgb", "ebcd"],
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
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ddedcefefffg",
                white: "ecfdgddeeedg",
            },
            move_tree: this.makePuzzleMoveTree(["df"], ["efdf"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfgfdgegfg",
                white: "cccddfbgcg",
            },
            move_tree: this.makePuzzleMoveTree(
                ["deefee", "deefffeeedfefdgehe", "deefffeeedfegefdfcgdhdgcgb"],
                [
                    "deefffeeedfefdgegdhe",
                    "deefffeeedfegefdfcgdhdgchcgb",
                    "deefffeeedfegefdfcgdgchd",
                    "deefffeeedfegefdgdfc",
                    "deefffeefeed",
                    "efde",
                ],
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
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfffdgeg",
                white: "gceffggg",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], ["dfee"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcfffgghgi",
                white: "dgegchfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], ["eieh"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcfffgdhehgh",
                white: "cfdgegchfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["gi"], ["eidi"], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "feffeggggh",
                white: "dfefcgfgfh",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], ["fieh"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture a white chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gccegeafcfbgbhch",
                white: "cccdbeeebfcgdgeg",
            },
            move_tree: this.makePuzzleMoveTree(["bd"], ["aebd"], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccecfdgeg",
                white: "dfeffgeh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cgdhch"],
                ["cgdhdichcibg", "cgdhdichbhbg", "cgdhdichbgbh", "dhcg"],
                9,
                9,
            ),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eccdfddeeegegfegfg",
                white: "ebfcddgdcedfefff",
            },
            move_tree: this.makePuzzleMoveTree(["fe"], ["eddc", "dcfe", "bdfe", "ccfe"], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cbccdddedgeg",
                white: "eecgfgdheh",
            },
            move_tree: this.makePuzzleMoveTree(["df"], ["efdf"], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "egahbhdhfhaibidi",
                white: "ccbedfagbgdgeh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["chciei"],
                ["chcicgei", "cicheifi", "cichcgei", "eifi"],
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
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccddefedfgfgg",
                white: "ddedcecfdgeg",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], ["efee"], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ddcfdfcgegbhbi",
                white: "gceeefdgchdh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fgehfh", "fgeheifhgh"],
                ["fgeheifhfigh", "ehfg"],
                9,
                9,
            ),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eddefecfdfbgdgdh",
                white: "dcbdddcebfcgch",
            },
            move_tree: this.makePuzzleMoveTree(["bh"], ["agbh"], 9, 9),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ddefbgcgdgahdhbi",
                white: "feafbfcfdfgfagegggehgh",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], ["ffee"], 9, 9),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eeffgfeggghhgi",
                white: "dfefcgfgfhgh",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], ["dgeh"], 9, 9),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gdffgfeghghh",
                white: "dfefcgfggggh",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], ["dgehdhfh", "dgehfhfi"], 9, 9),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fcgebfbgcgdgehfhbi",
                white: "cdbecfdfegfgggghfi",
            },
            move_tree: this.makePuzzleMoveTree(["dh"], ["eidh"], 9, 9),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture a black chain by putting it in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dddebfdfcgegahbhehgh",
                white: "gceeefgfdgfgchdhbi",
            },
            move_tree: this.makePuzzleMoveTree(["fh"], ["eifh"], 9, 9),
        };
    }
}
