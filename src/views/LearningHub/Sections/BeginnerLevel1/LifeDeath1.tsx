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

export class BL1LifeDeath1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08];
    }
    static section(): string {
        return "bl1-life-death-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning make second eye", "4.26 Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on make second eye",
            "Make second eye",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "A group needs two eyes to live. White to play. Make the white group alive by creating a second eye and prevent Black from making this eye false.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bebfbgcdchdddhedehfdfhgeghhehfhg",
                white: "dedgeeefegfefggfgg",
            },
            marks: { cross: "cf" },
            move_tree: this.makePuzzleMoveTree(["cfcecg"], ["cecf", "cgcf"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "By playing at point A, White makes two eyes in the corner. If Black plays at A, the white group is dead. This point A is called the 'vital point'. White to play. Make the white group alive by playing at the vital point.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "afbecdcfdfdgdiehfg",
                white: "bfbgbicgchdh",
            },
            marks: { A: "ah" },
            move_tree: this.makePuzzleMoveTree(["ah"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gfhfiffgfhfi",
                white: "hgigghhi",
            },
            move_tree: this.makePuzzleMoveTree(["ihgggi"], ["ggih", "giih"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "deeefecfgfcgggchghci",
                white: "efdgfgdhehfhdi",
            },
            move_tree: this.makePuzzleMoveTree(["fiffdf"], ["fffi", "dffi", "gifi"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdddedfdgdbehebfhfbghgchdhehfhgh",
                white: "deeefecfefdgegfggg",
            },
            move_tree: this.makePuzzleMoveTree(["gfcecg"], ["cegf", "gegf", "cggf"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdddedfdgdbehebfhfbghgchdhehfhgh",
                white: "deeefecfgfdgegfg",
            },
            move_tree: this.makePuzzleMoveTree(["ef"], ["ggef", "geef", "cgef", "ceef"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "deeefecfgfcgggchghcigi",
                white: "effgdhehfhdifi",
            },
            move_tree: this.makePuzzleMoveTree(["dgffdf"], ["dfdg", "ffdg"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ffgfhfiffgfhfi",
                white: "gghgghih",
            },
            move_tree: this.makePuzzleMoveTree(["higiig"], ["gihi", "ighi"], 9, 9),
        };
    }
}
