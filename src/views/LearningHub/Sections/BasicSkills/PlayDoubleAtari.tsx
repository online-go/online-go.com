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

export class PlayDoubleAtari extends LearningHubSection {
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
        return "play_double_atari";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning play double atari", "Play Double-Atari");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on play double atari",
            "Put two chains in atari",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White can put both marked stones in atari with one stone. This is called 'double-atari'. Black can only defend one of the stones. Play double-atari on the marked stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccfecfefdg",
                white: "geffeggg",
            },
            marks: { triangle: "effe", cross: "ee" },
            move_tree: this.makePuzzleMoveTree(["ee"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcefdgfghgchdhgh",
                white: "dedfbgcgegehfh",
            },
            marks: { triangle: "fgef" },
            move_tree: this.makePuzzleMoveTree(["ff"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccgcdegeefff",
                white: "cedfgfegfg",
            },
            marks: { triangle: "ffefde" },
            move_tree: this.makePuzzleMoveTree(["ee"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcbegebfcgggdhci",
                white: "ccbdaececfdgeg",
            },
            marks: { triangle: "cgbfbe" },
            move_tree: this.makePuzzleMoveTree(["bg"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgdffegggehfi",
                white: "eeefdgdhdiei",
            },
            marks: { triangle: "fieheg" },
            move_tree: this.makePuzzleMoveTree(["fh"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fceddegecfdggg",
                white: "ebccecddbece",
            },
            marks: { triangle: "deed" },
            move_tree: this.makePuzzleMoveTree(["ee"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgedfefegfhgi",
                white: "cecfdgcheheifi",
            },
            marks: { triangle: "gifh" },
            move_tree: this.makePuzzleMoveTree(["gh"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hegfdgegfg",
                white: "hdgedfefff",
            },
            marks: { triangle: "gfhe" },
            move_tree: this.makePuzzleMoveTree(["hf"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdeddefebfcfgf",
                white: "eedfefffbgcggg",
            },
            marks: { triangle: "gffe" },
            move_tree: this.makePuzzleMoveTree(["ge"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "eccdeddecfcgeg",
                white: "gbgcfdeedfffdg",
            },
            marks: { triangle: "dgdfee" },
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bfdfbgcgdgegfh",
                white: "cedecfeffgehgh",
            },
            marks: { triangle: "fgef" },
            move_tree: this.makePuzzleMoveTree(["ff"], [], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fdgdeehedfdgeh",
                white: "fegeefhfegggfh",
            },
            marks: { triangle: "egefgefe" },
            move_tree: this.makePuzzleMoveTree(["ff"], [], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "efffgfdggghh",
                white: "hfegfghgghih",
            },
            marks: { triangle: "ghfgeg" },
            move_tree: this.makePuzzleMoveTree(["fh"], [], 9, 9),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "efffgfdghg",
                white: "egggdhfhhh",
            },
            marks: { triangle: "ggeg" },
            move_tree: this.makePuzzleMoveTree(["fg"], [], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "efffgfeghgih",
                white: "dgfgggchehhh",
            },
            marks: { triangle: "hhggfg" },
            move_tree: this.makePuzzleMoveTree(["gh"], [], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "efffgfhfeghgih",
                white: "dgfgggigchehhh",
            },
            marks: { triangle: "hhggfg" },
            move_tree: this.makePuzzleMoveTree(["gh"], [], 9, 9),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfhfdgfgggeh",
                white: "defeheefgfeg",
            },
            marks: { triangle: "eggfef" },
            move_tree: this.makePuzzleMoveTree(["ff"], [], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play double-atari on the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "deeefedfgfbgcgbh",
                white: "efffdggghgchfhdi",
            },
            marks: { triangle: "dgffef" },
            move_tree: this.makePuzzleMoveTree(["eg"], [], 9, 9),
        };
    }
}
