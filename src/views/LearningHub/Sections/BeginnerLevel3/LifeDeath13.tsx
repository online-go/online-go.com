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

export class BL3LifeDeath13 extends LearningHubSection {
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
        return "bl3-life-death-13";
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
                black: "cscrcpbpbnfqdqeqgrdohr",
                white: "drercqbqbrarap",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["dsbs", "frbs", "esbs"], 19, 19),
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
                black: "aqbpcpdqeqfrfsfp",
                white: "bqcqbsdreres",
            },
            move_tree: this.makePuzzleMoveTree(["br"], ["csbr", "arcr", "crar"], 19, 19),
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
                black: "crdrcpdpbncndnbl",
                white: "brcsbpboao",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aq"],
                ["arbq", "bqbsasaq", "bqbsaqasarbs", "bsbq", "asbq", "cqaqarbs", "cqaqbqar"],
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
                black: "brbqbpcpcndnenfogpgqgrfresdsfn",
                white: "fserdrcrcqdpdoeofpfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eq"],
                ["cseqepes", "cseqesep", "cseqdqep"],
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
                black: "crcqcodpeofogohnhphqhrgrbr",
                white: "csfsfrgqgpfpepdqdr",
            },
            move_tree: this.makePuzzleMoveTree(["eq"], ["erds", "eseq", "dseq"], 19, 19),
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
                black: "aobocndodpbmdqcrdrcsaq",
                white: "bsbrapbpcp",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["bqar", "cqar"], 19, 19),
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
                black: "apbqcpcobndqeperes",
                white: "dsdrcrcqbpar",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["brbsaqao", "aqbsaobr"], 19, 19),
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
                black: "aobocodpdqdrdseo",
                white: "brcrcpbpap",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                [
                    "cqaraqbs",
                    "cqarcsaq",
                    "cqarbsaq",
                    "cqarasbscsaq",
                    "cqarasbsaqcs",
                    "csarcqaqasbs",
                    "csaraqcqasbq",
                    "csaraqcqbqas",
                    "csarbqas",
                    "csarasbsaqcqasbq",
                    "ascs",
                    "bscqbqar",
                    "bscqarbq",
                    "bscqaqbq",
                    "bqcsbsar",
                    "aqcq",
                ],
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
                black: "arbrdrcqdpdocncmdlbl",
                white: "bmbnbococpbqaq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ap"],
                ["aoam", "amapbpao", "amapaobp", "anap"],
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
                black: "bqcqdqeqfrgrfpbodn",
                white: "brcrdreres",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["aqar", "ascs", "bsar", "csar"], 19, 19),
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
                black: "ereqepencobobpapaqdngr",
                white: "arbqcqcpdpdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                ["dsbr", "csbr", "brcsdsbs", "brcsbsds", "crbs"],
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
                black: "dserdqcqcpbocoepes",
                white: "arbqbpcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscsapbrcr"],
                ["bscsbrap", "csbsbrap", "csbsapbr", "apbscsbr", "apbsbrcs"],
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
                black: "anbncodpdqdrcrdn",
                white: "bsbraqcqcpbo",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["aobp", "apbp", "bqao"], 19, 19),
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
                black: "bqcqdpdobofpfogqfresfshr",
                white: "arbrcrdsdqeqfq",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["erbs", "drbs"], 19, 19),
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
                black: "arbrcrdrdqdpcocncmblckan",
                white: "aqbqcqbobnbmam",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cpapbp"],
                ["cpapaobp", "aobpcpap", "aobpapcp", "apcp", "bpao"],
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
                black: "apbpcqdqeqfrfsfp",
                white: "asaraqbqcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["escs", "cses", "dsbs"], 19, 19),
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
                black: "aqapbpcpfpfrfsesgqepdphr",
                white: "arasbsdscrbqereq",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["dqcq", "drcq"], 19, 19),
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
                black: "apbrcrcqcpcocncmclbler",
                white: "bsarbqbpbobnbmam",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["aqao"], 19, 19),
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
                black: "araqbpcpcqepeqgqhrhqgodo",
                white: "bsbrbqcrdqerfrgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ds"],
                ["gsdsesdrcsdr", "gsdsdres", "esgs", "fsds", "drgsfsds", "drgsdsfs"],
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
                black: "escsfreqdqcqbqaqhrgq",
                white: "arbrcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["fsbs", "dsbs"], 19, 19),
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
                black: "brcrdsereqepdocnbnenbl",
                white: "arbqcqdrdqdpcobo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                ["aocsbpaq", "aocsaqbp", "apcs", "bpcsaoaq", "bpcsaqao", "aqcsaobp", "aqcsbpao"],
                19,
                19,
            ),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "arbqcqdqeqfqgqhqiqjqjr",
                white: "irhrgrerdrcrbr",
            },
            move_tree: this.makePuzzleMoveTree(["fr"], ["isfrfsgs", "bsfrfsis"], 19, 19),
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
                black: "bsbrcqdpepfqbpgqhrhpir",
                white: "cscrdqeqerfrgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsfsgr"],
                ["dsfsesgr", "esgr", "grdsesdr", "grdsdres", "fsds"],
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
                black: "bqcrdrcpcocnbmamdmep",
                white: "arbrbsbpbobnan",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aqap"], 19, 19),
            /* cSpell:enable */
        };
    }
}
