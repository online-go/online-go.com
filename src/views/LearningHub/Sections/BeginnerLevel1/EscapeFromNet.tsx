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

export class EscapeFromNet extends LearningHubSection {
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
        return "escape-from-net";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning escape from the net", "Escape net");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on escape from the net",
            "Escape from the net",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. White can try to escape by playing at A or B. In this case one of the two is successful. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clbncoeobpcqdqeq",
                white: "cpdpbqfqgqbrcrer",
            },
            marks: { 1: "eo", square: "dpcp", A: "ep", B: "do" },
            move_tree: this.makePuzzleMoveTree(["ep"], ["dodn", "drep"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "embndncoeobpcqeq",
                white: "docpdpbqgqbrerfr",
            },
            marks: { 1: "eq", square: "dpcpdo" },
            move_tree: this.makePuzzleMoveTree(["dq"], ["epfp", "crdq"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eogogpeqgqdrerfr",
                white: "coiocpfpdqfqhqcrgrir",
            },
            marks: { 1: "eo", square: "fqfp" },
            move_tree: this.makePuzzleMoveTree(["ep"], ["fofn", "dpep"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fndpepfpcqiqcrdrfr",
                white: "cmcocpbqdqeqbrcs",
            },
            marks: { 1: "fr", square: "eqdq" },
            move_tree: this.makePuzzleMoveTree(["er"], ["dser", "fqgq"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocoeobpcqdqeqfqhr",
                white: "dlcnencpdpbqarcrdrer",
            },
            marks: { 1: "eo", square: "dpcp" },
            move_tree: this.makePuzzleMoveTree(["do"], ["epfp"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmemgmeneogocpdpgpeqfqgr",
                white: "fnfoepfpdqgqhqbrdr",
            },
            marks: { 1: "gm", square: "fpepfofn" },
            move_tree: this.makePuzzleMoveTree(["fr"], ["erfr", "fmfl", "gnhn"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnfndpfpdqfqergr",
                white: "eobpepbqeqcrdr",
            },
            marks: { 1: "dn", square: "eqepeo" },
            move_tree: this.makePuzzleMoveTree(
                ["dococp"],
                ["docoenem", "docofogo", "enemdoco", "enemfogo", "fogoenem", "fogodoco"],
                19,
                19,
            ),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dogodpeqfqgqgr",
                white: "dmcpepfpdqcrerfr",
            },
            marks: { 1: "go", square: "fpep" },
            move_tree: this.makePuzzleMoveTree(
                ["eoendn"],
                ["eoenfnfo", "eoengphp", "gphp", "eneo", "fofn", "fnfo"],
                19,
                19,
            ),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnfncogocpfpdqeqfqer",
                white: "eofodpepgphpbqcqiqbrdrgrcs",
            },
            marks: { 1: "dn", square: "epdpfoeo" },
            move_tree: this.makePuzzleMoveTree(
                ["gnhoenfmem"],
                ["gnhofmen", "enem", "gqen", "esen", "fren"],
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
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnfncocpdpgphpcqeqfqgr",
                white: "dmdoeoepfpbqdqbrcrdr",
            },
            marks: { 1: "fn", square: "fpepeodo" },
            move_tree: this.makePuzzleMoveTree(
                ["encnfm", "encnem", "encnel"],
                ["cnen", "gofo", "fogo"],
                19,
                19,
            ),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofogodpgpdqcrdrfr",
                white: "dnbodocpephpcqeqbrhr",
            },
            marks: { 1: "fr", square: "eqep" },
            move_tree: this.makePuzzleMoveTree(
                ["erescs", "eresdscsbs"],
                ["gqfq", "fqgq", "cser", "eser"],
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
        return _(
            "White to play. Black intends to capture the marked stones in a net with 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dogodpeqfqgq",
                white: "epfpcqdqhq",
            },
            marks: { 1: "go", square: "fpep" },
            move_tree: this.makePuzzleMoveTree(
                ["gphphoipfognfnfmgmhnemflen"],
                [
                    "gphphoipfognfnfmgmhnemfldnen",
                    "gphphoipfognfnfmgmhnioen",
                    "gphphoipfognfnfmemen",
                    "gphphoipfognenfneoem",
                    "gphphoipgnfo",
                    "gphphoipeoen",
                    "gphpfofn",
                    "fofn",
                    "eoen",
                    "eneo",
                    "fnfo",
                ],
                19,
                19,
            ),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmdnfnbocoepfpbqcqdq",
                white: "blcmcndoeodpeqgqcrdrerhr",
            },
            marks: { 1: "fn", square: "dpeodo" },
            move_tree: this.makePuzzleMoveTree(
                ["fogogp"],
                ["fogognen", "fogoenem", "enem", "cpbp"],
                19,
                19,
            ),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fndodpgpcqfqcrdrer",
                white: "bpcpepfpdqeq",
            },
            marks: { 1: "fn", square: "eqdqfpep" },
            move_tree: this.makePuzzleMoveTree(
                ["gqfrgohpfo"],
                [
                    "gqfrfogo",
                    "gqfreoen",
                    "gqfreneo",
                    "gqfrhpgo",
                    "gofo",
                    "eneo",
                    "eoen",
                    "fogo",
                    "frgq",
                ],
                19,
                19,
            ),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emcndnfncodpdqeqfq",
                white: "dmendoeoiocpepcqcr",
            },
            marks: { 1: "fn", square: "epeodoen" },
            move_tree: this.makePuzzleMoveTree(["fmelfogngo"], ["fogo", "gofo", "fpgp"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fndodpgpeqfqdr",
                white: "epfpcqdqer",
            },
            marks: { 1: "fn", square: "fpep" },
            move_tree: this.makePuzzleMoveTree(
                ["gqfrgohpfo", "gqfrgresgohpfo"],
                [
                    "gqfrgohphofo",
                    "gqfrgresgohphofo",
                    "gqfrgreshpgo",
                    "gqfrhpgo",
                    "eoen",
                    "eneo",
                    "crfo",
                    "fogo",
                ],
                19,
                19,
            ),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "boeogocpdpeqfqgq",
                white: "embpepfpaqcqdqbrer",
            },
            marks: { 1: "go", square: "fpep" },
            move_tree: this.makePuzzleMoveTree(["docofo"], ["docodnfo", "fofn", "gphp"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hneogodpgpfqdrfr",
                white: "ioepfphpeqgqhq",
            },
            marks: { 1: "dr", square: "eqfpep" },
            move_tree: this.makePuzzleMoveTree(
                ["fofndoendqcpcq", "dofodqcpcq"],
                [
                    "fofndoendqcpercq",
                    "fofndoeneres",
                    "fofndoencpdq",
                    "fofneres",
                    "fofndqcq",
                    "fofnendo",
                    "dqcq",
                    "eresgrfs",
                    "eresdqcq",
                    "eresfofn",
                ],
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
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncnfnbobpcpdpfpeqfq",
                white: "codoeoepbqcqdqerfrgr",
            },
            marks: { 1: "fn", square: "epeodoco" },
            move_tree: this.makePuzzleMoveTree(
                ["fogogp"],
                ["fogoenem", "fogodndm", "enem", "dndm", "emen", "dmdn"],
                19,
                19,
            ),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stone in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dogogpeqfq",
                white: "iofphpgqhq",
            },
            marks: { 1: "do", square: "fp" },
            move_tree: this.makePuzzleMoveTree(
                ["fofngn"],
                ["fofneoen", "fofneneo", "fofnhogn", "epdp", "eoen", "fnfo", "eneo"],
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
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emcndngncodpfpgpdqfqdrer",
                white: "clcmbnbodoeofobpcpepeqiqfr",
            },
            marks: { 1: "gn", square: "eqepfoeodo" },
            move_tree: this.makePuzzleMoveTree(
                ["gohohpgqgr"],
                ["gohohnfn", "gohofnfm", "endmgoho", "endmfnfm", "endmfmfn", "fnfm"],
                19,
                19,
            ),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dogobpgpfqdrerfr",
                white: "epfpeqgqhq",
            },
            marks: { 1: "do", square: "eqfpep" },
            move_tree: this.makePuzzleMoveTree(
                ["eneofofngnfmho", "fofneneognfmho"],
                [
                    "eneofofngnfmhndp",
                    "eneofofngnfmgmdp",
                    "eneofofngnfmdndp",
                    "eneofofngnfmdpcp",
                    "eneofofndpcp",
                    "eneofofndqcq",
                    "eneodpcp",
                    "eneocpdp",
                    "eneodqcq",
                    "dqcq",
                    "dpcp",
                    "fofneneognfmhndp",
                    "fofneneognfmhphohnio",
                    "fofneneognfmhphoiohn",
                    "eoenfnfodnemdpco",
                ],
                19,
                19,
            ),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnfngncogocpgpbqdqeqgqdrfres",
                white: "eldoeofobpdpfpcqfqgrhr",
            },
            marks: { 1: "dn", square: "fqfpdpfoeodo" },
            move_tree: this.makePuzzleMoveTree(["cnboen"], ["enem"], 19, 19),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Black intends to capture the marked stones in a net with move 1. Escape from this net.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndpeqbrdrer",
                white: "emeoepcqdq",
            },
            marks: { 1: "br", square: "dqcq" },
            move_tree: this.makePuzzleMoveTree(["cocpbp"], ["cpdo", "crbq", "bqcp"], 19, 19),
        };
    }
}
