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

export class BL3CapturingRace1 extends LearningHubSection {
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
        return "bl3-capturing-race-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning avoid the fight", "Capturing Race");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on avoid the fight",
            "Avoid the fight",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "In a capturing race you can sometimes avoid a fight by making two eyes. Or you connect your group with another group, increasing the number of liberties. If you are not yet completely surrounded, you could try to escape. In this example the four white stones are not yet completely surrounded. White can escape by playing at A. Win the capturing race by avoiding the fight.",
        );
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
                black: "arbrcocpcrdodqdreofqfrhr",
                white: "aqbnbobpbqcncqdpdsepeqer",
            },
            marks: { A: "fp" },
            move_tree: this.makePuzzleMoveTree(["fpgpfoenfn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "cnesfqgrcoaqbqcqdqerfrdp",
                white: "arbrcrdrbseqepgphqhrgoeoen",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["gqds", "gsds", "fpds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "bsbrbqcpdpdqfqfpgr",
                white: "cqcrcserbpbocncm",
            },
            move_tree: this.makePuzzleMoveTree(["dr"], ["aqdr", "ardr", "esdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "aqapbpcpdqdrdscncm",
                white: "arbscrcqbqdpepfrfqfn",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["eqcs", "ercs", "escs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "bsbrbqcqdpepcofogo",
                white: "crcsdqdreqcpbpfpgphpfr",
            },
            move_tree: this.makePuzzleMoveTree(["bocnbn"], ["aqbo", "apbo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "bocodoepeqerdrdscldmaoaqap",
                white: "arbrcrbsdqdpcpbpgqgrfmeofofp",
            },
            move_tree: this.makePuzzleMoveTree(["bq"], ["fqbq", "frbq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "arbrcrcqcpdoeoercndnfm",
                white: "bqbpcobndpdqdrgqgobocmcl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eq"],
                ["cseq", "aqeq", "dseq", "esfr", "epfp", "fqeq"],
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
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "boclcpcqcrcsaobmcnck",
                white: "bsbrbqbpapcodoepeqerfn",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["dpar", "dqar", "drar", "dsar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "crdrerbqbpfrgqfpeodocn",
                white: "eqdqcqbrbscsfqepgrgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gp"],
                ["fsdp", "hqgp", "dsdp", "esdp", "fogp"],
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
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "aqbqcqcrbsdpepfqfrgo",
                white: "apbpcpdocndqdrdscm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["areqcs"],
                ["areqbras", "csar", "brar", "asar"],
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
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "arbrcrbocpdpdqepfofn",
                white: "csdsdrcqbqbpbneqfpgpfr",
            },
            move_tree: this.makePuzzleMoveTree(["co", "aocoap"], ["aocoanap", "bsap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "bsbrcrdrdseqgphphqhrepgn",
                white: "dqcqbqeresfrgrcodn",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["gsar", "aqar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race by avoiding the fight.");
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
                black: "dpdqdrdsbqbpcocn",
                white: "cscrcqcpbmcmdndoepfqfrfodl",
            },
            move_tree: this.makePuzzleMoveTree(["bo"], ["brar", "eqbr", "erbr", "esbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}
