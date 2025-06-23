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

export class BL1DoubleAtari extends LearningHubSection {
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
        return "bl1-double-atari";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning play double-atari", "4.6 Double-Atari");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on play double-atari",
            "Play double-atari",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcfegeefdg",
                white: "ffegggdh",
            },
            move_tree: this.makePuzzleMoveTree(["df"], ["eedf", "cgdf"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eedfegggfhgh",
                white: "eddeeffffg",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], ["fedg", "cfdg", "ehdg"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "edfdgddgegggfhhh",
                white: "gedfefffcgfggh",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], ["figi", "gfgi", "hggi", "dheh"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dccdcfbgcgegfgbhdh",
                white: "gcgedfefffdgggch",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], ["fheh", "dieh"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccecbdcecfbgdgbhdhbi",
                white: "bccddddedfffcgchfh",
            },
            move_tree: this.makePuzzleMoveTree(["be"], ["bfbe", "adbe", "dcbe", "cbbe"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bcccecbdcedfbgdgch",
                white: "cdddfddeefegdheh",
            },
            move_tree: this.makePuzzleMoveTree(["cf"], ["becf", "cgcf"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bdefffcgeggghgbhdh",
                white: "deeefegedfgfdgch",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], ["bgci", "cfci", "fgfh", "dieh"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgecgeghgdhfhci",
                white: "fdcfdfeffffgch",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], ["ehei", "diei", "bibh", "bgdg"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dfefffcggghgchehfhghdihi",
                white: "deeefecfgfhfbgfgbhbici",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], ["dhdg", "egdg", "eidh"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgdgebfdfefffcgfgbhehgh",
                white: "becedeeefecfgfbgggfhhh",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], ["chag", "egdg", "afdh", "giag"], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgebgcgfgahchehghdi",
                white: "bdeebfcfagdgegdhbi",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ci"],
                ["eificiaf", "eifibhaf", "bhaf", "aiaf", "fhficiaf"],
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
        return _("White to play. Play a good double-atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ecgcgdgedfffcgdgfgggbhehhhcigi",
                white: "deeefebfcfgfhfbghgchdhfhgh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eg", "ef"],
                ["fiei", "diei", "bidi", "ahdi", "ihfi", "eidi", "hifi"],
                9,
                9,
            ),
        };
    }
}
