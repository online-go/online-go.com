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

export class BL4Capture2 extends LearningHubSection {
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
        return "bl4-capture-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture", "Capture");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture", "Capture stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "cscrcqbqcpcocncmaohqho",
                white: "brasaraqbpbobnbmcldlfl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apanapaobsapbl", "blbkapanapaobs"],
                ["bsap"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bobncmcpdpepfphoio",
                white: "bpbqcqdqeqgqhqdococnemgmdlbk",
            },
            move_tree: this.makePuzzleMoveTree(
                ["en"],
                [
                    "eodn",
                    "dneoenfogofn",
                    "dneoenfofngogpgn",
                    "dneoenfofngogngp",
                    "dneofoen",
                    "dmen",
                    "fnen",
                ],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "cqdrerfqfpbpbohqbq",
                white: "eqdqcpdodmckfn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpepeodpdn"],
                ["epdp", "codp", "eodpdncnencocmbm", "eodpdncnencobnbm", "eodpdncncoen"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "araqbrcqdqdpdodncngp",
                white: "bqbpcpcobncmdmenfmbkck",
            },
            move_tree: this.makePuzzleMoveTree(["boaoapbobm"], ["apbo", "bmbo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bsaqbqcqdqdrdm",
                white: "crbrardserfrgqgo",
            },
            move_tree: this.makePuzzleMoveTree(["csascs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bmcncobobpdpep",
                white: "bqcqcpdodncmblamergq",
            },
            move_tree: this.makePuzzleMoveTree(["dmbnen"], ["cldm", "bndl"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bqbpbobncqdrcmcleock",
                white: "crdqercncocpdmendlgmgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpdsdn"],
                ["dpdsdodn", "dpdseqdn", "eqdp", "dndo", "dodn"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bsbrbqbpbocodndmdpepfpdlfk",
                white: "dqcpcqcrfqgqdoeofncnbnclhmckip",
            },
            move_tree: this.makePuzzleMoveTree(["eqerdrdscsdrfr"], ["eqercsdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "cqdqcpbobnbmerfrgrhqcldogpiq",
                white: "cocncmdpepeqfqgqeohpgohmipflek",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dmdnendofo"],
                ["dndmenfn", "endmfodn", "fofn"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bqcrdrdqdpcoeoenfpiq",
                white: "brbscqcpbpdodnck",
            },
            move_tree: this.makePuzzleMoveTree(
                ["boaqdmcnbncmcl", "dmcnboaqbncmcl"],
                ["cndm", "cmdm"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bpbobncpdqeqfpgpfqiphm",
                white: "cqcrbqdrerfrgqhqepdpcodmfmck",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eododn"],
                ["doeo", "cndndoeo", "dneoenfofngohpgngmcnemcm", "endn"],
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
        return _("Black to play. Capture as many white stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 11 },
            /* cSpell:disable */
            initial_state: {
                black: "brcqdpepfpgphqhpbpirdm",
                white: "dqeqfqgqcrhriqjrjp",
            },
            move_tree: this.makePuzzleMoveTree(["grisfr"], ["grisdrfr", "dris"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "cqdqeqcpbofres",
                white: "cmbncodpepfqgrhq",
            },
            move_tree: this.makePuzzleMoveTree(["fpgqdo", "docnfp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "brbqcpdqercodoeoem",
                white: "cqcrdrbpbocncmeqckgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsdpcsdqfq", "csdpdsdqfq"],
                ["fqfrepes", "fqfresdp", "frfq"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "cqcrdrbobncmdmemfofpdogm",
                white: "cocndndpdqerfqgqiq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cpeoendoeq", "eqepcpeoen"],
                ["encp", "eocp", "epeqcpeo", "epeqeocp"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bpdqeqfqfngogpgm",
                white: "dpcocqbqcmfpfogqgrdl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["doeodncpep"],
                ["eoepcpdo", "eoepdocp", "epeo", "cpdoaqbo", "cpdobobn", "endo", "aqcp"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "cpdqeqcocnbnbmbpaodmgq",
                white: "dndodpcmclblcqbqarcrbsaqdkgl",
            },
            move_tree: this.makePuzzleMoveTree(["emfoeoenfnepfp"], ["enem", "epem"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bmcndndodpdqcrerelhp",
                white: "brcqcpcobncmblcldk",
            },
            move_tree: this.makePuzzleMoveTree(["boambq"], ["bqbp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "bqcqcodreqepeodmcmfrfm",
                white: "brcrdqdpcpbocn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpdodncobn", "bpdodncoao"],
                ["dobp", "bndo", "dnbp"],
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
        return _("Black to play. Capture as many white stones as possible.");
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
                black: "arbrcrdrdscqdpdodncnckekgl",
                white: "bsbqcpcobncmesereqdqepenemhp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobpapaoaqbobm", "bobpaqaoapbobm"],
                ["bpbo", "aqdm"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
