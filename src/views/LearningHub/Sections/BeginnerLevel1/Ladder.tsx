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

export class BL1Ladder extends LearningHubSection {
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
        return "bl1-ladder";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture in a ladder", "4.5 Ladder");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture in a ladder",
            "Capture in a ladder",
        );
    }
}

class Page01 extends LearningPage {
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
                black: "eecfffeg",
                white: "ccdddfef",
            },
            marks: { triangle: "efdf" },
            move_tree: this.makePuzzleMoveTree(
                ["dedgdhcgbgchbh", "dedgdhcgbgchcibhah", "dedgdhcgbgchcibhbi", "dedgcgdhehchbh"],
                ["dedgdhcgchbgbfbhbiehfgdi", "dedgdhcgchbgbhbfcebebdcd", "dgde"],
                9,
                9,
            ),
        };
    }
}

class Page02 extends LearningPage {
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
                black: "eegfhffg",
                white: "fdgeheff",
            },
            marks: { triangle: "ff" },
            move_tree: this.makePuzzleMoveTree(
                ["feefdfegehdgcgdhch", "feefdfegehdgcgdhdichbh", "feefdfegdgehfhdhch"],
                [
                    "feefdfegehdgcgdhdichcibhbgfh",
                    "feefdfegehdgdhcgcfggfhhg",
                    "feefdfegdgehdhfhggghhhifhghi",
                    "feefegdfdecf",
                    "feefegdfdgdeedec",
                    "effe",
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "eceddefedfffdg",
                white: "ebdcddceeecfefeg",
            },
            marks: { triangle: "egefee" },
            move_tree: this.makePuzzleMoveTree(
                ["ehfgggfhgh", "ehfgggfhfighhh", "fgehdhfhgh"],
                [
                    "ehfgggfhfighgihhhgdh",
                    "ehfgggfhfighgihhhidh",
                    "ehfgfhggghhg",
                    "ehfgfhgggfghhgdhcgchbgei",
                    "fgehfhdhcgbgchbh",
                ],
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
                black: "ecdeeecfffgfdg",
                white: "cefegedfefhfeg",
            },
            marks: { triangle: "egefdf" },
            move_tree: this.makePuzzleMoveTree(
                ["ehfgggfhgh"],
                [
                    "ehfgggfhfighhhhg",
                    "ehfgggfhfighhghh",
                    "ehfgfhgg",
                    "fgehfhcgbfchbgbhahbeaeagafad",
                    "fgehfhcgbfchbgbhahbebiaf",
                    "fgehfhcgbfchbgbhbedi",
                    "fgehdhfhgghgghhh",
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfffdgegfh",
                white: "dfefhffggg",
            },
            marks: { triangle: "efdf" },
            move_tree: this.makePuzzleMoveTree(
                ["eededdcebecdccbdbc", "eededdcebecdccbdadbcbb"],
                [
                    "eededdcebecdccbdadbcacbbcbed",
                    "eededdcebecdccbdadbcacbbabed",
                    "eededdcebecdbdccdcfe",
                    "eededdcebecdbdccbcfe",
                    "eededdcecdbebdfe",
                    "eededdcecdbebffe",
                    "eedeceddedfe",
                    "eedeceddcdfe",
                    "deeefeedddfdgegdhehd",
                    "deeefeedfdec",
                    "deeeedfe",
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fdhdgegffgfh",
                white: "gcgdfeffgggh",
            },
            marks: { triangle: "fffe" },
            move_tree: this.makePuzzleMoveTree(
                ["eeefdfegehdgcgdhch", "eeefdfegehdgcgdhdichbh"],
                [
                    "eeefdfegehdgcgdhdichcibhbgde",
                    "eeefdfegehdgcgdhdichcibhbide",
                    "eeefdfegehdgdhcgcfed",
                    "eeefdfegehdgdhcgchde",
                    "eeefdfegdgeh",
                    "eeefegdfdedgdhfiehchcgcfbgdi",
                    "eeefegdfdedgdhfiehchcfcg",
                    "eeefegdfdedgcffiehdh",
                    "eeefegdfdged",
                    "efeedeedfcfbecdddccddfccebdb",
                    "efeedeedfcfbecdddccddfcccbdb",
                    "efeedeedfcfbecdddccddfccdbcb",
                    "efeedeedfcfbecdddccddfccdbhchecb",
                    "efeedeedfcfbecdddccdceegdfeh",
                    "efeedeedfcfbecddcddcebdb",
                    "efeeeddedfddecdcebegehdgcfdh",
                    "efeeeddedfddecdcebegdgeh",
                    "efeeeddedfddecdcdbeb",
                    "efeeeddedfdddcec",
                    "efeeeddedddfegdgdhfiehch",
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
                black: "fdbeeecfdfeffg",
                white: "dbfbddeddefeff",
            },
            marks: { triangle: "fffe" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "gegfhfggghhghh",
                    "gegfhfggghhgighhih",
                    "gegfhfggghhgighhhi",
                    "gfgegdhehdhfgghghh",
                ],
                [
                    "gegfhfgghgghfhgd",
                    "gegfhfgghgghhhgd",
                    "gegfgghfhegdfcgc",
                    "gegfgghfhggd",
                    "gfgehegdfcgc",
                    "gfgegdhehfhdhcgc",
                    "gfgegdhehfhdiegc",
                ],
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
                black: "gbgcfdeegefg",
                white: "dbfbddedfeff",
            },
            marks: { triangle: "fffe" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "efgfhfggghhghh",
                    "efgfhfggghhgighhih",
                    "efgfhfggghhgighhhi",
                    "efgfgghfhghegdegdgehdf",
                    "efgfgghfhehghh",
                ],
                [
                    "efgfhfgghgghfhhhihhegdif",
                    "efgfhfgghgghfhhhgihegdif",
                    "efgfhfgghgghhhfhegehdhdgdfcgcfch",
                    "efgfgghfhghegdegehdg",
                    "gfefdedfcecf",
                ],
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gdcefegfggfh",
                white: "fffghgghihhi",
            },
            marks: { triangle: "fgff" },
            move_tree: this.makePuzzleMoveTree(
                ["egefdfeeed"],
                [
                    "egefdfeedeedddeh",
                    "egefdfeedeedfdeh",
                    "egefdfeedeedeceh",
                    "egefeedfdgeh",
                    "egefeedfdeeh",
                    "egefeedfcfeh",
                    "efegdgeh",
                    "efegehdgdfdh",
                    "efegehdgdhchcgdfeecfbgbfbhbecdbdbccccbdc",
                    "efegehdgdhchcgdfeecfbgbfbhbecdbdbcccbbcbadaeacba",
                    "efegehdgdhchcgdfeecfbgbfbhbecdbdbcccbbcbadaeabacdeba",
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fdgegffgfh",
                white: "dcfeffhfggghihhi",
            },
            marks: { triangle: "fffe" },
            move_tree: this.makePuzzleMoveTree(
                ["eeefdfegehdgcgdhch", "eeefdfegehdgcgdhdichbh"],
                [
                    "eeefdfegehdgcgdhdichcibhbgde",
                    "eeefdfegehdgcgdhdichcibhbide",
                    "eeefdfegehdgdhcgcfeddegd",
                    "eeefdfegehdgdhcgchde",
                    "eeefdfegdgeh",
                    "eeefegdfdegdheedfcce",
                    "eeefegdfdggdheed",
                    "efeedeed",
                    "efeeeddedddfegdgdhfiehch",
                    "efeeeddedfdd",
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecdeeecfffgf",
                white: "cefegedfefhf",
            },
            marks: { triangle: "efdf" },
            move_tree: this.makePuzzleMoveTree(
                ["dgegehfgggfhgh"],
                [
                    "dgegehfgggfhfighhhhg",
                    "dgegehfgggfhfighhghh",
                    "dgegehfgfhgg",
                    "dgegfgehfhcg",
                    "dgegfgehdhfhgghgghhh",
                    "egdgcgdhehfgggfhcheighhh",
                    "egdgcgdhchehfgfhgghgghhh",
                    "egdgdhcgbffg",
                ],
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
        return _("Black to play. Capture the marked stones in a ladder.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dcfcedfeffeg",
                white: "fdgdeeeffggg",
            },
            marks: { triangle: "efee" },
            move_tree: this.makePuzzleMoveTree(
                ["dfdece"],
                ["dfdeddcecfge", "dfdeddcecdgf", "dedfcfdgehgf", "dedfdgcfcegf", "dedfdgcfcggf"],
                9,
                9,
            ),
        };
    }
}
