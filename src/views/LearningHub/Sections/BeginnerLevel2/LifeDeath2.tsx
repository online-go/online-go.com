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

export class BL2LifeDeath2 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl2-life-death-2";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning prevent eyes in correct order",
            "Life&Death",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on prevent eyes in correct order",
            "Prevent eyes in correct order",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnenfncodofofpcqdqeqfqfrgrhrfs",
                white: "bmdmemfmcngnbogobpgpipbqgqhqcrdreriris",
            },
            move_tree: this.makePuzzleMoveTree(["hscpep"], ["cphs"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "enfncodoeocpgpcqdqeqfqgqdrfrfs",
                white: "bmemfmhmcndngnbogobphpbqhqbrcrhrds",
            },
            move_tree: this.makePuzzleMoveTree(["esfoep"], ["fpes", "foes", "epes"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpbqbrdrbsds",
                white: "bococpepcqdqer",
            },
            move_tree: this.makePuzzleMoveTree(["crapar"], ["apcr"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocodoeofogoapcpcqdqeqfq",
                white: "bncndnenfngnhnhohpgqbrcrdrerfrgr",
            },
            move_tree: this.makePuzzleMoveTree(["bqgpep"], ["gpbq", "fpbq", "aqbq"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofocpdpcqeqcreres",
                white: "bndnenfncogobpgpbqbrfrgrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fpcsdr"],
                ["csfp", "dsfp", "fqfp", "drfp"],
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
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepfpdqcrdrerfrgrgs",
                white: "codoeofohocpgpcqgqhqbrhrbs",
            },
            move_tree: this.makePuzzleMoveTree(["fqcses"], ["csfq"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeocpcqdqeqfqcrfrcsds",
                white: "bndnengncofobpfpbqgqbrgrbs",
            },
            move_tree: this.makePuzzleMoveTree(["epfser"], ["fsep", "esep"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hqgqfqeqbrcrdrfrhresfs",
                white: "cqdqiqarirasbshsisdoepfpgphpipaqbq",
            },
            move_tree: this.makePuzzleMoveTree(["csgsds"], ["gscs"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndnenfnaodocpdpepfpbqcq",
                white: "ambmcmdmemfmgngogpaqdqeqfqarbrcrgr",
            },
            move_tree: this.makePuzzleMoveTree(["foapbo"], ["apfo", "bpfo"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dofodpfpcqdqeqfqcrfres",
                white: "bndnenfnhncogocpgpbqgqbrgrirbs",
            },
            move_tree: this.makePuzzleMoveTree(["eocsdr"], ["cseo", "dseo", "dreo"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndncoeofogocpdpeqfqgqcrdr",
                white: "blglcmdmbnenfngnbohobpgphpbqhqbrfrgr",
            },
            move_tree: this.makePuzzleMoveTree(["fpcqep"], ["cqfp", "erfp"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Prevent two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epgpcqdqeqgqcrerfrcs",
                white: "hnboeofogocpdphpbqhqbrgrhr",
            },
            move_tree: this.makePuzzleMoveTree(["fpfsds"], ["fsfp", "dsfp", "esfp"], 19, 19),
        };
    }
}
