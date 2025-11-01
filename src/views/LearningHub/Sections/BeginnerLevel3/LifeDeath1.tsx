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

export class BL3LifeDeath1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10];
    }
    static section(): string {
        return "bl3-life-death-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning increase eye space", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on increase eye space",
            "Increase eye space",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "In situations of life and death, it is important to play at the vital point. But sometimes you first have to increase your eye space in order to live. And you can capture a group by first reducing the eye space. Here, Black can increase the eye space by playing at A. However, if Black first plays at one of the vital points B or C, the black group dies. Black to play. Play at B or C to see what happens and then make the black group alive by increasing the eye space first.",
        );
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
                black: "bqcqcrdq",
                white: "cmcodpdreoeqer",
            },
            marks: { A: "bo", B: "ar", C: "bs" },
            move_tree: this.makePuzzleMoveTree(["bobnao"], ["arbscsbp", "bsarbobnaoaq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "eobpcpdpbqeqfqfrhr",
                white: "cqdqbrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arcsbsescr"],
                [
                    "arcsbsesdscr",
                    "arcsesbs",
                    "arcscrbs",
                    "csaresbs",
                    "escsarbs",
                    "escsbsar",
                    "aqarcsapbses",
                    "aqarcsapesbs",
                    "aqarascs",
                    "fscsarbs",
                    "fscsbsar",
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
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "gqdqcpcobo",
                white: "cqbqbp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dreqerfrcs", "dreqerfrapbscsbrar", "dreqerfrbr", "dreqerfrar"],
                [
                    "dreqerfrapbsarcrbrds",
                    "dreqerfrapbsbrcscresdsarfsao",
                    "crdrarbscsap",
                    "crdrbsar",
                    "apcrbrdrbsar",
                ],
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
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "cnbpcpepbqeqeres",
                white: "cqdqarbrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscsbs"],
                ["dscscrbs", "csds", "bsds", "dpdodscsbscr", "dpdodscscrbs", "dpdocsds"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "doapbpcpdqfqarer",
                white: "aqbqcqdrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscrbr"],
                ["dscrcsbr", "escr", "brds", "crds"],
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
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "gqeqepdpcpcobobm",
                white: "dqcqbqbp",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "erfrdrapbsesaqdscs",
                    "erfrdrapbsaraqesbr",
                    "erfrdrapbsaraqbrescscrasbs",
                    "erfrdrapbsaraqbrescrcs",
                    "erfrds",
                    "drerbrcsdsapaqbsas",
                    "drerbrcsdsapbs",
                    "drerbsarbrdscs",
                    "drerbsapaqdscs",
                    "drarbrcsbs",
                ],
                ["drerbrcsdsbsapar"],
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
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "gqeqdpcpapeoboao",
                white: "brdqcqaqbp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erfrdrbqarcsbsescr", "erbqarcrdrcsdsbsascsfrgrfs"],
                [],
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
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "frfqeqdqcqbqbo",
                white: "eserdrcrbr",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["aqarascs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "apbpcpfpaqdqeqfr",
                white: "bqcqbrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arcsbsescr"],
                [
                    "arcsbsesdscr",
                    "arcsesbs",
                    "arcscrbs",
                    "csaresbs",
                    "csarbses",
                    "csarases",
                    "bsarcses",
                    "bsarescs",
                    "escsarbs",
                    "escsbsar",
                    "fscsarbs",
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
        return _("White to play. Make the white group alive by increasing the eye space first.");
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
                black: "gqeqfpdpeocobo",
                white: "crdqcpbp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erfresbqbrapcqarbsdsasfsaq", "erfresbqaqbrbsarapaocq", "erfresbqaqarapbrbs"],
                [],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
