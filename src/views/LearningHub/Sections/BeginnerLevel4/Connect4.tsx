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

export class BL4Connect4 extends LearningHubSection {
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
        return "bl4-connect-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning connect", "Tesuji");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on connect", "Connect");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqcqdqcrepdodncmcl",
                white: "dpcpcoeoeqfqerdrhpfn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bo"],
                ["aoboanbnambmblap", "aobobnap", "aoboapbn", "bnbo", "bpbo", "apbn", "anbn"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbpcpdpepfqerdm",
                white: "arbrcqdqdrfrgrgqgpgn",
            },
            move_tree: this.makePuzzleMoveTree(["dsfpeq"], ["eseq", "eqes", "fpeq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpcngqhqiqjqcl",
                white: "fqgphpipkqkpjnfn",
            },
            move_tree: this.makePuzzleMoveTree(["eqfpfr"], ["freq", "erfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dqeqerfrcn",
                white: "dpepfqgqclelfpgriq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpbococpbq"],
                [
                    "bpbococpcqbq",
                    "bpbocpcodobn",
                    "cpcobocqdocr",
                    "cpcobocqbpcr",
                    "cpcodobobpbn",
                    "bobpcpcqbqcr",
                    "bobpcpcqcocr",
                    "cqcp",
                    "bqbpcpcocqbn",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbpcqdqerfrgrcmcl",
                white: "eqfqhqdpcpbockbkdkemfkeogn",
            },
            move_tree: this.makePuzzleMoveTree(["bnaoco"], ["aobn", "anao"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqcpcobobnfq",
                white: "cqdpdobmcndmbkfo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drcrdq"],
                ["crdrdqeq", "dqeqdrer", "erdrcreq"],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "apaobocodoeofpfqgrhqgndlaqcqcrcs",
                white: "arbrbsbqbpcpdpepeqfr",
            },
            move_tree: this.makePuzzleMoveTree(["fseresdsdr"], ["erdr", "esdrdsfs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbpcqdrgqipiq",
                white: "cpbocodpbmgoeren",
            },
            move_tree: this.makePuzzleMoveTree(
                ["freqes"],
                ["eqdqfrcresbr", "eqdqcrfqfrepesgr", "fqeq"],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "eofofqhpbmcmcldlerdqcqaqapbpekfkdsdp",
                white: "arbrbqcrdrcpcocnglendmdofm",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["bobn", "aoan", "bnbo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdpdqephq",
                white: "eqfpfoeocnbnho",
            },
            move_tree: this.makePuzzleMoveTree(["frerfq"], ["erfr", "grfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "eqdqcqbqbmcnenemcmdk",
                white: "frfqfpfodpcobpbobngm",
            },
            move_tree: this.makePuzzleMoveTree(["doeodnepcp"], ["epeo", "eoep", "cpdo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "asarbrbocodpeofpfqfrfsbm",
                white: "bscscrdqeqerescp",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["bpbq", "bqbpapcq", "aqap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "csbsbrbqbpcpdpgpgqgrhn",
                white: "araqapaobocodoepeqdqcqcrfodl",
            },
            move_tree: this.makePuzzleMoveTree(["dseser"], ["esdsdras", "fsds", "erds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqcqfqfrgshririqip",
                white: "bpcpeqepfphqgqgrgpgnbn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dreresfsfr"],
                [
                    "erdrdqes",
                    "dsdrercsdqes",
                    "dsdrercsesfs",
                    "dsdrercscres",
                    "dsdrdqes",
                    "dsdrescr",
                    "dsdrcres",
                    "csdrdses",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "fmcndnaqbqcqdqerfrgrhqemhl",
                white: "drcreqfqdpdofoanhoinbmckarbr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobpao"],
                [
                    "bobpcpcoapbn",
                    "bobpcocp",
                    "cocpbpbo",
                    "cocpbobp",
                    "cocpapao",
                    "cpcobobpapao",
                    "bpbococp",
                    "aocp",
                    "apbo",
                ],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "gmfmembqfoepbpcpdpim",
                white: "dqeqbrfpeogogpdmcmeldkbmbofrarcqfl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dnfnendoco"],
                ["dnfndoen", "fndo", "doen", "endo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
