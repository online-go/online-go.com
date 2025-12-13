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

export class BL4Connect1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-connect-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning connect", "Tesuji");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on connect", "Connect");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "There are several tesuji's to connect underneath ('watari' in Japanese). This is a connect tesuji using a knight's move. By playing at A, Black can connect their stones. Black to play. Connect the black stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdpgqhq",
                white: "cnenepfpgnipiq",
            },
            marks: { A: "er" },
            move_tree: this.makePuzzleMoveTree(["ereqdrdqcq"], ["eqfqfrer", "ereqdqfr"], 19, 19),
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
            "Another connect tesuji is the diagonal ('kosumi' in Japanese). By playing at A, Black can connect their stones. Black to play. Connect the black stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cqdqdrhrioiq",
                white: "bpcpdpeoeqfqgq",
            },
            marks: { A: "es" },
            move_tree: this.makePuzzleMoveTree(["esgrgs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "A third connect tesuji is the clamp ('hasami tsuke' in Japanese). By playing at A, Black can connect their stones. Black to play. Connect the black stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "codqdrhqhr",
                white: "eperfpgphpiqir",
            },
            marks: { A: "fr" },
            move_tree: this.makePuzzleMoveTree(["freqes"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "You can sometimes use shortage of liberties to connect underneath. If Black plays at A, White can not respond at B, due to a shortage of liberties. Black to play. Connect the black stones.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bscpcqcrdmdndpfrgrhq",
                white: "csdqdreneperfqhmhohpirjpjq",
            },
            marks: { A: "es", B: "ds" },
            move_tree: this.makePuzzleMoveTree(["es"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "drcrcqdncndlem",
                white: "ereqdqcpdoenfnhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpbocodpbq", "bpbocodpaq", "bpbocodpbr", "bpbocodpar"],
                ["bpbocodpbnbqaobr", "bobp", "apbo", "bnbp", "bqbp"],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "doeoengoeqdqinfl",
                white: "crcqdpepcodndmckgqiq",
            },
            move_tree: this.makePuzzleMoveTree(["fpcpfq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bsbrbqcperfrfqfpfoiq",
                white: "bpbocncqcrdrdpepeqendl",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["csds", "escs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dqeqfqhpcpbpbmcmdmdnfl",
                white: "bqcqdrerdpdocnbneneognim",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aoanco"],
                ["anao", "apcoanaoboaq", "boan", "coap"],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "fpepdpbrbscsaobocodrer",
                white: "cpdocnbnancrcqdsesfsfrgqgpdnhofn",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["bqbp", "bpbq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "crbrbqbpbobncmclfq",
                white: "cqcpcodndldkdrhqhohmfn",
            },
            move_tree: this.makePuzzleMoveTree(["erdsdq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dqcqcmcldk",
                white: "dpepeqfrhqdnfn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bo"],
                ["bpbo", "bnbo", "cncp", "cpcn", "cocpbpbobnbq"],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcpcoepdrcm",
                white: "crdqdperfohpgqfm",
            },
            move_tree: this.makePuzzleMoveTree(["doeqeo"], ["eqdo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
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
                black: "gngqgrbqbpcrdrgseripbocmjqjrhp",
                white: "cqdqcoemfpeqeohqfrhrhsgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["es"],
                ["fsesfqfr", "fsesdsfqesbr", "fqfs"],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpcqdqgqip",
                white: "dpdocoeqfpcl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erfrfq"],
                ["frer", "drer", "eserfrdr", "eserdrfs", "fseresdr", "grer", "dseresfr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
