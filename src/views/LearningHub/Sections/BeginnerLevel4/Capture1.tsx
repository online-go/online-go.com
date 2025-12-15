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

export class BL4Capture1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-capture-1";
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
        return _(
            "Tesuji is a term used to indicate a tactical, clever move in a local position. An example is surrounding: you surround your opponent's stones, like with a ladder. Along the way, you sacrifice one or more stones, but you continue to atari. Finally, you capture the entire group. White to play. Capture as many black stones as possible.",
        );
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
                black: "cncocpdodqfnhohq",
                white: "bnbobpbqcmcrdkdndpdr",
            },
            move_tree: this.makePuzzleMoveTree(["eoepcqdpfp"], ["epeo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "This shape is called a crane's nest. You can capture the three black stones by playing the crane's nest tesuji, starting at A and using shortage of liberties. White to play. Capture the three black stones.",
        );
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
                black: "dpenepfp",
                white: "cocpdqeqfqgogp",
            },
            marks: { A: "eo" },
            move_tree: this.makePuzzleMoveTree(["eododnfofn"], ["eodofodn"], 19, 19),
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
                black: "crcqdpdoeq",
                white: "dqdrcpepeoen",
            },
            move_tree: this.makePuzzleMoveTree(
                ["codndm"],
                ["dnco", "cnco", "fqer", "bper"],
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
                black: "grfqerepdphp",
                white: "cqcpcndqeqfrdl",
            },
            move_tree: this.makePuzzleMoveTree(["fpfseo", "fpfsfo"], ["drfs", "gqfp"], 19, 19),
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
                black: "bqcqdreqfqfrgrhqhpho",
                white: "gqgpfpepdpdqcpbpdler",
            },
            move_tree: this.makePuzzleMoveTree(["cresbr"], ["aqbr"], 19, 19),
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
                black: "cmesdscscrcqcpepeqerdodnemcl",
                white: "eobsbrbqbpcobnfsfrfqfpfoendq",
            },
            move_tree: this.makePuzzleMoveTree(["dpdrdp"], [], 19, 19),
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
                black: "bqbpcqdqeqerfpdmemgmhnhq",
                white: "fqfrepdpcpcobodncmclhp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gofofn"],
                ["gpfo", "fogpgqgo", "fogpgogq"],
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
                black: "bqcqdodpepfpgqgrhpiqclel",
                white: "dqeqfqgpgocpcohm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dneneofofn"],
                [
                    "dneneofognem",
                    "dneneofoemgn",
                    "dnenfoeoemfngnfm",
                    "dnenfoeoemfnfmgn",
                    "fodn",
                    "endn",
                    "fncn",
                    "cndndmcm",
                ],
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
                black: "crdrdqcpbpepfqgrgpeohr",
                white: "frereqcqbrdpdocobodm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csbqdscqaq", "csbqdscqap", "dsbqcscqaq", "dsbqcscqap"],
                ["bqes", "apes", "escsbsbq", "escsgsbqbsar", "fsbq"],
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
                black: "dpcpbocncmcleqfqfpdk",
                white: "bpbqcqerfrgqgpgoendngliqep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqeofoepco", "dqeocodofo"],
                ["dqeofoepdoco", "fodq"],
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
                black: "dsdrcpbpepeoenfpfqfrdl",
                white: "bqcrerfsgrgqgpfofnfmhn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqeqcs"],
                ["dqeqesgs", "dqeqcqes", "eqdq", "cqdq"],
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
                black: "epeqdqcpdmfnhn",
                white: "cqbpbodrerfqgpbnfrdpip",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eodofpdpdn"],
                ["eododnfo", "fpeo", "coeo", "doeo"],
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
                black: "aqapbobncmdqcpcqcrerfqgqgrhp",
                white: "bsbrbqbpcododpepfpeqfremgm",
            },
            move_tree: this.makePuzzleMoveTree(["drdscs"], ["csdr", "esfs"], 19, 19),
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
                black: "brbqbpbocncmdoeofognhnfqfrckcshq",
                white: "crcqcpcodnenfngohoerfsgrhr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fpepeqgpdpfphp"],
                [
                    "epfpgqdpeqdr",
                    "epfpgqdpdqeqdrds",
                    "epfpeqgq",
                    "epfpdpgq",
                    "epfpgpgq",
                    "dpeqfpepgqgphpdr",
                    "dpeqfpepgqgpdrio",
                    "dpeqepfp",
                    "gqfm",
                    "eqfm",
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
                black: "epdpdqfqfresgshrhqioimhp",
                white: "bqcpdoeofpgpgqgreqcmfnbo",
            },
            move_tree: this.makePuzzleMoveTree(["drercqeqds"], ["cqdr", "erdr"], 19, 19),
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
                black: "bqcqbrdreqhq",
                white: "crdqdpcpbpdnfn",
            },
            move_tree: this.makePuzzleMoveTree(["ercsfq"], ["ercsfrfq", "aqfq", "epfq"], 19, 19),
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
                black: "dpepcqcrfqgqhqhpir",
                white: "dqeqfpeodmgphoio",
            },
            move_tree: this.makePuzzleMoveTree(["cpdocodnen"], ["cpdocodncnen", "docp"], 19, 19),
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
                black: "crdrerfrgshrhqhogp",
                white: "grgqfqeqdqcqbrbsclcoes",
            },
            move_tree: this.makePuzzleMoveTree(["fsdsfsescs"], ["csfs", "dsfs"], 19, 19),
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
                black: "arbqcrbscpcobmdlfl",
                white: "bpbocqdqdpfpiqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cndoen"],
                ["cndodneofnbn", "cndodneoenfo", "cndodneofoen", "cndoeodn", "dncn", "docn"],
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
                black: "brbqbpbocndmdlbmdpdqdrfpfoeoenfr",
                white: "cscrcqcpcododnemfmfngohnfqgqgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epeqgpepds"],
                ["epeqgpeperes", "epeqgpepfsbs", "gpep", "ereseqds", "eresepeq", "dses", "fsds"],
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
                black: "docobobpfoepdqdrdl",
                white: "bqcqcrcpdpeoar",
            },
            move_tree: this.makePuzzleMoveTree(["eqener"], ["fpeqfqen", "enfq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
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
                black: "crbqcpdpeqfqgrhqirioaq",
                white: "hrgqgpfpepdocobpbnen",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frhsdq", "dqcqfr"],
                ["frhserdqdrcqcsbs", "dqcqerfr", "dqcqdrer"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
