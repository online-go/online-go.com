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

export class BL1CloseTerritory extends LearningHubSection {
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
        return "bl1-close-territory";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning close territory", "4.20 Territory");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on close territory",
            "Close your territory",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black's group is safe, because it has two eyes. In the endgame Black can make two more territory points. Black to play. Play the best move to close Black's territory.",
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
                black: "aparbrcqcsdqdrds",
                white: "aobocpdndpeqeresfsgr",
            },
            marks: { cross: "bp" },
            move_tree: this.makePuzzleMoveTree(["bp"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqdqbrcreres",
                white: "apbpcpdpepcqfqfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["eq"], ["dreq"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndndocpcrdrds",
                white: "ambmcmdmemeneoepdqeqeres",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["dpcqbqbr"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnaocobpcpbqdqdrds",
                white: "clambmcndndofoepeqeres",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["dpan"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndncpdqbrdrds",
                white: "ambmcmdmemendoeoepeqeres",
            },
            move_tree: this.makePuzzleMoveTree(["co"], ["dpcobobp", "dpcobpbo"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbnbodobqdqdrds",
                white: "ambmcmdmeneodpepeqeres",
            },
            move_tree: this.makePuzzleMoveTree(["cp"], ["cocp", "dncp"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmcndncpdpbqdqcrbs",
                white: "alblcldmemencodoeoepeqdrfrcsds",
            },
            move_tree: this.makePuzzleMoveTree(["bo"], [], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeoapbpcpeqcreres",
                white: "bmcndnenfnaobofogpfqfrgs",
            },
            move_tree: this.makePuzzleMoveTree(["ep"], ["fpep", "coepdpfp"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdmdnbodobqdqdrds",
                white: "alblcldlelemencoeodpepeqeres",
            },
            move_tree: this.makePuzzleMoveTree(["cp"], ["cncp", "cqcp"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndneocpepdrfres",
                white: "ambmcmdmemengnfofpeqgqgrfsgs",
            },
            move_tree: this.makePuzzleMoveTree(["dq"], ["fqer", "erdqfqcr"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alamcmdmcododpcqeqeres",
                white: "akbkcldlelbmemeneoepfqfrfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bnblandncn"],
                ["bnbldnan", "blan", "dnbn"],
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
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepcqfqbrdrfrasbscsds",
                white: "cndoeogobpcpfpaqbqgqargrfsgs",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["eseq", "eqes"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best move to close Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnencofocpgpcqdqeqfqgq",
                white: "dmemcnfngnbogobphpbqhqcrdrerfrgr",
            },
            move_tree: this.makePuzzleMoveTree(["eo", "ep"], ["doep", "fpeodoep"], 19, 19),
        };
    }
}
