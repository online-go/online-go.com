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

export class FirstLine extends LearningHubSection {
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
        return "first-line";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture on first line", "First Line");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture on first line",
            "Capture stones on the first line",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "It is difficult to escape with stones on the first line. Black to play. Capture the marked stone on the first line.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eqdr",
                white: "ds",
            },
            marks: { triangle: "ds" },
            move_tree: this.makePuzzleMoveTree(
                ["escscr", "escsbr", "escsbscrcq", "csesfs"],
                [],
                19,
                19,
            ),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fqer",
                white: "brhrbses",
            },
            marks: { triangle: "es" },
            move_tree: this.makePuzzleMoveTree(["dsfsgs"], ["dsfsgrdr", "fsds"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gqdrfr",
                white: "crhrircsfs",
            },
            marks: { triangle: "fs" },
            move_tree: this.makePuzzleMoveTree(["gsesds"], ["gseserds", "esgs"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gqcrdrfr",
                white: "hrircsdsfs",
            },
            marks: { triangle: "fs" },
            move_tree: this.makePuzzleMoveTree(["gsesbs", "gseser"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dr",
                white: "es",
            },
            marks: { triangle: "es" },
            move_tree: this.makePuzzleMoveTree(["fr"], ["erfr", "dsfr", "fser"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpbqbrdrbscs",
                white: "cocpcqcrirdses",
            },
            marks: { triangle: "esds" },
            move_tree: this.makePuzzleMoveTree(
                ["erfsgr"],
                ["erfsfrgs", "erfsgsfr", "fser", "frer"],
                19,
                19,
            ),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "crer",
                white: "dses",
            },
            marks: { triangle: "esds" },
            move_tree: this.makePuzzleMoveTree(["frdrdq"], ["drfr", "fsfr", "csfr"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dqcr",
                white: "dses",
            },
            marks: { triangle: "esds" },
            move_tree: this.makePuzzleMoveTree(
                ["frfsgr"],
                ["frfsgsgr", "frfsergr", "fsfr", "csfr"],
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
        return _("Black to play. Capture the marked stones on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqcr",
                white: "dses",
            },
            marks: { triangle: "esds" },
            move_tree: this.makePuzzleMoveTree(
                ["frdqeqdrdp"],
                ["frdqdrereqfq", "frdqerdr", "erfr", "fsfr", "csfr"],
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
        return _("Black to play. Capture the marked stones on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            initial_state: {
                black: "eqfqgqiq",
                white: "cqesfs",
            },
            marks: { triangle: "fses" },
            move_tree: this.makePuzzleMoveTree(
                ["drhrirhqhp", "drhrhqirjr", "drhrgrgshqirjr"],
                ["drhrirhqgrgshpis", "hrdr", "erdr", "dqdr"],
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
        return _("Black to play. Capture the marked stone on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpbqbrirbscs",
                white: "cocpcqcrgrds",
            },
            marks: { triangle: "ds" },
            move_tree: this.makePuzzleMoveTree(["dreserfsfrgsgq"], ["erdr", "esdr"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone on the first line.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqeq",
                white: "hphqhrds",
            },
            marks: { triangle: "ds" },
            move_tree: this.makePuzzleMoveTree(
                ["frfsgsesgr", "drercsesfr"],
                ["frfsgsescsgr", "frfsesergsesgrcrbrfq", "eresfsfr", "csesfrfsgsgr"],
                19,
                19,
            ),
        };
    }
}
