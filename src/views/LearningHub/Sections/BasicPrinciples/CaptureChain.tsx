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

export class CaptureChain extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "capture_chain";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture chain", "Capture Chain");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture chain",
            "Capture a chain of stones",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. The marked white chain is in atari. Capture these stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dcecfccddeeefe",
                white: "ddedfdcgdgeggg",
            },
            marks: { triangle: "ddedfd" },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["gd"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dbfbecedee",
                white: "ebgbfcfdfe",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ea"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dadbeb",
                white: "eaccdc",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["fa"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfefcgegggfh",
                white: "cecfdgchehei",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["dh"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dddebfcfefff",
                white: "eedfbgcgegfg",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["dg"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "efdgbhchbi",
                white: "decfbgahai",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ag"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                /* cspell:disable-next-line */
                black: "cfcgchehdi",
                /* cspell:disable-next-line */
                white: "eedgdhei",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ci"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                /* cspell:disable-next-line */
                black: "cgdgggbhci",
                /* cspell:disable-next-line */
                white: "cfbgahbi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ch"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                /* cspell:disable-next-line */
                black: "eefecgdgegfg",
                /* cspell:disable-next-line */
                white: "edfddegeff",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                /* cspell:disable-next-line */
                black: "cdcecfefffcg",
                /* cspell:disable-next-line */
                white: "eefegfegfg",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["df"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                /* cspell:disable-next-line */
                black: "dcfcddfdeegg",
                /* cspell:disable-next-line */
                white: "cceccdedde",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["db"], [], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                /* cspell:disable-next-line */
                black: "hfchfhghdieihi",
                /* cspell:disable-next-line */
                white: "fcceefdhehci",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): GobanConfig {
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

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): GobanConfig {
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

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): GobanConfig {
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

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Both players are in atari. Capture one or more black stones.");
    }
    config(): GobanConfig {
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
