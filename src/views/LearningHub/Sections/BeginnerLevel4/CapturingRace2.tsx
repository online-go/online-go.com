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

export class BL4CapturingRace2 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-capturing-race-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capturing race", "Capturing Race");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capturing race",
            "Win capturing race",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "drercqcpcodnen",
                white: "dodpdqcndmemfmclgogqhm",
            },
            move_tree: this.makePuzzleMoveTree(["eo"], ["eqeo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbqcpcoboaodqeqerfphp",
                white: "bncndndodpcqcrbrdrcsfnelbl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["asanaq", "asanap"],
                ["asanbpaq", "asanesap", "esas", "aqas", "apas", "bsas"],
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqcrdpdoanbmcncmen",
                white: "brcsdrdqepcpbpbobnfqfnfo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar", "bsasap", "bsasao", "bsasco"],
                ["apar", "aoar", "coar"],
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dlgpfpepbscrcqcpcodqgqgrfrgsdn",
                white: "csdrereqdphphqhrhshndoeogofo",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["dses"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dsdrcrcqbpbococmdl",
                white: "csbsbrbqapcpdpdofqeqfn",
            },
            move_tree: this.makePuzzleMoveTree(["areraq"], ["arerasaq", "aqar", "aoer"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "gsgrgqgpfoeodococpgodq",
                white: "crcqbpbodpepfpfqfrfscncl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erdres"],
                ["erdreqes", "drds", "eqdr", "eser"],
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "frgqbncododncsdsdrdqcpgp",
                white: "crcqbpbocncmbmdpepemfofmckbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqbraq"],
                ["bqbrapaq", "bqbraraq", "bqbraoaq", "bqbranaq", "brbq", "aobq", "apbq", "aqbq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aobocodpdnepfpfqerdrcr",
                white: "brcqdqeqcpbpapfrgrhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arcsbq", "arcsaq"],
                ["arcsbsas", "aqbqbsarcses", "bqaq", "bsar"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "hqgqfqbrbqcpdpepgreresfscn",
                white: "gphpdsdrdqeqhshriqipeofnfp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["irjrcs", "irjrcr", "irjrcq"],
                ["crgs", "cqgs", "csgs"],
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "fpfoelbsbrbqbpdnencocneqhphoek",
                white: "doeobnbmcrerfqgqcqcpfnglilckirgndpbo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drdscsdqepdrfr"],
                ["dqdr", "epdr", "csdr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dmfqfrfscrbraraqbpcodoeofpapbn",
                white: "erbqfofngpgqgriocqdpepirdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dseseqcscp"],
                ["dsesdqeq", "dsescpgs", "esds", "eqgs", "dqeq", "cpgs"],
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "gmdpdqaqarbrcrdnenfqbofpfo",
                white: "cqbpbqbncodogqcmdrergpdlfrho",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aocpcn"],
                ["aocpapcn", "apao", "cpao", "cnao"],
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "crdrdqeqfrgrhq",
                white: "brcsdsesercqcpfqfpgocn",
            },
            move_tree: this.makePuzzleMoveTree(["bsasfsbsbq"], ["fsbs", "bqdp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brcrbpcodoeofpfqfrfscm",
                white: "drerdpepfogogpgqgrirenfm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsesdq"],
                [
                    "dsescsgs",
                    "dseseqdq",
                    "dqeqesds",
                    "dqeqdsgs",
                    "dqeqcpgs",
                    "dqeqcqgs",
                    "esds",
                    "eqdq",
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "codoepcsdrerfrgrdqcqboaoeodl",
                white: "cpdpcrbreqfqgqhrhpbqaphnirbp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsbsar"],
                ["dsbsgsar", "bsdsesar", "bsdsaras", "ards"],
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbrbscrcqcpdoeoepfqemhq",
                white: "bqbpcocndpdqdrdscscl",
            },
            move_tree: this.makePuzzleMoveTree(["bo"], ["eraq", "eqaq", "esaq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "crdrcqdpdoco",
                white: "ereqdqcpbpepeoendmcm",
            },
            move_tree: this.makePuzzleMoveTree(["bobqbr"], ["bobqapbr", "bqbo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dsdrdqcqepfpfqgqhrirhphm",
                white: "crbqbpcpdpeqerfrgreodncl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brbsgs", "brbses", "brbsfs"],
                ["brbscsar", "brbsares", "escs", "gscs", "csbr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brcrdpdqcocnbmeo",
                white: "bqcqcpapbodrerfqgo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["araqan"],
                ["araqcsds", "araqbncs", "anar", "bsar", "bnar", "csar"],
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
        return _("Black to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dreqepdodndmcmbmfofrcpbp",
                white: "blcldlelbncncoamglbqcqdqdp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aoanbrarcraqbs"],
                [
                    "aoanbrarcraqasbs",
                    "aoanbraraqap",
                    "aoanbrarapaq",
                    "aoancrbrbsarcsap",
                    "aoancrbraqar",
                    "aoanaqar",
                    "apao",
                    "crap",
                    "brap",
                    "aqar",
                    "boan",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
