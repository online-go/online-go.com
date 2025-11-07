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

export class BL3ConnectCut4 extends LearningHubSection {
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
        return "bl3-connect-cut-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning respond to cut", "Connect and Cut");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on respond to cut", "Respond to cut");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Respond to this cut.");
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
                black: "crcqbpcocncm",
                white: "cpdodpdqdrbofr",
            },
            marks: { 1: "bo" },
            move_tree: this.makePuzzleMoveTree(
                ["bq", "ap", "aq", "br", "ar"],
                ["bnbqaobr", "aobqbnbr"],
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
        return _("Black to play. Respond to this cut.");
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
                black: "cocpdqeqgp",
                white: "cqdpdocndm",
            },
            marks: { 1: "cq" },
            move_tree: this.makePuzzleMoveTree(["bqcrbr"], ["bqcrdrbr", "crbq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Respond to this cut.");
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
                black: "gpgqiqbqbpcocnhreogo",
                white: "gmcqdobrcrdqeqfqgrfrarbmcmdmem",
            },
            marks: { 1: "do" },
            move_tree: this.makePuzzleMoveTree(["dndpen"], ["dpdnepcp", "dpdncpep"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Respond to this cut.");
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
                black: "crcqcpbocn",
                white: "cododpdqdrfrembp",
            },
            marks: { 1: "bp" },
            move_tree: this.makePuzzleMoveTree(["bn", "an", "bm"], ["bqbn", "apbn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Respond to this cut.");
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
                black: "crcqergrfqfpfo",
                white: "bpcpdpepcmeqdrds",
            },
            marks: { 1: "ds" },
            move_tree: this.makePuzzleMoveTree(["dq"], ["csdq", "esdq", "bqdq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Respond to this cut.");
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
                black: "crcqcpdrbocn",
                white: "erdqeqgrdpdocobnfn",
            },
            marks: { 1: "bn" },
            move_tree: this.makePuzzleMoveTree(["bm"], ["bpcm", "apcm", "anbm"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Respond to this cut.");
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
                black: "eqeoem",
                white: "cqcpcogpepcmiq",
            },
            marks: { 1: "ep" },
            move_tree: this.makePuzzleMoveTree(["fp"], ["dpfpdqdo", "dpfpdodq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Respond to this cut.");
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
                black: "cqcpdpepcmfqfrfs",
                white: "crdqeqeresfpgpgqfn",
            },
            marks: { 1: "fp" },
            move_tree: this.makePuzzleMoveTree(
                ["dsdrbr"],
                ["grhr", "hrgr", "hsgs", "brgr", "drds"],
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
        return _("Black to play. Respond to this cut.");
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
                black: "crcqbpcocncm",
                white: "bqcpdodpdqdrfrdn",
            },
            marks: { 1: "bq" },
            move_tree: this.makePuzzleMoveTree(["br"], ["bobr", "aqbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Respond to this cut.");
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
                black: "drdqepfqfrenelgmglgk",
                white: "crcqcpcncmeogrgqgpgohnhmcl",
            },
            marks: { 1: "eo" },
            move_tree: this.makePuzzleMoveTree(
                ["fodofpfngn"],
                ["fodofnfp", "dofodpdn", "dofodndp"],
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
        return _("Black to play. Respond to this cut.");
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
                black: "blcldmcnbncocpcqfkdkem",
                white: "drcrbqbobpanambmcmdndofq",
            },
            marks: { 1: "dn" },
            move_tree: this.makePuzzleMoveTree(
                ["aoapalaobr"],
                ["alao", "dpep", "epdp", "dqeq", "eqdq"],
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
        return _("Black to play. Respond to this cut.");
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
                black: "clcmcncoeoemeqdrfr",
                white: "crcqcpbobnbmepgrgqgpgogmgl",
            },
            marks: { 1: "ep" },
            move_tree: this.makePuzzleMoveTree(
                ["dpfpdq"],
                ["dpfpdodq", "fpdpfofq", "fpdpfqfo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
