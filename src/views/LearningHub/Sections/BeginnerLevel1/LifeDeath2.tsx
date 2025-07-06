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

export class BL1LifeDeath2 extends LearningHubSection {
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
        return "bl1-life-death-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning prevent second eye", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on prevent second eye",
            "Prevent second eye",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cgdgegchehfhdi",
                white: "bfcfdfefbgfgggbhghbigi",
            },
            move_tree: this.makePuzzleMoveTree(["fi"], ["cifi", "eifi"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dgegfgfhgheigi",
                white: "cfdfefffcggghgchhhci",
            },
            move_tree: this.makePuzzleMoveTree(["dh"], ["didh", "hidh", "ehdh"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dgegfgdhfhghgi",
                white: "cfdfefffcggghgchhhci",
            },
            move_tree: this.makePuzzleMoveTree(["ei"], ["diei", "hiei", "fiei", "ehei"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dgegfgdhgheigi",
                white: "cfdfefffcggghgchhhci",
            },
            move_tree: this.makePuzzleMoveTree(["fh"], ["hifh", "difh", "ehfh", "fifh"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gghgigghhi",
                white: "ffgfhfiffgfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["ih"], ["giih", "hhih", "iiih"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ggigghihhi",
                white: "ffgfhfiffgfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["hg"], ["gihg", "hhhg"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ggghihgihi",
                white: "ffgfhffgfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["hg"], ["ighg", "hhhg", "ifhg"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "igghihgihi",
                white: "ffgfhfiffgfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["hg"], ["gghg", "hhhg"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gghgfhghih",
                white: "gfhfifegfgehfi",
            },
            move_tree: this.makePuzzleMoveTree(
                ["hi"],
                ["gihiigeigifi", "gihiigeifigi", "gihiigeidifi", "gihieiig"],
                9,
                9,
            ),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "deeefeefgfdgegfg",
                white: "cdddedfdgdbehebfhfbghgchdhehfhgh",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "cf",
                    "gecfgg",
                    "gecfcgcegg",
                    "gecfcecggg",
                    "ggcfge",
                    "ggcfcgcege",
                    "ggcfcecgge",
                    "cgcfce",
                    "cgcfgggece",
                    "cgcfgeggce",
                ],
                [
                    "dfcfcecggegg",
                    "dfcfcecgggge",
                    "dfcfcgceggge",
                    "dfcfcgcegegg",
                    "dfcfgeggcecg",
                    "dfcfgeggcgce",
                    "dfcfgggecgce",
                    "dfcfgggececg",
                ],
                9,
                9,
            ),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hgghhhgiii",
                white: "ffhfifggfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["ig"], ["ihig"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent a second eye and capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gghgigihhi",
                white: "ffgfhfiffgfhfi",
            },
            move_tree: this.makePuzzleMoveTree(["gh"], ["gigh", "hhgh"], 9, 9),
        };
    }
}
