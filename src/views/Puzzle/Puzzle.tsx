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
import ReactResizeDetector from 'react-resize-detector';
import {Link} from "react-router-dom";
import {browserHistory} from "ogsHistory";
import {_, pgettext, interpolate} from "translate";
import {abort_requests_in_flight, post, get, put, del} from "requests";
import {KBShortcut} from "KBShortcut";
import {goban_view_mode, goban_view_squashed} from "Game";
import {PersistentElement} from "PersistentElement";
import {errorAlerter, errorLogger, dup, ignore} from "misc";
import {longRankString, rankList} from "rank_utils";
import {
    Goban,
    GoMath,
    GobanCanvas,
    GobanCanvasConfig,
    PuzzlePlacementSetting,
} from "goban";
import {Markdown} from "Markdown";
import {Player} from "Player";
import {StarRating} from "StarRating";
import {Resizable} from "Resizable";
import * as preferences from "preferences";
import * as data from "data";
import {TransformSettings, PuzzleTransform} from './PuzzleTransform';
import {PuzzleNavigation} from './PuzzleNavigation';
import {PuzzleEditor} from './PuzzleEditing';
import {MoveTree} from 'goban';

declare var swal;

interface PuzzleProperties {
    match: {
        params: {
            puzzle_id: string
        }
    };
}

let ranks = rankList(0, 38, false);

export class Puzzle extends React.Component<PuzzleProperties, any> {
    refs: {
        goban;
        goban_container;
        next_link;

        collection;
        name;
        puzzle_type;
    };
    ref_move_tree_container:HTMLElement;

    goban: Goban;
    goban_div: HTMLDivElement;
    goban_opts: any = {};
    solve_time_start: number = Date.now();
    attempts: number = 1;

    transform = new PuzzleTransform(new TransformSettings());
    navigation = new PuzzleNavigation();
    editor: PuzzleEditor;

    set_analyze_tool: any = {};

    constructor(props) {
        super(props);

        this.editor  = new PuzzleEditor(this, this.transform);

        this.state = {
            loaded: false,
            edit_step: "setup",
            setup_color: "black",
            puzzle_collection_summary: [],
            hintsOn: false,
        };

        this.goban_div = document.createElement("div");
        this.goban_div.className = "Goban";
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

    }

    componentDidMount() {
        window.document.title = _("Puzzle");
        this.fetchPuzzle(parseInt(this.props.match.params.puzzle_id));
        this.onResize();
    }
    UNSAFE_componentWillReceiveProps(next_props) {
        if (this.props.match.params.puzzle_id !== next_props.match.params.puzzle_id) {
            this.reinitialize();
            this.setState({
                loaded: false,
                puzzle_collection_summary: [],
                show_correct: false,
                show_wrong: false,
                editing: false,
            });
            this.fetchPuzzle(parseInt(next_props.match.params.puzzle_id));
        }
    }
    componentWillUnmount() {
    }
    componentDidUpdate() {
        this.onResize();
    }
    onResize = (no_debounce?: boolean) => {
        if (!this.refs.goban_container) {
            return;
        }

        if (this.goban) {
            this.goban.setSquareSizeBasedOnDisplayWidth(
                Math.min(this.refs.goban_container.offsetWidth, this.refs.goban_container.offsetHeight)
            );

            this.recenterGoban();
        }
    }
    recenterGoban() {
        let m = this.goban.computeMetrics();
        $(this.refs.goban_container).css({
            top: Math.ceil(this.refs.goban_container.offsetHeight - m.height) / 2,
            left: Math.ceil(this.refs.goban_container.offsetWidth - m.width) / 2,
        });
    }
    reinitialize() {
        if (this.goban) {
            this.goban.destroy();
            this.goban = null;
            this.navigation.goban = null;
        }
        while (this.goban_div.firstChild) {
            this.goban_div.removeChild(this.goban_div.firstChild);
        }
        this.editor.clearPuzzles();
    }

    setAnalyzeTool(tool, subtool) {
        if (this.navigation.checkAndEnterAnalysis()) {
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
                    //subtool = goban.engine.colorToMove() === "black" ? "black-white" : "white-black"
                    if (subtool == null) {
                        subtool = "alternate";
                    }
                    this.goban.setAnalyzeTool(tool, subtool);
                break;
            }
        }

        this.sync_state();
        return false;
    }

    fetchPuzzle(puzzleId: number) {
        this.editor.fetchPuzzle(
            puzzleId,
            (state, editing) => {
                this.reset(editing);
                this.setState(state);
                this.onResize(true);
                window.document.title = state.collection.name + ": " + state.name;
                data.set(`puzzle.collection.${state.collection.id}.last-visited`, state.id);
                this.solve_time_start = Date.now();
                this.attempts = 1;
            }
        );
    }

    replacementSettingFunction(): PuzzlePlacementSetting {
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
    }

    reset(editing?: boolean) {
        let opts:GobanCanvasConfig = this.editor.reset(this.goban_div, editing, this.replacementSettingFunction.bind(this));

        opts.move_tree_container = this.ref_move_tree_container;
        this.goban_opts = opts;

        this.goban = new Goban(opts);
        this.goban.setMode("puzzle");
        window["global_goban"] = this.goban;
        this.goban.on("update", () => this.onUpdate());

        this.goban.on("puzzle-wrong-answer", this.onWrongAnswer);
        this.goban.on("puzzle-correct-answer", this.onCorrectAnswer);

        this.navigation.goban = this.goban;
    }

    onUpdate() {
        this.removeHints();
        this.sync_state();
        this.forceUpdate();
    }

    removeHints() {
        if (this.goban) {
            let move = this.goban.engine.cur_move;
            move.branches.forEach(item => this.goban.deleteCustomMark(item.x, item.y, "hint", true));
        }
        this.setState({hintsOn: false});
    }

    sync_state() {
        let new_state: any = {};

        new_state.analyze_tool = this.goban.analyze_tool;
        new_state.analyze_subtool = this.goban.analyze_subtool;
        new_state.move_text = this.goban.engine.cur_move && this.goban.engine.cur_move.text ? this.goban.engine.cur_move.text : "";

        this.setState(new_state);
    }
    onWrongAnswer = () => {
        this.setState({
            show_correct: false,
            show_wrong: true,
        });
        this.attempts++;
    }
    onCorrectAnswer = () => {
        post(`puzzles/${this.props.match.params.puzzle_id}/solutions`, {
            'time_elapsed': Date.now() - this.solve_time_start,
            'flipped_horizontally': this.transform.settings.transform_h,
            'flipped_vertically':this.transform.settings.transform_v,
            'transposed': this.transform.settings.transform_x,
            'colors_swapped':this.transform.settings.transform_color,
            'attempts': this.attempts,
            'solution': this.goban.engine.cur_move.getMoveStringToThisPoint(),
        })
        .then(response => console.log(response))
        .catch(errorLogger);
        this.setState({
            show_correct: true,
            show_wrong: false,
        });
        setTimeout(() => {
            $(this.refs.next_link).focus();
        }, 1);
    }
    jumpToPuzzle = (ev) => {
        let next_puzzle_id = ev.target.value;
        browserHistory.push(`/puzzle/${next_puzzle_id}`);
    }
    undo = () => {
        this.setState({
            show_correct: false,
            show_wrong: false,
        });

        this.goban.showPrevious();

        this.onResize();
    }
    doReset = () => {
        this.reset();
        this.setState({
            show_correct: false,
            show_wrong: false,
        });
        this.onResize();
    }

    ratePuzzle = (value) => {
        put("puzzles/%%/rate", +this.props.match.params.puzzle_id, {rating: value})
        .then(ignore)
        .catch(errorAlerter);
        this.setState({
            rated: true,
            my_rating: value,
        });
    }
    setTransformation(what): void {
        let state = this.transform.stateForTransformation(what);
        if (state) {
            this.setState(state);
            if (state.zoom) {
                preferences.set("puzzle.zoom", this.transform.settings.zoom);
            }
        }

       this.transform.settings.log();

        $("#selected_puzzle").focus().blur(); /* otherwise last button unselected will look kinda like it's selected still */
        this.reset();
        this.onResize();
    }
    toggle_transform_x = () => {
        this.setTransformation("x");
    }
    toggle_transform_h = () => {
        this.setTransformation("h");
    }
    toggle_transform_v = () => {
        this.setTransformation("v");
    }
    toggle_transform_color = () => {
        this.setTransformation("color");
    }
    toggle_transform_zoom = () => {
        this.setTransformation("zoom");
    }

    save = () => {
        //this.setState({editing: false})

        let puzzle = this.goban.engine.exportAsPuzzle();
        puzzle.name = this.state.name;
        puzzle.puzzle_description = this.state.puzzle.puzzle_description;
        puzzle.puzzle_collection = this.state.puzzle.puzzle_collection;
        puzzle.puzzle_type = this.state.puzzle.puzzle_type;
        puzzle.puzzle_rank = this.state.puzzle.puzzle_rank;
        puzzle.puzzle_opponent_move_mode = this.state.puzzle.puzzle_opponent_move_mode;
        puzzle.puzzle_player_move_mode = this.state.puzzle.puzzle_player_move_mode;


        if (parseInt(this.props.match.params.puzzle_id)) {
            /* save */
            put("puzzles/%%", +this.props.match.params.puzzle_id, {"puzzle": puzzle})
            .then((res) => {
                window.location.reload();
            })
            .catch(errorAlerter);
        } else {
            /* create */
            post("puzzles/", {"puzzle": puzzle})
            .then((res) => {
                browserHistory.push(`/puzzle-collection/${puzzle.puzzle_collection}`);
            })
            .catch(errorAlerter);
        }
    }
    edit = () => {
        get("puzzles/collections/", {page_size: 100, owner: data.get("user").id})
        .then((collections) => {
            this.setState({
                editing: true,
                puzzle_collections: collections.results
            });
            this.reset(true);
            this.onResize();
        })
        .catch(errorAlerter);
    }

    openPuzzleSettings = (ev) => {
        let puzzle_settings = openPuzzleSettingsControls(ev);

        let randomize_transform = preferences.get("puzzle.randomize.transform");
        let randomize_color = preferences.get("puzzle.randomize.color");

        puzzle_settings.on("close", () => {
            if (randomize_transform !== preferences.get("puzzle.randomize.transform")  ||
                randomize_color !== preferences.get("puzzle.randomize.color")
            ) {
                this.fetchPuzzle(parseInt(this.props.match.params.puzzle_id));
            }
        });
    }

    setPuzzleCollection = (ev) => {
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
                    swal({ "text": _("Please provide a longer name for your new puzzle collection") })
                    .then(ignore).catch(ignore);
                    return;
                }

                this.editor.createPuzzleCollection(this.state.puzzle, name)
                    .then((state) => this.setState(state))
                    .catch(errorAlerter);
            })
            .catch(ignore);
        }
    }
    setSetupStep = () => {
        this.setState({edit_step: "setup"});
    }
    setMovesStep = () => {
        if (!this.validateSetup()) {
            this.setState({edit_step: "setup"});
            return;
        }

        this.setState({edit_step: "moves"});
        setTimeout(() => {
            this.goban.move_tree_redraw();
        }, 1);
    }
    validateSetup = () => {
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
    }
    setName = (ev) => {
        this.setState({ name: ev.target.value });
    }
    setPuzzleType = (ev) => {
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_type: ev.target.value})});
    }
    setDescription = (ev) => {
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_description: ev.target.value})});
    }
    setSetupColor = (color) => {
        this.navigation.checkAndEnterPuzzleMode();
        this.setState({setup_color: color});
    }
    setPuzzleSize = (ev) => {
        let size = parseInt(ev.target.value);
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {width: size, height: size})});
        this.goban_opts.width = size;
        this.goban_opts.height = size;
        this.goban.load(this.goban_opts);
        this.goban.redraw(true);
    }
    setPuzzleRank = (ev) => {
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_rank: parseInt(ev.target.value)})});
    }
    setInitialPlayer = (ev) => {
        let color = ev.target.value;

        this.goban.engine.jumpTo(this.goban.engine.move_tree);
        this.goban.engine.config.initial_player = color;
        this.goban.engine.player = color === "white" ? 2 : 1;
        this.goban.engine.resetMoveTree();

        this.setState({puzzle: Object.assign({}, this.state.puzzle, {initial_player: color})});
    }
    setOpponentMoveMode = (ev) => {
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_opponent_move_mode: ev.target.value})});
    }
    setPlayerMoveMode = (ev) => {
        this.setState({puzzle: Object.assign({}, this.state.puzzle, {puzzle_player_move_mode: ev.target.value})});
    }
    deleteBranch = () => {
        this.goban.deleteBranch();
    }
    updateMoveText = (ev) => {
        this.setState({move_text: ev.target.value});
        this.goban.engine.cur_move.text = ev.target.value;
        this.goban.move_tree_redraw();
        //this.goban.syncReviewMove(null, ev.target.value);
    }

    setCorrectAnswer = () => {
        this.goban.engine.cur_move.wrong_answer = false;
        this.goban.engine.cur_move.correct_answer = !this.goban.engine.cur_move.correct_answer;
        this.goban.move_tree_redraw();
        this.forceUpdate();
    }
    setIncorrectAnswer = () => {
        this.goban.engine.cur_move.correct_answer = false;
        this.goban.engine.cur_move.wrong_answer = !this.goban.engine.cur_move.wrong_answer;
        this.goban.move_tree_redraw();
        this.forceUpdate();
    }
    deletePuzzle = () => {
        swal({
            "text": _("Are you sure you want to delete this puzzle?"),
            showCancelButton: true,
        })
        .then(() => {
            del("puzzles/%%", +this.props.match.params.puzzle_id)
            .then(() => browserHistory.push(`/puzzle-collection/${this.state.puzzle.puzzle_collection}`))
            .catch(errorAlerter);
        })
        .catch(ignore);
    }

    showHint = () => {
        if (this.state.hintsOn) {
            this.removeHints();
        } else if (!this.goban.engine.cur_move.correct_answer) {
            let branches = this.goban.engine.cur_move.findBranchesWithCorrectAnswer();
            branches.forEach(branch => {
                this.goban.setCustomMark(branch.x, branch.y, "hint", true);
            });
            this.setState({hintsOn: true});
        }
    }
    setMoveTreeContainer = (resizable:Resizable):void => {
        this.ref_move_tree_container = resizable ? resizable.div : null;
        if (this.goban) {
            (this.goban as GobanCanvas).setMoveTreeContainer(this.ref_move_tree_container);
        }
    }


    render() {
        if (this.state.editing) {
            return this.renderEdit();
        } else {
            return this.renderPlay();
        }
    }
    renderPlay() {
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


        let show_correct = this.state.show_correct;
        if (this.goban.engine.move_tree.findBranchesWithCorrectAnswer().length === 0) {
            /* Some puzzles just have descriptions and there is no "correct" branch,
             * in this case just let the user know visually that there's nothing to
             * do, here's the next puzzle */
            show_correct = true;
        }


        const have_content:boolean =
            show_correct
            || this.state.show_wrong
            || !!goban.engine.cur_move.text
            || (!goban.engine.cur_move.parent && !!goban.engine.puzzle_description)
            ;

        return (
        <div className={`Puzzle ${view_mode} ${squashed}`}>
            <KBShortcut shortcut="escape" action={this.doReset} />
            <KBShortcut shortcut="left" action={this.undo} />

            <div className={"center-col"}>
                <div ref="goban_container" className="goban-container">
                    <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
                    <PersistentElement className="Goban" elt={this.goban_div}/>
                </div>
            </div>
            <div className={"right-col"}>
                <dl className="horizontal">
                    <dt>{_("Puzzle")}</dt>
                    <dd>
                        <select value={this.props.match.params.puzzle_id} onChange={this.jumpToPuzzle} id="selected_puzzle" >
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
                        <button className={this.state.hintsOn ? "active" : ""} onClick={this.showHint} >{_("Hint")}</button>
                    </div>
                </div>


                <hr/>

                {(goban.engine.cur_move.parent || null) &&
                    <div>
                        <button className="btn btn-default" onClick={this.undo} ><i className="fa fa-step-backward"></i> {_("Undo")}</button>
                        <button className="btn btn-warning pull-right" onClick={this.doReset} ><i className="fa fa-refresh"></i> {_("Reset")}</button>
                    </div>
                }

                {(have_content || null) &&
                    <div className='puzzle-node-content'>
                        {(show_correct || null) &&
                            <div className='success'>
                                <i className="fa fa-check-circle-o"></i> {_("Correct!")}
                            </div>
                        }

                        {(this.state.show_wrong || null) &&
                            <div className='incorrect'>
                                <i className="fa fa-times-circle-o reject-text"></i> {_("Incorrect")}
                            </div>
                        }

                        <div className='content'>
                            {(goban.engine.cur_move.parent == null || null) &&
                                <Markdown source={goban.engine.puzzle_description} />
                            }
                            {(goban.engine.cur_move.text || null) &&
                                <Markdown source={goban.engine.cur_move.text} />
                            }
                        </div>

                        {(show_correct || null) &&
                            <div className='actions'>
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
                    </div>
                }
            </div>
        </div>
        );
    }
    renderEdit() {
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
            <KBShortcut shortcut="up" action={this.navigation.nav_up}/>
            <KBShortcut shortcut="down" action={this.navigation.nav_down}/>
            <KBShortcut shortcut="left" action={this.navigation.nav_prev}/>
            <KBShortcut shortcut="right" action={this.navigation.nav_next}/>
            <KBShortcut shortcut="page-up" action={this.navigation.nav_prev_10}/>
            <KBShortcut shortcut="page-down" action={this.navigation.nav_next_10}/>
            <KBShortcut shortcut="home" action={this.navigation.nav_first}/>
            <KBShortcut shortcut="end" action={this.navigation.nav_last}/>

            {/*
            <KBShortcut shortcut="f1" action={this.set_analyze_tool.stone_null}/>
            <KBShortcut shortcut="f2" action={this.set_analyze_tool.stone_black}/>
            <KBShortcut shortcut="f4" action={this.set_analyze_tool.label_triangle}/>
            <KBShortcut shortcut="f5" action={this.set_analyze_tool.label_square}/>
            <KBShortcut shortcut="f6" action={this.set_analyze_tool.label_circle}/>
            <KBShortcut shortcut="f7" action={this.set_analyze_tool.label_letters}/>
            <KBShortcut shortcut="f8" action={this.set_analyze_tool.label_numbers}/>
            */}
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
                                    <option value={17}>{_("17x17")}</option>
                                    <option value={15}>{_("15x15")}</option>
                                    <option value={13}>{_("13x13")}</option>
                                    <option value={11}>{_("11x11")}</option>
                                    <option value={9}>{_("9x9")}</option>
                                    <option value={7}>{_("7x7")}</option>
                                    <option value={5}>{_("5x5")}</option>
                                </select>

                                <select value={this.state.puzzle.puzzle_rank} onChange={this.setPuzzleRank}>
                                    {ranks.map((e, idx) => (
                                        <option key={idx} value={e.rank}>{e.label}</option>
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
                            {(this.props.match.params.puzzle_id !== "new" || null) &&
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

                        <Resizable id="move-tree-container" className="vertically-resizable" ref={this.setMoveTreeContainer} />

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
    }
}


import {PopOver, popover} from "popover";
import {PuzzleSettingsModal} from './PuzzleSettingsModal';

export function openPuzzleSettingsControls(ev): PopOver {
    let elt = $(ev.target);
    let offset = elt.offset();

    return popover({
        elt: (<PuzzleSettingsModal />),
        at: {x: offset.left, y: offset.top + elt.height()},
        minWidth: 300,
        minHeight: 50,
    });
}
