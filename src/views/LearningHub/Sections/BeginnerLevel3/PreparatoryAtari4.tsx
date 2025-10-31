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

export class BL3PreparatoryAtari4 extends LearningHubSection {
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
        return "bl3-preparatory-atari-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture", "Preparatory Atari");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture",
            "Capture after preparatory atari",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "freqdpcpcobobm",
                white: "bpbqcqdqer",
            },
            move_tree: this.makePuzzleMoveTree(["fqepgr"], ["epfq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "jqhohpbrgqbpbocqdqerfqjpgn",
                white: "cncocpbldpepeqfpgphqiqbqbn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frgrdr", "drcrfr"],
                ["grfr", "crdr", "aoaq", "apaq"],
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
        return _("White to play. Capture after a preparatory atari.");
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
                black: "bqdqeqfqcpbofogpendnfn",
                white: "cqcrdrerfrgqhqbpeocn",
            },
            move_tree: this.makePuzzleMoveTree(["dpcofp"], ["codp", "brap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "bqcqdqerfqgphp",
                white: "bpcpdpepfpeqgobn",
            },
            move_tree: this.makePuzzleMoveTree(["frgqdr"], ["gqfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "dpepfofngpgm",
                white: "cpcodqeqfqgqgocm",
            },
            move_tree: this.makePuzzleMoveTree(["fphpeo"], ["hpfp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "gqirhrbmbpbocnfqepdqdpdoipgo",
                white: "eqfrgrhqbqcqcpcobndrerbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dncmfp", "fpgpdn"],
                ["cmdn", "gpfp", "aoan", "apan"],
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
        return _("White to play. Capture after a preparatory atari.");
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
                black: "gneodobqcpesgrgqgpfsarcqaq",
                white: "gsipiofrhqhrbpbocncmemhsancl",
            },
            move_tree: this.makePuzzleMoveTree(["erdscr"], ["dser", "drer"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "drcqdpepcobncmbrel",
                white: "cnbpdoeofpfqerfrfn",
            },
            move_tree: this.makePuzzleMoveTree(["cpdndq"], ["cpdneqdq", "bocp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "bqcqdreqfrfphq",
                white: "dqdpcpbperbn",
            },
            move_tree: this.makePuzzleMoveTree(["cresbr"], ["epes"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "cqdqepfogohohq",
                white: "brbqcpdpeofngndn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqfpdr", "eqfpcr", "eqfper", "eqfpfr", "eqfpfq"],
                [],
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
        return _("White to play. Capture after a preparatory atari.");
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
                black: "arbscsdrcqbqdpcnhphqdm",
                white: "bpcpdqeqergpgn",
            },
            move_tree: this.makePuzzleMoveTree(["doepfo"], ["epdo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "brbqcsdrergrfqgpgobs",
                white: "bpcpbncqcrdqeqfpfofnfs",
            },
            move_tree: this.makePuzzleMoveTree(["frgqds"], ["frgqesds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "bqbpcrdqeqfresgp",
                white: "erdrcqcpbocndp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brdsaq", "brdsap", "brdsar", "brdsbs"],
                ["csbr", "dscs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "brcqdqerfqgqhrir",
                white: "bqcpdpepeqfpgphqhobo",
            },
            move_tree: this.makePuzzleMoveTree(["frgrdr", "drcrfr", "crdrfr"], ["grfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "emclblfrfqepdocoboanamhpaldmfm",
                white: "cpbneqeresbraoapakbkckdkekbpdp",
            },
            move_tree: this.makePuzzleMoveTree(["eofpdn"], ["fpeo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "eqfqdqgpgocpcobndnbmfnem",
                white: "bqcqbpbodrerfrgqhrhpcneo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpdofp"],
                ["dpdoenep", "dpdoepfp", "dpdodmep", "dodp"],
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
        return _("White to play. Capture after a preparatory atari.");
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
                black: "bqcrdqeqfqgrhqirip",
                white: "hrgqgpfpepdpcpcqcn",
            },
            move_tree: this.makePuzzleMoveTree(["frhsdr"], ["frhserdr", "hphs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "bpcpdocnepgqgrgo",
                white: "codpdqcqerfrbr",
            },
            move_tree: this.makePuzzleMoveTree(["eodnfp"], ["dneo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "epeqerfrfsgqhqemelgminiododn",
                white: "dsdrdqdpcocndmdlbpesdkcmfogsgpgr",
            },
            move_tree: this.makePuzzleMoveTree(["eoenfq"], ["eoenfpfq", "eneo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "eqfqgpdpdogrhrho",
                white: "cqcpdqerfrgqdnem",
            },
            move_tree: this.makePuzzleMoveTree(["epfpeo"], ["epfpcoeo", "fpep"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "bpcododpepfqgrhr",
                white: "bocnbmdneofpgqhqiqgoen",
            },
            move_tree: this.makePuzzleMoveTree(["eqfrdqcpcq", "eqfrdqcpbq"], ["freq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "crcqcpbobnepdogldkck",
                white: "cmcncodpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eodnemenfnfodmeogo"],
                [
                    "eodnemenfnfodmeofpgo",
                    "eodnemenfnfofpgo",
                    "eodnemendmfn",
                    "eodnfpdm",
                    "fpeofnfogofqgper",
                    "dneofnfq",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture after a preparatory atari.");
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
                black: "blbkcocpdqeqfpfndk",
                white: "crcqbpbobnbmdpar",
            },
            move_tree: this.makePuzzleMoveTree(
                ["docndm"],
                ["docncmdn", "docndncm", "cndo"],
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
        return _("White to play. Capture after a preparatory atari.");
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
                black: "aqbpbocodncmcrcsdqeqdphqhoemfm",
                white: "bsbrbqcqcpdrdoeoepen",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fqeresfrgr"],
                ["fqeresfrdsfp", "fqerfrds", "fqerdsfr", "erfq", "dsfq", "aras", "apao"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
