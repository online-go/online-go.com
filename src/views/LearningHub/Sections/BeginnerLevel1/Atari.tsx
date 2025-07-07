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

export class BL1Atari extends LearningHubSection {
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
            Page19,
            Page20,
            Page21,
            Page22,
            Page23,
            Page24,
        ];
    }
    static section(): string {
        return "bl1-atari";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning atari", "Atari");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on atari", "Play the correct atari");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "You can capture the marked black stones, but you need to start correctly, by giving atari at correct side. Try also to calculate the next moves, before you play. White to play. Capture the marked black stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hfdgegfghgchghhh",
                white: "dfefffgfcgggfh",
            },
            marks: { triangle: "dgegfg" },
            move_tree: this.makePuzzleMoveTree(["dh"], ["ehdh"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture the marked black stones by giving atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccdfefhffggg",
                white: "eecfffegeh",
            },
            marks: { triangle: "dfef" },
            move_tree: this.makePuzzleMoveTree(
                ["dedgcgdhch", "dedgcgdhdichbh", "dedgdhcgbg"],
                [
                    "dedgdhcgchbgbffe",
                    "dedgdhcgchbgbhfe",
                    "dgdecedd",
                    "dgdeddcecdbe",
                    "dgdeddcebecd",
                ],
                9,
                9,
            ),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gdfeheefcgdgfggghg",
                white: "bfffgfbgegchdheh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eedfde"],
                ["eedfcfdedded", "eedfcfdeedhf", "eedfcfdeceed", "dfee"],
                9,
                9,
            ),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdcedfefdgfghgfh",
                white: "deeebfcfffegeh",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "dhcgbgchbhcibi",
                    "dhcgbgchcibhah",
                    "dhcgbgchcibhbiahag",
                    "dhcgchbgbh",
                    "dhcgchbgagbhbi",
                    "dhcgchbgagbhahbici",
                ],
                [
                    "dhcgbgchbhcidiei",
                    "dhcgbgchcibhbiahaidi",
                    "dhcgchbgagbhahbiaiaf",
                    "cgdhchei",
                    "cgdhdiei",
                ],
                9,
                9,
            ),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cddedfefffbgcgbhdhehci",
                white: "gcddcecfgfdgegfghgfh",
            },
            move_tree: this.makePuzzleMoveTree(["fe"], ["eefefded", "eefeedbe", "eefegeed"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "becefegehedfefcgdgfghgfh",
                white: "cccddebfffgfbgegchdheh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eecfbd", "eecfaebdbc", "eecfaebdadbcbb"],
                ["eecfaebdadbcacbbcbhf", "eecfaebdadbcacbbabhf", "cfee"],
                9,
                9,
            ),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgdhebfcfffgfdgeg",
                white: "beceafbgcgfgdheh",
            },
            move_tree: this.makePuzzleMoveTree(["ef"], ["dfef"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bdedbefegecfefcgdg",
                white: "eebfffbgegfgchdh",
            },
            move_tree: this.makePuzzleMoveTree(["ce"], ["dfce"], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "efffhfcgdggggheifi",
                white: "dedfbgegfgdhehfh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["chcfcebfbe", "chcfcebfafbebd", "chcfbfcecdbebd", "chcfbfcecdbeaebdbc"],
                [
                    "chcfcebfafbeaebd",
                    "chcfbfcecdbeaebdadbc",
                    "chcfbfcebecd",
                    "cfchbhdi",
                    "cfchcidi",
                    "cfchdici",
                ],
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
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fcgddegebfdfcgbhch",
                white: "ccedceeeefdgfgdh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cfddcddcecdbebcbbb", "cfdddc"],
                [
                    "cfddcddcecdbebcbdabbbcac",
                    "cfddcddcecdbebcbdabbcabc",
                    "cfddcddcecdbcbeb",
                    "cfddcddcdbec",
                    "ddcf",
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
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgeefffggeh",
                white: "fegfhfhggh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gdhehd"],
                ["gdheiehdfdhc", "gdheiehdhcfd", "hegd"],
                9,
                9,
            ),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Capture as many stones as possible by putting a black chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fdfeffcgggdhehfh",
                white: "deeedgegfgghhh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gfhghf"],
                ["gfhgighfhege", "gfhgighfifhe", "hggf"],
                9,
                9,
            ),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfdfdg",
                white: "bebfcg",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bgchbhdheh"],
                ["bgchbhdhcieh", "bgchdhbh", "chbg"],
                9,
                9,
            ),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfffegdh",
                white: "ceeffggg",
            },
            move_tree: this.makePuzzleMoveTree(["eedfde"], ["eedfdgde", "dfee"], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ddcegecfffdgfgeh",
                white: "cccdfddefedfeg",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], ["efee"], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfffcgeg",
                white: "ceeffggg",
            },
            move_tree: this.makePuzzleMoveTree(["eedfde"], ["eedfdgde", "dfee"], 9, 9),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dccdcecfcgdh",
                white: "bfbgdgahchbi",
            },
            move_tree: this.makePuzzleMoveTree(["eg"], ["dfeg"], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcdeeecfcg",
                white: "cedfefffhf",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cdbebdbfbg"],
                [
                    "cdbebdbfaebgchbhbidhahdgcidi",
                    "cdbebfbdbcccddbb",
                    "cdbebfbdbcccbbdd",
                    "cdbebfbdbcccaddd",
                    "cdbebfbdccbccbbb",
                    "cdbebfbdccbcbbcbdbdddcedfefdgegdgfgghehd",
                    "becd",
                ],
                9,
                9,
            ),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfdfcg",
                white: "gfdgfg",
            },
            move_tree: this.makePuzzleMoveTree(
                ["egdhehchbh"],
                ["egdhehchdibhbgefahfheifi", "egdhcheh", "dheg"],
                9,
                9,
            ),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dedfgffgfh",
                white: "ecgcffgghg",
            },
            move_tree: this.makePuzzleMoveTree(
                ["feefeeegdgehdh", "feefeeegdgeheidhch", "feefeeegehdgcgdhch", "feefeg"],
                [
                    "feefeeegdgeheidhdichcggehfhe",
                    "feefeeegehdgdhcgcfgehfhe",
                    "feefeeegehdgdhcgchgehfhe",
                    "effegefd",
                    "effeeefd",
                ],
                9,
                9,
            ),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edbecedeafagcgdgggbhchghcifigi",
                white: "eebfcfdfgfhfbgegfghgdhehfhdiei",
            },
            move_tree: this.makePuzzleMoveTree(["ff"], ["efff", "feffefgd"], 9, 9),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ddcecfeg",
                white: "dbcccdde",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "eedfdg",
                    "eedfefdgdhcgbgchbh",
                    "eedfefdgdhcgbgchcibhah",
                    "eedfefdgdhcgbgchcibhbi",
                ],
                [
                    "eedfefdgdhcgchbgbhbf",
                    "eedfefdgdhcgchbgbfaf",
                    "eedfefdgcgdhched",
                    "eedfefdgcgdhehed",
                    "dfee",
                ],
                9,
                9,
            ),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cdcfdfdg",
                white: "cgegdhfh",
            },
            move_tree: this.makePuzzleMoveTree(
                ["chbgbhbfbe", "chbgbhbfagbebdahaiafceaheheiag"],
                [
                    "chbgbhbfagbebdahaiafahci",
                    "chbgbhbfagbecebdbcahaiafahci",
                    "chbgbhbfagbecebdbcahaiafadah",
                    "chbgbfbh",
                    "bgch",
                ],
                9,
                9,
            ),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Capture as many stones as possible by putting a white chain in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ccddefdg",
                white: "fedfegfg",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cfdeeecebe"],
                ["decf", "cfdeeececdbebfed", "cfdeeececdbebdcg", "cfdeceee"],
                9,
                9,
            ),
        };
    }
}
