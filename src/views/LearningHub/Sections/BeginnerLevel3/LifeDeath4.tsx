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

export class BL3LifeDeath4 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "bl3-life-death-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture with sente move", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture with sente move",
            "Capture with sente move",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "bpcpdpepgpbqfqcrgrhr",
                white: "cqdqeqbrdrfrds",
            },
            move_tree: this.makePuzzleMoveTree(["arcsfs"], ["arcsasfs", "fsar", "csbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "bpdpepfpgpipcqgqhqbrfrir",
                white: "dqeqfqcrdrgrhresfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["hsgscs"],
                ["hsgsiscs", "cshs", "gshs", "dscs"],
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
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "anbncndnengnaofofpcqfqbrcrgr",
                white: "bocodoeoapcpaqbqdqeqarerasbses",
            },
            move_tree: this.makePuzzleMoveTree(["csbpep"], ["epcs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "araqbqbpcpdpeqfqgqhrfohqdsas",
                white: "brbscqdqdrerfrgres",
            },
            move_tree: this.makePuzzleMoveTree(["cscrgs"], ["gscs", "crcs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "codpepfphpaqbqgqarhrbshs",
                white: "eqfqbrcrdrgresgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfscs"],
                ["csfr", "fsfr", "erfr", "dqfr", "dscs"],
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
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "aobocodoeoapfpaqfqhqarbrgrgs",
                white: "bpcpdpbqdqeqcrfrbsesfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsercsdrcs"],
                ["dsercsdrascs", "dserdrcs", "dserascs", "erdr", "csds", "ascs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "aobocoeoapdphpaqeqfqgqhrbscshs",
                white: "bpcpbqdqarbrdrerfrgrases",
            },
            move_tree: this.makePuzzleMoveTree(["crcqgs"], ["cqcr", "dscr", "gscr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "bmcndnfnaoboeoapepeqergrbs",
                white: "cobpdpaqcqdqardrasds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brbqdo"],
                [
                    "bqbr",
                    "crbqdocs",
                    "crbqdobr",
                    "crbqbrdo",
                    "crbqcsdo",
                    "csdo",
                    "dobrcscp",
                    "dobrcpcs",
                    "dobrcrcs",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the white group by playing a sente move.");
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
                black: "enfnbocodogogpipbqhqarcrhrbscses",
                white: "eocpdpfpcqeqfqgqdrgrdsgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erdqfo", "erfodq"],
                ["foerfsep", "foerepfs", "frfo", "fsfo", "bpfo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
