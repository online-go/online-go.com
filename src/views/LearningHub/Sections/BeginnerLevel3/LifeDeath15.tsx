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

export class BL3LifeDeath15 extends LearningHubSection {
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
        return "bl3-life-death-15";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning alive", "Life&Death");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on alive", "Save group");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "csbpcpdqeqfqgqdobn",
                white: "brbqcqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsdseresfsfrcr"],
                ["bsdsesercrds", "aqbs", "asaq", "arbs", "erbs", "dsbs"],
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
        return _("White to play. Save your group.");
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
                black: "bqaobocodpeqeresdscseo",
                white: "bsbrcrdrbpcp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aq"],
                ["apcq", "cqaqapar", "arcq", "dqap"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "bqcqeqfqgqhqiq",
                white: "brcrerfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsfsgrgshr"],
                ["dsfsgrgshshresgs", "dsfsgsgr", "drargrhr", "drarbsgr", "ardrdsgr", "grdrdsar"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "bocpdqdrdofrbn",
                white: "crcqbqbpap",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["bsar", "csar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "arbrcqdpepfqgrgphrbp",
                white: "asbscrdsdqerfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["eq"], ["cseq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "arbrcranblcmcncodpdqeodlbk",
                white: "bqcqcpbobnbmam",
            },
            move_tree: this.makePuzzleMoveTree(["aqapbp"], ["aqapaobp", "apaq", "aoaq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "fresgshrhqhpgpepdpcpfobqarbpcr",
                white: "bsbrdscqdqeqfqgqgr",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["drfp", "cshs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "brbqbpesfrfqgpgofnemdmbnhrhqgmbm",
                white: "crcqdsereqdpfpfoen",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dn"],
                ["fseo", "doeoepdn", "doeodnep", "eodo", "coeo"],
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
        return _("White to play. Save your group.");
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
                black: "hqhpgobqbrcrgnfmelencncobpcmgliockdrfrgrhr",
                white: "cqdqeqfqgqgpcpdofofnem",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ep"],
                ["dmdneoep", "dmdnepeo", "eoepdndm", "eoepdmdn", "dnepeodm", "dnepdmeo"],
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
        return _("White to play. Save your group.");
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
                black: "bsbrcqdqepfpgqhqhrhsgpbp",
                white: "grgsfqeqerdrcs",
            },
            move_tree: this.makePuzzleMoveTree(["fscrds"], ["crfs", "dsfs", "escr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "bsbrbococpdqerepfrbm",
                white: "arbqbpcqdrcs",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["crap", "dsap", "esap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "brcrdqdpdocncmblaldl",
                white: "bqcqcpcobnbmam",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ao"],
                ["apbo", "boapaqao", "boapaoaq", "aqbo", "bpao"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "bpcpdpeqerfpbn",
                white: "bsbqdqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                [
                    "brcqcrds",
                    "cqaraqdscsbr",
                    "cqaraqdsbrcs",
                    "cqarbraq",
                    "aqdscscqcrar",
                    "aqdsarcr",
                    "aqdscrar",
                    "aqdsbrcq",
                    "craraqds",
                    "crardsaq",
                    "dsaraqcrcqbr",
                    "cscqcrar",
                ],
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
        return _("White to play. Save your group.");
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
                black: "arbocpcqdrdobnfr",
                white: "cscrbrbqbp",
            },
            move_tree: this.makePuzzleMoveTree(["asbsaq"], ["asbsapas", "apas", "aqas"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "aqapbnbocpdqeresep",
                white: "arcrdrdscq",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["brbs", "bqbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "aoanbncndodpdqcqdrdsen",
                white: "cscrbrbqapbococp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["asaqbp"],
                ["asaqarbp", "arbp", "bpar", "aqas"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "dsesereqdpcpbpbneo",
                white: "bsbqcqdqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                ["csaraqbr", "brcs", "crar", "aqcs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "drcqcpcockerfrbmbldkelflgmhnbnhogqgkhrgpfn",
                white: "dqeqfqfpdpdocncmdlemfmgnclgo",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["foen", "eoen", "dnen"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "anbncndoeoeqfrdrcsbsfo",
                white: "arbrcrdqdpcpbo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bq"],
                ["aobq", "bpaoapbq", "bpaobqap", "apbq", "cobq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "aqbqcpdpeqfrfsbpfp",
                white: "arbrcscqdqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dr"],
                ["esdr", "dsdrcres", "dsdrescr", "cres"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "brbqbpcpdrdsdpepfqgqhrhpir",
                white: "cqcrdqeqerfrgrgs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["cses", "bses", "hscs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "brdqblbmdmeneoepcmdr",
                white: "cpdobobncnam",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bq"],
                ["cqbq", "anbq", "dpbqapbp", "dpbqanap", "aobq", "apbq", "aqbq", "dnbq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "bqcqdqeqfqgqhq",
                white: "brcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                ["frargrhr", "esar", "bsarfrgrfsds"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save your group.");
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
                black: "bsbrfrgshrhqgpfpepdpcqbpip",
                white: "cscrdqeqfqgqgres",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["fsdr", "drfs", "dsfs"], 19, 19),
            /* cSpell:enable */
        };
    }
}
