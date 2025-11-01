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

export class BL3LifeDeath11 extends LearningHubSection {
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
        return "bl3-life-death-11";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning alive false eye", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on alive false eye",
            "Make alive, false eye",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "cpcqaraqapboaodocnfrfqepfohr",
                white: "bsbrcrdqbqbpdpeqer",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["codsescp", "codscpes"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "crbqcpdpepfqfrfsbpfobn",
                white: "arbrbscqdqeraq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ds", "csesds"],
                ["drds", "esdr", "csesdrds"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "gnfnemdmcmbncoaoapbmbqbrdscserhrfqgqgpgo",
                white: "bpcpdpdodncnenfofpeqdqdrfr",
            },
            move_tree: this.makePuzzleMoveTree(["bo"], ["esbo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "aqapbpcpdpepfqfrfsesfo",
                white: "arasbsbqcrdsereq",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["dqcq", "drcq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "drerfrgqhphognfnenhmiqircndpcobpbqcr",
                white: "cqdqeqfqgpgofoeoepcpgr",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["hqdo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "ereqepcpbqbp",
                white: "arbrbscqdr",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["csdq", "dqds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "cndnenesfogofmfshpdsdrcrgrfqcqhnanarbrhqbpbsbn",
                white: "eqerfrdqfpepeodobqgpcpcobo",
            },
            move_tree: this.makePuzzleMoveTree(["gq"], ["apgqaoaq", "apgqaqao"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "aqapbpcpdpeqfqfreobrhr",
                white: "asarbqcrcsdreres",
            },
            move_tree: this.makePuzzleMoveTree(["cqbsar"], ["bscq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "gsgrgqfpgoepfnendncocpcqbqarbsaqcmhphq",
                white: "crdserfreqdqdpdoeofofqbr",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], ["gpfsfpes", "gpfsesfp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "aqbqbpcpdpepeqfrfsgq",
                white: "arbrcscqdqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dresds"],
                ["esdr", "dsdrescr", "dsdrcres"],
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
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "fqgrdsesfsbscshrgpgofodpdncnbnbofmiqip",
                white: "coarbrcqcpbpapdqeqerfrfpep",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["gqdo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Save the white group; watch out for a false eye.");
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
                black: "bsbrbqbpcpdpepfqgqhqirisip",
                white: "cqdqeqfrfsgrhrhs",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["drds", "crdscser", "csds"], 19, 19),
            /* cSpell:enable */
        };
    }
}
