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

export class BL1Connect extends LearningHubSection {
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
        return "bl1-connect";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning connect", "4.14 Connect");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on connect", "Connect your stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The two marked chains can each be captured by chasing them down. But Black can strengthen the stones by connecting them underneath. Black to play. Connect the marked stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "crdrfrgr",
                white: "dqeqfqgqer",
            },
            marks: { triangle: "grfrdrcr", cross: "es" },
            move_tree: this.makePuzzleMoveTree(["es"], ["dses", "fses"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqdqfqgqhq",
                white: "fmgncpdpfpgpeq",
            },
            marks: { triangle: "hqgqfqdqcqbq" },
            move_tree: this.makePuzzleMoveTree(
                ["er"],
                [
                    "drerfres",
                    "dreresfsfrds",
                    "dreresfsdsfr",
                    "frerdres",
                    "freresdsfsdr",
                    "freresdsdrfs",
                ],
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
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dndpeq",
                white: "bncpfpcqdqgq",
            },
            marks: { triangle: "dndpeq" },
            move_tree: this.makePuzzleMoveTree(
                ["epdoeocoen", "epdoeocoem", "epdoeocofn"],
                ["doep", "eoep", "enep"],
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
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eneodpbqcqeqfq",
                white: "dmdndofobpcpfphpgq",
            },
            marks: { triangle: "eneodpbqcqeqfq" },
            move_tree: this.makePuzzleMoveTree(["ep"], ["dqep"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmcndocpcqdr",
                white: "enbocofodpep",
            },
            marks: { triangle: "dmcndo" },
            move_tree: this.makePuzzleMoveTree(["dn"], ["cmdn"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnencoeocqeq",
                white: "bobpcpepfpfq",
            },
            marks: { triangle: "cnencoeocqeq" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["dqdp", "dodp", "dndp"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofogocqeqcrer",
                white: "cndncocpepfpbqfqhqfr",
            },
            marks: { triangle: "doeofogocqeqcrer" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["dqdp", "drdp"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndncpcqcrdr",
                white: "bododpdqfqer",
            },
            marks: { triangle: "cndncpcqcrdr" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnfndocpbq",
                white: "cmbocobpeqgqdr",
            },
            marks: { triangle: "dnfndocpbq" },
            move_tree: this.makePuzzleMoveTree(
                ["dqepdpeoen"],
                [
                    "dqepdpeofoenemdm",
                    "dqepeodp",
                    "dqepfodp",
                    "cqdp",
                    "eodp",
                    "epcq",
                    "endp",
                    "fodp",
                    "dpcq",
                ],
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
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndneodpfp",
                white: "enfncocpcqdqfr",
            },
            marks: { triangle: "cndneodpfp" },
            move_tree: this.makePuzzleMoveTree(["do"], ["fodo", "epdo"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "enfngncpdqdr",
                white: "clfmcnepeqhqer",
            },
            marks: { triangle: "enfngncpdqdr" },
            move_tree: this.makePuzzleMoveTree(
                ["dodpcocqcr"],
                [
                    "dodpcocqbqcr",
                    "dodpeoco",
                    "dodpcqco",
                    "dpdo",
                    "codndoeo",
                    "codndpdo",
                    "cqdo",
                    "eodo",
                    "dncododp",
                    "dncodpdo",
                ],
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
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fpeqdr",
                white: "cqdqcrfr",
            },
            marks: { triangle: "fpeqdr" },
            move_tree: this.makePuzzleMoveTree(["er"], ["fqer", "eper"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "focpdpfpeqfr",
                white: "gpbqcqfqgqdrhr",
            },
            marks: { triangle: "freqfpdpcpfo" },
            move_tree: this.makePuzzleMoveTree(["er"], ["dqer", "eper", "eser"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cncocqdqbr",
                white: "cpdpepeq",
            },
            marks: { triangle: "brdqcqcocn" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bqbp", "crbp"], 19, 19),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "You can sometimes connect stones by capturing a stone. Black to play. Connect the marked stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codocpdqdr",
                white: "bpdpaqcqfqbrcr",
            },
            marks: { triangle: "drdqcpdoco", cross: "ep" },
            move_tree: this.makePuzzleMoveTree(["ep"], [], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dndodpcqeqfqcr",
                white: "coeocpepbqdqbrer",
            },
            marks: { triangle: "crfqeqcqdpdodn" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bobpbqdqcrer",
                white: "cncocpcqbrdr",
            },
            marks: { triangle: "ercrdqbqbpbo" },
            move_tree: this.makePuzzleMoveTree(["ds"], [], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clcnbobqbrbs",
                white: "bpcpdpfpdr",
            },
            marks: { triangle: "bsbrbqbocncl" },
            move_tree: this.makePuzzleMoveTree(["ap"], [], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpfpeqdrfres",
                white: "epgpbqcqdqfqgqgr",
            },
            marks: { triangle: "esfrdreqfpdp" },
            move_tree: this.makePuzzleMoveTree(["eo"], ["erfo"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epcqdqfq",
                white: "cpdpeqgqfr",
            },
            marks: { triangle: "fqdqcqep" },
            move_tree: this.makePuzzleMoveTree(["er"], ["fper"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpcqfqcrer",
                white: "cododpdqdr",
            },
            marks: { triangle: "ercrfqcqcp" },
            move_tree: this.makePuzzleMoveTree(["ds"], [], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "coeobpcqeq",
                white: "bncndndodqbrcrdr",
            },
            marks: { triangle: "eqcqbpeoco" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["cpdp", "epdp"], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqeqfq",
                white: "bofodpdq",
            },
            marks: { triangle: "fqeqcqbq" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Connect the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpfphpgq",
                white: "emcneoep",
            },
            marks: { triangle: "gqhpfpdpcp" },
            move_tree: this.makePuzzleMoveTree(["eq"], ["gpeq", "fqeq"], 19, 19),
        };
    }
}
