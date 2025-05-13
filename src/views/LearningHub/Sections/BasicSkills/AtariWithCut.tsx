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

export class AtariWithCut extends LearningHubSection {
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
        return "atari-with-cut";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning atari with cut", "Atari with Cut");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on atari with cut",
            "Put in atari by cutting",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. White can connect the marked stones to the other white stones and escape from being captured. Prevent this by cutting and capture the marked stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfffcgfgdhfhei",
                white: "dbcdcedfdgegeh",
            },
            marks: { triangle: "dfdgegeh" },
            move_tree: this.makePuzzleMoveTree(["deefee"], ["efde"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "deeefegecfgfcgeg",
                white: "cdcedfefffggehgh",
            },
            move_tree: this.makePuzzleMoveTree(["fgdgdh"], ["dgfg"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cedebfcgggbhdhehfh",
                white: "gcgdcfdfgfhfdgegfg",
            },
            move_tree: this.makePuzzleMoveTree(["ffefee"], ["efff"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cebfffbgfgchdheh",
                white: "gcfegecfefcgdgeg",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ccegdhdi",
                white: "fffgehei",
            },
            move_tree: this.makePuzzleMoveTree(["fhfigi"], ["fifh"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cddebfcgdg",
                white: "fecfdfegfg",
            },
            move_tree: this.makePuzzleMoveTree(["efcebe"], ["ceef"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cedeeebfffcg",
                white: "cfdfefhffggg",
            },
            move_tree: this.makePuzzleMoveTree(["egdgdh"], ["dgeg"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cdeefecfdgeg",
                white: "gcgedfefgffg",
            },
            move_tree: this.makePuzzleMoveTree(["ffdedd"], ["deff"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dgegfhei",
                white: "cfcgdheh",
            },
            move_tree: this.makePuzzleMoveTree(["ch"], ["dich"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gdcedeeefecfgfggehfh",
                white: "bdcdbebfdfefffbgcgfg",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], ["egdg"], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfffdgehfhfi",
                white: "cccecfcgdhdiei",
            },
            move_tree: this.makePuzzleMoveTree(["chcibi"], ["cich"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fecfcgdgggehfh",
                white: "dbdccededfegfg",
            },
            move_tree: this.makePuzzleMoveTree(["efffgf"], ["ffef"], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "eefedfgfggchghdieifi",
                white: "cdcecfefffcgfgdhehfh",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], [], 9, 9),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcdffffgchfhdiei",
                white: "dccdcecfcgegdheh",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], ["efdg"], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cddeeefecfgffg",
                white: "dfefffbgcggghg",
            },
            move_tree: this.makePuzzleMoveTree(["dgegeh"], ["egdg"], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "becfdfegfggg",
                white: "ccbfcgdgehfh",
            },
            move_tree: this.makePuzzleMoveTree(["bg"], ["afbg", "dhbhchbgghci"], 9, 9),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cdddcebfbgcgdgfg",
                white: "bcdcedbedeeecfdf",
            },
            move_tree: this.makePuzzleMoveTree(["bd"], ["aebd"], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Prevent White from connecting and capture one or more white stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gehfcgeggghgfh",
                white: "ecgchceeheffgf",
            },
            move_tree: this.makePuzzleMoveTree(["hdgdie"], ["iehd", "fegdfdfc", "effe"], 9, 9),
        };
    }
}
