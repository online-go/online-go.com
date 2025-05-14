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

export class FalseEye extends LearningHubSection {
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
        return "false-eye";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning make eye false", "False Eye");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on make eye false",
            "Make or prevent false eye",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black has two eyes, but the eye at A is not safe. White to play. Make the eye at A false, capturing the black group.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fhghhhihdieigi",
                white: "egfggghgigchdh",
            },
            marks: { A: "fi", cross: "eh" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["cieh"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ceahbhdhehciei",
                white: "bgcgdgegggfh",
            },
            marks: { A: "di" },
            move_tree: this.makePuzzleMoveTree(["ch"], ["fich", "agch"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccfhghhhihdieigi",
                white: "gehfiffgggchdh",
            },
            marks: { A: "fi" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["cieh"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcahbhchdhcieifi",
                white: "cebgcgegfhghgi",
            },
            marks: { A: "di" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["ageh", "dgeh"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ahbhchdhehdifigi",
                white: "bgcgdgegggghbi",
            },
            marks: { A: "ei" },
            move_tree: this.makePuzzleMoveTree(["fh"], ["hifh", "agfh"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcafbgahbhchdh",
                white: "bdcecgdgegeh",
            },
            marks: { A: "ag" },
            move_tree: this.makePuzzleMoveTree(["bf"], ["dibf"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "afbfbgbhchbidieifi",
                white: "bececfcgegggahgh",
            },
            marks: { A: "ci" },
            move_tree: this.makePuzzleMoveTree(["dh"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ebfchddfcgegchdhehciei",
                white: "ddeebfcfffbgfgbhfhbi",
            },
            marks: { A: "dg" },
            move_tree: this.makePuzzleMoveTree(["ef"], ["deef"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcahbhdhehciei",
                white: "dfefbgcgfgfh",
            },
            marks: { A: "bi" },
            move_tree: this.makePuzzleMoveTree(["ch"], ["bich", "dgch"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dccddgegahbhchehcidi",
                white: "febfdfefbgfgfheifi",
            },
            marks: { A: "dh" },
            move_tree: this.makePuzzleMoveTree(["cg"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ecgdahbhdhehfhei",
                white: "cfbgdgegfggggh",
            },
            marks: { A: "bi" },
            move_tree: this.makePuzzleMoveTree(["ch"], ["cgch", "gich"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false capturing the black group.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgdcedebfdfgfbgcgbhdhbicidi",
                white: "ecbdcdddbeeeafefagegahehei",
            },
            marks: { A: "cf" },
            move_tree: this.makePuzzleMoveTree(["dg"], [], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent Black from making a white eye false.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "deeegecfffbgggbhghbieifigi",
                white: "ebccgcdfefdgfgchehfhcidi",
            },
            move_tree: this.makePuzzleMoveTree(["cg"], [], 9, 9),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent Black from making a white eye false.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bebgcgdgehfh",
                white: "ahbhchbidi",
            },
            move_tree: this.makePuzzleMoveTree(["dh"], [], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent Black from making a white eye false.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ddedcefecfffbgfgbhfhbi",
                white: "dedfcgegchdhehciei",
            },
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent Black from making a white eye false.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bfffcgdgegfhdieifi",
                white: "ecgdbgahchdhehbi",
            },
            move_tree: this.makePuzzleMoveTree(["ci"], ["agci"], 9, 9),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent Black from making a white eye false.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cfffbgdgegfhfi",
                white: "ahchdhehbiei",
            },
            move_tree: this.makePuzzleMoveTree(["bh"], ["cibh"], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent Black from making a white eye false.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ddedfdcegecfgfbgggbhfhghcidi",
                white: "ebfbgchcdeeedfffcgegfgdheh",
            },
            move_tree: this.makePuzzleMoveTree(["ch"], ["fech"], 9, 9),
        };
    }
}
