/*
 * Copyright (C) 2012-2020  Online-Go.com
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

import * as React from "react";
import {LearningPage, DummyPage} from './LearningPage';
import {_, pgettext, interpolate} from "translate";
import {LearningHubSection} from './LearningHubSection';

export class SnapBack extends LearningHubSection {
    static pages():Array<typeof LearningPage> {
        return [
            Page1,
            Page2,
            Page3,
            Page4,
            Page5,
            Page6,
            Page7,
        ];
    }

    static section():string { return "snapback"; }
    static title():string { return pgettext("Tutorial section on snapback", "Snapback!"); }
    static subtext():string { return pgettext("Tutorial section on snapback", "Sacrificing stones to come back and capture a group"); }
}


class Page1 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("Capture the two white stones at e3 and e4");
    }
    config() {
        return {
            mode: "puzzle",
            initial_state: {
                'black': 'd4d3e2f2g3e5',
                'white': 'e4e3f5g4'
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "f4f3f4"
                ],
                [
                    "f3f4"
                ]
            )
        };
    }

}

class Page2 extends LearningPage {
    text() {
        return _("Capture the two white stones");
    }
    config() {
        return {
            mode: "puzzle",
            initial_state: {
                'black': 'c4d3d5e5f4f3',
                'white': 'c2d2c3e3e4',
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "e2d4d3"
                ],
                [
                    "d4e2"
                ]
            )
        };
    }

}

class Page3 extends LearningPage {
    text() {
        return _("Capture the three white stones");
    }
    config() {
        return {
            mode: "puzzle",
            initial_state: {
                'black': 'a3b2c1c3d3e3f3f2',
                'white': 'c2d2e2f1g1g2g3g4'
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "e1d1e1"
                ],
                [
                    "d1e1",
                    "b1e1",
                ]
            )
        };
    }

}

class Page4 extends LearningPage {
    text() {
        return _("Capture the five white stones");
    }
    config() {
        return {
            mode: "puzzle",
            initial_state: {
                'black': 'c9d9e9b8f8f7f6f5e5d4d6',
                'white': 'c8d8e8e7e6c6d5d4d3'
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "c7d7d6"
                ],
                [
                    "d7c7"
                ]
            )
        };
    }

}

class Page5 extends LearningPage {
    text() {
        return _("Save your group");
    }
    config() {
        return {
            mode: "puzzle",
            initial_state: {
                'black': 'a3a4b3b5b6c2c3c4c5',
                'white': 'a2b2a6b7c1c6c7d1d2d3d4d5'
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "b1a1b1"
                ],
                [
                    "a5b4",
                    "a1b1",
                    "b4a5"
                ]
            )
        };
    }

}

class Page6 extends LearningPage {
    text() {
        return _("Capture the four white stones");
    }
    config() {
        return {
            mode: "puzzle",
            initial_state: {
                'black': 'c6d7e8f7f6f5f4d3e3',
                'white': 'b5b6c5e4e5e6e7'
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "d5d4c4d6d5"
                ],
                [
                    "d4d5",
                    "d6d5",
                    "d5d4d6c4"
                ]
            )
        };
    }

}

class Page7 extends LearningPage {
    text() {
        return _("Capture all of the white stones");
    }
    config() {
        return {
            mode: "puzzle",
            initial_state: {
                'white': 'a4a5a6b4b7b8b9c4c5c6',
                'black': 'a3b3c3a8b6c7c8c9d4d5d6e7'
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "a7a9a7b5b6"
                ],
                [
                    "a9a7",
                    "a7a9a8a7"
                ]
            )
        };
    }

}
