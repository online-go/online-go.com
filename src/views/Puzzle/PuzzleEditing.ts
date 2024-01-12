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

import { GobanCanvasConfig, GoMath, PuzzleConfig, PuzzlePlacementSetting } from "goban";
import { errorAlerter, dup } from "misc";
import { PuzzleTransform } from "./PuzzleTransform";
import { _Puzzle } from "./Puzzle";
import * as data from "data";
import { abort_requests_in_flight, post, get } from "requests";
import * as preferences from "preferences";

export class PuzzleEditor {
    orig_puzzle_config?: PuzzleConfig;
    puzzle_config?: PuzzleConfig;
    puzzle: _Puzzle;
    transform: PuzzleTransform;

    constructor(puzzle: _Puzzle, transform: PuzzleTransform) {
        this.puzzle = puzzle;
        this.transform = transform;
    }

    clearPuzzles() {
        this.orig_puzzle_config = undefined;
        this.puzzle_config = undefined;
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
            const m = window.location.href.match(/collection_id=([0-9]+)/);
            if (m) {
                collection_id = parseInt(m[1]);
            }

            obj = Object.assign(obj, {
                id: 242,
                owner: data.get("user"),
                name: "",
                created: "",
                modified: "",
                puzzle: {
                    puzzle_player_move_mode: "free",
                    puzzle_rank: "18",
                    name: "",
                    //"move_tree": { },
                    initial_player: "black",
                    puzzle_opponent_move_mode: "automatic",
                    height: 19,
                    width: 19,
                    mode: "puzzle",
                    puzzle_collection: collection_id,
                    puzzle_type: "life_and_death",
                    initial_state: {
                        white: "",
                        black: "",
                    },
                    puzzle_description: "",
                },
                private: false,
                width: 19,
                height: 19,
                type: "life_and_death",
                has_solution: false,
                rank: 18,
                collection: {},
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
    createPuzzleCollection(puzzle: any, name: string): Promise<any> {
        let postResult: any;
        return post("puzzles/collections/", {
            name: name,
            private: false,
            price: "0.00",
        })
            .then((res) => {
                postResult = res;
                return getAllPuzzleCollections(data.get("user").id);
            })
            .then((collections) => {
                return {
                    puzzle: Object.assign({}, puzzle, { puzzle_collection: postResult.id }),
                    puzzle_collections: collections,
                };
            });
    }

    /**
     * Download a puzzle for given id
     * @param puzzle_id puzzle id
     * @param callback assigns new state and editing status
     */
    fetchPuzzle(puzzle_id: number, callback: (state: any, editing: boolean) => void) {
        abort_requests_in_flight(`puzzles/`, "GET");
        if (isNaN(puzzle_id)) {
            getAllPuzzleCollections(data.get("user").id)
                .then((collections) => {
                    console.log(collections);
                    callback(
                        Object.assign({ puzzle_collections: collections }, this.editPuzzle(true)),
                        true,
                    );
                })
                .catch(errorAlerter);
            return;
        }

        Promise.all([
            get(`puzzles/${puzzle_id}`),
            get(`puzzles/${puzzle_id}/collection_summary`),
            get(`puzzles/${puzzle_id}/rate`),
        ])
            .then((arr: [rest_api.PuzzleDetail, any, any]) => {
                const rating = arr[2];
                const puzzle = arr[0].puzzle;
                const collection = arr[0].collection;

                let randomize_transform = preferences.get(
                    "puzzle.randomize.transform",
                ); /* only randomize when we are getting a new puzzle */
                let randomize_color =
                    preferences.get(
                        "puzzle.randomize.color",
                    ); /* only randomize when we are getting a new puzzle */

                randomize_transform &&= collection.position_transform_enabled;
                randomize_color &&= collection.color_transform_enabled;

                this.transform.settings.zoom = preferences.get("puzzle.zoom");

                this.transform.settings.transform_color = randomize_color && Math.random() > 0.5;
                this.transform.settings.transform_h = randomize_transform && Math.random() > 0.5;
                this.transform.settings.transform_v = randomize_transform && Math.random() > 0.5;
                this.transform.settings.transform_x = randomize_transform && Math.random() > 0.5;

                const new_state = Object.assign(
                    {
                        puzzle_collection_summary: arr[1],
                        loaded: true,
                        my_rating: rating.rating,
                        rated: !("error" in rating),
                        zoom: this.transform.settings.zoom,
                        collection: collection,
                        transform_color: this.transform.settings.transform_color,
                        transform_h: this.transform.settings.transform_h,
                        transform_v: this.transform.settings.transform_v,
                        transform_x: this.transform.settings.transform_x,
                    },
                    arr[0],
                );

                this.orig_puzzle_config = puzzle;

                const bounds = this.getBounds(puzzle, puzzle.width, puzzle.height);
                new_state.zoomable =
                    (bounds &&
                        (bounds.left > 0 ||
                            bounds.top > 0 ||
                            bounds.right < puzzle.width - 1 ||
                            bounds.bottom < puzzle.height - 1)) ||
                    undefined;

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
    reset(
        goban_div: HTMLDivElement,
        editing: boolean,
        replacementSettingsFunction: () => PuzzlePlacementSetting,
    ): GobanCanvasConfig {
        const puzzle = (this.puzzle_config = dup(this.orig_puzzle_config));

        if (!puzzle) {
            throw new Error("No puzzle loaded");
        }

        if (!editing) {
            this.transform.transformPuzzle(puzzle);
        }
        let bounds = this.transform.settings.zoom
            ? this.getBounds(puzzle, puzzle.width as number, puzzle.height as number)
            : null;
        if (editing) {
            bounds = null;
        }

        const label_position = preferences.get("label-positioning-puzzles");

        while (goban_div.firstChild) {
            goban_div.removeChild(goban_div.firstChild);
        }

        const opts: GobanCanvasConfig = Object.assign(
            {
                board_div: goban_div,
                interactive: true,
                mode: "puzzle" as const,
                draw_top_labels: label_position === "all" || label_position.indexOf("top") >= 0,
                draw_left_labels: label_position === "all" || label_position.indexOf("left") >= 0,
                draw_right_labels: label_position === "all" || label_position.indexOf("right") >= 0,
                draw_bottom_labels:
                    label_position === "all" || label_position.indexOf("bottom") >= 0,
                getPuzzlePlacementSetting: () => ({ mode: "play" as const }),
                bounds: bounds || undefined,
                player_id: 0,
                server_socket: undefined,
                square_size: 4,
            },
            puzzle,
        );

        if (editing) {
            opts.getPuzzlePlacementSetting = replacementSettingsFunction;
            opts.puzzle_opponent_move_mode = "automatic";
            opts.puzzle_player_move_mode = "free";
            if (puzzle) {
                opts.puzzle_rank = puzzle.puzzle_rank || 0;
                opts.puzzle_collection = puzzle.puzzle_collection || 0;
                opts.puzzle_type = puzzle.puzzle_type || "";
            }

            opts.move_tree_container = document.getElementById("move-tree-container") || undefined;
        }

        return opts;
    }

    getBounds(puzzle: PuzzleConfig, width: number, height: number) {
        const ret = {
            top: 9999,
            bottom: 0,
            left: 9999,
            right: 0,
        };

        const process = (pos: any, width: number, height: number) => {
            if (Array.isArray(pos)) {
                for (let i = 0; i < pos.length; ++i) {
                    process(pos[i], width, height);
                }
                return;
            }

            if (pos.x >= 0) {
                ret.left = Math.min(pos.x, ret.left);
                ret.right = Math.max(pos.x, ret.right);
                ret.top = Math.min(pos.y, ret.top);
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

        process(GoMath.decodeMoves(puzzle.initial_state!.black, width, height), width, height);
        process(GoMath.decodeMoves(puzzle.initial_state!.white, width, height), width, height);
        process(puzzle.move_tree, width, height);

        if (ret.top > ret.bottom) {
            return null;
        }

        const padding = 1;
        ret.top = Math.max(0, ret.top - padding);
        ret.bottom = Math.min(height - 1, ret.bottom + padding);
        ret.left = Math.max(0, ret.left - padding);
        ret.right = Math.min(width - 1, ret.right + padding);

        const snap_to_edge = 3;
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

export async function getAllPuzzleCollections(
    owner_id: number,
): Promise<rest_api.PuzzleCollection[]> {
    let again = true;
    let page = 1;
    const ret: rest_api.PuzzleCollection[] = [];

    while (again) {
        const res = await get("puzzles/collections/", {
            page_size: 100,
            owner: owner_id,
            page,
        });

        ret.push(...res.results);
        if (res.next) {
            page += 1;
        } else {
            again = false;
        }
    }

    return ret;
}
