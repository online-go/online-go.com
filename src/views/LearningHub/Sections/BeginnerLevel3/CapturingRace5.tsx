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

export class BL3CapturingRace5 extends LearningHubSection {
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
        return "bl3-capturing-race-5";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning eye vs. no eye", "Capturing Race");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on eye vs. no eye", "Eye vs. no eye");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "brbqcpdpbpeqfqfrgrhrdn",
                white: "crcqdqergqhqiripfpep",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["csds", "fscs", "hscs", "gscs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "cqcpboaobncndnenbscrdrerdsfr",
                white: "arbrbqbpapgsfqhrcododpdqeqgq",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], ["grfs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "arbqbpcqdqdperesfrfqgp",
                white: "brcrdrdseqepdocoboeobm",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["apbs", "asbs", "aqbs", "cpbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "apbpcpcqdrerfrescscn",
                white: "aqbqbrcrdqeqgqgreo",
            },
            move_tree: this.makePuzzleMoveTree(["as"], ["bsas", "fqbs", "gsbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "csdrerfrfscqcpbpapdpeo",
                white: "asbrbqaqcrdqeqfqgqgr",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["gsds", "esds", "bsar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "aqbpapbocodnendpdqdrdscm",
                white: "arbqcqcpdoeoepeqergrfn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                ["crcs", "esbr", "csbr", "brbscrcs", "brbscscr", "brbsescs", "brbsascr"],
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
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "esfsfrarbqbpbocpdqeqfqgp",
                white: "crdrerdscqbncncodpepbrdnenbl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsaoaq"],
                ["bsaoanaq", "asbs", "aqbs", "aobs"],
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
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "drereqfrfsaqbqcqcpdocn",
                white: "arbrcrbsdqdpepfpfqgrhqfn",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["gsds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "bpeofpbrbqfqfrfsdnfnfmdpcp",
                white: "crcqdqeqerepgofogrhrgngmhp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ds"],
                ["esds", "csds", "gpds", "gqds", "gsds"],
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
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "aobobpcqdqdrdscodnenas",
                white: "aqbqbrapcpdpeperfrgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                [
                    "csbsarbs",
                    "crcs",
                    "eqbscscr",
                    "eqbsescs",
                    "eqbscrcs",
                    "esbseqcs",
                    "esbscrcs",
                    "esbscscr",
                ],
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
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "doepeqaqarasbseresfqgrencnemapbpcp",
                white: "brbqcqdqdrcsdpirfpfoeohofsgqgmhq",
            },
            move_tree: this.makePuzzleMoveTree(["gshshrfrgs"], ["hrgs", "dscr", "frgs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race (eye vs. no eye).");
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
                black: "araqbqcqdrcsdpepfofqgrfn",
                white: "apbpcpdqeqeresdsdocncm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscrbr", "bscras"],
                ["crbsdrfr", "brbscrdrcrfr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
