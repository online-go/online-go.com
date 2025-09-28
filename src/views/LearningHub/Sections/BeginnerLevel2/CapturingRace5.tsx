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

export class BL2CapturingRace5 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07];
    }
    static section(): string {
        return "bl2-capturing-race-5";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning throw in", "Capturing Race");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on throw in", "Throw in");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If your opponent already has an eye, you can try to make it a false eye. By throwing in at A, White makes the black eye false. Now White can win the capturing race. White to play. Win the capturing race by throwing in.",
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
                black: "apbpcocpcrdldodqdseqesfqfr",
                white: "aqarbqbscqcsdpepfpgqgrhp",
            },
            marks: { A: "dr" },
            move_tree: this.makePuzzleMoveTree(["drergsbrdrcrfs"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clbocodoeodpeqbrerbscses",
                white: "bpepfpbqdqfqarcrdrfrhr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cqcpdscqap", "cqcpdscqaqapao"],
                ["cqcpapfs", "dscq", "cpfs"],
                19,
                19,
            ),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocodofoapepeqdr",
                white: "bpcpdpaqdqgqarbrerfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqcqcrbqbs"],
                ["bqcqcrbqasbs", "cqbq", "crbq"],
                19,
                19,
            ),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbpcpcqdqcrer",
                white: "bqeqfqgqbrdrcsds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsasesbsaq", "bsasesbsaraqap"],
                ["bsasaqfr", "esbs", "asfr"],
                19,
                19,
            ),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hodqeqhqcrdrfrgr",
                white: "cocpfpcqfqbrercsdses",
            },
            move_tree: this.makePuzzleMoveTree(["bsasfsbsbq"], ["fsbs"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpbqdqeqfqarbrfrhr",
                white: "cnbobpcqcrdrerbses",
            },
            move_tree: this.makePuzzleMoveTree(["csdsfs"], ["fscs", "dscs"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnbpcpdpcqeqerdses",
                white: "fnepfpaqbqdqfqcrdrhrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brarcsbrap"],
                ["brarapfr", "csbr", "apbr"],
                19,
                19,
            ),
        };
    }
}
