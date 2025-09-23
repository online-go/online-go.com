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

export class BL2Ko1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "bl2-ko-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning start ko fight", "Ko");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on start ko fight", "Start ko fight");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Start a ko fight as a reply to white 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcododpeqdr",
                white: "cpbqdqfqcrer",
            },
            marks: { 1: "er" },
            move_tree: this.makePuzzleMoveTree(["cq"], ["frep", "esep"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Start a ko fight as a reply to white 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmboapcpdpeqfq",
                white: "bpaqcqdqbr",
            },
            marks: { 1: "aq" },
            move_tree: this.makePuzzleMoveTree(["bq"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Start a ko fight as a reply to white 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dldnapbpcpdpaqbrcr",
                white: "eoepgpbqcqdqfqardrbs",
            },
            marks: { 1: "bs" },
            move_tree: this.makePuzzleMoveTree(["as"], ["csds", "dscs"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Start a ko fight as a reply to white 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbpcpcqbrdr",
                white: "bqdqeqgqcrbsds",
            },
            marks: { 1: "bs" },
            move_tree: this.makePuzzleMoveTree(["cs"], ["aqer", "asar", "arer"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Start a ko fight as a reply to white 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcodocpbqbrcr",
                white: "bpdphpcqeqfqardrbscs",
            },
            marks: { 1: "cq" },
            move_tree: this.makePuzzleMoveTree(["dq"], ["dsaq", "apaq", "boaq", "aqap"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Start a ko fight as a reply to white 1.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmbpdpbqcqbrdrcsds",
                white: "bocoeoapcpdqeqarerbses",
            },
            marks: { 1: "bs" },
            move_tree: this.makePuzzleMoveTree(["as"], ["aqcr", "aocr"], 19, 19),
        };
    }
}
