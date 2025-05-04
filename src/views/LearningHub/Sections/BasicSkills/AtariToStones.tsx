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

export class AtariToStones extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "atari-to-stones";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning atari to stones", "Atari to Stones");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on atari to stones",
            "Atari towards your own stones",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Driving the marked stones towards your own stones helps you capture these stones. Put the marked stones in atari.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "deeegecffffg",
                white: "cdfdcefedfef",
            },
            marks: { triangle: "dfef" },
            move_tree: this.makePuzzleMoveTree(["dg"], ["egdgdhcgbgbf"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Put in atari towards your own stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "efffgfdgggdhdi",
                white: "cfdfcgegfgchci",
            },
            move_tree: this.makePuzzleMoveTree(["fh"], ["ehfheifi"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Put in atari towards your own stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cefecfefdg",
                white: "ccdedfegfg",
            },
            move_tree: this.makePuzzleMoveTree(["dd"], ["eedd"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Put in atari towards your own stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cdcfffdgeg",
                white: "dfefcgfggg",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], ["deeeedfe"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Put in atari towards your own stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfdgggehfh",
                white: "gehfegfghg",
            },
            move_tree: this.makePuzzleMoveTree(["ffefee"], ["effffegf"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Put in atari towards your own stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfefffcgggfh",
                white: "gdhfegfgghhh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ehdgdh", "ehdgdfdhch", "ehdgdfdhdichbh"],
                ["ehdgdfdhdichcibh", "dgeh"],
                9,
                9,
            ),
        };
    }
}
