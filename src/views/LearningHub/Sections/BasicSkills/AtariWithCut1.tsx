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

export class AtariWithCut1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "atari-with-cut1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning atari with cut", "Atari with Cut 1");
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfffcgfgdhfhei",
                white: "dbcdcedfdgegeh",
            },
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
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
            "Black to play. Prevent white from connecting and capture one or more white stones.",
        );
    }
    config(): PuzzleConfig {
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
