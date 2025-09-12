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

export class BL2Seki extends LearningHubSection {
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
        return "bl2-seki";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning make seki", "Seki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on make seki", "Make seki");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black has two eyes and 6 points (5 territory and 1 prisoner). However, White can make seki and cancel these points by playing at A. Black can not capture the two white stones in the corner: Black will put his stones in atari by responding at B. White to play. Make seki.",
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
                black: "aoapaqbobqcpcqcrcs",
                white: "anarbncodndpdqdrds",
            },
            marks: { A: "bs", B: "br" },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dndocpepfpcqfqcrfrcsfs",
                white: "eofogodpgpdqgqdrgrgs",
            },
            marks: { triangle: "dpdqdr" },
            move_tree: this.makePuzzleMoveTree(["ds"], ["erds", "esds", "eqds"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbndnencofogoepaqbqcqdqfq",
                white: "bmcmdmemfmfneoapbpcpdp",
            },
            marks: { triangle: "eoapbpcpdp" },
            move_tree: this.makePuzzleMoveTree(["docnam"], ["amdo", "bodo", "aodo"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aoboapcpbqcqcrcs",
                white: "anbncncodpdqbrdrbsds",
            },
            marks: { triangle: "brbs" },
            move_tree: this.makePuzzleMoveTree(["ar"], ["aqar", "asar"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmbncndneoepbqcqdqarbs",
                white: "blclcmdmemencodoapbpcpaq",
            },
            marks: { triangle: "aqcpbpapdoco" },
            move_tree: this.makePuzzleMoveTree(["ao"], ["alao", "bodp", "dpao"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqcrdrercses",
                white: "apbpcpdqeqfqfrbsfs",
            },
            marks: { triangle: "bs" },
            move_tree: this.makePuzzleMoveTree(["ar"], [], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "boapbpcpcqbrcrdrds",
                white: "anbncnaocodpaqdqfqareres",
            },
            marks: { triangle: "araq" },
            move_tree: this.makePuzzleMoveTree(["bs"], ["asbs"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpbqeqfqbrfrgrhrbsfshs",
                white: "epfpcqdqgqhqiqcrircsdsis",
            },
            marks: { triangle: "cqdqcrcsds" },
            move_tree: this.makePuzzleMoveTree(["er"], ["eser", "drer"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepaqbqcqeqcrdrerds",
                white: "cndoeofoapbpcpfpfqbrfrbsesfs",
            },
            marks: { triangle: "brbs" },
            move_tree: this.makePuzzleMoveTree(["ar"], [], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            initial_state: {
                black: "fncodoeogodpdqarbrcrerfrgrhrbsfshs",
                white: "bnboapcpaqbqcqeqfqgqhqiqkqdriris",
            },
            marks: { triangle: "dr" },
            move_tree: this.makePuzzleMoveTree(["ds"], [], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndndoapbpdpfpbqeqarbrfrfs",
                white: "aobococpcqdqcrerbsds",
            },
            marks: { triangle: "aobococpcqdqcrerbsds" },
            move_tree: this.makePuzzleMoveTree(["es"], ["ascsbses", "cses"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnaobocodoepeqarbrcrdrer",
                white: "clbmcndneneodpaqbqcqdq",
            },
            marks: { triangle: "dpaqbqcqdq" },
            move_tree: this.makePuzzleMoveTree(
                ["amcpan"],
                ["cpbp", "bpap", "apbp", "anamcpbp", "anambpap", "anamapbp", "anamalcp"],
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
        return _("White to play. Make seki and rescue the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmcndodpaqbqdqbrdrbsds",
                white: "anbnaocobpcpcqcrcs",
            },
            marks: { triangle: "anbnaocobpcpcqcrcs" },
            move_tree: this.makePuzzleMoveTree(["as", "ar"], ["apbo"], 19, 19),
        };
    }
}
