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

export class BL3PreparatoryAtari1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10];
    }
    static section(): string {
        return "bl3-preparatory-atari-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning preparatory atari", "Preparatory Atari");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on preparatory atari",
            "Play a preparatory atari",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Often you need a combination of techniques to reach your goal. A preparatory atari can be useful in such combinations. First, you put stones in atari, that you can not, or do not want to, capture. By doing this, other stones can come into an advantageous position for you. Here, Black can put some stones in atari by playing at A and then capture stones in a snapback. Black to play. Capture stones using a preparatory atari.",
        );
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
                black: "bobpbqcqdldmdrenerfpfqgr",
                white: "bnckclcmcocpdodqepeq",
            },
            marks: { A: "eo" },
            move_tree: this.makePuzzleMoveTree(["eodpcn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "cpdqeqfqepeogphp",
                white: "crcqdpdobpenfofpgqgriq",
            },
            move_tree: this.makePuzzleMoveTree(["dncofn", "fngodn"], ["codn", "gofn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "apaobocodoepfqfogq",
                white: "aqbpcpdpeqfrgrcrhrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqardq", "dqerbq"],
                ["bqarbrcq", "bqarcqdq", "bqarerdq", "erdq", "arbq"],
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
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "hncqbpbqcrbsarcsgqeqfqhpepdrip",
                white: "escpdqdperhrhqgpfpcncleobogs",
            },
            move_tree: this.makePuzzleMoveTree(["docofo", "fogodo"], ["codo", "gofo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "brbqcrdrereqfr",
                white: "grhrfqepdqcqbpcohocn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpcpfp", "fpgqdp"],
                ["dpcpeofp", "dpcpgqfp", "gqfp", "fpgqeodp", "cpdp"],
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
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "csbrbqbpbocp",
                white: "cqcrdserdpcobnbm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["docndq", "dqdrdo"],
                ["cndo", "drdq", "bsdn"],
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
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "csdsdrdqdpcpdodncmclel",
                white: "arbscrcqbpcocnbmblbk",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqbrbo", "bobnbq"],
                ["bqbrapaq", "bqbrbnbo", "bnbo", "bobnbrbq", "bobnapbq", "brbq"],
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
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "flkpgnhniocpcncrcmfmdqdpepfpfojo",
                white: "brbqcqdreqfqgpgohoiripbpinhmgmboiqik",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gqhper", "ercsgq"],
                ["gqhpfrer", "imjn", "fngr"],
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
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "cqdqercpcobnbmclaq",
                white: "cmcnblckdkdodpeqfrgqgn",
            },
            move_tree: this.makePuzzleMoveTree(["epfqdn", "dndmep"], ["dmdn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a double-atari after a preparatory atari.");
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
                black: "cqdqdpepfpfofngmhq",
                white: "bqcrdrareqfrfmeneodocpdl",
            },
            move_tree: this.makePuzzleMoveTree(["cobpem", "emflco"], ["bpco", "fqer"], 19, 19),
            /* cSpell:enable */
        };
    }
}
