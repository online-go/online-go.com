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

export class BL3LifeDeath3 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-life-death-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning live with sente move", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on live with sente move",
            "Live with sente move",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White has to make two eyes to make the group in the corner alive. But, White has to do this in the correct order. First, White plays a sente move at B, placing the three black stones in atari and forcing Black to save these stones first. White can then make a second eye at A. White to play. Make the group alive by playing a sente move.",
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
                black: "aobocpcqcsdodrdsepeq",
                white: "aparbpbrcrdqerfrgq",
            },
            marks: { A: "bq", B: "bs" },
            move_tree: this.makePuzzleMoveTree(["bsdpbq"], ["bqbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "cmbocogoapdpepfpdqgqergrdses",
                white: "bpbqeqfqbrcrdrfras",
            },
            move_tree: this.makePuzzleMoveTree(["csfsaq"], ["aqcs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "dnboeofogocpdpgpbqfqhqfrbsfs",
                white: "epfpeqgqarbrcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["esgrcs", "escsgr"], ["cses"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "bncodofoapbpfpcqdqgqeres",
                white: "cpdpbqarbrdrbs",
            },
            move_tree: this.makePuzzleMoveTree(["crepds", "creqds"], ["eqep", "dscr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "cmembnbofocpdpfpaqbqeqgqeres",
                white: "codoepcqarbrcsds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqbpdr", "dqdrbp"],
                ["drdq", "bpapdqdrbpcp"],
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
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "codofocpfpfqbrgrbs",
                white: "dpepeqcrdreres",
            },
            move_tree: this.makePuzzleMoveTree(["cqcsbq", "cqbqcs"], ["cscq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "anbncncodofoepaqdqfqhqdrcsds",
                white: "aobobpcpdpcqeqbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["bserar"], ["arbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "csercrdqdpeobodncn",
                white: "drbrcqcpbp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsdsaq", "bsapdsaraqbqas", "bsaqdsapar"],
                ["dsesbsaq", "dsesaqbs", "aqbs", "apbs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "dmanbncnaododpdqcrcs",
                white: "bocoapaqbqbrbs",
            },
            move_tree: this.makePuzzleMoveTree(["cqdrcp"], ["cpcq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "emfmbncndnbofogocpdphpbqdqhqcrir",
                white: "codoeobpepeqfqgqergrdsgs",
            },
            move_tree: this.makePuzzleMoveTree(["drcqfs"], ["fsdr", "csdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "cndoeobpcpgpaqdqeqgqarfrhr",
                white: "dpepbqcqbrdrbscs",
            },
            move_tree: this.makePuzzleMoveTree(["erfpes", "eresfqeqfp"], ["eresfqeqdqfp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "cmdnenfnbocogobpdpgpbqdqeqhqgr",
                white: "doeofocpcqarbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["fqer", "dsbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the group alive by playing a sente move.");
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
                black: "dmbncnboeocpdpfpdqgqgrbscsds",
                white: "codoapbpbqcqarbrdr",
            },
            move_tree: this.makePuzzleMoveTree(["eqdnes"], ["eser", "eres"], 19, 19),
            /* cSpell:enable */
        };
    }
}
