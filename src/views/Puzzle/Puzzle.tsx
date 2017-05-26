/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {Link, browserHistory} from "react-router";
import {_, pgettext, interpolate} from "translate";
import {abort_requests_in_flight, post, get, put, del} from "requests";
import {KBShortcut} from "KBShortcut";
import {goban_view_mode, goban_view_squashed} from "Game";
import {PersistentElement} from "PersistentElement";
import {errorAlerter, dup, ignore} from "misc";
import {longRankString} from "rank_utils";
import {Goban, GoMath} from "goban";
import {Markdown} from "Markdown";
import {Player} from "Player";
import {StarRating} from "StarRating";
import {Resizable} from "Resizable";
import preferences from "preferences";
import data from "data";

declare var swal;

interface PuzzleProperties {
    params: {
        puzzle_id: string
    };
}
let ranks = [];
for (let i = 0; i < 39; ++i) {
    ranks.push({"value": i, "text": longRankString(i)});
}

export class Puzzle extends React.Component<PuzzleProperties, any> {
    refs: {
        goban;
        goban_container;
        next_link;

        collection;
        name;
        puzzle_type;
    };

    goban: Goban;
    goban_div: any;
    orig_puzzle: any = null;
    puzzle: any = null;
    goban_opts: any = {};

    zoom: boolean;
    transform_color: boolean;
    transform_h: boolean;
    transform_x: boolean;
    transform_v: boolean;
    set_analyze_tool: any = {};

    constructor(props) { /* {{{ */
        super(props);
        this.state = {
            loaded: false,
            edit_step: "setup",
            setup_color: "black",
            puzzle_collection_summary: [],
        };

        this.goban_div = $("<div className='Goban'>");
        this.reinitialize();

        this.set_analyze_tool = {
            stone_null: this.setAnalyzeTool.bind(this, "stone", null),
            stone_alternate: this.setAnalyzeTool.bind(this, "stone", "alternate"),
            stone_black: this.setAnalyzeTool.bind(this, "stone", "black"),
            stone_white: this.setAnalyzeTool.bind(this, "stone", "white"),
            label_triangle: this.setAnalyzeTool.bind(this, "label", "triangle"),
            label_square: this.setAnalyzeTool.bind(this, "label", "square"),
            label_circle: this.setAnalyzeTool.bind(this, "label", "circle"),
            label_cross: this.setAnalyzeTool.bind(this, "label", "cross"),
            label_letters: this.setAnalyzeTool.bind(this, "label", "letters"),
            label_numbers: this.setAnalyzeTool.bind(this, "label", "numbers"),
            draw: () => { this.setAnalyzeTool("draw", this.state.analyze_pencil_color); },
            clear_and_sync: () => { this.goban.syncReviewMove({"clearpen": true}); this.goban.clearAnalysisDrawing(); },
            delete_branch: () => { this.deleteBranch(); },
        };

    } /* }}} */

    componentDidMount() {{{
        this.fetchPuzzle(parseInt(this.props.params.puzzle_id));
        this.onResize();
        $(window).on("resize", this.onResize as () => void);
    }}}
    componentWillReceiveProps(next_props) {{{
        if (this.props.params.puzzle_id !== next_props.params.puzzle_id) {
            this.reinitialize();
            this.setState({
                loaded: false,
                puzzle_collection_summary: [],
                show_correct: false,
                show_wrong: false,
                editing: false,
            });
            this.fetchPuzzle(parseInt(next_props.params.puzzle_id));
        }
    }}}
    componentWillUnmount() {{{
        $(window).off("resize", this.onResize as () => void);
    }}}
    componentDidUpdate() {{{
        this.onResize();
    }}}
    onResize = (no_debounce?: boolean) => {{{
        if (!this.refs.goban_container) {
            return;
        }

        if (this.goban) {
            this.goban.setSquareSizeBasedOnDisplayWidth(
                Math.min(this.refs.goban_container.offsetWidth, this.refs.goban_container.offsetHeight)
            );

            this.recenterGoban();
        }
    }}}
    recenterGoban() {{{
        let m = this.goban.computeMetrics();
        $(this.refs.goban_container).css({
            top: Math.ceil(this.refs.goban_container.offsetHeight - m.height) / 2,
            left: Math.ceil(this.refs.goban_container.offsetWidth - m.width) / 2,
        });
    }}}
    reinitialize() {{{
        if (this.goban) {
            this.goban.destroy();
            this.goban = null;
        }
        this.goban_div.empty();
        this.orig_puzzle = null;
        this.puzzle = null;
    }}}

    setAnalyzeTool(tool, subtool) {{{
        if (this.checkAndEnterAnalysis()) {
            $("#game-analyze-button-bar .active").removeClass("active");
            $("#game-analyze-" + tool + "-tool").addClass("active");
            switch (tool) {
                case "draw":
                    this.goban.setAnalyzeTool(tool, this.state.analyze_pencil_color);
                break;
                case "erase":
                    console.log("Erase not supported yet");
                break;
                case "label":
                    this.goban.setAnalyzeTool(tool, subtool);
                break;
                case "stone":
                    if (subtool == null) {
                    //subtool = goban.engine.colorToMove() === "black" ? "black-white" : "white-black"
                    subtool = "alternate";
                }
                this.goban.setAnalyzeTool(tool, subtool);
                break;
            }
        }

        this.sync_state();
        return false;
    }}}

    checkAndEnterAnalysis() {{{
        if (this.goban.mode === "puzzle") {
            this.goban.setMode("analyze", true);
            return true;
        }
        if (this.goban.mode === "analyze") {
            return true;
        }
        return false;
    }}}
    checkAndEnterPuzzleMode() {{{
        if (this.goban.mode !== "puzzle") {
            this.goban.setAnalyzeTool("stone", "alternate");
            this.goban.setMode("puzzle", true);
        }
        return true;
    }}}

    editPuzzle(new_puzzle: boolean) {{{
        this.zoom = false;
        this.transform_color = false;
        this.transform_h = false;
        this.transform_v = false;
        this.transform_x = false;

        let obj: any = {
            editing: true,
            edit_step: "setup",
            setup_color: "black",
            loaded: true,
        };

        if (new_puzzle) {
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
                    "puzzle_collection": 0,
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
            this.orig_puzzle = obj.puzzle;
            obj.puzzle_collection_summary = [];
        }
        this.reset(true);

        this.setState(obj);
    }}}
    fetchPuzzle(puzzle_id: number) {{{
        abort_requests_in_flight(`puzzles/`, "GET");
        if (isNaN(puzzle_id)) {
            get(`puzzles/collections/`, {page_size: 100, owner: data.get("user").id})
            .then((collections) => {
                this.setState({
                    puzzle_collections: collections.results
                });
                this.editPuzzle(true);
            })
            .catch(errorAlerter);
            return;
        }

        Promise.all([
            get(`puzzles/${puzzle_id}`),
            get(`puzzles/${puzzle_id}/collection_summary`),
            get(`puzzles/${puzzle_id}/rate`),
        ])
        .then((arr) => {
            let rating = arr[2];
            let puzzle = arr[0].puzzle;

            let randomize_transform = preferences.get("puzzle.randomize.transform"); /* only randomize when we are getting a new puzzle */
            let randomize_color = preferences.get("puzzle.randomize.color"); /* only randomize when we are getting a new puzzle */
            this.zoom = preferences.get("puzzle.zoom");
            this.transform_color = randomize_color && Math.random() > 0.5;
            this.transform_h = randomize_transform && Math.random() > 0.5;
            this.transform_v = randomize_transform && Math.random() > 0.5;
            this.transform_x = randomize_transform && Math.random() > 0.5;

            let new_state = Object.assign({
                puzzle_collection_summary: arr[1],
                loaded: true,
                my_rating: rating.rating,
                rated: !("error" in rating),
                zoom: this.zoom,
                transform_color: this.transform_color,
                transform_h: this.transform_h,
                transform_v: this.transform_v,
                transform_x: this.transform_x,
            }, arr[0]);

            console.log("==>", puzzle);

            this.orig_puzzle = puzzle;
            this.reset();

            let bounds = this.getBounds(puzzle, puzzle.width, puzzle.height);
            new_state.zoomable = bounds && (bounds.left > 0 || bounds.top > 0 || bounds.right < puzzle.width - 1 || bounds.bottom < puzzle.height - 1);

            this.setState(new_state);
            this.onResize(true);
        })
        .catch(errorAlerter);
    }}}
    reset = (editing?: boolean) => {{{
        let puzzle = this.puzzle = dup(this.orig_puzzle);

        if (!puzzle) {
            throw new Error("No puzzle loaded");
        }

        if (!editing) {
            this.transformPuzzle();
        }
        let bounds = this.zoom ? this.getBounds(puzzle, puzzle.width, puzzle.height) : null;
        if (editing) {
            bounds = null;
        }

        let label_position = preferences.get("label-positioning");

        this.goban_div.empty();

        let opts: any = Object.assign({
            "board_div": this.goban_div,
            "interactive": true,
            //"onUpdate": sync,
            "mode": "puzzle",
            "draw_top_labels": (label_position === "all" || label_position.indexOf("top") >= 0),
            "draw_left_labels": (label_position === "all" || label_position.indexOf("left") >= 0),
            "draw_right_labels": (label_position === "all" || label_position.indexOf("right") >= 0),
            "draw_bottom_labels": (label_position === "all" || label_position.indexOf("bottom") >= 0),
            //"move_tree_div": "#game-move-tree-container",
            //"move_tree_canvas": "#game-move-tree-canvas",
            "getPuzzlePlacementSetting": () => {
                return {"mode": "play"};
            },
            "bounds": bounds,
            "player_id": 0,
            "server_socket": null,

            //"square_size": function(goban) { return getGobanSquareSize(goban); },
            /*
            "onCorrectAnswer": function() {
                $scope.show_correct = true;
                $scope.show_wrong = false;
                if (!$scope.$$phase) $scope.$digest();
                console.log("Correct");
                setTimeout(function() {
                    $("#next_link").focus();
                }, 1);
                logSuccess();
            },
            "onWrongAnswer": function() {
                $scope.show_wrong = true;
                $scope.show_correct = false;
                if (!$scope.$$phase) $scope.$digest();
                console.log("Wrong");
                attempts++;
            },
            */

           square_size: 4

            //"display_width": Math.min(this.refs.goban_container.offsetWidth, this.refs.goban_container.offsetHeight),
        }, puzzle);

        if (editing) {
            opts.getPuzzlePlacementSetting = () => {
                if (this.state.edit_step === "setup") {
                    return {
                        "mode": "setup",
                        "color": this.state.setup_color === "black" ? 1 : 2,
                    };
                }
                if (this.state.edit_step === "moves") {
                    this.setState({show_warning: true});
                    return {
                        "mode": "place",
                        "color": 0,
                    };
                }
            };
            opts.puzzle_opponent_move_mode = "automatic";
            opts.puzzle_player_move_mode = "free";
            opts.puzzle_rank = puzzle && puzzle.puzzle_rank ? puzzle.puzzle_rank : 0;
            opts.puzzle_collection = (puzzle && puzzle.collection ? puzzle.collection.id : 0);
            opts.puzzle_type = (puzzle && puzzle.type ? puzzle.type : "");
            opts.move_tree_div = "#move-tree-container";
            opts.move_tree_canvas = "#move-tree-canvas";


        }

        this.goban_opts = opts;



        this.goban = new Goban(opts);
        this.goban.setMode("puzzle");
        window["global_goban"] = this.goban;
        this.goban.on("update", () => this.sync_state());
        this.goban.on("update", () => this.forceUpdate());

        this.goban.on("puzzle-wrong-answer", this.onWrongAnswer);
        this.goban.on("puzzle-correct-answer", this.onCorrectAnswer);
    }}}
    sync_state() {{{
        let new_state: any = {};
        let goban = this.goban;

        new_state.analyze_tool = goban.analyze_tool;
        new_state.analyze_subtool = goban.analyze_subtool;
        new_state.move_text = goban.engine.cur_move && goban.engine.cur_move.text ? goban.engine.cur_move.text : "";

        this.setState(new_state);
    }}}
    onWrongAnswer = () => {{{
        this.setState({
            show_correct: false,
            show_wrong: true,
        });
    }}}
    onCorrectAnswer = () => {{{
        this.setState({
            show_correct: true,
            show_wrong: false,
        });
        setTimeout(() => {
            $(this.refs.next_link).focus();
        }, 1);
    }}}
    jumpToPuzzle = (ev) => {{{
        let next_puzzle_id = ev.target.value;
        browserHistory.push(`/puzzle/${next_puzzle_id}`);
    }}}
    undo = () => {{{
        this.setState({
            show_correct: false,
            show_wrong: false,
        });

        if (this.goban.engine.cur_move.parent) {
            this.goban.engine.jumpTo(this.goban.engine.cur_move.parent);
        }

        this.forceUpdate();
        this.onResize();
    }}}
    doReset = () => {{{
        this.reset();
        this.setState({
            show_correct: false,
            show_wrong: false,
        });
        this.onResize();
    }}}

    ratePuzzle = (value) => {{{
        put(`puzzles/${this.props.params.puzzle_id}/rate`, {rating: value})
        .then(ignore)
        .catch(errorAlerter);
        this.setState({
            rated: true,
            my_rating: value,
        });
    }}}
    transform = (what): void => {{{
        console.log("Transforming", what);

        switch (what) {
            case "h"     : this.setState({transform_h     : this.transform_h     = !this.transform_h});     break;
            case "v"     : this.setState({transform_v     : this.transform_v     = !this.transform_v});     break;
            case "x"     : this.setState({transform_x     : this.transform_x     = !this.transform_x});     break;
            case "color" : this.setState({transform_color : this.transform_color = !this.transform_color}); break;
            case "zoom"  :
                this.setState({zoom: this.zoom = !this.zoom});
                preferences.set("puzzle.zoom", this.zoom);
            break;
        }
        console.log(
            this.transform_x
           , this.transform_h
           , this.transform_v
           , this.transform_color
           , this.zoom
       );

        $("#selected_puzzle").focus().blur(); /* otherwise last button unselected will look kinda like it's selected still */
        this.reset();
        this.onResize();
    }}}
    toggle_transform_x = () => {{{
        this.transform("x");
    }}}
    toggle_transform_h = () => {{{
        this.transform("h");
    }}}
    toggle_transform_v = () => {{{
        this.transform("v");
    }}}
    toggle_transform_color = () => {{{
        this.transform("color");
    }}}
    toggle_transform_zoom = () => {{{
        this.transform("zoom");
    }}}

    save = () => {{{
        //this.setState({editing: false})

        let puzzle = this.goban.engine.exportAsPuzzle();
        puzzle.name = this.state.name;
        puzzle.puzzle_description = this.state.puzzle.puzzle_description;
        puzzle.puzzle_collection = this.state.puzzle.puzzle_collection;
        puzzle.puzzle_type = this.state.puzzle.puzzle_type;
        puzzle.puzzle_rank = this.state.puzzle.puzzle_rank;
        puzzle.puzzle_opponent_move_mode = this.state.puzzle.puzzle_opponent_move_mode;
        puzzle.puzzle_player_move_mode = this.state.puzzle.puzzle_player_move_mode;


        if (parseInt(this.props.params.puzzle_id)) {
            /* save */
            put(`puzzles/${this.props.params.puzzle_id}`, {"puzzle": puzzle})
            .then((res) => {
                window.location.reload();
            })
            .catch(errorAlerter);
        } else {
            /* create */
            post("puzzles/", {"puzzle": puzzle})
            .then((res) => {
                browserHistory.push("/puzzles");
            })
            .catch(errorAlerter);
        }
    }}}
    edit = () => {{{
        get(`puzzles/collections/`, {page_size: 100, owner: data.get("user").id})
        .then((collections) => {
            this.setState({
                editing: true,
                puzzle_collections: collections.results
            });
            this.reset(true);
            this.onResize();
        })
        .catch(errorAlerter);
    }}}

    openPuzzleSettings = (ev) => {{{
        let promise = openPuzzleSettingsControls(ev);

        let randomize_transform = preferences.get("puzzle.randomize.transform");
        let randomize_color = preferences.get("puzzle.randomize.color");


        promise.on("close", () => {
            if (randomize_transform !== preferences.get("puzzle.randomize.transform")  ||
                randomize_color !== preferences.get("puzzle.randomize.color")
            ) {
                this.fetchPuzzle(parseInt(this.props.params.puzzle_id));
            }
        });
    }}}

    transformMoveText(puzzle, txt) {{{
        if (this.transform_color) {
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
    }}}
    transformCoordinate(puzzle, coord, width, height) {{{
        if (coord.marks && Array.isArray(coord.marks)) {
            for (let i = 0; i < coord.marks.length; ++i) {
                this.transformCoordinate(puzzle, coord.marks[i], width, height);
            }
        }
        if (coord.text) {
            coord.text = this.transformMoveText(puzzle, coord.text);
        }

        if (coord.x < 0) { return; }

        if (this.transform_x) {
            let t = coord.y;
            coord.y = coord.x;
            coord.x = t;
        }
        if (this.transform_h) { coord.x = (width - 1) - coord.x; }
        if (this.transform_v) { coord.y = (height - 1) - coord.y; }
    }}}
    transformCoordinates(puzzle, coords, width, height) {{{
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
    }}}
    transformPuzzle() {{{
        let puzzle = this.puzzle;
        let width = puzzle.width;
        let height = puzzle.height;
        console.log("puzzle: ", puzzle);

        if (puzzle.initial_state && puzzle.initial_state.black && puzzle.initial_state.black.length) {
            puzzle.initial_state.black = GoMath.encodeMoves(this.transformCoordinates(puzzle, GoMath.decodeMoves(puzzle.initial_state.black), width, height));
        }
        if (puzzle.initial_state && puzzle.initial_state.white && puzzle.initial_state.white.length) {
            puzzle.initial_state.white = GoMath.encodeMoves(this.transformCoordinates(puzzle, GoMath.decodeMoves(puzzle.initial_state.white), width, height));
        }
        if (puzzle.move_tree) {
            this.transformCoordinates(puzzle, puzzle.move_tree, width, height);
        }

        if (this.transform_color) {
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
    }}}
    getBounds(puzzle, width, height) {{{
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
    }}}

    nav_up = () => {{{
        this.checkAndEnterAnalysis();
        this.goban.prevSibling();
    }}}
    nav_down = () => {{{
        this.checkAndEnterAnalysis();
        this.goban.nextSibling();
    }}}
    nav_first = () => {{{
        this.checkAndEnterAnalysis();
        this.goban.showFirst();
    }}}
    nav_prev_10 = () => {{{
        this.checkAndEnterAnalysis();
        for (let i = 0; i < 10; ++i) {
            this.goban.showPrevious();
        }
    }}}
    nav_prev = () => {{{
        this.checkAndEnterAnalysis();
        this.goban.showPrevious();
    }}}
    nav_next = (event?: React.MouseEvent<any>) => {{{
        this.checkAndEnterAnalysis();
        this.goban.showNext();
    }}}
    nav_next_10 = () => {{{
        this.checkAndEnterAnalysis();
        for (let i = 0; i < 10; ++i) {
            this.goban.showNext();
        }
    }}}
    nav_last = () => {{{
        this.checkAndEnterAnalysis();
        this.goban.jumpToLastOfficialMove();
    }}}

    setPuzzleCollection = (ev) => {{{
        if (parseInt(ev.target.value) > 0) {
            this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_collection: parseInt(ev.target.value)})});
        }
        else if (ev.target.value === "new") {
            swal({
                text: _("Collection name"),
                input: "text",
                showCancelButton: true,
            })
            .then((name) => {
                if (!name || name.length < 5) {
                    swal({
                        "text": _("Please provide a longer name for your new puzzle collection")
                    })
                    .then(ignore)
                    .catch(ignore);
                    return;
                }

                post("puzzles/collections/", {
                    "name": name,
                    "private": false,
                    "price": "0.00",
                })
                .then((res) => {
                    get(`puzzles/collections/`, {page_size: 100, owner: data.get("user").id})
                    .then((collections) => {
                        this.setState({
                            puzzle: Object.assign({}, this.state.puzzle, {puzzle_collection: res.id}),
                            puzzle_collections: collections.results
                        });
                    })
                    .catch(errorAlerter);
                })
                .catch(errorAlerter);
            })
            .catch(ignore);
        }
    }}}
    setSetupStep = () => {{{
        this.setState({edit_step: "setup"});
    }}}
    setMovesStep = () => {{{
        if (!this.validateSetup()) {
            this.setState({edit_step: "setup"});
            return;
        }

        this.setState({edit_step: "moves"});
        setTimeout(() => {
            this.goban.redrawMoveTree();
        }, 1);
    }}}
    validateSetup = () => {{{
        if (!(this.state.puzzle.puzzle_collection > 0)) {
            this.refs.collection.focus();
            return false;
        }
        if (this.state.name.length < 5) {
            this.refs.name.focus();
            return false;
        }
        if (!(this.state.puzzle.puzzle_type)) {
            this.refs.puzzle_type.focus();
            return false;
        }
        return true;
    }}}
    setName = (ev) => {{{
        this.setState({ name: ev.target.value });
    }}}
    setPuzzleType = (ev) => {{{
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_type: ev.target.value})});
    }}}
    setDescription = (ev) => {{{
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_description: ev.target.value})});
    }}}
    setSetupColor = (color) => {{{
        this.checkAndEnterPuzzleMode();
        this.setState({setup_color: color});
    }}}
    setPuzzleSize = (ev) => {{{
        let size = parseInt(ev.target.value);
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {width: size, height: size})});
        this.goban_opts.width = size;
        this.goban_opts.height = size;
        this.goban.load(this.goban_opts);
        this.goban.redraw(true);
    }}}
    setPuzzleRank = (ev) => {{{
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_rank: parseInt(ev.target.value)})});
    }}}
    setInitialPlayer = (ev) => {{{
        let color = ev.target.value;

        this.goban.engine.jumpTo(this.goban.engine.move_tree);
        this.goban.engine.config.initial_player = color;
        this.goban.engine.player = color === "white" ? 2 : 1;
        this.goban.engine.resetMoveTree();

        this.setState({puzzle: Object.assign({}, this.state.puzzle, {initial_player: color})});
    }}}
    setOpponentMoveMode = (ev) => {{{
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_opponent_move_mode: ev.target.value})});
    }}}
    setPlayerMoveMode = (ev) => {{{
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_player_move_mode: ev.target.value})});
    }}}
    deleteBranch = () => {{{
        this.goban.deleteBranch();
    }}}
    updateMoveText = (ev) => {{{
        this.setState({move_text: ev.target.value});
        this.goban.engine.cur_move.text = ev.target.value;
        this.goban.redrawMoveTree();
        //this.goban.syncReviewMove(null, ev.target.value);
    }}}

    setCorrectAnswer = () => {{{
        this.goban.engine.cur_move.wrong_answer = false;
        this.goban.engine.cur_move.correct_answer = !this.goban.engine.cur_move.correct_answer;
        this.goban.redrawMoveTree();
        this.forceUpdate();
    }}}
    setIncorrectAnswer = () => {{{
        this.goban.engine.cur_move.correct_answer = false;
        this.goban.engine.cur_move.wrong_answer = !this.goban.engine.cur_move.wrong_answer;
        this.goban.redrawMoveTree();
        this.forceUpdate();
    }}}
    deletePuzzle = () => {{{
        swal({
            "text": _("Are you sure you want to delete this puzzle?"),
            showCancelButton: true,
        })
        .then(() => {
            del(`puzzles/${this.props.params.puzzle_id}`)
            .then(() => browserHistory.push(`/puzzles`))
            .catch(errorAlerter);
        })
        .catch(ignore);
    }}}



    render() {{{
        if (this.state.editing) {
            return this.renderEdit();
        } else {
            return this.renderPlay();
        }
    }}}
    renderPlay() {{{
        if (!this.state.loaded) {
            return <div/>;
        }

        let view_mode = goban_view_mode();
        let squashed = goban_view_squashed();
        let puzzle = this.state;
        let goban = this.goban;
        let difficulty = longRankString(puzzle.rank);

        let next_id = 0;
        for (let i = 0; i < this.state.puzzle_collection_summary.length - 1; ++i) {
            if (this.state.puzzle_collection_summary[i].id === puzzle.id) {
                next_id = this.state.puzzle_collection_summary[i + 1].id;
            }
        }

        return (
        <div className={`Puzzle ${view_mode} ${squashed}`}>
            <KBShortcut shortcut="escape" action={this.doReset} />
            <KBShortcut shortcut="left" action={this.undo} />

            <div className={"center-col"}>
                <div ref="goban_container" className="goban-container">
                    <PersistentElement className="Goban" elt={this.goban_div}/>
                </div>
            </div>
            <div className={"right-col"}>
                <dl className="horizontal">
                    <dt>{_("Puzzle")}</dt>
                    <dd>
                        <select value={this.props.params.puzzle_id} onChange={this.jumpToPuzzle} id="selected_puzzle" >
                            {this.state.puzzle_collection_summary.map((puzzle, idx) => (
                                <option key={idx} value={puzzle.id}>{puzzle.name}</option>
                            ))}
                        </select>
                    </dd>
                    <dt>{_("Collection")}</dt>
                    <dd>{puzzle.collection.name}</dd>
                    <dt>{_("Difficulty")}</dt>
                    <dd>{difficulty}</dd>
                    <dt>{_("Rating")}</dt>
                    <dd><StarRating value={this.state.rated ? this.state.my_rating : this.state.rating} rated={this.state.rated} onChange={this.ratePuzzle} /></dd>
                    <dt>{_("Author")}</dt>
                    <dd><Player user={this.state.owner} icon rank /></dd>
                </dl>

                <div className="btn-container">
                    <div className="btn-group">
                        <button type="button" className={this.state.transform_x ? "active" : ""} onClick={this.toggle_transform_x}>
                            <i className="fa fa-expand"></i>
                        </button>
                        <button type="button" className={this.state.transform_h ? "active" : ""} onClick={this.toggle_transform_h}>
                            <i className="fa fa-arrows-h"></i>
                        </button>
                        <button type="button" className={this.state.transform_v ? "active" : ""} onClick={this.toggle_transform_v}>
                            <i className="fa fa-arrows-v"></i>
                        </button>
                        <button type="button" className={this.state.transform_color ? "active" : ""} onClick={this.toggle_transform_color}>
                            <i className="fa fa-adjust"/>
                        </button>
                        {(this.state.zoomable || null) &&
                            <button type="button" className={this.state.zoom ? "active" : ""} onClick={this.toggle_transform_zoom}>
                                <i className="fa fa-arrows-alt"></i>
                            </button>
                        }

                        <button type="button" onClick={this.openPuzzleSettings}>
                            <i className="fa fa-gear"/>
                        </button>

                        {(puzzle.owner.id === data.get("user").id || null) &&
                            <button onClick={this.edit}><i className="fa fa-pencil"></i></button>
                        }
                    </div>
                </div>


                <hr/>

                {(goban.engine.cur_move.parent || null) &&
                    <div>
                        <button className="btn btn-default" onClick={this.undo} ><i className="fa fa-step-backward"></i> {_("Undo")}</button>
                        <button className="btn btn-warning pull-right" onClick={this.doReset} ><i className="fa fa-refresh"></i> {_("Reset")}</button>
                    </div>
                }

                {(goban.engine.cur_move.parent == null || null) &&
                    <Markdown source={goban.engine.puzzle_description} />
                }
                {(goban.engine.cur_move.text || null) &&
                    <Markdown source={goban.engine.cur_move.text} />
                }
                {(this.state.show_correct || null) &&
                    <div>
                        {(!goban.engine.cur_move.text || null) &&
                            <div>
                                <h1><i className="fa fa-check-circle-o success-text"></i> {_("Correct!")}</h1>
                            </div>
                        }

                        {(next_id !== 0 && next_id !== puzzle.id || null) &&
                            <Link ref="next_link" to={`/puzzle/${next_id}`} className="btn primary">{_("Next")}</Link>
                        }
                        {(next_id === 0 || null) &&
                            <div>
                                <h3>{_("You have reached the end of this collection")}</h3>
                                <Link to="/puzzles/" className="primary">{_("Back to Puzzle List")}</Link>
                            </div>
                        }
                    </div>
                }

                {(this.state.show_wrong || null) &&
                    <div>
                        {(!goban.engine.cur_move.text || null) &&
                            <div><h1><i className="fa fa-times-circle-o reject-text"></i> {_("Incorrect")}</h1></div>
                        }
                    </div>
                }
            </div>
        </div>
        );
    }}}
    renderEdit() {{{
        if (!this.state.loaded) {
            return <div/>;
        }

        let view_mode = goban_view_mode();
        let squashed = goban_view_squashed();
        let puzzle = this.state;
        let goban = this.goban;
        let difficulty = longRankString(puzzle.rank);
        let show_warning = false;

        let next_id = 0;
        for (let i = 0; i < this.state.puzzle_collection_summary.length - 1; ++i) {
            if (this.state.puzzle_collection_summary[i].id === puzzle.id) {
                next_id = this.state.puzzle_collection_summary[i + 1].id;
            }
        }

        return (
        <div className={`Puzzle ${view_mode} ${squashed}`}>
            <KBShortcut shortcut="up" action={this.nav_up}/>
            <KBShortcut shortcut="down" action={this.nav_down}/>
            <KBShortcut shortcut="left" action={this.nav_prev}/>
            <KBShortcut shortcut="right" action={this.nav_next}/>
            <KBShortcut shortcut="page-up" action={this.nav_prev_10}/>
            <KBShortcut shortcut="page-down" action={this.nav_next_10}/>
            <KBShortcut shortcut="home" action={this.nav_first}/>
            <KBShortcut shortcut="end" action={this.nav_last}/>

            <KBShortcut shortcut="f1" action={this.set_analyze_tool.stone_null}/>
            <KBShortcut shortcut="f2" action={this.set_analyze_tool.stone_black}/>
            <KBShortcut shortcut="f4" action={this.set_analyze_tool.label_triangle}/>
            <KBShortcut shortcut="f5" action={this.set_analyze_tool.label_square}/>
            <KBShortcut shortcut="f6" action={this.set_analyze_tool.label_circle}/>
            <KBShortcut shortcut="f7" action={this.set_analyze_tool.label_letters}/>
            <KBShortcut shortcut="f8" action={this.set_analyze_tool.label_numbers}/>
            <KBShortcut shortcut="del" action={this.set_analyze_tool.delete_branch}/>


            <div className={"center-col"}>
                <div ref="goban_container" className="goban-container">
                    <PersistentElement className="Goban" elt={this.goban_div}/>
                </div>
            </div>
            <div className={"right-col"}>

                <div className="btn-group">
                    <button className={this.state.edit_step === "setup" ? "active" : ""} onClick={this.setSetupStep}>{_("Setup")}</button>
                    <button className={this.state.edit_step === "moves" ? "active" : ""} onClick={this.setMovesStep}>{_("Moves")}</button>
                </div>

                {(this.state.edit_step === "setup" || null) &&
                    <div>

                        <div className="space-around padded">
                            <select ref="collection" value={this.state.puzzle.puzzle_collection} onChange={this.setPuzzleCollection}>
                                <option value={0}> -- {_("Select collection")} -- </option>
                                {this.state.puzzle_collections.map((e, idx) => (
                                    <option key={idx} value={e.id}>{e.name}</option>
                                ))}
                                <option value={"new"}> -- {_("Create collection")} -- </option>
                            </select>
                        </div>

                        <div className="padded">
                            <input ref="name" type="text" value={this.state.name} onChange={this.setName} placeholder={_("Puzzle name")}></input>
                        </div>

                        <div className="padded">
                            <div className="space-around">
                                <select ref="puzzle_type" value={this.state.puzzle.puzzle_type} onChange={this.setPuzzleType}>
                                    <option value="">-- {_("Type")} --</option>
                                    <option value="life_and_death">{_("Life and Death")}</option>
                                    <option value="joseki">{_("Joseki")}</option>
                                    <option value="fuseki">{_("Fuseki")}</option>
                                    <option value="tesuji">{_("Tesuji")}</option>
                                    <option value="best_move">{_("Best Move")}</option>
                                    <option value="endgame">{_("End Game")}</option>
                                    <option value="elementary">{_("Elementary")}</option>
                                </select>

                                <select value={this.state.puzzle.width} onChange={this.setPuzzleSize}>
                                    <option value={19}>{_("19x19")}</option>
                                    <option value={13}>{_("13x13")}</option>
                                    <option value={9}>{_("9x9")}</option>
                                    <option value={5}>{_("5x5")}</option>
                                </select>

                                <select value={this.state.puzzle.puzzle_rank} onChange={this.setPuzzleRank}>
                                    {ranks.map((e, idx) => (
                                        <option key={idx} value={e.value}>{e.text}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="padded">
                            <textarea rows={7} value={this.state.puzzle.puzzle_description} onChange={this.setDescription}
                                placeholder={_("Describe the objective of this problem")}></textarea>
                        </div>

                        <dl className="horizontal">
                            <dt>{_("Place stones")}</dt>
                            <dd>
                                <div className="btn-group">
                                    <button onClick={this.setSetupColor.bind(this, "black")} className={this.state.setup_color === "black" ? "active" : ""}>
                                        <img width="16px" height="16px" alt="black" src={data.get("config.cdn_release") + "/img/black.png"}/>
                                    </button>
                                    <button onClick={this.setSetupColor.bind(this, "white")} className={this.state.setup_color === "white" ? "active" : ""}>
                                        <img width="16px" height="16px" alt="white" src={data.get("config.cdn_release") + "/img/white.png"}/>
                                    </button>
                                </div>
                            </dd>

                            <dt>{_("Player color")}</dt>
                            <dd>
                                <select value={this.state.puzzle.initial_player} onChange={this.setInitialPlayer}>
                                    <option value="black">{_("Black")}</option>
                                    <option value="white">{_("White")}</option>
                                </select>
                            </dd>

                            <dt>{interpolate(pgettext("Puzzle move mode for specified color", "{{color}} move mode"),
                                             {"color": this.state.puzzle.initial_player === "black" ? _("Black") : _("White")})}</dt>
                            <dd>
                                <select value={this.state.puzzle.puzzle_player_move_mode} onChange={this.setPlayerMoveMode}>
                                    <option value="free">{_("Free placement")}</option>
                                    <option value="fixed">{_("Only allow on specified paths")}</option>
                                </select>
                            </dd>

                            <dt>{interpolate(pgettext("Puzzle move mode for specified color", "{{color}} move mode"),
                                             {"color": this.state.puzzle.initial_player === "black" ? _("White") : _("Black")})}</dt>
                            <dd>
                                <select value={this.state.puzzle.puzzle_opponent_move_mode} onChange={this.setOpponentMoveMode}>
                                    <option value="automatic">{_("Automatic")}</option>
                                    <option value="manual">{_("Player controlled")}</option>
                                </select>
                            </dd>
                        </dl>

                        <div className="space-around">
                            {(this.props.params.puzzle_id !== "new" || null) &&
                                <button className="reject" onClick={this.deletePuzzle}>{_("Remove puzzle")}</button>
                            }
                            <button className="primary" onClick={this.setMovesStep}>{_("Next")} &rarr;</button>
                        </div>
                    </div>
                }
                {(this.state.edit_step === "moves" || null) &&
                    <div>
                        <div className="padded space-between">
                            <button onClick={this.set_analyze_tool.stone_alternate}
                                 className={"stone-button " + ((this.state.analyze_tool === "stone" && (this.state.analyze_subtool !== "black" && this.state.analyze_subtool !== "white")) ? "active" : "")}>
                                 <img alt="alternate" width="16px" height="16px" src={data.get("config.cdn_release") + "/img/black-white.png"}/>
                            </button>


                            <div className="btn-group">
                                <button onClick={this.set_analyze_tool.label_letters}
                                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "letters") ? "active" : ""}>
                                    <i className="fa fa-font"></i>
                                </button>
                                <button onClick={this.set_analyze_tool.label_numbers}
                                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "numbers") ? "active" : ""}>
                                    <i className="ogs-label-number"></i>
                                </button>
                                <button onClick={this.set_analyze_tool.label_triangle}
                                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "triangle") ? "active" : ""}>
                                    <i className="ogs-label-triangle"></i>
                                </button>
                                <button onClick={this.set_analyze_tool.label_square}
                                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "square") ? "active" : ""}>
                                    <i className="ogs-label-square"></i>
                                </button>
                                <button onClick={this.set_analyze_tool.label_circle}
                                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "circle") ? "active" : ""}>
                                    <i className="ogs-label-circle"></i>
                                </button>
                                <button onClick={this.set_analyze_tool.label_cross}
                                    className={(this.state.analyze_tool === "label" && this.state.analyze_subtool === "cross") ? "active" : ""}>
                                    <i className="ogs-label-x"></i>
                                </button>
                            </div>

                            <button onClick={this.deleteBranch}>
                                <i className="fa fa-trash"></i>
                            </button>
                        </div>

                        <Resizable id="move-tree-container" className="vertically-resizable" >
                            <canvas id="move-tree-canvas"></canvas>
                        </Resizable>

                        <textarea id="game-move-node-text" placeholder={_("Move notes")}
                            rows={5}
                            value={this.state.move_text}
                            onChange={this.updateMoveText}
                            ></textarea>


                        <div className="space-around padded">
                            <button className={(this.goban.engine.cur_move.correct_answer ? " success" : "")} onClick={this.setCorrectAnswer} >
                                {_("Correct answer") /* translators: Correct puzzle move */}
                            </button>

                            <button className={(this.goban.engine.cur_move.wrong_answer ? " reject" : "")} onClick={this.setIncorrectAnswer} >
                                {_("Wrong answer") /* translators: Correct puzzle move */}
                            </button>
                        </div>


                        <div className="space-around">
                            <button onClick={this.setSetupStep}>&larr; {_("Setup")}</button>
                            <button className="primary" onClick={this.save}>{_("Save")}</button>
                        </div>
                    </div>
                }
            </div>
        </div>
        );
    }}}


}


import {PopOver, popover, close_all_popovers} from "popover";

interface PuzzleSettingsModalProperties {
}

export class PuzzleSettingsModal extends React.PureComponent<PuzzleSettingsModalProperties, any> {
    constructor(props) { /* {{{ */
        super(props);
        this.state = {
            randomize_transform: preferences.get("puzzle.randomize.transform"),
            randomize_color: preferences.get("puzzle.randomize.color"),
        };
    } /* }}} */

    toggleTransform = () => {{{
        preferences.set("puzzle.randomize.transform", !this.state.randomize_transform);
        this.setState({randomize_transform: !this.state.randomize_transform});
    }}}
    toggleColor = () => {{{
        preferences.set("puzzle.randomize.color", !this.state.randomize_color);
        this.setState({randomize_color: !this.state.randomize_color});
    }}}
    render() {{{
        return (
            <div className="PuzzleSettingsModal">
                <div className="details">
                    <div className="option">
                        <input id="transform" type="checkbox" checked={this.state.randomize_transform} onChange={this.toggleTransform} />
                        <label htmlFor="transform">{_("Randomly transform puzzles")}</label>
                    </div>
                    <div className="option">
                        <input id="color" type="checkbox" checked={this.state.randomize_color}  onChange={this.toggleColor} />
                        <label htmlFor="color">{_("Randomize colors")}</label>
                    </div>
                </div>
            </div>
        );
    }}}
}

export function openPuzzleSettingsControls(ev): PopOver {{{
    let elt = $(ev.target);
    let offset = elt.offset();

    return popover({
        elt: (<PuzzleSettingsModal />),
        at: {x: offset.left, y: offset.top + elt.height()},
        minWidth: 300,
        minHeight: 50,
    });
}}}
