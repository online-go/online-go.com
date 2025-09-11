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

export class BL2Snapback extends LearningHubSection {
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
        return "bl2-snapback";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning snapback 1", "Snapback");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on snapback 1",
            "Capture with snapback",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndneodpepbqcqfq",
                white: "cmdmbnfnbodocp",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["coen"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bndnboapcpcq",
                white: "codpaqdqbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bqbp"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdmanbobpaqbqcrdr",
                white: "bncncocpcqeqfqarbr",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["apao"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmanenaoeobpepbqcrdr",
                white: "bnbodocpcqarbrbs",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aqap"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpbqdqfqcrergrds",
                white: "bocoapdpepaqeqbr",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["cpcq"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpdqfqardrgrasbscsds",
                white: "aobocodpepcqbr",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["bqaq"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcqdqfqgqbrdrer",
                white: "aobocpdpepeqarfr",
            },
            move_tree: this.makePuzzleMoveTree(["bq"], ["aqbq"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emdnfndogodpeqfq",
                white: "dldmcncofocpepcqdq",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["eoen"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpfpaqdqgqarbrdrcsds",
                white: "codoapcpbqcqcr",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["asbs"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fndofohodpepeqhqergrfs",
                white: "dnencoeocpfpcqdqgqdrdses",
            },
            move_tree: this.makePuzzleMoveTree(["fr"], ["fqfr"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dngncobpgpbqgqcrdrergrfsgs",
                white: "docqdqeqfqarbrfrcs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["dses"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnendofogobpdpgpcqgqbrdr",
                white: "dmemcnfncocpfpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(["eo"], ["epeo"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elembncnendobpcpdpgpdqfqerfr",
                white: "dkekfkbmcmdmdnfneogoepbqcqeqbrdrcs",
            },
            move_tree: this.makePuzzleMoveTree(["fo"], ["fpfo", "fmfo"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocodoeoepdqarcrdr",
                white: "apbpcpdpcqeqbrerbs",
            },
            move_tree: this.makePuzzleMoveTree(["bq"], ["aqbq", "esds"], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dkdmemcnfnbocofobpfpeqer",
                white: "bmcmfmgmbndnengneocpephpbqdqfqgqdr",
            },
            move_tree: this.makePuzzleMoveTree(["dp"], ["dodp"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dncpepbqeqcrdr",
                white: "dmemcoeobpdpdq",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["cqdo", "bodo"], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpepfpbqcqdqgqcrerds",
                white: "bncodoeoapbpdpaqbrbscs",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["asar"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnencoeoepeqarbrcrdr",
                white: "cldmbncndodpaqbqcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpboap"],
                ["bpbocpap", "cpbo", "apbpaobo", "apbpboao", "boaobpan"],
                19,
                19,
            ),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdmemcnenbobpdpcqbr",
                white: "clbmbndncodoepdqfqcrerbs",
            },
            move_tree: this.makePuzzleMoveTree(["eo"], ["cpeo"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmdmeneobpepbqcqdq",
                white: "aobododpeqfqbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cocndn", "cocncpdnbn"],
                ["cocncpdncmbn", "dnco", "cnco", "cpco"],
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
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emenfocpfpcqeqdrer",
                white: "elfldmdngncoeoepdqfqgq",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["dpdo"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bndnenfngncogocpcqdrerfr",
                white: "doeofohodpgphpbqdqeqarcrhrbs",
            },
            move_tree: this.makePuzzleMoveTree(["fpfqgq"], ["fqfp", "epfp"], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "docpbqdqeqfqbrfrcs",
                white: "dnboeobpgpcqgqcrdrergrfsgs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["dses"], 19, 19),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible with a snapback.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clcmbndnbobpgpbqeqfqgqcrdr",
                white: "dmemcnfncogocpepfpcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eofodp"],
                ["eofododp", "dpdo", "dodpeofo", "dodpfoeo", "foeo"],
                19,
                19,
            ),
        };
    }
}
