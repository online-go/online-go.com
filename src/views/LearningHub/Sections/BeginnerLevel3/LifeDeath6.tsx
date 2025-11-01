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

export class BL3LifeDeath6 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-life-death-6";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture along the side", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture along the side",
            "Capture along the side",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bohpbqcqdqeqfqgqhr",
                white: "brcrdrerfrgr",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["gsar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcqdqeqfqgqhqiqjqbrjr",
                white: "crdrergrhrircsfsis",
            },
            move_tree: this.makePuzzleMoveTree(["fresgs", "frgses"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bofpbqcqdqeqfr",
                white: "arbrcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["esdsbs"], ["aqes"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bobqcqdqeqfqgr",
                white: "arbrcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["esdsbs"], ["fres"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "krarjqiqhqgqeqdqcqbqaqkp",
                white: "jrirhrgrerdrcrbr",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "frfsfqesgsjshs",
                    "frfsfqesbscsgsjshs",
                    "frfsfqesbscsjsisgs",
                    "frfsfqesbscsjsgsis",
                    "frfsfqesjsisgs",
                    "frfsfqesjsgsis",
                ],
                ["fsfr", "jsfs", "bsfs", "frfsgsfq", "frfsesfq"],
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
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqeqfqgqiqhr",
                white: "arbrcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscsesfrfsgsgrdsfs"],
                ["fres", "fses", "esbs"],
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
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bobqcqdqeqfqgqiq",
                white: "brcrdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["argrhr"], ["grar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bobqcqdqeqfqgqhqiqir",
                white: "brcrdrerfrgr",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["gsar", "hrar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bqdqeqfqgqiq",
                white: "arbrdrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["cr"], ["grcr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bpfpgpjpcqdqeqhqiqbrjr",
                white: "fqcrdrergrhrir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsisfrgqgs"],
                ["isfshsgq", "isfsgqhs", "isfscsgq", "csfsdsgq", "csfsgqds", "csfsisgq"],
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
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcqdqeqgqhqiqkqbrjrcs",
                white: "crdrerfrgrhrirbsis",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gsfsds", "gsdsfs"],
                ["fsgs", "jsgs", "dsgs"],
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
        return _("Black to play. Capture the group along the side.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "hrgqfqeqdqbqhpbpeocobo",
                white: "csgrfrerdrbrcqcp",
            },
            move_tree: this.makePuzzleMoveTree(["argses"], ["gsar", "dpar"], 19, 19),
            /* cSpell:enable */
        };
    }
}
