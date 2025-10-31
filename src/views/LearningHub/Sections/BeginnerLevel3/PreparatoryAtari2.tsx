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

export class BL3PreparatoryAtari2 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10];
    }
    static section(): string {
        return "bl3-preparatory-atari-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning ladder", "Preparatory Atari");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on ladder", "Play ladder");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White can put a stone in atari by playing at A and then capture a different stone in a ladder. White to play. Play a ladder after a preparatory atari.",
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
                black: "bpbqcpdqepgq",
                white: "cocqdodphm",
            },
            marks: { A: "eq" },
            move_tree: this.makePuzzleMoveTree(["eqcrfp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "dreqfrgqdpcp",
                white: "bpcqdqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epfqdo"],
                ["epfqcododneo", "epfqcodoeodn", "cres"],
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
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "brcrcqbpcocndn",
                white: "bqcpdpdqdrdoencmflfr",
            },
            move_tree: this.makePuzzleMoveTree(["boaqbn"], ["boaqdmbn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "bqcqdqcrerfqgq",
                white: "drbpcpdpepeqbnfphqio",
            },
            move_tree: this.makePuzzleMoveTree(["frdsgr"], ["frdsgpgr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "cpdpeofp",
                white: "dodnepeq",
            },
            move_tree: this.makePuzzleMoveTree(["foengp"], ["enfo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "cocpdpdrdseqfrfn",
                white: "bpcqdqcrdoerar",
            },
            move_tree: this.makePuzzleMoveTree(["epfqcn"], ["epfqbocn", "esfs", "cses"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "dndocobqcqdqcrepfpbnbmclarbsck",
                white: "bpbocnfqeqereohndrdpelcp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["endmgp", "gpfoendmfn"],
                ["dmen", "fogp", "gpfoendmgofn"],
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
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "bpcodpdqeneofpgq",
                white: "eqepdodnfqgogl",
            },
            move_tree: this.makePuzzleMoveTree(["fogpem", "gpfoem"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "bpcodoepdqdrerfrhqip",
                white: "crcqcpdpboeqfqhm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eofpfogqcn", "eofpcndndmenfo"],
                [
                    "eofpdncnbncm",
                    "eofpdncncmbn",
                    "eofpfogqdncnbncm",
                    "eofpfogqdncncmbn",
                    "eofpcndnendm",
                    "eofpcndndmenfnfo",
                    "fpeo",
                    "bqfp",
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
        return _("White to play. Play a ladder after a preparatory atari.");
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
                black: "arbrcqdqdrepfpiq",
                white: "crbqbpcpdpeofoeqbn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ercsgpfqfrgqhq", "gpfqercsfr"],
                ["ercsgpfqfrgqgrhq", "ercsgpfqgqfr", "fqgp", "dscs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
