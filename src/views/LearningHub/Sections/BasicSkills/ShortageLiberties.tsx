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

export class ShortageLiberties extends LearningHubSection {
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
        return "shortage-liberties";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning shortage of liberties",
            "Shortage Liberties",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on shortage of liberties",
            "Shortage of liberties",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black can put the marked stones in atari by playing at A. Next, White can connect at B, but the white stones will still be in atari. This is called 'shortage of liberties'. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "afbfagcgahai",
                white: "bgbhdhci",
            },
            marks: { triangle: "bhbg", A: "ch", B: "bi" },
            move_tree: this.makePuzzleMoveTree(["chbidi"], ["bich"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gfdgegfgdhgh",
                white: "cfcgchehfhdi",
            },
            marks: { triangle: "fheh" },
            move_tree: this.makePuzzleMoveTree(["fi", "eifigi"], ["gieifici"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfcgegfgchdi",
                white: "dgggdhehghfi",
            },
            marks: { triangle: "ehdhdg" },
            move_tree: this.makePuzzleMoveTree(["fh"], ["eici", "cifh"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cccecgdgegfgbheh",
                white: "ffggchdhfhghciei",
            },
            marks: { triangle: "cidhch" },
            move_tree: this.makePuzzleMoveTree(["bi"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cedfagbgcgch",
                white: "dgfgbhdhaici",
            },
            marks: { triangle: "aibh" },
            move_tree: this.makePuzzleMoveTree(["ah"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gfcgdgegfgchghgi",
                white: "cfbgbhdhehfhciei",
            },
            marks: { triangle: "eifhehdh" },
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gfdgegfgchci",
                white: "ggdhehghdifi",
            },
            marks: { triangle: "diehdh" },
            move_tree: this.makePuzzleMoveTree(["fh"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cebfefffbgfgchdi",
                white: "dddecfcgegggdhfh",
            },
            marks: { triangle: "cgcf" },
            move_tree: this.makePuzzleMoveTree(["df"], ["dgdf"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "geefhffgggigfhih",
                white: "dfcgeghgehghhhfi",
            },
            marks: { triangle: "hhghhg" },
            move_tree: this.makePuzzleMoveTree(["hi"], ["gihi"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edfdbecedegecfgfehfh",
                white: "eefeafbfdfffcgegbhdh",
            },
            marks: { triangle: "fffeee" },
            move_tree: this.makePuzzleMoveTree(["fg"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dgegfgggchhhhi",
                white: "cgbhdhehghfigi",
            },
            marks: { triangle: "gifigh" },
            move_tree: this.makePuzzleMoveTree(["fh"], ["dicifhei", "eidifhcieifi"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture the marked stones using a shortage of liberties for White.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "eddeefegfgchdhgh",
                white: "fdffgfggehfhcidi",
            },
            marks: { triangle: "ehfhcidi" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "fibheibibgagafcgah",
                    "fibheibibgagah",
                    "fibheibibgagai",
                    "eifigibhbgagbiaiafcgeibiah",
                    "eifigibheibibg",
                ],
                [
                    "bihheigi",
                    "bihhgihieifi",
                    "bihhgihifiei",
                    "eifigibhbgagafcgdgbfeibi",
                    "eifigibhbgagafcgeibfbicd",
                ],
                9,
                9,
            ),
        };
    }
}
