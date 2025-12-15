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

export class BL4CapturingRace7 extends LearningHubSection {
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
            Page15,
            Page16,
            Page17,
            Page18,
            Page19,
            Page20,
        ];
    }
    static section(): string {
        return "bl4-capturing-race-7";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capturing race", "Capturing Race");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capturing race",
            "Win capturing race",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "brcqdqcpbperfrhq",
                white: "drcreqdpepcoboaoen",
            },
            move_tree: this.makePuzzleMoveTree(["bqaqap"], ["apbq", "aqcs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "crdqdpcobobnbmdrfqhp",
                white: "cqcpbpblcmcndoeoemck",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apbqbraram", "apbqbrarao", "apbqbraran"],
                [
                    "apbqbraraqbs",
                    "apbqbrarbsao",
                    "apbqamaq",
                    "apbqaoaq",
                    "apbqanaq",
                    "apbqaqbr",
                    "brapbqbs",
                    "aobq",
                    "ambq",
                    "anbq",
                    "aqbr",
                ],
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
        return _("White to play. Win the capturing race.");
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
                black: "crdrbpcodnenfmfleldkckfqhq",
                white: "cpeofngnemdmcmhn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bodpdo"],
                ["bodpcndo", "docn", "cndo", "dpcn"],
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
        return _("White to play. Win the capturing race.");
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
                black: "arbrcqbpcpdpepfqerfrgrcn",
                white: "bqcrbsdrdqeqhrhqgqfpgpeogn",
            },
            move_tree: this.makePuzzleMoveTree(["esdscs"], ["gsds", "dses", "csaq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "dpcpcqcrerfsgrbobncngqgpgncl",
                white: "bsbrbqbpcodoeoepfqfremfl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dreqcs"],
                ["dreqfpds", "dqdr", "csdr", "eqdr", "dsdr"],
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
        return _("White to play. Win the capturing race.");
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
                black: "asbsbqaqcrdrdqepfpgqhqdoeo",
                white: "cqcpcocndpeqerdsclem",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brares", "esfrbr"],
                ["brarbpfr", "esfrbpfs", "esfrcsbr", "bpfrbraresfs", "bpfrbrarapfq", "bpfresbr"],
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
        return _("White to play. Win the capturing race.");
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
                black: "bqbrcrdrcpcodncmfqfofmfl",
                white: "cqdqdpbpbobnbmdm",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["cndo", "docn", "clen"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "brbqcsdsdreqfqgrgo",
                white: "cqcrdqerbpcpbn",
            },
            move_tree: this.makePuzzleMoveTree(["bsasesbsaq"], ["esbs", "aqfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "brbqcpcodqeqfresdm",
                white: "cqcrdpepfpfqgqgrirgm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsergs"],
                ["dserbsgs", "erdr", "drer", "csdr", "bsdr", "gsdr"],
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
        return _("White to play. Win the capturing race.");
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
                black: "csbsbrbqcpdpepfpfqgn",
                white: "crcqdqerdsbpcodoeobnem",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqfraq", "eqfrar"],
                ["eqfrfsgs", "freq", "aqeq"],
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
        return _("White to play. Win the capturing race.");
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
                black: "bqcqdpepcocnbnangq",
                white: "cpbpcmbmbkdmdndo",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["boap", "amap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "anbncnendoepdqcqcrbrer",
                white: "araqbqcpdpcoboaoeqfqdsgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsesfrdrfs"],
                ["bsesdrcs", "bsescsdr", "dresbscs", "csdrfrbs", "frcs"],
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
        return _("White to play. Win the capturing race.");
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
                black: "arbqbpcpdoeoepeqeresgoip",
                white: "aobocodpdqdrdscsbrdncmcken",
            },
            move_tree: this.makePuzzleMoveTree(["aqapcq"], ["cqbs", "apbs", "asbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "bqdocoboendmcmblfnfl",
                white: "brdqdpepeoanbncndngq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcpcqapao", "bpcpap"],
                ["bpcpcqaparam", "aobp", "cpbp", "apbpaqao", "apbpaoaq", "apbpcqam", "apbpcpam"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "cmdnfsfrfqeqdpcpbpaqbrcr",
                white: "flfneoepgpgqgrgsdsdrcqdqbq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arascsapfp", "arascsaper", "arascsapes"],
                [
                    "arascsapbsar",
                    "arasercs",
                    "arasfpcs",
                    "arasescs",
                    "csar",
                    "fpcs",
                    "ercs",
                    "escs",
                    "bsar",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "aqarbpcocndpepeqeresdlbq",
                white: "brbscsdsdrdqcqcpeofogpgqfrgmdo",
            },
            move_tree: this.makePuzzleMoveTree(["bo"], ["fqas", "fpas", "fsas"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "dqdrcpcobobndnenfrfqfoho",
                white: "crcqdpepdobmcmcnel",
            },
            move_tree: this.makePuzzleMoveTree(
                ["anbqaobpbr", "anbqbr", "aobqanbpbr"],
                ["anbqaobpapbr", "bpbq", "bqfp"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "bqcqcrdrcodpepfqgqhqdm",
                white: "cpbpbodqeqeresfpgpgnhm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dncndo"],
                ["dncneodocmen", "doeo", "eodo", "aqfr", "dsfr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "bqcpdpeqfqfrgrbncl",
                white: "dqhrgqhpfpepdogmir",
            },
            move_tree: this.makePuzzleMoveTree(["dr"], ["erdr", "gsdr", "fsdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
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
                black: "bsbqcrdrdqeqfqgphphqhrfogm",
                white: "gqgrfrfpepdpcpcqbpbnbrar",
            },
            move_tree: this.makePuzzleMoveTree(
                ["es"],
                ["eres", "dsesergs", "dsesfscs", "cseserds", "csesasgs", "csesfsds", "aqgs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
