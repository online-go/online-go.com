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

export class BL4Capture3 extends LearningHubSection {
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
        return "bl4-capture-3";
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "erdqcpbqaqbpcn",
                white: "arbrcrdrcq",
            },
            move_tree: this.makePuzzleMoveTree(["eqdpfr"], ["dpeq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many black stones as possible.");
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
                black: "eqfqfpeoelfmhl",
                white: "dqdrerepcpcmclgpgqgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fodpfrepen"],
                ["fodpfrepdoen", "fodpdoen", "fodpengo", "frfo", "dpfo"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "crcqcpdqepdofofnemgpgqgrglir",
                white: "brbqbpcocndmelcldreqfqfpgohnhpiq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csdpeoendneofm"],
                [
                    "csdpeoendneognfm",
                    "csdpeoendneogmer",
                    "csdpeoenfmer",
                    "csdpdneo",
                    "fmer",
                    "ener",
                ],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "dpdqepfqfrgshrhqcocncmdlckelfofniofl",
                white: "bqcpeqfpgpgqgreododndmgohnbobn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drercqeqes"],
                ["erfs", "cqdr", "fmem", "gnem"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many black stones as possible.");
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
                black: "dqdofqdmdlenfngmhpdkbmip",
                white: "epdncnemfmgnhnfkin",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foeodpcobocpcq"],
                ["foeodpcobocpbpcq", "foeodpcocpbo", "foeocodp", "eofo", "glco", "hmco"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many black stones as possible.");
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
                black: "brbqereqdqcpcodnhqhohm",
                white: "cqcrdrbpbocnbndmemfqfpcl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpdoeoependpfr", "dpdoeoependpesfrgr"],
                ["dpdoeneo", "dodp", "ends", "aqcs", "bsds", "epdp"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "dqeqfqcpcododmfngo",
                white: "cqbqbpbodrerfrgqdpbnhqio",
            },
            move_tree: this.makePuzzleMoveTree(["fpepeodpdn"], ["epfp", "eofp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many black stones as possible.");
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
                black: "cqcrdsesdpdofphqirhp",
                white: "csbsbrbqbpdrcocndlfnhn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erfsgr"],
                ["erfsfrgs", "frer", "fser", "dqcp"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "bqcqdpdodnbmckdkeqerfphpbk",
                white: "crdrdqcpcodleneoepgn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cm"],
                ["cndmemcm", "cndmcmem", "dmcn", "brbp"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "bpcpdpeqfr",
                white: "bqcqdqer",
            },
            move_tree: this.makePuzzleMoveTree(["fqepgr"], ["epfq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many black stones as possible.");
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
                black: "aqapaobobncndncpcqdreqfrdl",
                white: "arbrbqbpcodoeodqfqfpgrhqfm",
            },
            move_tree: this.makePuzzleMoveTree(["crdpepdqds"], ["dpcr", "epcr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many black stones as possible.");
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
                black: "brcrdrdqcpcoesfsfrfqgphqhoirhmfn",
                white: "cqbqcndpepfpeqergqgrdmdk",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscsgsdsar"],
                ["gsds", "bpbo", "dobp", "bobp"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "crcqdqbqbsarbpaperfqfpgq",
                white: "bocpdpdreqepcnfoeohoiqir",
            },
            move_tree: this.makePuzzleMoveTree(["frdsgr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many black stones as possible.");
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
                black: "brbqbpcododpdqepgqfrer",
                white: "crcqcpbocnbmdneofogphqhogreqenap",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drfqfpeqes", "drfqfpeqfs"],
                ["fpdr", "fqdr", "aqdr"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "doeocpbpdqfngoergqhnhq",
                white: "bocodnenfoeqfqcqbqcnel",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpepfpdpdr"],
                ["dpepfpdpapdr", "epfp", "fpdp"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "erfrhqdqdpcpbocnaniodlbl",
                white: "apbpbqbrardrcqcseqepeoaogn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cododncocmbnbm"],
                ["doco", "dncocmbm", "gqgr"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "crcqdqdpdoenfngohoerfqgqiq",
                white: "drcsbrbqcpcodnemfmcmbpgnfpgmdsbs",
            },
            move_tree: this.makePuzzleMoveTree(["foeoeq"], ["eofo", "eqfo", "epeq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many black stones as possible.");
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
                black: "cpbpdoeocmbmfpgpgqfrhremgm",
                white: "cqdpepeqfqercocn",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "bobqbrcraqdqapcqcs",
                    "bobqbrcraqdqapcqdr",
                    "bobqbrcrapdqaqcqcs",
                    "bobqbrcrapdqaqcqdr",
                ],
                ["bobqapbr", "bobqcrao", "bqbo"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "crcqdqeqepgqaqapaobocodoblcndmbm",
                white: "csbrarbqbpcpdperdrhqeofnfldn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fqfpgpfrfofqgr", "fqfpgpfrfofqfs"],
                ["fqfpgpfrgrbs", "fqfpfogp", "fpfq"],
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
        return _("White to play. Capture as many black stones as possible.");
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
                black: "crdrdqepfpgqgrcogn",
                white: "dpdocnbocqeqerfrdn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brbqcscpdscqaq", "brbqcscpdscqbp", "brbqdscpcscqbp", "brbqdscpcscqaq"],
                ["dsbr", "csbr", "bqes"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
