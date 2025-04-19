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

import { PuzzleConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class BothAtari extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10];
    }
    static section(): string {
        return "both_atari";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning both atari", "Both Atari");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on both atari",
            "Capture stones in atari",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ceeedfffegeh",
                white: "eddefegffg",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fgggigdhehhhgi",
                white: "dgegchfhghdi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ei"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ffcgdgegfgbhfhdiei",
                white: "gdgfggdhehghfigi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ci"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "efffcgdgggehfh",
                white: "eefecfdfgfeg",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["fg"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcfecfefgfcgdgggehfh",
                white: "cedebfdfegfgbhchdh",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["bg"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cfeffgggigehhhgi",
                white: "eeffgfhfhgfhgh",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["eg"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eedfffdgehdi",
                white: "decfefcgdh",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["eg"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "becfagbgchdhehciei",
                white: "cgdgegahbhfhbifi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["di"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccfcgggbhdhehfh",
                white: "dgegfgchghdifi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ei"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eecfdfcgegchehei",
                white: "efffdgfgdhfhdi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}
