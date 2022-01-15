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
import { PuzzleConfig } from "goban";
import { LearningPage, DummyPage } from "./LearningPage";
import { _, pgettext, interpolate } from "translate";
import { LearningHubSection } from "./LearningHubSection";

export class Intro extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page1];
    }

    static section(): string {
        return "rules-intro";
    }
    static title(): string {
        return pgettext("Tutorial section name on rules introduction", "The Game!");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on rules introduction",
            "Build territory one stone at a time",
        );
    }
}

class Page1 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _(
            "You can play a stone on any crossline, even the outer ones. The goal of the game is to surround the largest areas. Stones don't move but can be captured. Make a move to continue",
        );
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: { black: "", white: "" },

            move_tree: this.makePuzzleMoveTree(
                [
                    "a1",
                    "a2",
                    "a3",
                    "a4",
                    "a5",
                    "a6",
                    "a7",
                    "a8",
                    "a9",
                    "b1",
                    "b2",
                    "b3",
                    "b4",
                    "b5",
                    "b6",
                    "b7",
                    "b8",
                    "b9",
                    "c1",
                    "c2",
                    "c3",
                    "c4",
                    "c5",
                    "c6",
                    "c7",
                    "c8",
                    "c9",
                    "d1",
                    "d2",
                    "d3",
                    "d4",
                    "d5",
                    "d6",
                    "d7",
                    "d8",
                    "d9",
                    "e1",
                    "e2",
                    "e3",
                    "e4",
                    "e5",
                    "e6",
                    "e7",
                    "e8",
                    "e9",
                    "f1",
                    "f2",
                    "f3",
                    "f4",
                    "f5",
                    "f6",
                    "f7",
                    "f8",
                    "f9",
                    "g1",
                    "g2",
                    "g3",
                    "g4",
                    "g5",
                    "g6",
                    "g7",
                    "g8",
                    "g9",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                    "h7",
                    "h8",
                    "h9",
                    "j1",
                    "j2",
                    "j3",
                    "j4",
                    "j5",
                    "j6",
                    "j7",
                    "j8",
                    "j9",
                ],
                [],
            ),
        };
    }
}
