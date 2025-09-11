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

export class BL2ThrowIn2 extends LearningHubSection {
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
        return "bl2-throw-in-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning throw in 2", "Throw In 2");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on throw in 2",
            "Capture after throwing in",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bsdrcrdqbqaqepfodocoeo",
                white: "bpcpdpfpgpcqeqerdses",
            },
            move_tree: this.makePuzzleMoveTree(["brarcsbrap"], ["csbr", "apbo"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmbncnenfnaodoapbpcpepeqer",
                white: "flambmcmdmemandndpbqcqdq",
            },
            move_tree: this.makePuzzleMoveTree(["coboaq"], ["boco", "aqco"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbphpcqdqeqgqarbrfrgrcs",
                white: "cnenaobocpepfpfqcrdrerbs",
            },
            move_tree: this.makePuzzleMoveTree(["bqaqdp"], ["dpbq", "aqbq"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqdqbrdrfrcs",
                white: "cmapbpcpaqcqcr",
            },
            move_tree: this.makePuzzleMoveTree(["bsasar"], ["dsbs", "arbs"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpgpcqdqfqbrerfr",
                white: "dnaobocpepeqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["bqaqdpbqbs"], ["dpbq", "aqbq", "arbq"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fngndoeogodpgpcqeqgqcreres",
                white: "fmcndnenbofocpepfpbqfqbrfrfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqdrcodqcs", "dqdrcodqdscsbs"],
                ["codq", "drds", "csgr"],
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
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmgnindoeofofpeqhqcrdrfrgr",
                white: "cmdnenfncogocpgpcqfqgqbr",
            },
            move_tree: this.makePuzzleMoveTree(["epdpdq"], ["dpep", "erho", "dqho"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeogohodpfpdqgq",
                white: "cmdnenfncofocpcqbrdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["epeqfq"], ["eqep", "fqep"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hrgrfqeqdqdphoeohngnfndncniq",
                white: "frerdrbrgqcqgpgofodocobobn",
            },
            move_tree: this.makePuzzleMoveTree(["epfpcp"], ["cphp"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmfmcnboapdpbqeqerfr",
                white: "anbnaodoeoepcqdqfqgq",
            },
            move_tree: this.makePuzzleMoveTree(["bpcpcobpbr", "bpcocp"], ["cobp", "cpbm"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndoeocpfpcqfqcrfrcseshs",
                white: "fohodpepgpgqdrergrhriris",
            },
            move_tree: this.makePuzzleMoveTree(["fsgseq"], ["dseq", "dqds", "eqfs"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndneoepfpcqeqdrfrfs",
                white: "enfndodpgpdqfqgqgrgs",
            },
            move_tree: this.makePuzzleMoveTree(["eresfoercr"], ["eser", "foer", "dser"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqdqeqgqcrfrfs",
                white: "bocpdpepbqbrdrcs",
            },
            move_tree: this.makePuzzleMoveTree(["dseser"], ["bsds", "erds"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbqcqdqdr",
                white: "epeqarbrcrerasds",
            },
            move_tree: this.makePuzzleMoveTree(["csbsaq"], ["bscs", "aqcs"], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fngnfpdqeqcrcs",
                white: "cnhocpcqhqdrhrdsfshs",
            },
            move_tree: this.makePuzzleMoveTree(["eserfr"], ["eres", "fres"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbqcqdqeqbrfr",
                white: "fpfqarcrdrergrasbs",
            },
            move_tree: this.makePuzzleMoveTree(["csdsaq"], ["aqcs", "esfs"], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gneocqdqeqfqcrgrgs",
                white: "cnbpbqgqhqbrdrerfrcs",
            },
            move_tree: this.makePuzzleMoveTree(["dsesfs"], ["fsds", "esds", "bsds"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "encocpbqdqeqfqgqbrdr",
                white: "gndpephpcqhqcrerfrgrcsds",
            },
            move_tree: this.makePuzzleMoveTree(["esfsbseshr"], ["bses"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gnhpcqdqeqfqgqbrfrhrir",
                white: "cmcobpbqcrdrergrbsfsgshs",
            },
            move_tree: this.makePuzzleMoveTree(["esdsis"], ["csar", "ises"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dncpdqeqfqgqcrgrcs",
                white: "gnhphqdrerfrhrgs",
            },
            move_tree: this.makePuzzleMoveTree(["fsesds"], ["dsfs"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmdndocpepcqeqiqcrerirhs",
                white: "fmeofodpdqdrfrdses",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsgscsfsfq"],
                ["fsgscsfsgrfq", "fsgsgrfq", "fsgsfqgq", "csfs"],
                19,
                19,
            ),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmanbncocpbqcqdrercs",
                white: "fnboapbpaqdqeqfqbrcrfres",
            },
            move_tree: this.makePuzzleMoveTree(["arasao"], ["aoar", "bsar"], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fodpaqbqcqeqfqarcrfr",
                white: "dmgncocpgpdqgqbrdrergrbscsfs",
            },
            move_tree: this.makePuzzleMoveTree(["esdsas"], ["dses", "ases"], 19, 19),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dncpdpbqdqfqbrbs",
                white: "cmcnbogobpaqcqgqcrgrcsesgs",
            },
            move_tree: this.makePuzzleMoveTree(["dsdrer"], ["drds", "erds"], 19, 19),
        };
    }
}
