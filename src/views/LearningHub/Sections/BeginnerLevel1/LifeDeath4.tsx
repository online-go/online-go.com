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

export class BL1LifeDeath4 extends LearningHubSection {
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
        return "bl1-life-death-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning first make eye", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on first make eye",
            "First make an eye",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White can choose to play at A and make an eye, or play at B to close his territory. But playing at B is a mistake (try it). You should first make an eye. White to play. First make an eye and make the white group alive.",
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
                black: "bqcqcsdqeqfqfrhr",
                white: "arbrcrdrer",
            },
            marks: { A: "bs", B: "es" },
            move_tree: this.makePuzzleMoveTree(["bsesds"], ["esbs"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncodofoapbpaqdqeqfqcrfrcs",
                white: "cpbqcqarbrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["bsesds"], ["dsbs", "esbs"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepfpbqcqgqhqbrerhrbs",
                white: "dqeqfqcrfrgrcsgs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["dres"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doapbpcpaqdqeqergrcs",
                white: "bqcqarbrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["crbs", "esbs"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcpdpfpaqeqerbses",
                white: "bqcqdqarbrdr",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["dscs"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocpdpfpbqeqercses",
                white: "dqarbrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["bscqcr"], ["cqbs", "crbs", "aqbs"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofogoiocphpcqhqcrgrhr",
                white: "epfpgpgqdrfrfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqdses"],
                ["dqdseseq", "dpdqeqds", "cseqdqer", "dseqdqer"],
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
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            initial_state: {
                black: "focpdpepbqfqgqhqbrdrhrjrds",
                white: "cqdqeqcrfrgrcsgs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["eres", "hses", "bses"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codpepfpbqcqfqgqhqbrhrbs",
                white: "dqeqcrerfrgrcs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsgsfs"],
                ["gsdsdres", "gsdsesdr", "esgs"],
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
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofohobpcpdpgpbqgqbrgrfsgs",
                white: "epfpcqdqfqcrfrcs",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["eser"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "godpepfpbqcqgqhqbrerhrbs",
                white: "dqeqfqcrgrcses",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drgsfr"],
                ["frdrdsgs", "frdrgsds", "gsdr", "hsdr", "fsdr"],
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
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cneobpcpeqbrer",
                white: "bqardr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscrcq"],
                ["cqbs", "crbs", "dqcq", "dscq"],
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
        return _("White to play. First make an eye and make the white group alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "coeodpfpgpipbqcqhqbrhrhs",
                white: "dqeqgqcrdrgrcsgs",
            },
            move_tree: this.makePuzzleMoveTree(["esfqfr"], ["fqes", "fres"], 19, 19),
        };
    }
}
