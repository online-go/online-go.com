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

export class BL3LifeDeath16 extends LearningHubSection {
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
        return "bl3-life-death-16";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture", "Life&Death");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture", "Capture group");
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
            /* cSpell:disable */
            initial_state: {
                black: "craqapbpcpdpepfqfrfses",
                white: "arbrbqcqdqeqerds",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["csbsdrds", "drcs"], 19, 19),
            /* cSpell:enable */
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
            /* cSpell:disable */
            initial_state: {
                black: "bsbrbqcpdpepfpdsgqhphrhs",
                white: "cqcrcsdqeqfqgrgses",
            },
            move_tree: this.makePuzzleMoveTree(["fr"], ["erdr", "drer", "fsfr"], 19, 19),
            /* cSpell:enable */
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
            /* cSpell:disable */
            initial_state: {
                black: "bncocpdpcrdrerdn",
                white: "bsbrcqbpboao",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqarbqapbq"],
                ["aqarbqapdqbq", "aqardqbq", "aqaranbq", "aqarcsbq", "bqaq", "araq"],
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
        return _("Black to play. Capture the white group.");
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
                black: "aqanbncndodpdqcqdrdmfr",
                white: "cscrbrbqcpcoboao",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["aras", "apbp", "asar"], 19, 19),
            /* cSpell:enable */
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
            /* cSpell:disable */
            initial_state: {
                black: "aobncneoeperdrcsbsdsfrenblel",
                white: "arbrcrdqdpdocoboap",
            },
            move_tree: this.makePuzzleMoveTree(["bq"], ["anbq", "bpbq", "cqbq", "asbq"], 19, 19),
            /* cSpell:enable */
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
            /* cSpell:disable */
            initial_state: {
                black: "braqbpcpereqbncndpen",
                white: "bqcrcqapdrdsao",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                ["anbs", "esar", "esbs", "arbs", "asbs", "dqbs", "bobs"],
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
        return _("Black to play. Capture the white group.");
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
                black: "codrdsaqbpapardoepfpgqgrgobnir",
                white: "frfsesbsbrbqcpdpdqeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cr"],
                ["cqcr", "ercr", "cscr", "gscr", "ascr"],
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
        return _("Black to play. Capture the white group.");
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
                black: "brbqfrfscpcoepfpgphqhrhodo",
                white: "cscrcqeqerfqgqgrgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqdres"],
                ["dqdrdpes", "esdsfsdq", "esdsdqfs", "dses", "drdq"],
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
        return _("Black to play. Capture the white group.");
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
                black: "araobocodpdqdrdnfr",
                white: "bsbraqcqcpbp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apascr", "crasap"],
                ["apascscr", "crascsap", "cscr"],
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
        return _("Black to play. Capture the white group.");
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
                black: "brbkckcldmdndocpcqcrepbnamao",
                white: "arbqbpbococnbmblal",
            },
            move_tree: this.makePuzzleMoveTree(
                ["anapan"],
                ["apan", "aqan", "cman", "akan"],
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
        return _("Black to play. Capture the white group.");
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
                black: "arasfsgrfqeqcpbpapeodqhrgp",
                white: "aqbqbrcrdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdsbsgsfs"],
                ["esdsbsgshsfs", "esdsgsbs", "bscsases", "bscsesas", "dses", "csbs"],
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
        return _("Black to play. Capture the white group.");
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
                black: "cpcqdqerdseqcn",
                white: "bsbqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                ["bpar", "esar", "aqar", "csesards"],
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
        return _("Black to play. Capture the white group.");
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
                black: "brcrcpepfpgphpipiqirisdnco",
                white: "csdrdqeqfqgqhqhrhs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsesfr"],
                [
                    "esfsfrgr",
                    "esfsdsergrds",
                    "esfsdserdsgr",
                    "esfserds",
                    "esfsgrdsfrer",
                    "esfsgrdsgsfr",
                    "fsfrgses",
                    "fsfresgs",
                    "frfsesgr",
                    "frfsgrds",
                    "frfsergr",
                    "grfr",
                ],
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
        return _("Black to play. Capture the white group.");
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
                black: "apbpcpdpeqfqgrgpircs",
                white: "aqbqdqdrdserfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["cqcrbr"], ["crcq", "brcq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
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
            /* cSpell:disable */
            initial_state: {
                black: "apbpbmcmcnbkencqdqdrdsepeo",
                white: "aqbqbrcrcpcobobn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsaocs"],
                ["csbs", "anao", "aoan", "ascs"],
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
        return _("Black to play. Capture the white group.");
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
                black: "dsdreqepdocobofrenbm",
                white: "crbqbpcpdpdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscsbr"],
                [
                    "bscsarbrasaq",
                    "bscsarbraqap",
                    "bscsarbrapas",
                    "arbr",
                    "apbsaqar",
                    "apbscsaq",
                    "apbsaraq",
                    "brbs",
                ],
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
        return _("Black to play. Capture the white group.");
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
                black: "anbncodnepeodreqfr",
                white: "arcrbqcqcpbo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscsap"],
                ["bscsaoap", "aobs", "apbs", "csbs", "dsbs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
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
            /* cSpell:disable */
            initial_state: {
                black: "bqanbncndodpdqdrcr",
                white: "arbrbscqcpbpbo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apaqao"],
                ["apaqcsao", "apaqcoao", "aqap", "aoap", "csao", "coap"],
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
        return _("Black to play. Capture the white group.");
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
                black: "fsgrgqfpepdpcpbqcrbphp",
                white: "brcqdqdrdseqfqfr",
            },
            move_tree: this.makePuzzleMoveTree(["arbses"], ["esar", "bsar", "csar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
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
            /* cSpell:disable */
            initial_state: {
                black: "bsbrbqbpeqgrgqgpfoeodocoirho",
                white: "cscrcqcpdpepfpfqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsesdr"],
                [
                    "fsesgsdr",
                    "fseserdr",
                    "esfserdr",
                    "esfsdrer",
                    "erdresfs",
                    "erdrfses",
                    "erdrdses",
                    "drerfsdq",
                    "drerdqds",
                    "dreresdq",
                    "drerdsdq",
                    "dser",
                    "dqfs",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page21 extends LearningPage {
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
            /* cSpell:disable */
            initial_state: {
                black: "ambmcndmdodpdqcqdrfr",
                white: "crbrbqcpcobobn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aoapan"],
                [
                    "aoapcsan",
                    "aoapbsan",
                    "anaoapbparaq",
                    "anaoapbpaqar",
                    "anaoapbpcsbs",
                    "anaoapbpbscs",
                    "apaocsbs",
                    "apaoaqar",
                    "apaobpaq",
                    "apaoanbpcsbs",
                    "apaoanbpaqar",
                    "csapbsan",
                    "csapanao",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
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
            /* cSpell:disable */
            initial_state: {
                black: "arcrdrbocodndpdqbm",
                white: "braqcscqcpbp",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["apao", "asap", "bsas", "dsbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page23 extends LearningPage {
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
            /* cSpell:disable */
            initial_state: {
                black: "bocpdqdrdofrbn",
                white: "cscrcqbpaq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["br"],
                [
                    "aobrapas",
                    "aobrasap",
                    "arbraoas",
                    "arbrasap",
                    "bsbrasap",
                    "bsbraras",
                    "bsbraoap",
                ],
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
        return _("Black to play. Capture the white group.");
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
                black: "bqcsdsdrdqdpcobncmeo",
                white: "bsarcrcqbp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cpbrapaqao"],
                [
                    "cpbrapaqboao",
                    "cpbraqap",
                    "cpbrboap",
                    "cpbraoap",
                    "brcpaqap",
                    "brcpapaq",
                    "brcpboap",
                    "apcpaqao",
                    "apcpbobr",
                    "apcpbraq",
                    "apcpaoaq",
                    "aqap",
                    "boap",
                    "aoap",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
