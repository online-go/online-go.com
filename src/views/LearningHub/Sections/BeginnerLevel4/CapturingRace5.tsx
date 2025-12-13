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

export class BL4CapturingRace5 extends LearningHubSection {
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
        return "bl4-capturing-race-5";
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
                black: "cocpcqbqgrfrerdrdsfscmanbn",
                white: "aqbrcrcsbpboaogqdqeqhrhqfqhnar",
            },
            move_tree: this.makePuzzleMoveTree(["hs"], ["apas", "asap"], 19, 19),
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
                black: "bsbqbpbodrdqdpdodncnfqhp",
                white: "cocpcqcrbrbncmbldmengm",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["csar", "aqar", "aoar", "apar"], 19, 19),
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
                black: "dlbmcmdpdobpbodncqdqckelgl",
                white: "cncrdrbndmemeneoepeqaqbqbrgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aoapco", "aoapcp"],
                ["aoapanam", "anam", "cocp", "cpco", "apan"],
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
                black: "fqfpeoaraqbqcrdrdqdpcpgrengn",
                white: "codoboepeqeresdsbrbpapcl",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["csbs", "asbs"], 19, 19),
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
                black: "ephshrgqfqbsbrcrcqdphpeofnfo",
                white: "doemdqeqerfrgrgsarbqcnenbpcp",
            },
            move_tree: this.makePuzzleMoveTree(["dsdres"], ["dsdraqes", "aqds", "drds"], 19, 19),
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
                black: "arbqcqcrdpepfpfqfrhrgn",
                white: "bsaqapbpcpcododqeqerescl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csfsbr"],
                ["csfsdsbr", "csfsdrds", "csfsasdr", "brds", "drfs", "dscs", "asds"],
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
                black: "brcrdrdpdocobobneqfqhper",
                white: "dqcqbqbpbmcndncleoepemgo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apanao", "apanam"],
                ["aoapaqan", "aqao", "anao"],
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
                black: "crdsdqeqgrgqgpfphn",
                white: "brfqfrepdpcqbpfoem",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdrbs"],
                ["esdrerfs", "esdrcsbs", "esdrfsgs", "erdr", "fses", "drer"],
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
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "drerfqgqgrgshpipjqjrhn",
                white: "brcrdqepfpgphqhrhscodm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsiseq"],
                ["fsisfres", "eqfs", "frfs", "dsis"],
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
                black: "dogrfrbrcqcpdqeqboeogpgohqfmes",
                white: "fpfqerdrcrcocnbnandpdlep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqbpapaqaobqbs", "bqbpaoaqapbqbs"],
                ["bpbq", "csbs"],
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
                black: "dpepdrfofngpgqgrho",
                white: "bocodoeofpfqerdl",
            },
            move_tree: this.makePuzzleMoveTree(["dqfreq"], ["cpdq", "eqdq"], 19, 19),
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
                black: "bqcqcpcobnclcmdrereqfpenelfn",
                white: "arbrcrcndndodpdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["boaoaqbpapbobm", "boaoapbpaq"],
                ["boaoaqbpbmap", "boaoapbpbmaq", "boaobpap", "aqbo", "bpbo", "apbo"],
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
                black: "eqdqdrcrbsfpgpgqeshrhqfn",
                white: "arbrcqdpepbqcofqerfrgrdm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscsas"],
                ["asfs", "csds", "fsgs", "gshs"],
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
                black: "arbrcqbpcpdpepfpfrgrgqdmbn",
                white: "bscrbqdqeqfqgpgohqhrio",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eserdr"],
                ["eres", "dres", "dses", "csdr"],
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
                black: "araqbqbpcododpcreqerem",
                white: "cpcqdqdrdsbrbsepfpgqgrgn",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "boescsbnfs",
                    "boescsbnfr",
                    "boescsbnfq",
                    "boescsbnaoanfs",
                    "boescsbnaoanfr",
                    "boescsbnaoanfq",
                    "csesbo",
                ],
                ["fses", "esfs", "fres", "fqes", "csesfsas", "csesfras", "csesfqas"],
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
                black: "dpdocoarbrcrdndmbnanfohndq",
                white: "aqdrerbqcqcpcmbmbkdlfqhqbocn",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aoap", "bpao", "amap", "csap"], 19, 19),
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
                black: "cqbqdpbocndrerfrgqdmdlhp",
                white: "arbrcrdoepdqeqengo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcpcoapaqbpbn"],
                ["bpcpcoapbnaq", "bpcpapco", "bpcpaqco", "cpbp", "cobp", "aqbp"],
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
                black: "bqbpdreqfpfognhnioipiqhl",
                white: "dqeofnfmgogpgqdm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erdpep"],
                ["erdpfqep", "epfqfrer", "epfqerfr", "epfqgrdp", "fqep"],
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
                black: "bscrdrerfresfqbpcpepeodnclbn",
                white: "brbqcqdqeqfpgpgqgrgsgn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csdsfs"],
                ["fscs", "dscs", "arcs", "aqcs"],
                19,
                19,
            ),
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
                black: "bsbqcqdrdsesdpdocobodmbm",
                white: "aqapbpcpdqeqerfsfrfohpfm",
            },
            move_tree: this.makePuzzleMoveTree(["br"], ["crbr", "arbr", "csar"], 19, 19),
            /* cSpell:enable */
        };
    }
}
