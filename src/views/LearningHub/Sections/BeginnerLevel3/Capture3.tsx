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

export class BL3Capture3 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-capture-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 2", "Capture");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture 2", "Capture stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofogocpdphpeqhq",
                white: "cnfngnhoepfpgp",
            },
            move_tree: this.makePuzzleMoveTree(["doenem"], ["endo", "dndo"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clelbmbncodoeodpcqarbrcrdrer",
                white: "cndnbobpcpepbqdqeqfqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fnfogo"],
                ["foenemfngnfm", "foenemfnfmgn", "foenfnem", "enfo"],
                19,
                19,
            ),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcldlcodocpdqfqgqhqcrdrbs",
                white: "eneobpdpepgpbqcqbr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cnbobn"],
                ["bndmdncn", "dncncmdm", "dncnbncm", "dncnbocm", "bocn"],
                19,
                19,
            ),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlemfmgmcndnboeogodpbqcqeq",
                white: "bmcmdmbnenfnaobpcp",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["codo", "fodo"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clelbmcpdpepfqcrdrerfr",
                white: "dofofpbqcqdqeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bococneoendnbp"],
                [
                    "bpcocnbobnaneoao",
                    "bpcocnbobnanapao",
                    "bpcocnboaobn",
                    "bpcobocn",
                    "cobpapbobncn",
                    "cobpapboaobn",
                    "eobp",
                ],
                19,
                19,
            ),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "embncndndpaqbqcqgqdrerfr",
                white: "enfndoepdqeqarbrcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpapao"],
                ["cpao", "apbp", "cocs", "bocs"],
                19,
                19,
            ),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocoeofodpcqeqcrerhrds",
                white: "bpcpepfpbqfqbrfrbscsfs",
            },
            move_tree: this.makePuzzleMoveTree(["dqdres"], ["esdq", "drdq"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dofobpepfpbqcqdqdr",
                white: "cnbocoeogocpdphpeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fnengpeoem"],
                ["fnenemgnfmgphogq", "enfn", "dnfn", "gpfn"],
                19,
                19,
            ),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnenbocoeocpbqcrdrer",
                white: "cldmanbncndodpcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpapaobpbr"],
                ["bpapbrao", "aobp", "brar"],
                19,
                19,
            ),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcncodpdqfqer",
                white: "bnbocpepcqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["eqdofr"], ["doeq"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emcnendobpcpaqbr",
                white: "fneofodpbqcqeqcrcs",
            },
            move_tree: this.makePuzzleMoveTree(["arasbs"], ["bsar", "apar"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcmemenaobodofocpdpaqbqdqdr",
                white: "anbncndncoeocqarbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["apbp"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobpcpepfpbqdqfqcrdrfr",
                white: "bmbocododpeqbrercses",
            },
            move_tree: this.makePuzzleMoveTree(["dscqaq"], ["aqfs", "apfs"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndneogoepfpcqdqfqgq",
                white: "enfngnhnbocodofodpgpeqergr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["hqhpfrgpip"],
                ["hqhpiphriqfr", "frhq", "hohq", "bqhq"],
                19,
                19,
            ),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ckcmdmdncoeoapbpcpfpcqbrbs",
                white: "bncnbododpbqdqarcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["aqas", "csbm", "asaq"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmemcnbocpdpfpeqdrer",
                white: "dneobpepaqcqdqcr",
            },
            move_tree: this.makePuzzleMoveTree(["co"], ["doco", "fqgq"], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bobpaqcqdqcrercses",
                white: "cpdpepbqeqbrfrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drdsfs", "dsdrfs"],
                ["fsardras", "fsardsas"],
                19,
                19,
            ),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlemfmdngndobpdpgphpaqcqeqfqhqbrcrhr",
                white: "cmdmcnbocofocpdqgqdrerfrgr",
            },
            move_tree: this.makePuzzleMoveTree(["enfpep"], ["epen", "eoen", "fpen"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlflcmcnenfnbododpaqbqcqdq",
                white: "dmemdneoapbpepeqarbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["co"], ["cpco"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmancndodpaqbqcqdq",
                white: "bndnencoeobpepeqbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apboar"],
                ["apbocpao", "arap", "cpap", "boap"],
                19,
                19,
            ),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnfndogodpcqeqfqcrcs",
                white: "dmcncofocpepbqdqdrds",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["bren", "eoen"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndneoepgpbqdqcrdr",
                white: "bocododpcqeqbrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cscpdscqaq", "cscpdscqbp", "dscpcscqaq", "dscpcscqbp"],
                ["cscpbpap", "dscpbpap", "cpbp", "bpcp"],
                19,
                19,
            ),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblcldlambncncobpcp",
                white: "bmcmdmandnaododpcqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqapaqboan"],
                ["bqapaqboaoan", "apaq", "boap"],
                19,
                19,
            ),
        };
    }
}
