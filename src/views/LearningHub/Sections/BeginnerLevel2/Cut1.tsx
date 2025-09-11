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

export class BL2Cut1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "bl2-cut-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning cut", "Cut 1");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on cut", "Cut opponent's group");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldmcncogpfqdrer",
                white: "dnengncpdpcr",
            },
            move_tree: this.makePuzzleMoveTree(["doeoep"], ["cqep", "eodo", "epdo"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlelemencododpeqer",
                white: "bmcmdmcncpbqcqdr",
            },
            move_tree: this.makePuzzleMoveTree(["bo"], ["dqbo"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldlflcnfpbqcqfqdrer",
                white: "enfohobpcpepdqeqhq",
            },
            move_tree: this.makePuzzleMoveTree(["doeodp"], ["gogn"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "encpepdqfqer",
                white: "clcncocqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bobpdpbq", "bqbpdpbr"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bndndodpfpeq",
                white: "clelcmcnbocqdq",
            },
            move_tree: this.makePuzzleMoveTree(["bpcpco"], ["cobp", "cpbp"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldmdpbqcqdqeq",
                white: "fmencocpepfpfq",
            },
            move_tree: this.makePuzzleMoveTree(["dodncn"], ["dndo", "cndo", "eodo"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dodpdqfqerds",
                white: "cmcncqbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcpcobobn"],
                [
                    "bococpbp",
                    "cpbpboco",
                    "coaobpapbqaq",
                    "coaoboanapbp",
                    "coaoboanbpapaqbq",
                    "coaoapbpboan",
                    "coaoanbobpapaqbncpbq",
                    "coaoanbobpapaqbnbqcp",
                ],
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
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elflcmemdnbqdqeqfq",
                white: "fmfnbocoepfpgpgq",
            },
            move_tree: this.makePuzzleMoveTree(["dodpcp"], ["dpdoeoen", "fodo"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clbmcndngncqdqfqgqhqbrcr",
                white: "bnbocofogohocpepbqar",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eodoenfpdp"],
                ["eododpen", "eodofpen", "dodp", "dpdo"],
                19,
                19,
            ),
        };
    }
}
