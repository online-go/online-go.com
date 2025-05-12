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

export class CapturingRace extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "capturing_race";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning win capturing race", "Capturing Race");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on win capturing race",
            "Win the capturing race",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The two marked chains have both two liberties. White can capture the black chain by reducing its liberties. Black can do the same if it was Black's turn to play. This is called a 'capturing race'. If both players have the same number of liberties, the player that plays first will win the capturing race. White to play. Win the capturing race.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "hcgdgehfhg",
                white: "hdhegfgghh",
            },
            marks: { triangle: "hghfhehd" },
            move_tree: this.makePuzzleMoveTree(
                ["igieif", "ifidig"],
                ["igieidic", "ifidieig"],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dfefdgfgchfh",
                white: "cecfcgegdheh",
            },
            marks: { triangle: "ehdhcheg" },
            move_tree: this.makePuzzleMoveTree(
                ["bhdici"],
                ["bhdieifi", "cibhbgei", "cibhbiei", "cibhahei"],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gfegfgdhgh",
                white: "cgdgehfh",
            },
            marks: { triangle: "fhehdh" },
            move_tree: this.makePuzzleMoveTree(
                ["cheidi", "dichbhfici"],
                ["cheifigi", "dichbhfieici", "dichcibh"],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bbcccdaebe",
                white: "adbdcecf",
            },
            marks: { triangle: "beaebdad" },
            move_tree: this.makePuzzleMoveTree(
                ["bfbcaf", "afbcbf"],
                ["bfbcacab", "afbcacab", "acabbfbc"],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "efffdgfgdh",
                white: "dfcgegeh",
            },
            marks: { triangle: "ehdhegdg" },
            move_tree: this.makePuzzleMoveTree(
                ["chfhdi", "dichbhfhci"],
                ["dichcibh", "fhchbhcf", "fhchghcf", "fhchcfgh"],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "egfgggchdhghci",
                white: "bfcgdgbhehfh",
            },
            marks: { triangle: "cifhehdhch" },
            move_tree: this.makePuzzleMoveTree(
                ["bifidi", "eibiahagbggiaifidi"],
                [
                    "bifieidi",
                    "diei",
                    "eibiaiah",
                    "eibiahagafgibgfi",
                    "eibiahagbggiaffi",
                    "eibidifi",
                    "figi",
                ],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "adbdcededfbgcgeg",
                white: "bccceccdbebfcf",
            },
            marks: { triangle: "cfbfbebdad" },
            move_tree: this.makePuzzleMoveTree(["acafae"], ["aeaf", "afag"], 9, 9),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bfefcgdgbhehfhghei",
                white: "egfgggchdhhhgihi",
            },
            marks: { triangle: "eighfhehdhch" },
            move_tree: this.makePuzzleMoveTree(["ficidi"], ["dici", "cibi"], 9, 9),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fabbebfbgbccdcde",
                white: "hacbdbhbecfcgc",
            },
            marks: { triangle: "gbfbebdbcbfa" },
            move_tree: this.makePuzzleMoveTree(
                ["gadaea", "dabagacaea"],
                ["gadacaba", "eada", "dabaeaca", "caba"],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dgegfgchghhhihgi",
                white: "gghgigdhehfhfi",
            },
            marks: { triangle: "gifiihhhghfhehdh" },
            move_tree: this.makePuzzleMoveTree(
                ["iidihi", "hiiihi", "hiiidicihi"],
                ["hiiicieidibi", "dici", "cieidibi"],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dehedfhfegfggg",
                white: "efffgfcgdghghh",
            },
            marks: { triangle: "ggfgeggfffef" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "ehgegheefh",
                    "ehgefheegh",
                    "ghdhehfhfi",
                    "ghdhfhehchcidieifi",
                    "fhehghdhchcieieedi",
                    "fhehghdhchcieieefefddi",
                    "fhehghdhchcieieegegddi",
                    "fhehghdhchcibigedieeei",
                    "fhehghdhchcibigeeieedi",
                    "fhehdhgheifidi",
                    "fhehdhghfieidigihigefifhfi",
                ],
                [
                    "ehgefefd",
                    "ghdhfheheichbhbgcfbfcecd",
                    "fhehdhghgifihieedige",
                    "fhehdhghgifihieefefd",
                    "fhehdhghgifihieegegd",
                    "fhehdhghgifihieeeidi",
                    "fhehdhghgifidihieiig",
                    "fhehdhghgifieidihici",
                    "fhehdhghfieigihi",
                ],
                9,
                9,
            ),
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
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fafbfcdded",
                white: "eaebecfdgd",
            },
            marks: { triangle: "fcecfbebfaea" },
            move_tree: this.makePuzzleMoveTree(
                ["gcdcgbdbga", "gbgchchbga", "gagbhbhagchcga", "gagbhbhahcdcgcdbga"],
                ["gagbgchbhchaibdciaic", "gagbgchbhchaibdcicdb"],
                9,
                9,
            ),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race and capture the marked stones without putting yourself in atari.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "becfdfbgegbhehei",
                white: "efffcgdgfgchfhfi",
            },
            marks: { triangle: "chdgcg" },
            move_tree: this.makePuzzleMoveTree(["ci"], ["dhdi"], 9, 9),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race and capture the marked stones without putting yourself in atari.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "egfgggchdhhhgihi",
                white: "bfcgdgbhehfhghei",
            },
            marks: { triangle: "eighfheh" },
            move_tree: this.makePuzzleMoveTree(["fi"], ["dici", "bidi"], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race and capture the marked stones without putting yourself in atari.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "becebfagcgahch",
                white: "cfdfbgdgbhehbi",
            },
            marks: { triangle: "bibhbg" },
            move_tree: this.makePuzzleMoveTree(["ci"], ["aiaf"], 9, 9),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race and capture the marked stones without putting yourself in atari.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "hfegfgggchdhhhdihi",
                white: "ccbfcgdgbhehfhghfi",
            },
            marks: { triangle: "fighfheh" },
            move_tree: this.makePuzzleMoveTree(["gi"], ["eici"], 9, 9),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race and capture the marked stones without putting yourself in atari.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fedfefcgfgchfhci",
                white: "cecfbgdgegbhdhei",
            },
            marks: { triangle: "eidhegdg" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["dibi"], 9, 9),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Win the capturing race and capture the marked stones without putting yourself in atari.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bdbfcfagdgbhdhai",
                white: "dedfefbgcgegchci",
            },
            marks: { triangle: "cichcgbg" },
            move_tree: this.makePuzzleMoveTree(["di"], ["biah"], 9, 9),
        };
    }
}
