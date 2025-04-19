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

export class CaptureBlack extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10];
    }
    static section(): string {
        return "capture_black";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture", "Capture Black");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture", "Capture black stones");
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cfcgchehdi",
                white: "eedgdhei",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ci"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cgdgggbhci",
                white: "cfbgahbi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ch"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eefecgdgegfg",
                white: "edfddegeff",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdcecfefffcg",
                white: "eefegfegfg",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["df"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dcfcddfdeegg",
                white: "cceccdedde",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["db"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hfchfhghdieihi",
                white: "fcceefdhehci",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
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
                black: "fgggigdhehhhgi",
                white: "dgegchfhghdi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ei"], [], 9, 9),
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
                black: "ffcgdgegfgbhfhdiei",
                white: "gdgfggdhehghfigi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ci"], [], 9, 9),
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
                black: "gcfecfefgfcgdgggehfh",
                white: "cedebfdfegfgbhchdh",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["bg"], [], 9, 9),
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
                black: "cfeffgggigehhhgi",
                white: "eeffgfhfhgfhgh",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["eg"], [], 9, 9),
        };
    }
}
