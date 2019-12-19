/*
 * Copyright (C) 2012-2019  Online-Go.com
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

import {GoMath} from "goban";

export class TransformSettings {
    constructor(
        public transform_color: boolean = false,
        public transform_h: boolean = false,
        public transform_x: boolean = false,
        public transform_v: boolean = false,
        public zoom: boolean = false
    ) {}

    reset() {
        this.transform_color = false;
        this.transform_h = false;
        this.transform_v = false;
        this.transform_x = false;
        this.zoom = false;
    }

    log() {
        console.log(
            this.transform_x
           , this.transform_h
           , this.transform_v
           , this.transform_color,
           this.zoom
       );
    }
}

export class PuzzleTransform {

    constructor(
        public settings: TransformSettings
    ) {}

    transformMoveText(puzzle, txt) {
        if (this.settings.transform_color) {
            let colors = {
                "White" : "Black",
                "Musta" : "Valkoinen",
                "Negro" : "Blanco",
                "Noir" : "Blanc",
                "Czarny" : "Biały",
                "Svart" : "Vit",
            };

            let utf8_colors = {
                "Schwarz" : "Weiß",
                "黑" : "白",
                "Черные" : "Белые",
            };


            let t = "tttttttttttt";
            let T = "TTTTTTTTTTTT";
            let tr = /tttttttttttt/g;
            let Tr = /TTTTTTTTTTTT/g;
            for (let c1 in colors) {
                let c2 = colors[c1];

                let c1r = new RegExp("\\b" + c1 + "\\b", "gm");
                let c2r = new RegExp("\\b" + c2 + "\\b", "gm");

                let c1caser = new RegExp("\\b" + c1 + "\\b", "gmi");
                let c2caser = new RegExp("\\b" + c2 + "\\b", "gmi");

                let c1case = c1.toLowerCase();
                let c2case = c2.toLowerCase();

                txt = txt
                        .replace(c1r, T)
                        .replace(c1, T)
                        .replace(c1caser, t)
                        .replace(c2r, c1)
                        .replace(c2, c1)
                        .replace(c2caser, c1case)
                        .replace(tr, c2case)
                        .replace(Tr, c2);
            }
            for (let c1 in utf8_colors) {
                let c2 = utf8_colors[c1];

                txt = txt
                        .replace(c1, T)
                        .replace(c2, c1)
                        .replace(Tr, c2);
            }
        }

        txt = txt.replace(/\b([a-zA-Z][0-9]{1,2})\b/g, (match, contents, offset, s) => {
            let dec = GoMath.decodeMoves(contents, puzzle.width, puzzle.height);
            this.transformCoordinate(puzzle, dec[0], puzzle.width, puzzle.height);
            let ret = GoMath.prettyCoords(dec[0].x, dec[0].y, puzzle.height);
            if (/[a-z]/.test(contents)) {
                return ret.toLowerCase();
            } else {
                return ret.toUpperCase();
            }
        });

        return txt;
    }

    transformCoordinate(puzzle, coord, width, height) {
        if (coord.marks && Array.isArray(coord.marks)) {
            for (let i = 0; i < coord.marks.length; ++i) {
                this.transformCoordinate(puzzle, coord.marks[i], width, height);
            }
        }
        if (coord.text) {
            coord.text = this.transformMoveText(puzzle, coord.text);
        }

        if (coord.x < 0) { return; }

        if (this.settings.transform_x) {
            let t = coord.y;
            coord.y = coord.x;
            coord.x = t;
        }
        if (this.settings.transform_h) { coord.x = (width - 1) - coord.x; }
        if (this.settings.transform_v) { coord.y = (height - 1) - coord.y; }
    }

    transformCoordinates(puzzle, coords, width, height) {
        if (Array.isArray(coords)) {
            for (let i = 0; i < coords.length; ++i) {
                this.transformCoordinate(puzzle, coords[i], width, height);
                if (coords[i].branches) {
                    this.transformCoordinates(puzzle, coords[i].branches, width, height);
                }
            }
        } else {
            this.transformCoordinate(puzzle, coords, width, height);
            if (coords.branches) {
                this.transformCoordinates(puzzle, coords.branches, width, height);
            }
        }
        return coords;
    }

    transformPuzzle(puzzle) {
        let width = puzzle.width;
        let height = puzzle.height;

        if (puzzle.initial_state && puzzle.initial_state.black && puzzle.initial_state.black.length) {
            puzzle.initial_state.black = GoMath.encodeMoves(this.transformCoordinates(puzzle, GoMath.decodeMoves(puzzle.initial_state.black, width, height), width, height));
        }
        if (puzzle.initial_state && puzzle.initial_state.white && puzzle.initial_state.white.length) {
            puzzle.initial_state.white = GoMath.encodeMoves(this.transformCoordinates(puzzle, GoMath.decodeMoves(puzzle.initial_state.white, width, height), width, height));
        }
        if (puzzle.move_tree) {
            this.transformCoordinates(puzzle, puzzle.move_tree, width, height);
        }

        if (this.settings.transform_color) {
            let t = puzzle.initial_state.black;
            puzzle.initial_state.black = puzzle.initial_state.white;
            puzzle.initial_state.white = t;

            if (puzzle.initial_player === "black") {
                puzzle.initial_player = "white";
            } else {
                puzzle.initial_player = "black";
            }
        }

        if (puzzle.puzzle_description) {
            puzzle.puzzle_description = this.transformMoveText(puzzle, puzzle.puzzle_description);
        }
    }


    /**
     * Return state for Puzzle class, based on given transformation
     * @param what transformation key
     * @return Puzzle State
     */
    stateForTransformation(what): any {
        let state: any = null;

        switch (what) {
            case "h"     : state = {transform_h     : this.settings.transform_h     = !this.settings.transform_h};     break;
            case "v"     : state = {transform_v     : this.settings.transform_v     = !this.settings.transform_v};     break;
            case "x"     : state = {transform_x     : this.settings.transform_x     = !this.settings.transform_x};     break;
            case "color" : state = {transform_color : this.settings.transform_color = !this.settings.transform_color}; break;
            case "zoom"  :
                state = {zoom: this.settings.zoom = !this.settings.zoom};
            break;
        }

       return state;
    }


}
