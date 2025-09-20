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

export class BL2LifeDeath5 extends LearningHubSection {
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
        return "bl2-life-death-5";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning life and death 3", "Life&Death");
    }
    static subtext(): string {
        return "";
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clbmcndneneocpepcqcrbs",
                white: "anbncodoapbpbqarbr",
            },
            move_tree: this.makePuzzleMoveTree(["bo"], ["dpbo", "ambo"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmandneneoepeqbrcrdr",
                white: "bncncodoapbpdpcqdq",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["bqao", "aqao", "boao"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmeneocpdpepcqbrcr",
                white: "anbncnaocodobpbqarbs",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["csaq", "apaq", "amaq"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpbqeqfqfres",
                white: "cqdqarbrdrerbs",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["cscr", "crcs", "aqds"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmfmdngngodpepfpcqcrerbs",
                white: "anbncnaodoeofobpcpaqbqbr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["co"],
                ["asco", "arco", "boco", "amco", "enco", "fnco"],
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
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cofodpfpbqcqgqargrfsgs",
                white: "dqeqfqbrcrfrdses",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["drbs", "csbs", "epbs", "asbs"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndoeobpcpcqeqfqgqgr",
                white: "dpaqbqdqcrerfrcses",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drbras"],
                ["drbrepas", "brarbsdr", "brardrbs", "epdr", "bsdr", "apbr", "arbr"],
                19,
                19,
            ),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dogofpbqcqdqgqhqiqarirbshs",
                white: "eqfqbrcrdrgrhresfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cs", "erfrcs", "frgscs"],
                ["gsis", "erfrepcs", "frgsiscs", "epcs", "iscs", "dscs"],
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
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blclcmcoeobpcpdqeqarerds",
                white: "ambmbnboapaqbqcqcrdrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ao"],
                ["anao", "alao", "cnao", "brao", "asao", "csesdsao", "csesaods"],
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
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndnenfncogocpgpbqfqgqbrgrbsgs",
                white: "doeofodpfpcqdqeqdrfrfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ds"],
                ["esercsds", "eserdscsdscr", "eserdscscrds", "eres", "csds"],
                19,
                19,
            ),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcmdmemanbnfnfofpdqeqfqbrcr",
                white: "cndnboeocpdpepbqcq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apaoaq", "apaqao"],
                ["aoap", "aqap", "bpap", "coap"],
                19,
                19,
            ),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpbqeqfqgqgrgs",
                white: "cqdqarbrcrerfrcs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["dses", "aqfs", "fses", "drds"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmbocoeodpfpfqdrer",
                white: "aobpcpaqdqeqarbrcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cq"],
                ["cscq", "bscq", "bqan", "dscq", "ancq"],
                19,
                19,
            ),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmcndoeobpepeqarbrcrdrer",
                white: "anbnbocodpbqcqdq",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aqap", "cpap"], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmbnbpcpdqeqeres",
                white: "anaoapbqcqbrdrbs",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["csds", "aqds", "ards", "crds"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doapbpcpaqdqeqergrbs",
                white: "bqcqarbrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["cres", "esfs"], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdmemfmengngoepgpcqdqeqgqbrfrbs",
                white: "anbncndnfnboeofobpcpdpfpaqar",
            },
            move_tree: this.makePuzzleMoveTree(["doapbq"], ["doapaobq", "bqdo", "apdo"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncncoapcpcqcrcs",
                white: "aobobpbqbr",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["aqbs", "arbs", "asbs"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmanenfngngogpcqdqeqfqgqarcrcs",
                white: "bncndnboeofoapbpcpdpfpbqbr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsdoep"],
                ["bsdocoep", "dobs", "epbs", "asbs"],
                19,
                19,
            ),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doapbpcpaqdqeqergrcs",
                white: "bqcqarbrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["crbs", "esbs"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndnencofogpeqfqhqarcrdrer",
                white: "bodocpepaqbqcqdqbrbs",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["eoao", "bpao", "csao", "apao"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobococpepdqbrdrds",
                white: "apbpbqcqcrcs",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["bsar", "asar"], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmandnenaofodpfpcqdqeqgqdr",
                white: "bncnbodocpepaqbqarcr",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["bpbs", "apbs", "csbs", "dsbs"], 19, 19),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpaqdqeqfr",
                white: "bqcqbrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["csar", "bsar", "asar"], 19, 19),
        };
    }
}
