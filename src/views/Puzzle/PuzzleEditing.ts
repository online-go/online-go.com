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

import {
    Goban,
    GobanCanvasConfig,
    GoMath,
    PuzzleConfig,
    PuzzlePlacementSetting,
} from "goban";
import {errorAlerter, dup, ignore} from "misc";
import {TransformSettings, PuzzleTransform} from './PuzzleTransform';
import {Puzzle} from './Puzzle';
import * as data from "data";
import {abort_requests_in_flight, post, get, put, del} from "requests";
import * as preferences from "preferences";


export class PuzzleEditor {
    orig_puzzle_config: PuzzleConfig = null;
    puzzle_config: PuzzleConfig = null;
    puzzle: Puzzle;
    transform: PuzzleTransform ;

    constructor(
        puzzle: Puzzle,
        transform: PuzzleTransform
    ) {
        this.puzzle = puzzle;
        this.transform = transform;
    }

    clearPuzzles() {
        this.orig_puzzle_config = null;
        this.puzzle_config = null;
    }

    /**
     * Edit puzzle and return new state
     * @param new_puzzle True if it is a new puzzle
     * @return State
     */
    private editPuzzle(new_puzzle: boolean): any {
        this.transform.settings.reset();

        let obj: any = {
            editing: true,
            edit_step: "setup",
            setup_color: "black",
            loaded: true,
        };

        if (new_puzzle) {
            let collection_id = 0;
            let m = window.location.href.match(/collection_id=([0-9]+)/);
            if (m) {
                collection_id = parseInt(m[1]);
            }

            obj = Object.assign(obj, {
                "id": 242,
                "owner": data.get("user"),
                "name": "",
                "created": "",
                "modified": "",
                "puzzle": {
                    "puzzle_player_move_mode": "free",
                    "puzzle_rank": "18",
                    "name": "",
                    //"move_tree": { },
                    "initial_player": "black",
                    "puzzle_opponent_move_mode": "automatic",
                    "height": 19,
                    "width": 19,
                    "mode": "puzzle",
                    "puzzle_collection": collection_id,
                    "puzzle_type": "life_and_death",
                    "initial_state": {
                        "white": "",
                        "black": ""
                    },
                    "puzzle_description": ""
                },
                "private": false,
                "width": 19,
                "height": 19,
                "type": "life_and_death",
                "has_solution": false,
                "rank": 18,
                "collection": { },
            });
            this.orig_puzzle_config = obj.puzzle;
            obj.puzzle_collection_summary = [];
        }

        return obj;
    }

    /**
     * Create collection for puzzle
     * NOTE: Does not catch error
     * @param puzzle Puzzle
     */
    createPuzzleCollection(puzzle: any, name:string): Promise<any> {
        let postResult;
        return post("puzzles/collections/", {
            "name": name,
            "private": false,
            "price": "0.00",
        }).then((res) => {
            postResult = res;
            return get("puzzles/collections/", {page_size: 100, owner: data.get("user").id});
        }).then((collections) => {
            return {
                puzzle: Object.assign({}, puzzle, {puzzle_collection: postResult.id}),
                puzzle_collections: collections.results
            };
        });
    }

    /**
     * Download a puzzle for given id
     * @param puzzle_id puzzle id
     * @param callback assignes new state and editing status
     */
    fetchPuzzle(puzzle_id: number, callback: (state: any, editing: boolean) => void) {
        abort_requests_in_flight(`puzzles/`, "GET");
        if (isNaN(puzzle_id)) {
            get("puzzles/collections/", {page_size: 100, owner: data.get("user").id})
            .then((collections) => {
                callback(
                    Object.assign(
                        { puzzle_collections: collections.results },
                        this.editPuzzle(true)
                    ),
                    true
                );
            })
            .catch(errorAlerter);
            return;
        }

        Promise.all([
            get("puzzles/%%", puzzle_id),
            get("puzzles/%%/collection_summary", puzzle_id),
            get("puzzles/%%/rate", puzzle_id),
        ])
        .then((arr) => {
            let rating = arr[2];
            let puzzle = arr[0].puzzle;

            let randomize_transform = preferences.get("puzzle.randomize.transform"); /* only randomize when we are getting a new puzzle */
            let randomize_color = preferences.get("puzzle.randomize.color"); /* only randomize when we are getting a new puzzle */

            this.transform.settings.zoom = preferences.get("puzzle.zoom");

            this.transform.settings.transform_color = randomize_color && Math.random() > 0.5;
            this.transform.settings.transform_h = randomize_transform && Math.random() > 0.5;
            this.transform.settings.transform_v = randomize_transform && Math.random() > 0.5;
            this.transform.settings.transform_x = randomize_transform && Math.random() > 0.5;

            let new_state = Object.assign({
                puzzle_collection_summary: arr[1],
                loaded: true,
                my_rating: rating.rating,
                rated: !("error" in rating),
                zoom: this.transform.settings.zoom,
                transform_color: this.transform.settings.transform_color,
                transform_h: this.transform.settings.transform_h,
                transform_v: this.transform.settings.transform_v,
                transform_x: this.transform.settings.transform_x,
            }, arr[0]);

            this.orig_puzzle_config = puzzle;

            let bounds = this.getBounds(puzzle, puzzle.width, puzzle.height);
            new_state.zoomable = bounds && (bounds.left > 0 || bounds.top > 0 || bounds.right < puzzle.width - 1 || bounds.bottom < puzzle.height - 1);

            callback(new_state, false);
        })
        .catch(errorAlerter);
    }

    /**
     * Reset board
     * @param goban_div Goban Html Div component
     * @param editing True if it is editing
     * @return Goban options
     */
    reset(goban_div: HTMLDivElement, editing: boolean, replacementSettingsFunction: () => PuzzlePlacementSetting): GobanCanvasConfig {
        let puzzle = this.puzzle_config = dup(this.orig_puzzle_config);

        if (!puzzle) {
            throw new Error("No puzzle loaded");
        }

        if (!editing) {
            this.transform.transformPuzzle(puzzle);
        }
        let bounds = this.transform.settings.zoom ? this.getBounds(puzzle, puzzle.width, puzzle.height) : null;
        if (editing) {
            bounds = null;
        }

        let label_position = preferences.get("label-positioning");

        while (goban_div.firstChild) {
            goban_div.removeChild(goban_div.firstChild);
        }

        let opts:GobanCanvasConfig = Object.assign({
            "board_div": goban_div,
            "interactive": true,
            "mode": "puzzle",
            "draw_top_labels": (label_position === "all" || label_position.indexOf("top") >= 0),
            "draw_left_labels": (label_position === "all" || label_position.indexOf("left") >= 0),
            "draw_right_labels": (label_position === "all" || label_position.indexOf("right") >= 0),
            "draw_bottom_labels": (label_position === "all" || label_position.indexOf("bottom") >= 0),
            "getPuzzlePlacementSetting": () => ({ "mode": "play" }),
            "bounds": bounds,
            "player_id": 0,
            "server_socket": null,
            "square_size": 4
        }, puzzle);

        let newState = null;

        if (editing) {
            opts.getPuzzlePlacementSetting = replacementSettingsFunction;
            opts.puzzle_opponent_move_mode = "automatic";
            opts.puzzle_player_move_mode = "free";
            opts.puzzle_rank = puzzle && puzzle.puzzle_rank ? puzzle.puzzle_rank : 0;
            opts.puzzle_collection = (puzzle && puzzle.collection ? puzzle.collection.id : 0);
            opts.puzzle_type = (puzzle && puzzle.type ? puzzle.type : "");
            opts.move_tree_container = document.getElementById("move-tree-container");
        }

        return opts;
    }


    getBounds(puzzle, width, height) {
        let ret = {
            top: 9999,
            bottom: 0,
            left: 9999,
            right: 0,
        };

        let process = (pos, width, height) => {
            if (Array.isArray(pos)) {
                for (let i = 0; i < pos.length; ++i) {
                    process(pos[i], width, height);
                }
                return;
            }

            if (pos.x >= 0) {
                ret.left   = Math.min(pos.x, ret.left);
                ret.right  = Math.max(pos.x, ret.right);
                ret.top    = Math.min(pos.y, ret.top);
                ret.bottom = Math.max(pos.y, ret.bottom);
            }

            if (pos.marks && Array.isArray(pos.marks)) {
                for (let i = 0; i < pos.marks.length; ++i) {
                    process(pos.marks[i], width, height);
                }
            }

            if (pos.branches) {
                process(pos.branches, width, height);
            }
        };

        process(GoMath.decodeMoves(puzzle.initial_state.black), width, height);
        process(GoMath.decodeMoves(puzzle.initial_state.white), width, height);
        process(puzzle.move_tree, width, height);

        if (ret.top > ret.bottom) {
            return null;
        }

        let padding = 1;
        ret.top = Math.max(0, ret.top - padding);
        ret.bottom = Math.min(height - 1, ret.bottom + padding);
        ret.left = Math.max(0, ret.left - padding);
        ret.right = Math.min(width - 1, ret.right + padding);

        let snap_to_edge = 3;
        if (ret.top <= snap_to_edge) {
            ret.top = 0;
        }
        if (ret.bottom >= height - snap_to_edge) {
            ret.bottom = height - 1;
        }
        if (ret.left <= snap_to_edge) {
            ret.left = 0;
        }
        if (ret.right >= width - snap_to_edge) {
            ret.right = width - 1;
        }

        return ret;
    }


}
