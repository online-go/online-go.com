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

export class BL3Seki2 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08];
    }
    static section(): string {
        return "bl3-seki-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capturing race", "Seki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capturing race", "Capturing race");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you want to win the capturing race, you should prevent your opponent from making a seki. So if seki is possible, you should take good care of that. If White plays at B, Black can make seki by playing at A. To prevent this to happen, White should play at C. White to play. Prevent seki and win the capturing race.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcrdpdqdsepfqgqgrgs",
                white: "dreqerfpgphphqhr",
            },
            marks: { A: "cs", B: "es", C: "fs" },
            move_tree: this.makePuzzleMoveTree(["fscshs"], ["escs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent seki and win the capturing race or make seki.");
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
                black: "hlinfogohodpepipdqiqcrdreriresis",
                white: "clbodoeocpfpgphpbqhqbrfrgrhrbsgs",
            },
            move_tree: this.makePuzzleMoveTree(["fq"], ["csfq", "hsfq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent seki and win the capturing race or make seki.");
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
                black: "ingohoepfpipeqiqcrdreriresis",
                white: "cldneofocpdpgpcqgqbrgrgs",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["hpcs", "hqcs", "hrcs", "hscs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent seki and win the capturing race or make seki.");
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
                black: "fnfohodpepgpdqhqiqdrirds",
                white: "cmbodoeocpfpbqfqbrfrgrhrhs",
            },
            move_tree: this.makePuzzleMoveTree(["fseres"], ["gqfs", "isfs", "esfs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent seki and win the capturing race or make seki.");
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
                black: "hsglhneofogodphpcqdqhqarbrdrhras",
                white: "gscmdmencodobpcpepfpaqfqerfrgres",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["dscs", "gpcs", "gqcs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent seki and win the capturing race or make seki.");
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
                black: "cmanbncocpfpcqdqeqhqfrasfs",
                white: "aobobpaqbqcrdrercses",
            },
            move_tree: this.makePuzzleMoveTree(["br"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent seki and win the capturing race or make seki.");
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
                black: "aqbqcqdqcrerdses",
                white: "apbpcpdpfpeqhqfrbsfs",
            },
            move_tree: this.makePuzzleMoveTree(["br"], ["csar", "arcs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent seki and win the capturing race or make seki.");
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
                black: "gscmcnfndoapbpcpdqeqerfrgr",
                white: "fpdpephpaqbqcqfqgqarcrhrascshs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdrbr", "esdrbs"],
                ["dses", "drds", "bres", "bses"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
