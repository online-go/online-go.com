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

export class TwoEyes extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "make-alive";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning make two eyes", "Two Eyes");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on making two eyes", "Make two eyes");
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The white group is not safe yet. Black can prevent White from making two eyes by playing at A. White to play. Make the white group alive by making two eyes.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "egfggghgigeh",
                white: "fhghhhihhi",
            },
            marks: { A: "fi" },
            move_tree: this.makePuzzleMoveTree(["fi"], ["eifigidh"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dgegfggghgigdhei",
                white: "ehfhghhhihhi",
            },
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "egfggghgigehei",
                white: "fhghhhihfi",
            },
            move_tree: this.makePuzzleMoveTree(["hi"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bgcgdgegfggghgbhhhbihi",
                white: "chdhehfhgheigi",
            },
            move_tree: this.makePuzzleMoveTree(["ci"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "agbgcgdgegehei",
                white: "bhchdhbidi",
            },
            move_tree: this.makePuzzleMoveTree(["ah"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make two eyes.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bgcgdgegfggghgbhhhbifihi",
                white: "chdhehfhghciei",
            },
            move_tree: this.makePuzzleMoveTree(["gi"], [], 9, 9),
        };
    }
}
