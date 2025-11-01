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

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class BL3LifeDeath7 extends LearningHubSection {
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
        return "bl3-life-death-7";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning large eye", "Life&Death");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on large eye", "Large eye");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "This formation of a large eye is called flower in Japan and cherry blossom in Korea. By playing at A you can make the group alive or dead. White to play. Capture the black group.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cncocpcqdmdndqemeqfmfnfpfqgngogp",
                white: "bnbobpbqbrclcmcrdldrelerflfrgmgqgrhmhnhohphq",
            },
            marks: { A: "eo" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
            /* cSpell:Aenable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "In general a group with a rectangular 6-point eye space is alive. A rectangle in the corner is a special case. Here, White can capture the black group, since the group is completely surrounded. After White 1 and Black 2, White can play at A and use a shortage of liberties: Black can not play at B, because the black stones will then be in atari. White to play. Capture the black group.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqdrdsbs",
                white: "apbpcpdpepeqeresbr",
            },
            marks: { A: "ar", B: "cr", 1: "br", 2: "bs" },
            move_tree: this.makePuzzleMoveTree(["arcrcs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If the black stones are not completely surrounded, but they have 1 outside liberty, White can not capture the group immediately. But after playing 1 and 3, White can make a ko by capturing black 4. White to play. Make a ko.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqdrdsasbr",
                white: "apbpcpdpepeqerbscs",
            },
            marks: { 1: "bs", 2: "br", 3: "cs", 4: "as" },
            move_tree: this.makePuzzleMoveTree(["ar"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If the black stones have two outside liberties, the black group is alive. Make the black group alive after White has played 1.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqdrds",
                white: "bpcpdpepeqerbs",
            },
            marks: { 1: "bs" },
            move_tree: this.makePuzzleMoveTree(["brcsasarcr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dqeqfqgqcrgrcsgs",
                white: "hobpdpepfpgpcqhqbrhrhs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eresdrdsfr"],
                ["eresfrdr", "eresdsdr", "eresbsdr", "eser", "drer", "dses", "bses"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dpgqfqfogogpfserdrcrbscqcpdo",
                white: "brbqbpcocndnenfnhnhmhohphqgrfrir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epeoeq"],
                ["eoep", "esep", "csep", "eqep"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqdrds",
                white: "apbpcpdpepeqeres",
            },
            move_tree: this.makePuzzleMoveTree(["brbsar"], ["brbscrar", "bsbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbqcqdqdr",
                white: "bpcpdpepeqer",
            },
            move_tree: this.makePuzzleMoveTree(["bscsbr"], ["dsbs", "csbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cqdqeqfqcrgrbsesgs",
                white: "cpdpepfphpbqgqbrhrhs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfsdsercsdrcs", "frfscserdsdrcs", "frfserdrcs"],
                ["frfsdserdrcs", "frfscserasds", "frfserdrdscs", "dsfr", "fsfr", "drer", "csfr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bscrcqdqeqfqfrgrgs",
                white: "hrgqhpfpepdpcpbqbr",
            },
            move_tree: this.makePuzzleMoveTree(["esdser"], ["dses", "csds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqdr",
                white: "apbpcpdpfpeqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscsbr", "bsbrcsdsas", "brbsarcrds"],
                ["bsbrdscs", "bsbrascs", "brbscrar", "brbscsar"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbrcqcpdreres",
                white: "bqbpcodoeodqeqfqfr",
            },
            move_tree: this.makePuzzleMoveTree(["csbscrdscr"], ["bscs", "dpcr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "epfpdqgqcrdrgrcsfs",
                white: "doeofogocphpcqhqbrhrbsgshs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["freser"],
                ["fresfqgp", "esfr", "erfr", "eqer", "gpfr", "dper"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dqepfpfqfrgrbscscrcq",
                white: "gshrhqgqgpfoeodpdobpbqbr",
            },
            move_tree: this.makePuzzleMoveTree(["eresdr"], ["fser", "eser"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "epfpdqfqgqcrgrcs",
                white: "doeofohocpgpcqhqbrhr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eresdrfrgs", "eresdrfrdpdsgs", "eresdrdsfr", "erdres"],
                ["eresdrfrdpdseqdq", "gseresfsfrds", "gserfses", "fsergses", "drer"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the black group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbrcqdqdrer",
                white: "bqbpcpdpeqfpfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csbses", "csbsar"],
                ["csbsapar", "escs", "arcs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
