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

import { PuzzleConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class PlayDoubleAtari1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "play_double_atari_1";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning play double atari 1",
            "Play double-atari 1",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on play double atari 1",
            "Give double atari",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play double-atari on the marked stones.");
    }
    config(): PuzzleConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccfecfefdg",
                white: "geffeggg",
            },
            marks: { triangle: "effe" },
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
    config(): PuzzleConfig {
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
    config(): PuzzleConfig {
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
    config(): PuzzleConfig {
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
    config(): PuzzleConfig {
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
    config(): PuzzleConfig {
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
    config(): PuzzleConfig {
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
    config(): PuzzleConfig {
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
    config(): PuzzleConfig {
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
