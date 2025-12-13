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

export class BL4Connect2 extends LearningHubSection {
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
            Page14,
        ];
    }
    static section(): string {
        return "bl4-connect-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning connect", "Tesuji");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on connect", "Connect");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "crcsfrfqfpapbpcodobnfn",
                white: "bsbrarbqcqcpdpeq",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["erdr", "dses", "drer"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bsbrbqcqereqgrgqip",
                white: "crdrdqepfpcpbpcmgn",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["csds", "esds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqcqcrckcmemfk",
                white: "drdqcpdoeogpiq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobpap"],
                ["anapbpboaobn", "anapbpbobnao", "bpbo", "bnbp"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcpeqepeocl",
                white: "crdqdpdnergqhqen",
            },
            move_tree: this.makePuzzleMoveTree(["dodrcn"], ["dodrcocn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "brbqbpgqgrgscncl",
                white: "cqdqeqfqgphpiqireofm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdsdrercs"],
                ["esdsdrerfscr", "esdscsdr", "cses", "dscscres", "crdr", "erdr", "drfrfsesercr"],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqcqdqcnanbmblclek",
                white: "bpcpdpeqdrgpeodndmcmbngm",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["boap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dpcpdmdlfk",
                white: "dodnfnfofqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bnbococnbm", "bnbobpcnbm"],
                [
                    "bnbococncmbm",
                    "bnbocnco",
                    "bnbobpcncmbm",
                    "bnbobpcncobm",
                    "bnbobpcnaobm",
                    "cocn",
                    "cncobobn",
                    "bobncncocmbp",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dsdrdqcpcobqhshrhqcmcl",
                white: "frgqeqepdphpgpgndndmiqirio",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqcqdreqepgqclcmip",
                white: "dpcpeodndlckekglgo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobpap"],
                [
                    "anbobpao",
                    "anboaobmbncnblap",
                    "anboaobmbncnbpbl",
                    "anbobnao",
                    "bpbo",
                    "bnbp",
                    "aobpapbncnbo",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "erfqepdpcpbpdm",
                white: "bqcqdqdreqfriqio",
            },
            move_tree: this.makePuzzleMoveTree(["gresgp"], ["gpgr", "fpgr", "fogr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcrcsfrgqfpeodocnbnhoiqhq",
                white: "bsbrbqbpcpdpeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eserds"],
                ["erdrdsesdqdr", "erdrdsesfsdqesgr", "dreresgrfsgs"],
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
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cqbqdncmbmemgndk",
                white: "cpcocndqdrdpgphq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["anaobo", "anapbp", "apanbn"],
                ["aoapbpan", "bpbo", "bnbo", "bobpapbnanao"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "drdqcqdpcmcl",
                white: "cpdoeoepdkdldmfrck",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobncncobp"],
                ["bpcnbnbmblboamao", "cocn", "bnbo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "brcqcpdpeperfqhpgqfn",
                white: "crdrdqbqbpbocncl",
            },
            move_tree: this.makePuzzleMoveTree(["bsards"], ["dsbs", "csds"], 19, 19),
            /* cSpell:enable */
        };
    }
}
