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

export class Capture extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "capture";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture stones", "Capture");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture stones 2",
            "Capture stones",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked white stone.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ie",
                white: "id",
            },
            marks: { triangle: "id" },
            move_tree: this.makePuzzleMoveTree(
                ["hdichcibhbiaha", "hdichcibiahbgbhaga"],
                ["hdicibhc"],
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
        return _("Black to play. Capture the marked white stone.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcfeffdgegchdh",
                white: "ccdfefbgcgfgbh",
            },
            marks: { triangle: "fg" },
            move_tree: this.makePuzzleMoveTree(
                ["ggfhghehfi", "ggfhghehei"],
                ["ggfhfighhhhggfhi", "ggfhfighhhhggigf", "ggfhfighgihg", "ggfhehghhhhg", "fhgg"],
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
        return _("Black to play. Capture the marked white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ccdcbddddedfcgdggg",
                white: "bbcbbccdcecfbgbhch",
            },
            marks: { triangle: "cfcecd" },
            move_tree: this.makePuzzleMoveTree(["bf"], ["bebf"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cbebdccdedcecfdgdh",
                white: "ddfddebfdfcgegfgch",
            },
            marks: { triangle: "dfdedd" },
            move_tree: this.makePuzzleMoveTree(["ef"], ["eeef"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecgcbecefebfdfffbgdgeg",
                white: "bdcddeeecfefgfcgfgggch",
            },
            marks: { triangle: "efeede" },
            move_tree: this.makePuzzleMoveTree(["dd"], ["eddd"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fdeeefcgfg",
                white: "ddeddefeff",
            },
            marks: { triangle: "fffe" },
            move_tree: this.makePuzzleMoveTree(
                ["gegfhfggghhghh", "gegfhfggghhgig"],
                ["gegfhfgghggh", "gegfgghf", "gfgehegdgcfc", "gfgehegdhdgc", "gfgegdhe"],
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
        return _("Black to play. Capture the marked white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cccecgfgggehgh",
                white: "gchfhgfhhhfihi",
            },
            marks: { triangle: "fifh" },
            move_tree: this.makePuzzleMoveTree(["gi"], ["eigi"], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bcbdcddedfagbggg",
                white: "bbcbdcddaebecebf",
            },
            marks: { triangle: "bfcebeae" },
            move_tree: this.makePuzzleMoveTree(
                ["cfacafadab", "afaccfadab"],
                ["cfacadcc", "adcc", "afacadcc"],
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
        return _("Black to play. Capture the marked white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ccdcgcbdedeegeefcgdghg",
                white: "ebeccdddbedecfdfegfgdh",
            },
            marks: { triangle: "dfcfdebeddcd" },
            move_tree: this.makePuzzleMoveTree(["bf"], ["aebg", "bgbc", "adbg"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked white stone.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gcffgfdgeg",
                white: "eecfefcgfg",
            },
            marks: { triangle: "fg" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "fhgghgghhh",
                    "fhgghgghgi",
                    "ggfhghehdhdifi",
                    "ggfhghehdhdieifigi",
                    "ggfhehghhheigi",
                    "ggfhehghhheidi",
                ],
                ["fhggghhg", "ggfhghehfidhchbh", "ggfhehghfihh"],
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
        return _("Black to play. Capture the marked white stone.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfffdg",
                white: "ccecdf",
            },
            marks: { triangle: "df" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "deefeeegehfgggfhgh",
                    "deefeeegehfgggfhfighhh",
                    "deefeeegfgehfhdhcgchbh",
                    "deefeeegfgehfhdhchcgbgdgdi",
                    "deefeeegfgehfhdhchcgbgdgei",
                    "deefeeegfgehdhfhgh",
                ],
                [
                    "deefeeegehfgggfhfighgihh",
                    "deefeeegehfgfhgg",
                    "deefegeefeed",
                    "deefegeeedfefdge",
                    "deefegeeedfegefdfcdd",
                    "deefegeeedfegefdgddd",
                    "efde",
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
        return _("Black to play. Capture the marked white stone.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gccdeecfff",
                white: "fegeefhfgg",
            },
            marks: { triangle: "ef" },
            move_tree: this.makePuzzleMoveTree(
                ["egdfdedgdhcgbgchbh", "egdfdedgdhcgbgchci"],
                [
                    "egdfdedgdhcgchbg",
                    "egdfdedgcgdh",
                    "egdfdgdedded",
                    "egdfdgdeedfg",
                    "egdfdgdeceed",
                    "dfegfgfh",
                    "dfegdgfg",
                ],
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
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "godpepcqfqcrfrcs",
                white: "cmcocpbqdqeqbrdres",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["dsbs", "fsbs"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmepfphpdqgqcrdrgrbsgs",
                white: "dmdodpbqcqeqfqarbrfrdsesfs",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["ercs"], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cncpdpbqeqbreres",
                white: "eohoepcqdqfqcrfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["drds"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofohocpgpcqfqcrercs",
                white: "dmcncobpdpepfpbqdqgqiqdrgrdses",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], ["eqfr", "brar", "frfs"], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dobpbqarcr",
                white: "cqdqfqbrbs",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["asaq", "drer"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hpdqeqcrdrfrgr",
                white: "cncpdpepfpbqfqbrercses",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], ["dscq", "bscqdscs"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eneocpdpeqcreres",
                white: "gnepfpdqfqdrfrcs",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["bsfsdscs", "dsfs"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cncpcqbrdrerfr",
                white: "dqeqfqhqcrgrcsfs",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["dses", "esds"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture white stones without putting yourself into atari.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnbocpdpbqeqbrerfres",
                white: "eohoepcqdqfqgqcrgrfsgs",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["drds", "dscs"], 19, 19),
        };
    }
}
