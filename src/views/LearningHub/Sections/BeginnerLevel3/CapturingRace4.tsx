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

export class BL3CapturingRace4 extends LearningHubSection {
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
        return "bl3-capturing-race-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning choose target chain", "Capturing Race");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on choose target chain",
            "Choose target chain",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "erfrgqgpfpendncmbobncpcqcrcsdr",
                white: "bsbrbqaqbpgrhrcododpdqeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eo", "ep", "cn"],
                ["apao", "arfs", "asfs", "aofs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "freresbrbqapaobnfqepeodobmdm",
                white: "drdseqcofpgphqhrbobpcqdpdq",
            },
            move_tree: this.makePuzzleMoveTree(["cr", "cs"], ["cngr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "crdrdqergqhrhqcpbpdococm",
                white: "bsbrbqcqfrgreqepdpeoen",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fq"],
                ["fsfq", "gsfq", "aqes", "ares", "ases", "cses", "escs"],
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
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "arbqcpbpdpeqeresfqgqgrgsdn",
                white: "brcqdqdrdsepfpgphqhrhsho",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], ["crcs", "bsfs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "cqdqdrerfrfqgpbpbogofnencncscr",
                white: "bsbrarbqcpdpepfphpgreqhqgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ap"],
                ["aqap", "cofs", "dofs", "eofs", "fofs"],
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
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "epdpcpbqbrcrdrfpgqhqirip",
                white: "dqeqerfqgrhraraqapbpcqcoclbodnas",
            },
            move_tree: this.makePuzzleMoveTree(
                ["es", "fsesdsfrhs", "dsfresbsfs"],
                ["hsds", "fsesdsfrgshs", "fsesgsds", "gsds"],
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
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "bqcodrergofrhqhpcqdo",
                white: "arbrdqeqcrgrfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gqhrir", "hrgqgs"],
                ["gsgq", "csfs", "aqfs", "bsds", "asds", "dpfs", "epds", "fpds"],
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
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "brbqeqfqgrepdpcp",
                white: "cqcrdqerdsbpbocodn",
            },
            move_tree: this.makePuzzleMoveTree(["bscsfs"], ["frbs", "fsbs", "csbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "crcqbpbodpepfpgqgrgobncmcl",
                white: "brbqdqeqfqcpcodndmfndl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dr"],
                ["bsdr", "aqdr", "csbs", "ardr", "frdr", "erdr"],
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
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "araqapbpcsereqepdocobo",
                white: "bqbrcpdpdqdrdseofogpfqgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["crcqes"],
                ["crcqbsasesfs", "crcqbsasbses", "bses", "escrasbs", "escrbsas", "ases"],
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
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "asepfpgparhphohnfmemcnbococpdqdrdserfrhldn",
                white: "bscrcqbqbpapcsgqeqdphripgofqdoioeoiqfohq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["en", "fn", "gn"],
                ["brgr", "braq", "aqgr", "aqbr", "aogrbraq", "aograqbr", "grgs"],
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
        return _("Black to play. Win the capturing race by attacking the right target chain.");
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
                black: "bsbrbqcqdpepfpgqgrfn",
                white: "crcsdsereqdqcpbpcododm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsaqes"],
                ["fsaqfrar", "fsaqfqar", "fraq", "fqaq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
