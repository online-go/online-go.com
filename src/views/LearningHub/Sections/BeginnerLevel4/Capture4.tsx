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

export class BL4Capture4 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-capture-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture", "Tesuji");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture", "Capture");
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
                black: "brcqcodoepeqer",
                white: "crbqcpdpeoenfpfqfrgn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpdqdrcqaq", "bpdqdrcqcs"],
                ["drbo", "dqbp", "bodr"],
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
                black: "cscrerdqbqbpcncodnengn",
                white: "brardrcqcpdpdobobncmfpclhp",
            },
            move_tree: this.makePuzzleMoveTree(["epeqeodqfq"], ["dsfo", "eoep"], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "grgqipiognfpdpepdqcpbpdmim",
                white: "bqcqdreqfqfrgphpiqjqjp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gserhq"],
                ["fser", "eres", "hqgs", "crbr"],
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
                black: "fsgsgrgqgpfoeodocpdqhn",
                white: "bqbpbocqdresfrfqfpepcm",
            },
            move_tree: this.makePuzzleMoveTree(["ereqdpercr"], ["eqer", "dper"], 19, 19),
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
                black: "csdresfsfrfqepfododndl",
                white: "bscrereqdqdpcocncmck",
            },
            move_tree: this.makePuzzleMoveTree(["cqdscpdrbr"], ["cpcq", "dsbq", "brds"], 19, 19),
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
                black: "fqfpepcsbsbrbqbpcpfrfsgognhp",
                white: "dpcqcrcoboeofodsereqclem",
            },
            move_tree: this.makePuzzleMoveTree(["dqdres"], ["esdq", "drdq"], 19, 19),
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
                black: "bqcpdoeodqbpcnfpdl",
                white: "cqcrfogphofneqepdpiqfl",
            },
            move_tree: this.makePuzzleMoveTree(["erdrfq"], ["drer", "fqer", "brdr"], 19, 19),
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
                black: "brcsdrdqcqepfpgqen",
                white: "bpcpdpgphqhrhsgoipcmdleqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfsesdsfq"],
                ["frfsfqes", "esfr", "fqfr", "grgs"],
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
                black: "cqdreqbpbobncmdmgqbr",
                white: "dqcpcocneogofm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dodpepdnen"],
                ["dodpdnep", "dpdo", "dndp"],
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
                black: "crdrbqapaobodpdncn",
                white: "bpcpcododqbnbmcmdkhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eoepcqdpfp"],
                ["eoepcqdpeqfp", "eoepfpen", "epen", "cqeo", "eneo", "eqen"],
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
                black: "bsbrbqbpcododp",
                white: "bocnbmcpcqdqcrgqhpdlao",
            },
            move_tree: this.makePuzzleMoveTree(["eqerdrdscsdrfr"], ["eqercsdr"], 19, 19),
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
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbsdpbqcrdrerfqfpfofnen",
                white: "frgrhqeqdqcqcpdmbnemfmgmhoineodn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["codoep", "cobobp", "cobpboepdo", "cobpbodoep"],
                ["bpco", "doco", "boco", "epco"],
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
                black: "enfrfqbsbrbqbpdoeoepco",
                white: "bocndndpcpcqcrerfsgrgqgpdlelhnbmgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drdscsdqeq"],
                ["drdsdqeq", "drdseqcs", "dqeq", "eqcs", "cseq"],
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
                black: "arbqbpcpdoeocnfpdl",
                white: "brcrcqdpepfogogqfmhq",
            },
            move_tree: this.makePuzzleMoveTree(["dqeqerdrfq"], ["eqdq", "fqer", "erdq"], 19, 19),
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
                black: "drcrcqcpcodnenepfnfl",
                white: "bpbocndodpdqeqgognbmhqbqhl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fqerfreofofpes"],
                ["eofq", "erfq", "fpfq", "frfq"],
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
                black: "bsbrbqbpdocoeqenfnfl",
                white: "bocnbncpcqcrerdmgpgqgrhndl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drdqdpdscs", "drdqcsdsdp"],
                ["csdr", "dqdr", "dpdr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
