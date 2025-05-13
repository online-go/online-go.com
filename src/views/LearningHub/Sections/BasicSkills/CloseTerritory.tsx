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

export class CloseTerritory extends LearningHubSection {
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
        return "close_territory";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning close territory", "Close Territory");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on close territory", "");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black has a small territory, but White can reduce it by playing at A. Black to play. Prevent this reduction by closing the territory with one move.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "afbfcfdfdhbhdg",
                white: "aebecedeeeefegehei",
            },
            marks: { A: "di" },
            move_tree: this.makePuzzleMoveTree(["di"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cdddedfdgdcegecfgfcgdgfggg",
                white: "ccdcecfcgcbdhdbehebfhfbgeghgchdhehfhgh",
            },
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfefffgfcgggchehghci",
                white: "deeefegebfcfhfbghgbhhhbigihi",
            },
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "adbdcdcecgbhchci",
                white: "acbcccdcdddecfdfdgdhdi",
            },
            move_tree: this.makePuzzleMoveTree(["bf"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfdfefffgfcgggghbicigi",
                white: "bdcedeeefegebfhfbghgbhhhhi",
            },
            move_tree: this.makePuzzleMoveTree(["ch"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "afbfcfdfbhdhehei",
                white: "aebecedeeeefegggfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "agbgdgegbhehei",
                white: "afbfcfdfefffcgfgfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["ch"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cgdgahbhdhfhghgi",
                white: "bfcfdfagbgegfggghghhhi",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "agbgcgdgbidi",
                white: "afbfcfdfefegehei",
            },
            move_tree: this.makePuzzleMoveTree(["dh"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bfcfagahchdhbi",
                white: "aebecedeafdfdgehdiei",
            },
            move_tree: this.makePuzzleMoveTree(["cg"], ["cicg"], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bgcgdgegahehei",
                white: "afbfcfdfefffagfgfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["bh", "bi", "ch"], ["aibhchbi", "aibhbici"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Close the black territory with one move.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "aeafbfbgcgegahdhehdi",
                white: "adcdbecfdfefffdgfgfheifi",
            },
            move_tree: this.makePuzzleMoveTree(["ch", "bh", "ci", "bichci"], ["bichbhci"], 9, 9),
        };
    }
}
