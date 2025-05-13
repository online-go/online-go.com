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

export class Ladder extends LearningHubSection {
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
        return "ladder";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture in ladder 1", "Ladder");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture in ladder",
            "Capture in a ladder",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. The marked chain has only two liberties. By repeatedly playing at the head of the white chain, Black can capture the marked stones. This is called a 'ladder'. Black should prevent White from creating three liberties. Capture the marked stones in a ladder.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecfcddgdeeheffgg",
                white: "edfdfegegfhf",
            },
            marks: { triangle: "hfgfgefefded" },
            move_tree: this.makePuzzleMoveTree(["ifhghh", "hg"], ["ifhgighh"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecfcddgdeeheff",
                white: "edfdfegegf",
            },
            marks: { triangle: "gfgefefded" },
            move_tree: this.makePuzzleMoveTree(
                ["gghfhg", "gghfifhghh"],
                ["gghfifhgighh", "hfgg"],
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecfcddgdeeff",
                white: "edfdfege",
            },
            marks: { triangle: "gefefded" },
            move_tree: this.makePuzzleMoveTree(
                ["hegfgghfifhghh", "hegfgghfhg"],
                ["hegfgghfifhgighh", "hegfhfgg", "gfhe"],
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecfcddgdee",
                white: "edfdfe",
            },
            marks: { triangle: "fefded" },
            move_tree: this.makePuzzleMoveTree(
                ["ffgehegfgghfifhghh", "ffgehegfgghfhg"],
                ["ffgehegfgghfifhgighh", "ffgehegfhfgg", "ffgegfhe", "geff"],
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecfcddee",
                white: "edfd",
            },
            marks: { triangle: "fded" },
            move_tree: this.makePuzzleMoveTree(
                ["gdfeffgehegfgghfifhghh", "gdfeffgehegfgghfhg"],
                [
                    "gdfeffgehegfgghfifhgighh",
                    "gdfeffgehegfhfgg",
                    "gdfeffgegfhe",
                    "gdfegeff",
                    "fegd",
                ],
                9,
                9,
            ),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecfcdd",
                white: "ed",
            },
            marks: { triangle: "ed" },
            move_tree: this.makePuzzleMoveTree(
                ["eefdgdfeffgehegfgghfifhghh", "eefdgdfeffgehegfgghfhg"],
                [
                    "eefdgdfeffgehegfgghfifhgighh",
                    "eefdgdfeffgehegfhfgg",
                    "eefdgdfeffgegfhe",
                    "eefdgdfegeff",
                    "eefdfegd",
                    "fdee",
                ],
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fdfeefgfegfh",
                white: "edeedffffggg",
            },
            marks: { triangle: "ggfgff" },
            move_tree: this.makePuzzleMoveTree(
                ["hgghgihhih", "hgghgihhhi", "hgghhh"],
                ["ghhg"],
                9,
                9,
            ),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fdfeefgfeg",
                white: "edeedffffg",
            },
            marks: { triangle: "fgff" },
            move_tree: this.makePuzzleMoveTree(
                ["fhgghgghgihhih", "fhgghgghgihhhi", "fhgghgghhh"],
                ["fhggghhg", "ggfh"],
                9,
                9,
            ),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fdfeefeg",
                white: "edeedfff",
            },
            marks: { triangle: "ff" },
            move_tree: this.makePuzzleMoveTree(
                ["gffgfhgghgghgihhih", "gffgfhgghgghgihhhi", "gffgfhgghgghhh"],
                ["gffgfhggghhg", "gffgggfh", "fggf"],
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edfeefgfggfh",
                white: "ecgdgeffegfg",
            },
            marks: { triangle: "fgegff" },
            move_tree: this.makePuzzleMoveTree(
                ["dgeheidhch", "dgehdh"],
                ["dgeheidhdich", "ehdg"],
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edfeefgfgg",
                white: "ecgdgefffg",
            },
            marks: { triangle: "fgff" },
            move_tree: this.makePuzzleMoveTree(
                ["fhegdgeheidhch", "fhegdgehdh"],
                ["fhegdgeheidhdich", "fhegehdg", "egfh"],
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
        return _("Black to play. Capture the marked stone in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edfegfgg",
                white: "ecgdgeff",
            },
            marks: { triangle: "ff" },
            move_tree: this.makePuzzleMoveTree(
                ["effgfhegdgeheidhch", "effgfhegdgehdh"],
                ["effgfhegdgeheidhdich", "effgfhegehdg", "effgegfh", "fgef"],
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
        return _("White to play. Capture the marked stone in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dcfdgdgeff",
                white: "bceefegf",
            },
            marks: { triangle: "ff" },
            move_tree: this.makePuzzleMoveTree(
                ["fgefdfegehdgcgdhdichbh", "fgefdfegehdgcgdhch"],
                [
                    "fgefdfegehdgcgdhdichcibh",
                    "fgefdfegehdgdhcg",
                    "fgefdfegdgeh",
                    "fgefegdf",
                    "effg",
                ],
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
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ddeddefeffgf",
                white: "fdeegeeffg",
            },
            marks: { triangle: "gffffe" },
            move_tree: this.makePuzzleMoveTree(
                ["hfggghhgighhhi", "hfggghhgighhih", "hfggghhghh"],
                ["hfgghggh", "gghf"],
                9,
                9,
            ),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ecedcedeeffffg",
                white: "fdeefedfgfeg",
            },
            marks: { triangle: "fgffef" },
            move_tree: this.makePuzzleMoveTree(
                ["fhgghgghgihhih", "fhgghgghgihhhi", "fhgghgghhh"],
                ["fhggghhg", "ggfh"],
                9,
                9,
            ),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ecgdgeefff",
                white: "fedfgffg",
            },
            marks: { triangle: "ffef" },
            move_tree: this.makePuzzleMoveTree(
                ["eeegehdgcgdhdichbh", "eeegehdgcgdhch"],
                ["eeegehdgcgdhdichcibh", "eeegehdgdhcg", "eeegdgeh", "egee"],
                9,
                9,
            ),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgdfeefffeggggh",
                white: "fdeegedfgffgfh",
            },
            marks: { triangle: "egffeffe" },
            move_tree: this.makePuzzleMoveTree(
                ["ehdgcgdhdichbh", "ehdgcgdhch"],
                ["ehdgcgdhdichcibh", "ehdgdhcg", "dgeh"],
                9,
                9,
            ),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcgdfeefffgggh",
                white: "fdeegegffgfh",
            },
            marks: { triangle: "ffeffe" },
            move_tree: this.makePuzzleMoveTree(
                ["dfegehdgcgdhdichbh", "dfegehdgcgdhch"],
                ["dfegehdgcgdhdichcibh", "dfegehdgdhcg", "dfegdgeh", "egdf"],
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
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dcddcedfef",
                white: "deeeffdg",
            },
            marks: { triangle: "efdf" },
            move_tree: this.makePuzzleMoveTree(
                ["cfegehfgggfhfighhh", "cfegehfgggfhgh"],
                ["cfegehfgggfhfighgihh", "cfegehfgfhgg", "cfegfgeh", "egcf"],
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
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcdecfdfeffggg",
                white: "ddceeebfdgeg",
            },
            marks: { triangle: "efdfcfde" },
            move_tree: this.makePuzzleMoveTree(
                ["ffcgchbgagbhbi", "ffcgchbgagbhah", "ffcgchbgbh"],
                ["ffcgbgch", "cgff"],
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
        return _("White to play. Capture the marked stone in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ecedeedf",
                white: "cededg",
            },
            marks: { triangle: "df" },
            move_tree: this.makePuzzleMoveTree(
                ["efcfbfcgchbgagbhbi", "efcfbfcgchbgagbhah", "efcfbfcgchbgbh"],
                ["efcfbfcgbgch", "efcfcgbf", "cfef"],
                9,
                9,
            ),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stone in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ecedeedf",
                white: "deefdh",
            },
            marks: { triangle: "df" },
            move_tree: this.makePuzzleMoveTree(
                ["cfdgegcgbgchcibhah", "cfdgegcgbgchcibhbi", "cfdgegcgbgchbh"],
                ["cfdgegcgchbg", "cfdgcgeg", "dgcf"],
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
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dbecedcededf",
                white: "cdddbeeeef",
            },
            marks: { triangle: "dfdece" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "dgcfbfcgchbgagbhbi",
                    "dgcfbfcgchbgagbhah",
                    "dgcfbfcgchbgbh",
                    "dgcfcgbfafbgbh",
                    "dgcfcgbfbg",
                ],
                ["dgcfbfcgbgch", "dgcfcgbfafbgagbh", "cfdg"],
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
        return _("White to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dcecdecfdfefdg",
                white: "ddceeeffegdh",
            },
            marks: { triangle: "dgefdfcfde" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "bfcgchbgagbhbi",
                    "bfcgchbgagbhah",
                    "bfcgchbgbh",
                    "bfcgbgchcibhah",
                    "bfcgbgchcibhbi",
                    "bfcgbgchbh",
                ],
                ["cgbf"],
                9,
                9,
            ),
        };
    }
}
