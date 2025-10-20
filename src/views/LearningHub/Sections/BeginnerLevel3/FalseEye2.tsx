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

export class BL3FalseEye2 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-false-eye-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning throw in twice", "False Eye");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on throw in twice", "Throw in twice");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "You can sometimes make an eye false by trowing in. In this example, White needs to throw in twice to make the black eye false. First, White throws in at A and after Black has captured the two white stones, White can throw in again. Make the black eye false by throwing in twice.",
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
                black: "arbrbscrdrerfs",
                white: "bpbqdqeqfpfrgres",
            },
            marks: { A: "ds" },
            move_tree: this.makePuzzleMoveTree(["dscsesds"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "dnbocodpephpcqfqgqcrhrires",
                white: "bpaqbqbrdrerfrgrascsgs",
            },
            move_tree: this.makePuzzleMoveTree(["dsfsds"], ["fsds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "bpfpcqdqeqfrgres",
                white: "arbrcrdrerbsfs",
            },
            move_tree: this.makePuzzleMoveTree(["dscses"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "bldlcmdnaodocpepbqcqdrfr",
                white: "anbncncobpaqarbrcrcs",
            },
            move_tree: this.makePuzzleMoveTree(["apboap"], ["boap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "cnbohocpepfpgpcqdqhqcrhrasfs",
                white: "bpaqbqeqfqgqbrdrergrcsdsgs",
            },
            move_tree: this.makePuzzleMoveTree(["bsarbs"], ["arbs", "esbs", "frbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "cmbocoeogodpcqfqhqdrerfr",
                white: "apbpcpdqeqarbrcrcs",
            },
            move_tree: this.makePuzzleMoveTree(["bqaqcq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "codoeogobpfpbqeqgqhqbrcrhr",
                white: "dpepcqfqdrfrgresgs",
            },
            move_tree: this.makePuzzleMoveTree(["dqerdqeqcp"], ["erdq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "clbmfmcndnengnhndoiofpipdqiqbrcrdrergrhr",
                white: "bocoeofogoapcpdphpbqcqeqfqgqhq",
            },
            move_tree: this.makePuzzleMoveTree(["epgpep"], ["gpep"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "blglcmdmfmbngngohobpepbqcqdqfqgqhqbrhres",
                white: "dnenfncofocpdpfpeqcrdrerfrgrcsgs",
            },
            move_tree: this.makePuzzleMoveTree(["eodoep"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "bldlbncndoapdpepeqfrbs",
                white: "amanbobpbqcqdqardrds",
            },
            move_tree: this.makePuzzleMoveTree(["aoaqao"], ["aqao"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "eobpfpgpipbqdqeqhqdrhrbs",
                white: "fqgqarbrcrergrdsesgs",
            },
            move_tree: this.makePuzzleMoveTree(["csascs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "cldlelflbmbngnfobpcpepfphpbqdqbrgr",
                white: "dmemcnencodoeodpcqeqcrercses",
            },
            move_tree: this.makePuzzleMoveTree(["drdsdq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Make a false eye by throwing in twice.");
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
                black: "cmbncoeocpaqeqcrdrfr",
                white: "aobobpcqdqarbrbs",
            },
            move_tree: this.makePuzzleMoveTree(["bqapbq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
