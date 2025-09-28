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

export class BL2LifeDeath1 extends LearningHubSection {
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
        return "bl2-life-death-1";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning make eyes in correct order",
            "Life&Death",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on make eyes in correct order",
            "Make eyes in correct order",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If a group does not have two eyes yet, you should ensure that you always can make two eyes. If you need one move for each eye, it can be important to play those two moves in the correct order. In this example White can make two eyes by playing at A and B.  White has to choose between A and B as the first move. If White chooses the wrong one, he gets no chance to make the second. Make two eyes in the correct order.",
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
                black: "apbpcqdodqeqer",
                white: "bqbrbsdrds",
            },
            marks: { A: "aq", B: "cr" },
            move_tree: this.makePuzzleMoveTree(["craqar"], ["aqcr"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnbpcpdpfpeqerdses",
                white: "bqcqdqbrdrbs",
            },
            move_tree: this.makePuzzleMoveTree(["csaqar"], ["aqcs", "arcs", "apcs"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmbocoeodpdqdrcs",
                white: "apbpcparbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["bscqbq"], ["cqbs", "bqbs"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmbocoeocpdqdrds",
                white: "bpbqcqarcras",
            },
            move_tree: this.makePuzzleMoveTree(["apcsbs"], ["csap", "bsap"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eoapbpcpdqeqeres",
                white: "bqcqbrdrbs",
            },
            move_tree: this.makePuzzleMoveTree(["dsaqar"], ["aqds", "csds"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gpaqbqcqdqeqfqgrhr",
                white: "brcrdrerfrcs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arfses"],
                ["asar", "fsar", "esar", "gsar"],
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
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cneofohocpdpgpbqgqbrgrbsgs",
                white: "epfpcqdqcrerfres",
            },
            move_tree: this.makePuzzleMoveTree(["fqcsds"], ["csfq", "dsfq"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpdpepfpgphpcqhqbrhrbshs",
                white: "eqgqcrergrcsesgs",
            },
            move_tree: this.makePuzzleMoveTree(["dqfqfr"], ["drfqfrdq", "fqdr", "frdr"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndnfneoepaqeqcrdrerbs",
                white: "bocodobpcqdqarbr",
            },
            move_tree: this.makePuzzleMoveTree(["dpaoap"], ["aodp", "apdp", "bqdp"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndnenfnbogobpgpbqfqgqbrfr",
                white: "codoeofocpcqdqeqcrcs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eresdsfpep"],
                ["fper", "dser", "eser", "eper"],
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
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bodoeofogocpgpbqcqgqbrgrir",
                white: "dpfpdqfqcrdrerfrcs",
            },
            move_tree: this.makePuzzleMoveTree(["epfses"], ["fsep", "esep", "gsep"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bodoeofogoiocphpbqhqbrgrhrcsfsgs",
                white: "dpepfpgpcqdqcrerfres",
            },
            move_tree: this.makePuzzleMoveTree(["dsgqfq"], ["gqds", "fqds"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes in the correct order.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codoeofogohobpbqgqhqbrcrhrcshs",
                white: "cpepfpcqfqdrergres",
            },
            move_tree: this.makePuzzleMoveTree(["gsdpdq"], ["dpgs", "fsgs", "dqgs"], 19, 19),
        };
    }
}
