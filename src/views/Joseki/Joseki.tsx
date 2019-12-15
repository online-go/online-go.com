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

/* A page for looking up and playing against josekis */

import * as React from "react";
import { Link } from "react-router-dom";
import ReactResizeDetector from 'react-resize-detector';
import * as queryString from "query-string";

import * as data from "data";
import { _, interpolate, npgettext } from "translate";
import { KBShortcut } from "KBShortcut";
import { PersistentElement } from "PersistentElement";
import { Goban, GoMath, GobanConfig } from "goban";
import { Markdown } from "Markdown";

import { Player } from "Player";

import { JosekiAdmin } from "JosekiAdmin";

import {openModal} from 'Modal';
import {JosekiSourceModal} from "JosekiSourceModal";
import {JosekiVariationFilter} from "JosekiVariationFilter";
import {JosekiTagSelector} from "JosekiTagSelector";
import {Throbber} from "Throbber";

const server_url = data.get("joseki-url", "/godojo/");

const position_url = (node_id: string, variation_filter?: any, mode?: string) => {
    let position_url = server_url + "position?id=" + node_id;
    if (variation_filter) {
        if (variation_filter.contributor) {
            position_url += "&cfilterid=" + variation_filter.contributor;
        }
        if (variation_filter.tags && variation_filter.tags.length !== 0) {
            position_url += "&tfilterid=" + variation_filter.tags;
        }
        if (variation_filter.source) {
            position_url += "&sfilterid=" + variation_filter.source;
        }
    }
    if (mode) {
        position_url += "&mode=" + mode;
    }
    return position_url;
};

const joseki_sources_url = server_url + "josekisources";
const tags_url = server_url + "tags";

const tag_count_url = (node_id: number, tag_id:number): string => (
    server_url + "position/tagcount?id=" + node_id + "&tfilterid=" + tag_id
);

const tagscount_url = (node_id: string): string => (
    server_url + "position/tagcounts?id=" + node_id
);

// Joseki specific markdown

const applyJosekiMarkdown = (markdown: string): string => {
    // Highligh marks in the text
    let result = markdown.replace(/<([A-Z]):([A-Z][0-9]{1,2})>/mg, '**$1**');

    // Transform position references into actual link
    result = result.replace(/<position: *([0-9]+)>/img, '**[' + _("Position") + ' $1](/joseki/$1)**');

    return result;
};

const getOGSJWT = (): string => {
    return data.get('config').user_jwt;
};

// Headers needed to talk to the godojo server.
const godojo_headers = (): {} => ({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Godojo-Auth-Token': 'foofer',
    'X-User-Info' : getOGSJWT()       // re-load this every time, in case they change identity via login/logout
    }
);

enum MoveCategory {
    // needs to match definition in BoardPosition.java
    // conceivably, should fetch these from the back end?
    IDEAL = "Ideal",
    GOOD = "Good",
    MISTAKE = "Mistake",
    TRICK = "Trick",
    QUESTION = "Question"
}

const bad_moves = ["MISTAKE", "QUESTION"] as any;  // moves the player is not allowed to play in Play mode

enum PageMode {
    Explore, Play, Edit, Admin
}

const ColorMap = {
    "IDEAL": "#008300",
    "GOOD": "#436600",
    "MISTAKE": "#b3001e",
    "TRICK": "#ffff00",
    "QUESTION": "#00ccff",
};

interface JosekiProps {
    match: {
        params: any
    };
    location: any;
}

export class Joseki extends React.Component<JosekiProps, any> {

    goban: Goban;
    goban_div: HTMLDivElement;
    goban_opts: any = {};
    goban_container:HTMLDivElement;
    goban_persistent_element:PersistentElement;

    last_server_position = ""; // the most recent position that the server returned to us, used in backstepping
    last_placement = "";
    next_moves: Array<any> = []; // these are the moves that the server has told us are available as joseki moves from the current board position
    current_marks: [];           // the marks on the board - from the server, or from editing
    load_sequence_to_board = false; // True if we need to load the stones from the whole sequence received from the server onto the board
    show_comments_requested = false;  //  If there is a "show_comments parameter in the URL
    previous_position = {} as any; // Saving the information of the node we have moved from, so we can get back to it
    backstepping = false;   // Set to true when the person clicks the back arrow, to indicate we need to fetch the position information
    played_mistake = false;
    computer_turn = false;  // when we are placing the computer's stone in Play mode
    filter_change = false;  // set to true when a position is being reloaded due to filter change
    cached_positions = {};

    constructor(props) {
        super(props);

        // console.log(props);
        this.state = {
            move_string: "",             // This is used for making sure we know what the current move is. It is the display value also.
            current_node_id: undefined as string,    // The server's ID for this node, so we can uniquely identify it and create our own route for it,
            position_description: "",
            variation_label: '_',
            current_move_category: "",
            pass_available: false,   // Whether pass is one of the joseki moves or not.   Contains the category of the position resulting from pass, if present
            contributor_id: -1,     // the person who created the node that we are displaying
            child_count: 0,

            throb: false,   // whether to show board-loading throbber

            mode: PageMode.Explore,
            user_can_edit: false,       // Purely for rendering purposes, server won't let them do it anyhow if they aren't allowed.
            user_can_administer: false,
            user_can_comment: false,

            move_type_sequence: [],   // This is the sequence of "move types" that is passed to the Play pane to display
            joseki_errors: 0,         // How many errors made by the player in the current sequence in Play mode.
            josekis_played: undefined as string,    // The player's joseki playing record...
            josekis_completed: undefined as number,
            joseki_successes: undefined as number,
            joseki_best_attempt: undefined as number,
            joseki_tag_id: undefined as number,       // the id of the "This is Joseki" tag, for use in setting default

            joseki_source: undefined as {url: string, description: string}, // the source of the current position
            tags: [],                  // the tags that are on the current position

            variation_filter: {} as {contributor: number, tags: number[], source: number},   // start with no filter defined

            count_details_open: false,
            tag_counts: [],  // A count of the number of continuations from this position that have each tag
            counts_throb: false,

            db_locked_down: true // pessimistic till it tells us otherwise
        };

        this.goban_div = document.createElement('div');
        this.goban_div.className = 'Goban';
    }

    initializeGoban = (initial_position?) => {
        // this can be called at any time to reset the board
        if (this.goban != null) {
            this.goban.destroy();
        }

        let opts:GobanConfig = {
            "board_div": this.goban_div,
            "interactive": true,
            "mode": "puzzle",
            "player_id": 0,
            "server_socket": null,
            "square_size": 20,
        };

        if (initial_position) {
            opts["moves"] = initial_position;
        }
        this.goban_opts = opts;
        this.goban = new Goban(opts);
        this.goban.setMode("puzzle");
        this.goban.on("update", () => this.onBoardUpdate());
        window["global_goban"] = this.goban;
    }

    componentDidMount = () => {
        this.getUserJosekiPermissions();

        // When we go into Play mode we need to know what tag is the Joseki one
        // We ask the server about that now so we have it handy
        this.getJosekiTag();

        const target_position = this.props.match.params.pos || "root";

        if (target_position !== "root") {
            this.load_sequence_to_board = true;

            const queries = queryString.parse(this.props.location.search);
            if (queries.show_comments) {
                this.show_comments_requested = true;
            }
        }

        this.initializeBoard(target_position);
    }

    initializeBoard = (target_position: string = "root") => {
        // console.log("Resetting board...");
        this.next_moves = [];
        this.played_mistake = false;
        this.computer_turn = false;

        this.setState({
            move_string: "",
            current_move_category: "",
            move_type_sequence: [],
            joseki_errors: 0,
            joseki_successes: undefined,
            joseki_best_attempt: undefined
        });
        this.initializeGoban();
        this.onResize();
        this.resetJosekiSequence(target_position);
    }

    resetBoard = () => {
        this.initializeBoard("root");
    }

    getUserJosekiPermissions = () => {
        fetch(server_url + "user-permissions", {
            mode: 'cors',
            headers: godojo_headers()   // server gets user id from here
        })
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            // console.log("Server response:", body);

            this.setState({
                user_can_edit: body.can_edit,
                user_can_administer: body.is_admin,
                user_can_comment: body.can_comment
            });
        }).catch((r) => {
            console.log("Permissions GET failed:", r);
        });
    }

    getJosekiTag = () => {
        // The "Joseki Tag" has to be the one at group 0 seq 0.  That's the deal.
        fetch(server_url + "tag?group=0&seq=0", {
            mode: 'cors',
            headers: godojo_headers()
        })
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            //console.log("Server response:", body);

            this.setState({
                joseki_tag_id: body.tags[0].id
            });
        }).catch((r) => {
            console.log("Joseki tag GET failed:", r);
        });
    }

    resetJosekiSequence = (pos: string) => {
        // ask the server for the moves from postion pos
        this.fetchNextMovesFor(pos);
    }

    onResize = () => {
        this.goban.setSquareSizeBasedOnDisplayWidth(
            Math.min(this.goban_container.offsetWidth, this.goban_container.offsetHeight)
        );
        this.goban.redraw();
        this.recenterGoban();
    }

    recenterGoban() {
        let m = this.goban.computeMetrics();
        if (this.goban_container.offsetWidth > 0 && m.width > 0) {
            this.goban_persistent_element.container.style.left = Math.round(Math.ceil(this.goban_container.offsetWidth - m.width) / 2) + "px";
        }
    }

    loadPosition = (node_id) => {
        this.load_sequence_to_board = true;
        this.fetchNextMovesFor(node_id);
    }

    updatePlayerJosekiRecord = (node_id) => {
        fetch(server_url + "playrecord/", {
            method: 'put',
            mode: 'cors',
            headers: godojo_headers(),
            body: JSON.stringify({
                position_id: node_id,
                errors: this.state.joseki_errors
            })
        })
        .then(res => res.json())
        .then(body => {
            console.log("Server response to play record PUT:", body);
            this.extractPlayResults(body);
        }).catch((r) => {
            console.log("Play record PUT failed:", r);
        });
    }

   // Fetch the next moves based on the current filter
   fetchNextMovesFor = (node_id: string) => {
        this.fetchNextFilteredMovesFor(node_id, this.state.variation_filter);
    }

    // Fetch the next moves based on the supplied filter
    // Note that this is where a "position gets rendered" after the placement of a stone, or some other trigger.
    // A trigger like placing a stone happens, then this gets called (from processPlacement etc), then the result gets rendered
    // in the processing of the result of the fectch for that position.

    fetchNextFilteredMovesFor = (node_id: string, variation_filter) => {
        /* TBD: error handling, cancel on new route */
        /* Note that this routine is responsible for enabling stone placement when it has finished the fetch */

        // visual indication that we are processing their click
        this.setState({
            position_description: "",
            throb: true,
        });

        // We have to turn show_comments_requested off once we are done loading a first position...
        this.show_comments_requested = this.load_sequence_to_board ? this.show_comments_requested : false;

        // console.log("cache:", this.cached_positions);

        // Because of tricky sequencing of state update from server responses, only
        // explore mode works with this caching ... the others need processNewMoves to happen after completion
        // of fetchNextFilteredMovesFor (this routine), which doesn't work with caching... needs some reorganisation
        // to make that work
        if (this.state.mode === PageMode.Explore && this.cached_positions.hasOwnProperty(node_id)) {
            console.log("cached position:", node_id);
            this.processNewMoves(node_id, this.cached_positions[node_id]);
        }
        else {
            // console.log("fetching position for node", node_id);
            fetch(position_url(node_id, variation_filter, this.state.mode), {
                mode: 'cors',
                headers: godojo_headers()
            })
            .then(response => response.json()) // wait for the body of the response
            .then(body => {
                // console.log("Server response:", body);
                this.processNewMoves(node_id, body);
                this.cached_positions = {[node_id]: body, ...this.cached_positions};
            }).catch((r) => {
                console.log("Node GET failed:", r);
            });
        }
    }

    // Handle the per-move processing of getting to the new node.
    // The data is in dto - it is a BoardPositionDTO from the server, but may have been
    // cached locally.

    processNewMoves = (node_id: string, dto) => {
        this.setState({throb: false});

        if (this.load_sequence_to_board) {
            // when they clicked a position link, we have to load the whole sequence we recieved onto the board
            // to get to that position
            this.loadSequenceToBoard(dto.play);
            this.load_sequence_to_board = false;
        }

        this.processNewJosekiPosition(dto);

        if (this.state.count_details_open) {
            this.showVariationCounts(node_id);
        }

        if (this.state.mode === PageMode.Play) {

            const good_moves = dto.next_moves.filter( (move) => (!bad_moves.includes(move.category)));

            if ((good_moves.length === 0) && !this.played_mistake) {
                this.setState({
                    move_type_sequence: [
                        ...this.state.move_type_sequence,
                        {type: 'complete', comment: _("Joseki!")}  // translators: the person completed a joseki sequence successfully
                    ]});
                this.updatePlayerJosekiRecord(node_id);
            }

            if (this.computer_turn) {
                // obviously, we don't place another stone if we just placed one
                this.computer_turn = false;
            }
            else if (dto.next_moves.length > 0 && this.state.move_string !== "") {
                // the computer plays both good and bad moves
                const next_play = dto.next_moves[Math.floor(Math.random() * dto.next_moves.length)];
                // console.log("Will play: ", next_play);

                this.computer_turn = true;
                if (next_play.placement === "pass") {
                    this.goban.pass();
                    this.onBoardUpdate();
                }
                else {
                    const location = this.goban.engine.decodeMoves(next_play.placement)[0];
                    this.goban.engine.place(location.x, location.y);
                    this.onBoardUpdate();
                }
            }
        }
        if (this.backstepping) {
            // console.log("finishing backstep");
            this.backstepping = false;
        }
        this.goban.enableStonePlacement();
    }

    loadSequenceToBoard = (sequence: string) => {
        // We expect sequence to come from the server in the form ".root.K10.L11.pass.Q12"
        // Goban wants "K10L11..Q12"
        // console.log("Loading server supplied position", sequence);

        const ogs_move_string = sequence.substr(6).replace(/\./g, '').replace(/pass/g, '..');
        this.initializeGoban(ogs_move_string);
        this.onBoardUpdate();
    }

    // Decode a response from the server into state we need, and display accordingly
    // "position" is a BoardPositionDTO
    processNewJosekiPosition = (position) => {
        this.setState({
            // I really wish I'd just put all of this into a single state object :S
            // It's on the "gee that would be good to refactor" list...
            position_description: position.description,
            contributor_id: position.contributor,
            variation_label: position.variation_label, // needed for when we edit this position
            current_move_category: position.category,
            current_node_id: position.node_id,
            current_comment_count: position.comment_count,
            joseki_source: position.joseki_source,
            tags: position.tags,
            child_count: position.child_count,
            db_locked_down: position.db_locked_down
        });
        this.last_server_position = position.play;
        this.last_placement = position.placement;
        this.next_moves = position.next_moves;
        this.current_marks = JSON.parse(position.marks) || [];
        this.previous_position = position.parent;
        if (this.state.mode !== PageMode.Play || this.state.move_string === "") {
            this.renderCurrentJosekiPosition();
        }

        // Give them the URL for this position in the URL bar
        window.history.replaceState({}, document.title, '/joseki/' + this.state.current_node_id);
    }

    // Draw all the variations that we know about from the server (array of moves from the server)
    renderCurrentJosekiPosition = () => {
        let next_moves = this.next_moves;
        let current_marks = this.current_marks;
        // console.log("rendering josekis ", next_moves, current_marks);
        this.goban.engine.cur_move.clearMarks();  // these usually get removed when the person clicks ... but just in case.
        let new_options = {};
        let pass_available = false;
        next_moves.forEach((option) => {
            new_options = {};
            if (option['placement'] === 'pass') {
                pass_available = option["category"].toLowerCase(); // this is used as a css style for the button
            }
            else {
                const label = option['variation_label'];
                new_options[label] = {
                    move: GoMath.encodePrettyCoord(option['placement'], this.goban.height),
                    color: ColorMap[option["category"]]
                };
            }
            // we have to do this one at a time in case there are more than one variation with the same label
            // because we can draw multiple with the same label, but only one at a time with this call!
            this.goban.setColoredMarks(new_options);
        });


        this.setState({pass_available});
        let new_marks = {};
        current_marks.forEach((mark:{}) => {
            const label = mark['label'];
            new_marks[label] = GoMath.encodePrettyCoord(mark['position'], this.goban.height);
            this.goban.setMarks(new_marks);
        });
        this.goban.redraw(true);  // stop it optimising away colour changes when mark doesn't change.
    }

    /* This is called every time a move is played on the Goban
       or anything else changes about the state of the board (back-step, sequence load)

       We ask the board engine what the position is now, and update the display accordingly */
    onBoardUpdate = () => {
        let mvs = GoMath.decodeMoves(
            this.goban.engine.cur_move.getMoveStringToThisPoint(),
            this.goban.width,
            this.goban.height);

        let move_string;
        let the_move;

        // console.log("onBoardUpdate mvs", mvs);
        if (mvs.length > 0) {
            let move_string_array = mvs.map((p) => {
                let coord = GoMath.prettyCoords(p.x, p.y, this.goban.height);
                coord = coord === '' ? 'pass' : coord;  // if we put '--' here instead ... https://stackoverflow.com/questions/56822128/rtl-text-direction-displays-dashes-very-strangely-bug-or-misunderstanding#
                return coord;
            });
            // console.log("MSA", move_string_array);

            move_string = move_string_array.join(",");

            the_move = mvs[mvs.length - 1];
        }
        else {
            // console.log("empty board");
            move_string = "";
            the_move = undefined;
        }
        if (move_string !== this.state.move_string) {
            this.goban.disableStonePlacement();  // we need to only have one click being processed at a time
            // console.log("Move placed: ", the_move);
            this.setState({ move_string });
            this.processPlacement(the_move, move_string);   // this is responsible for making sure stone placement is turned back on
        }
        else {
            this.backstepping = false;   // Needed for if they backstep twice at the empty board
        }
    }

    processPlacement(move: {x: number, y: number}, move_string: string) {
        /* They've either
            clicked a stone onto the board in a new position,
            or hit "back" to arrive at an old position,
            or we got here during "loading a new sequence"

            Note that this routine must either call this.fetchNextMovesFor() or this.goban.enableStonePlacement()
            ... otherwise stone placement will be left turned off.
            */

        const placement = move ?
            move.x !== -1 ?
                GoMath.prettyCoords(move.x, move.y, this.goban.height) :
                'pass' :
            "root";

        // console.log("Processing placement at:", placement, move_string);

        if (this.backstepping) {
            const play = ".root." + move_string.replace(/,/g, '.');
            // console.log("backstep to ", play);

            if (this.state.mode === PageMode.Play) {
                // in theory can only happen when backstepping out of a mistake
                // in this case, all the data for the position we arrived at should be valid (not reset exploratory)
                this.played_mistake = false;
                this.backstepping = false;
                this.goban.enableStonePlacement();
            }
            else if (this.state.current_move_category !== "new") {
                this.fetchNextMovesFor(this.previous_position.node_id);
                this.setState({ current_move_category: this.previous_position.category });
            }
            else if (play === this.last_server_position) {
                // console.log("Arriving back at known moves...");
                // We have back stepped back to known moves
                this.fetchNextMovesFor(this.state.current_node_id);
            }
            else {
                this.backstepping = false; // nothing else to do
                this.goban.enableStonePlacement();
                // console.log("backstepped exploratory");
            }
        }
        else if (this.load_sequence_to_board) {
            // console.log("loaded sequence: nothing to do in process placement");
            this.goban.enableStonePlacement();
        }
        else { // they must have clicked a stone onto the board
            const chosen_move = this.next_moves.find(move => move.placement === placement);

            // console.log("chosen move:", chosen_move, this.computer_turn);

            if (this.state.mode === PageMode.Play &&
                !this.computer_turn &&  // computer is allowed/expected to play mistake moves to test the response to them
                (chosen_move === undefined ||  // not in valid list of next_moves
                bad_moves.includes(chosen_move.category))) {
                // console.log("mistake!");
                this.played_mistake = true;
                this.last_placement = placement;
            }

            if (chosen_move !== undefined && !this.played_mistake) {
                /* The database already knows about this move, so we just get and display the new position information */
                this.fetchNextMovesFor(chosen_move.node_id);

            } else if (chosen_move === undefined && !this.played_mistake) {
                /* This isn't in the database */
                // console.log("exploratory");
                let next_variation_label = '1';
                // pre-set the variation label for edit-mode with the number of children this new move's parent has.
                if (this.next_moves.length > 0) {
                    const labelled_here = this.next_moves.reduce((count, move) =>
                        (("123456789".includes(move['variation_label']) && move['placement'] !== 'pass') ? count + 1 : count),
                    0);
                    // Chose the next variation label to be the one afer the current count
                    // Note that '1' will never actually be chosen through this code.
                    next_variation_label = "123456789_".charAt(labelled_here);
                    // console.log("New exploration: ", this.next_moves, labelled_here, next_variation_label);
                }
                this.next_moves = [];
                this.setState({
                    position_description: "", // Blank default description
                    current_move_category: "new",
                    child_count: 0,
                    tag_counts: [],
                    variation_label: next_variation_label,
                    joseki_source: undefined,
                    tags: []
                });
                this.goban.enableStonePlacement();
            }

            if (this.state.mode === PageMode.Play) {
                const move_type = this.computer_turn ? 'computer' :
                    (chosen_move === undefined || bad_moves.includes(chosen_move.category)) ? 'bad' : 'good';

                const comment = placement + ": " +
                    ((chosen_move === undefined) ? _("That move isn't listed!") :  MoveCategory[chosen_move.category]);

                this.setState({
                    move_type_sequence: [...this.state.move_type_sequence, {type: move_type, comment: comment}],
                    joseki_errors: (move_type === 'bad' ? this.state.joseki_errors + 1 : this.state.joseki_errors)
                });
            }

            if (this.state.mode === PageMode.Play && this.played_mistake && !this.backstepping && !this.computer_turn) {
                // They clicked a non-Joseki move
                // console.log("Ooops: ", this.state.current_move_category);

                this.renderMistakeResult();
                // Note: we have not called fetchNextMoves or enablePlacement, so placement is turned off now!
            }

            // console.log("pp exit");
        }
    }

    renderMistakeResult = () => {
        // Draw the correct options (which must be still in this.next_moves)
        // and cross out the wrong option (which is expected in this.last_placement)
        // console.log("rendering mistake at", this.last_placement);

        this.renderCurrentJosekiPosition();

        if (this.last_placement !== 'pass') {
            let new_options = {
                'X': {
                    move: GoMath.encodePrettyCoord(this.last_placement, this.goban.height),
                    color: ColorMap['MISTAKE']
                }
            };
            this.goban.setColoredMarks(new_options);
        }
    }

    componentDidUpdate(prevProps) {
        // console.log("did update...");
        if (prevProps.location.key !== this.props.location.key) {
            this.componentDidMount();  // force reload of position if they click a position link
        }

        // try to persuade goban to render at the correct size all the time
        this.onResize();
    }

    setAdminMode = () => {
        this.resetBoard();
        this.setState({
            mode: PageMode.Admin
        });
    }

    setExploreMode = () => {
        this.setState({
            mode: PageMode.Explore,
        });
    }

    setPlayMode = () => {
        this.setState({
            mode: PageMode.Play,
            played_mistake: false,
            move_type_sequence: [],
            computer_turn: false,
            joseki_errors: 0,
            joseki_successes: undefined,
            joseki_best_attempt: undefined,
            count_display_open: false
        });
        this.fetchPlayResults();
    }

    setEditMode = () => {
        this.setState({
            mode: PageMode.Edit,
        });
    }

    // Here we are getting the user's overall play history results
    fetchPlayResults = () => {
        let results_url = server_url + "playrecord";

        // console.log("Fetching play record logs ", results_url);
        this.setState({extra_throb: true});
        fetch(results_url, {
            mode: 'cors',
            headers: godojo_headers()
        })
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            this.setState({extra_throb: false});
            // console.log("Server response: ", body);
            this.extractPlayResults(body);
        }).catch((r) => {
            console.log("Play results GET failed:", r);
        });
    }

    // results DTO can come from either a fetch of the overall player record, or a put of the results of a particular sequence
    extractPlayResults = (results_dto) => {
        this.setState({
            josekis_played: results_dto.josekis_played,
            josekis_completed: results_dto.josekis_completed,
            joseki_best_attempt: results_dto.error_count,
            joseki_successes: results_dto.successes
        });
    }

    backOneMove = () => {
        // They clicked the back button ... tell goban and let it call us back with the result
        if (!this.backstepping) {
            // console.log("backstepping...");
            this.backstepping = true;  // make sure we know the reason why the goban called us back
            this.goban.showPrevious();
        }
        else {
            // console.log("(ignoring back button click, still processing prior one)");
        }
    }

    doPass = () => {
        this.goban.pass();
        this.goban.engine.cur_move.clearMarks();
        this.goban.redraw();
        this.onBoardUpdate();  // seems like pass does not trigger this!
    }

    updateVariationFilter = (filter) => {
        // console.log("update filter:", filter);
        this.setState({
            variation_filter: filter
        });
        this.cached_positions = {}; // dump cache because the filter changed, and the cache holds filtered results
        this.fetchNextFilteredMovesFor(this.state.current_node_id, filter);
    }

    updateMarks = (marks) => {
        this.current_marks = marks;
        this.renderCurrentJosekiPosition();
    }

    toggleContinuationCountDetail = () => {
        if (this.state.count_details_open) {
            this.hideVariationCounts();
        }
        else {
            this.showVariationCounts(this.state.current_node_id);
        }
    }

    showVariationCounts = (node_id: string) => {
        this.setState({
            tag_counts: [],
            count_details_open: true,
            counts_throb: true
        });

        fetch(tagscount_url(node_id), {
            mode: 'cors',
            headers: godojo_headers()
        })
        .then(res => res.json())
        .then(body => {
            // console.log("Tags Count GET:", body);
            let tags = [];
            if (body.tags) {
                tags = body.tags.sort((t1, t2) => (t1.group !== t2.group ? Math.sign(t1.group - t2.group) : Math.sign(t1.seq - t2.seq)));
            }
            let counts = [];
            tags.forEach(t => {
                counts.push({tagname: t.description, count: t.continuationCount});
            });
            this.setState({
                tag_counts: counts,
                counts_throb: false
            });
        }).catch((r) => {
            console.log("Continuation Counts GET failed:", r);
        });
    }

    hideVariationCounts = () => {
        this.setState({count_details_open: false});
    }

    updateDBLockStatus = (new_status) => {
        this.setState({db_locked_down: new_status});
    }

    render() {
        // console.log("Joseki app rendering ", this.state.move_string, this.state.current_move_category);

        const tenuki_type = (this.state.pass_available && this.state.mode !== PageMode.Play && this.state.move_string !== "") ?
            this.state.pass_available : "";

        const count_details = this.state.count_details_open ?
            <React.Fragment>
                {this.state.tag_counts.filter((t) => (t.count > 0)).map((t, idx) => (
                    <div className="variation-count-item" key={idx}>
                        <span>{t.tagname}:</span><span>{t.count}</span></div>
                ))}
            </React.Fragment>
            : "";

        const tags = ! this.state.tags  ? "" :
            this.state.tags.sort((a, b) => (Math.sign(a.group - b.group))).map((tag, idx) => (
            <div className="position-tag" key={idx}>
                <span>{tag['description']}</span>
            </div>
        ));

        return (
            <div className={"Joseki"}>
                <KBShortcut shortcut="home" action={this.resetBoard} />
                <KBShortcut shortcut="left" action={this.backOneMove} />

                <div className={"left-col" + (this.state.mode === PageMode.Admin ? " admin-mode" : "")}>
                    <div ref={(e) => this.goban_container = e} className="goban-container">
                        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
                        <PersistentElement ref={(e) => this.goban_persistent_element = e} className="Goban" elt={this.goban_div} />
                    </div>
                </div>
                <div className="right-col">
                    <div className="top-bar">
                        <div className={"move-controls" + (this.played_mistake ? " highlight" : "")}>
                            <i className="fa fa-fast-backward" onClick={this.resetBoard}></i>
                            <i className={"fa fa-step-backward" + ((this.state.mode !== PageMode.Play || this.played_mistake) ? "" : " hide")} onClick={this.backOneMove}></i>
                            <button
                                className={"pass-button " + tenuki_type}
                                onClick={this.doPass}>
                                Tenuki
                            </button>
                            <div className="throbber-spacer">
                                <Throbber throb={this.state.throb}/>
                            </div>
                        </div>
                        <div className="top-bar-other">
                            {this.renderModeControl()}
                            <a href="https://github.com/online-go/online-go.com/wiki/OGS-Joseki-Explorer" className="joseki-help">
                                <i className="fa fa-question-circle-o"></i>
                            </a>
                        </div>
                    </div>

                    {this.renderModeMainPane()}

                    <div className="position-details">
                        <div className={"status-info" + (this.state.move_string === "" ? " hide" : "")} >
                            {this.state.position_type !== "new" &&
                            <div className="position-other-info">
                                {tags}
                                {this.state.joseki_source && this.state.joseki_source.url.length > 0 &&
                                <div className="position-joseki-source">
                                    <span>{_("Source")}:</span><a href={this.state.joseki_source.url}>{this.state.joseki_source.description}</a>
                                </div>}
                                {this.state.joseki_source && this.state.joseki_source.url.length === 0 &&
                                <div className="position-joseki-source">
                                    <span>{_("Source")}:</span><span>{this.state.joseki_source.description}</span>
                                </div>}
                            </div>
                            }
                            <div className="move-category">
                                {this.state.current_move_category === "" ? "" :
                                    _("Last move") + ": " +
                                    (this.state.current_move_category === "new" ? (
                                        this.state.mode === PageMode.Explore ? _("Experiment") : _("Proposed Move")) :
                                        this.state.current_move_category)}
                            </div>

                            <div className={"contributor" +
                                ((this.state.current_move_category === "new") ? " hide" : "")}>

                                <span>{_("Contributor")}:</span> <Player user={this.state.contributor_id} />
                            </div>
                                <div>{_("Moves made")}:</div>
                                <div className="moves-made">
                                {this.state.current_move_category !== "new" ?
                                <Link className="moves-made-string" to={'/joseki/' + this.state.current_node_id}>{this.state.move_string}</Link> :
                                <span className="moves-made-string">{this.state.move_string}</span>}
                            </div>
                        </div>
                        <div className="continuations-pane">
                            {!!this.state.child_count &&
                            <React.Fragment>
                                <button className="position-child-count" onClick={this.toggleContinuationCountDetail}>
                                    {interpolate(_("This position leads to {{count}} others"), {count: this.state.child_count})}
                                    {!this.state.count_details_open &&
                                        <i className="fa fa-lg fa-caret-right"></i>
                                    }
                                    {this.state.count_details_open &&
                                        <i className="fa fa-lg fa-caret-down"></i>
                                    }
                                </button>
                                <div className={"child-count-details-pane" + (this.state.count_details_open ? " details-pane-open" : "")}>

                                    {this.state.count_details_open &&
                                    <div className="count-details">
                                        <Throbber throb={this.state.counts_throb}/>
                                        {count_details}
                                    </div>
                                    }
                                </div>
                            </React.Fragment>
                            }
                            {(!this.state.child_count) &&
                                <React.Fragment>
                                <div className="position-child-count">
                                    {_("This position has no continuations") + "."}
                                </div>
                                <div className="child-count-details-pane">
                                </div>
                                </React.Fragment>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderModeControl = () => (
        <div className="mode-control btn-group">
            <button className={"btn s  " + (this.state.mode === PageMode.Explore ? "primary" : "")} onClick={this.setExploreMode}>
                {_("Explore")}
            </button>
            <button className={"btn s  " + (this.state.mode === PageMode.Play ? "primary" : "")} onClick={this.setPlayMode}>
                {_("Play")}
            </button>
            {this.state.user_can_edit && !this.state.db_locked_down &&
            <button
                className={"btn s  " + (this.state.mode === PageMode.Edit ? "primary" : "")} onClick={this.setEditMode}>
                {this.state.current_move_category === "new" && this.state.mode === PageMode.Explore ? _("Save") : _("Edit")}
            </button>
            }
            {this.state.user_can_edit && this.state.db_locked_down &&
            <button
                className={"btn s "} disabled>
                Edit <i className="fa fa-lock"/>
            </button>
            }
            <button className={"btn s  " + (this.state.mode === PageMode.Admin ? "primary" : "")} onClick={this.setAdminMode}>
                {this.state.user_can_administer ? _("Admin") : _("Updates")}
            </button>
        </div>
    )

    renderModeMainPane = () => {
        // console.log("Mode pane render ", this.state.variation_filter);
        if (this.state.mode === PageMode.Admin) {
            return (
                <JosekiAdmin
                    godojo_headers={godojo_headers()}
                    server_url={server_url}
                    user_can_administer={this.state.user_can_administer}
                    user_can_edit={this.state.user_can_edit}
                    db_locked_down={this.state.db_locked_down}
                    loadPositionToBoard = {this.loadPosition}
                    updateDBLockStatus = {this.updateDBLockStatus}
                />
            );
        }
        else if (this.state.mode === PageMode.Explore ||
            (this.state.mode === PageMode.Edit && this.state.move_string === "" )// you can't edit the empty board
        ) {
            return (
                <ExplorePane
                    description={this.state.position_description}
                    position_type={this.state.current_move_category}
                    comment_count={this.state.current_comment_count}
                    position_id={this.state.current_node_id}
                    can_comment={this.state.user_can_comment}
                    joseki_source={this.state.joseki_source}
                    tags={this.state.tags}
                    set_variation_filter = {this.updateVariationFilter}
                    current_filter = {this.state.variation_filter}
                    child_count = {this.state.child_count}
                    show_comments = {this.show_comments_requested}
                />
            );
        }
        else if (this.state.mode === PageMode.Edit) {
            return (
                <EditPane
                    node_id={this.state.current_node_id}
                    category={this.state.current_move_category}
                    description={this.state.position_description}
                    variation_label={this.state.variation_label}
                    joseki_source_id={this.state.joseki_source ? this.state.joseki_source.id : 'none'}
                    tags={this.state.tags}
                    contributor={this.state.contributor_id}
                    save_new_info={this.saveNewPositionInfo}
                    update_marks={this.updateMarks}
                />
            );
        }
        else {
            return (
                <PlayPane
                    move_type_sequence={this.state.move_type_sequence}
                    joseki_errors={this.state.joseki_errors}
                    josekis_played={this.state.josekis_played}
                    josekis_completed={this.state.josekis_completed}
                    joseki_best_attempt={this.state.joseki_best_attempt}
                    joseki_successes={this.state.joseki_successes}
                    joseki_tag_id={this.state.joseki_tag_id}
                    set_variation_filter = {this.updateVariationFilter}
                    current_filter = {this.state.variation_filter}
                />
            );
        }
    }

    saveNewPositionInfo = (move_type, variation_label, tags, description, joseki_source_id, marks) => {

        const mark_string = JSON.stringify(marks); // 'marks' is just a string as far as back end is concerned

        this.cached_positions = {}; // dump cache to make sure the editor sees their new results

        if (this.state.current_move_category !== "new") {
            // they must have pressed save on a current position.

            fetch(position_url(this.state.current_node_id), {
                method: 'put',
                mode: 'cors',
                headers: godojo_headers(),
                body: JSON.stringify({
                    description: description,
                    variation_label: variation_label,
                    tags: tags,
                    category: move_type.toUpperCase(),
                    joseki_source_id: joseki_source_id,
                    marks: mark_string
                 })
            })
            .then(res => res.json())
            .then(body => {
                // console.log("Server response to sequence PUT:", body);
                this.processNewJosekiPosition(body);
                this.setExploreMode();
            }).catch((r) => {
                console.log("Position PUT failed:", r);
            });
        }
        else {
            // Here the person has added one or more moves then clicked "save"
            // First we save the new position(s)
            fetch(server_url + "positions/", {
                method: 'post',
                mode: 'cors',
                headers: godojo_headers(),
                body: JSON.stringify({
                    sequence: this.state.move_string,
                    category: move_type })
            })
            .then(res => res.json())
            .then(body => {
                // console.log("Server response to sequence POST:", body);
                this.processNewJosekiPosition(body);

                // Now we can save the fields that apply only to the final position

                fetch(position_url(this.state.current_node_id), {
                    method: 'put',
                    mode: 'cors',
                    headers: godojo_headers(),
                    body: JSON.stringify({
                        description: description,
                        variation_label: variation_label,
                        tags: tags,
                        joseki_source_id: joseki_source_id,
                        marks: mark_string
                     })
                })
                .then(res => res.json())
                .then(body => {
                    // console.log("Server response to description PUT:", body);
                    this.processNewJosekiPosition(body);
                    this.setExploreMode();
                }).catch((r) => {
                    console.log("Position PUT failed:", r);
                });
            }).catch((r) => {
                console.log("PositionS POST failed:", r);
            });
        }
    }
}

// This pane responds to changes in position ID by showing the new node information
interface ExploreProps {
    position_id: string;
    description: string;
    position_type: string;
    comment_count: number;
    can_comment: boolean;
    joseki_source: {url: string, description: string};
    tags: Array<any>;
    set_variation_filter(filter: any): void;
    current_filter: {contributor: number, tags: number[], source: number};
    child_count: number;
    show_comments: boolean;
}

class ExplorePane extends React.Component<ExploreProps, any> {

    constructor(props) {
        super(props);

        this.state = {
            extra_info_selected: "none",
            current_position: "",
            commentary: [],
            forum_thread: "",
            audit_log: [],
            next_comment: "",
            extra_throb: false
        };
    }

    componentDidMount = () => {
        if (this.props.show_comments) {
            this.showComments();
        }
     }

    static getDerivedStateFromProps(nextProps, prevState) {
        // Detect position id changes, so we can close the extra_info pane
        if (nextProps.position_id !== prevState.current_position) {
            return { current_position: nextProps.position_id };
        }
        else {
            return null;
        }
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (prevProps.position_id !== this.props.position_id) {
            this.setState({
                extra_info_selected: "none",
                commentary: []
            });
        }
        else {
            if (this.props.position_id  && this.props.show_comments && this.state.extra_info_selected === "none" ) {
                this.showComments();
            }
        }
    }

    showComments = () => {
        // Possible optimisation: don't re-fetch if we already have them for this node
        const comments_url = server_url + "commentary?id=" + this.props.position_id;
        // console.log("Fetching comments ", comments_url);
        // console.log(godojo_headers);
        this.setState({extra_throb: true});

        fetch(comments_url, {
            mode: 'cors',
            headers: godojo_headers()
        })
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            // console.log("Server response:", body);
            this.setState({extra_throb: false});
            this.extractCommentary(body);
        }).catch((r) => {
            console.log("Comments GET failed:", r);
        });
        this.setState({ extra_info_selected: "comments" });
    }

    extractCommentary = (commentary_dto) => {
        // console.log(commentary_dto);
        let commentary = commentary_dto.commentary.map((comment) => (
            {
                user_id: comment.userId,
                date: new Date(comment.date),
                comment: comment.comment
            }
        ));
        const forum_thread_url = commentary_dto.forum_thread_id === null ? "" :
            ("https://forums.online-go.com/t/" + commentary_dto.forum_thread_id);

        this.setState({
            commentary: commentary,
            forum_thread: forum_thread_url
        });
    }

    hideExtraInfo = () => {
        this.setState({ extra_info_selected: "none" });
    }

    showAuditLog = () => {
        const audits_url = server_url + "audits?id=" + this.props.position_id;
        // console.log("Fetching audit logs ", audits_url);
        this.setState({extra_throb: true});
        fetch(audits_url, {
            mode: 'cors',
            headers: godojo_headers()
        })
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            // console.log("Server response: ", body);
            this.extractAuditLog(body);
        }).catch((r) => {
            console.log("Audits GET failed:", r);
        // tslint:disable-next-line:no-floating-promises
        }).finally(() => {
            this.setState({extra_throb: false});
        });

        this.setState({ extra_info_selected: "audit-log" });
    }

    extractAuditLog = (audit_log_dto) => {
        // the format is basically what we need.  Just capture it!
        this.setState({ audit_log: audit_log_dto});
    }

    showFilterSelector = () => {
        this.setState({ extra_info_selected: "variation-filter" });
    }

    onCommentChange = (e) => {
        // If they hit enter, we intercept and save.  Otherwise just let them keep typing characters, up to the max length
        // (if they are allowed, of course)
        if (/\r|\n/.exec(e.target.value)) {
            const comment_url = server_url + "comment?id=" + this.props.position_id;
            fetch(comment_url, {
                method: 'post',
                mode: 'cors',
                headers: godojo_headers(),
                body: this.state.next_comment
            })
            .then(res => res.json())
            .then(body => {
                // console.log("Server response to comment POST:", body);
                this.extractCommentary(body);
            }).catch((r) => {
                console.log("Comment PUT failed:", r);
            });

            this.setState({ next_comment: "" });
        }
        else if (e.target.value.length < 200 && this.props.can_comment) {
            this.setState({ next_comment: e.target.value });
        }
    }

    render = () => {
        const filter_active =
            ((this.props.current_filter.tags && this.props.current_filter.tags.length !== 0) ||
            this.props.current_filter.contributor ||
            this.props.current_filter.source);

        let description = applyJosekiMarkdown(this.props.description);

        return (
            <div className="explore-pane">
                    <div className="description-column">
                        {this.props.position_type !== "new" ?
                        <div className="position-description">
                            <Markdown source={description} />
                        </div>
                        : ""}
                    </div>
                    <div className={"extra-info-column extra-info-open"}>
                        <div className="btn-group extra-info-selector">
                            <button className={"btn s " + (this.state.extra_info_selected === "variation-filter" ? " primary" : "")}
                                    onClick={(this.state.extra_info_selected === "variation-filter") ? this.hideExtraInfo : this.showFilterSelector}>
                                    <span>{_("Filter")}</span>
                                    {this.state.extra_info_selected === "variation-filter" ?
                                    <i className={"fa fa-filter hide"}/> :
                                    <i className={"fa fa-filter" + (filter_active ? " filter-active" : "")}/>
                                    }
                            </button>
                            <button className={"btn s " + (this.state.extra_info_selected === "comments" ? " primary" : "")}
                                    onClick={(this.state.extra_info_selected === "comments") ? this.hideExtraInfo : this.showComments}>
                                    {_("Comments")} ({this.props.comment_count})
                            </button>
                            <button className={"btn s " + (this.state.extra_info_selected === "audit-log" ? " primary" : "")}
                                    onClick={(this.state.extra_info_selected === "audit-log") ? this.hideExtraInfo : this.showAuditLog}>
                                    {_("Changes")}
                            </button>
                        </div>

                        {this.state.extra_info_selected === "comments" &&
                            <div className="discussion-container">
                                <div className="discussion-lines">
                                    <Throbber throb={this.state.extra_throb}/>
                                    {this.state.commentary.map((comment, idx) =>
                                        <div className="comment" key={idx}>
                                            <div className="comment-header">
                                                <Player user={comment.user_id}></Player>
                                                <div className="comment-date">{comment.date.toDateString()}</div>
                                            </div>
                                            <Markdown className="comment-text" source={applyJosekiMarkdown(comment.comment)} />
                                        </div>
                                    )}
                                </div>
                                <textarea className="comment-input" rows={1} value={this.state.next_comment} onChange={this.onCommentChange} />
                            </div>
                        }

                        {this.state.extra_info_selected === "audit-log" &&
                            <div className="audit-container">
                                    <Throbber throb={this.state.extra_throb}/>
                                    {this.state.audit_log.map((audit, idx) =>
                                        <div className="audit-entry" key={idx}>
                                            <div className="audit-header">
                                                <Player user={audit.userId}></Player>
                                                <div className="audit-date">{new Date(audit.date).toDateString()}</div>
                                            </div>
                                            {audit.comment}
                                        </div>
                                    )}
                            </div>
                        }

                        {this.state.extra_info_selected === "variation-filter" &&
                            <div className="filter-container">
                                <JosekiVariationFilter
                                    contributor_list_url={server_url + "contributors"}
                                    tag_list_url = {server_url + "tags"}
                                    source_list_url = {server_url + "josekisources"}
                                    current_filter = {this.props.current_filter}
                                    godojo_headers={godojo_headers()}
                                    set_variation_filter={this.props.set_variation_filter}
                                />
                            </div>
                        }
                    </div>
            </div>
        );
    }
}

// We should display entertaining gamey encouragement for playing Josekies correctly here...
interface PlayProps {
    move_type_sequence: [];
    joseki_errors: number;
    josekis_played: number;
    josekis_completed: number;
    joseki_best_attempt: number;
    joseki_successes: number;
    joseki_tag_id: number;
    set_variation_filter(filter: any): void;
    current_filter: {contributor: number, tags: number[], source: number};
}

class PlayPane extends React.Component<PlayProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            extra_info_selected: "none",
            extra_throb: false,
            forced_filter: false
        };
    }

    iconFor = (move_type) => {
        switch (move_type) {
            case 'good': return (<i className="fa fa-check"/>); break;
            case 'bad': return (<i className="fa fa-times"/>); break;
            case 'computer': return (<i className="fa fa-desktop"/>); break;
            case 'complete': return (<i className="fa fa-star"/>); break;
            default: return "";
        }
    }

    componentDidMount = () => {
        if (this.props.current_filter.contributor  &&
            this.props.current_filter.tags  &&
            this.props.current_filter.source ) {
            // Set up a Joseki filter by default
            this.props.set_variation_filter({
                tags:[this.props.joseki_tag_id],
                contributor: undefined,
                source: undefined
            });
            this.showFilterSelector();
            this.setState({forced_filter: true});
        }
        else {
            this.showResults();
        }
    }

    // here we are detecting each time they play a move, so we can
    // set the extra info selector in the most helpful way
    static getDerivedStateFromProps = (nextProps, prevState) => {
        if (prevState.forced_filter && nextProps.move_type_sequence.length > 1) {
            return ({
                extra_info_selected: 'results',
                forced_filter: false
            });
        }
        return null;
    }

    showFilterSelector = () => {
        this.setState({ extra_info_selected: "variation-filter" });
    }

    showResults = () => {
        this.setState({ extra_info_selected: 'results'});
    }

    hideExtraInfo = () => {
        this.setState({ extra_info_selected: "none" });
    }

    render = () => {
        // console.log("Play render", this.props.move_type_sequence);

        const filter_active =
            ((this.props.current_filter.tags && this.props.current_filter.tags.length !== 0) ||
            this.props.current_filter.contributor ||
            this.props.current_filter.source );

        return (
            <div className="play-columns">
                <div className="play-dashboard">
                    {this.props.move_type_sequence.length === 0 &&
                    <div> Your move...</div>}
                    {this.props.move_type_sequence.map( (move_type, id) => (
                        <div key={id}>
                            {this.iconFor(move_type['type'])}
                            {move_type['comment']}
                        </div>))}
                </div>
                <div className={"extra-info-column extra-info-open"}>
                        <div className="btn-group extra-info-selector">
                            <button className={"btn s " + (this.state.extra_info_selected === "results" ? " primary" : "")}
                                    onClick={(this.state.extra_info_selected === "results") ? this.hideExtraInfo : this.showResults}>
                                    {_("Results")}
                            </button>
                            <button className={"btn s " + (this.state.extra_info_selected === "variation-filter" ? " primary" : "")}
                                    onClick={(this.state.extra_info_selected === "variation-filter") ? this.hideExtraInfo : this.showFilterSelector}>
                                    <span>{_("Filter")}</span>
                                    {this.state.extra_info_selected === "variation-filter" ?
                                    <i className={"fa fa-filter hide"}/> :
                                    <i className={"fa fa-filter" + (filter_active ? " filter-active" : "")}/>
                                    }
                            </button>
                        </div>
                        {this.state.extra_info_selected === "results" &&
                            <div className="play-results-container">
                                <h4>{_("Overall:")}</h4>
                                <div>{_("Josekis played")}: {this.props.josekis_played}</div>
                                <div>{_("Josekis played correctly")}: {this.props.josekis_completed}</div>

                                <h4>{_("This Sequence:")}</h4>
                                <div>{_("Mistakes so far")}: {this.props.joseki_errors}</div>

                                {!!this.props.joseki_successes &&
                                    <div>{_("Correct plays of this position")}: {this.props.joseki_successes}</div>
                                }
                                {!!this.props.joseki_best_attempt &&
                                    <div>
                                    {interpolate(_("Best attempt: {{mistakes}}"), {mistakes: this.props.joseki_best_attempt})
                                     + " " + npgettext("mistakes", "mistake", "mistakes", this.props.joseki_best_attempt)}
                                    </div>
                                }
                            </div>
                        }

                        {this.state.extra_info_selected === "variation-filter" &&
                            <div className="filter-container">
                                <JosekiVariationFilter
                                    contributor_list_url={server_url + "contributors"}
                                    tag_list_url = {server_url + "tags"}
                                    source_list_url = {server_url + "josekisources"}
                                    current_filter = {this.props.current_filter}
                                    godojo_headers={godojo_headers()}
                                    set_variation_filter={this.props.set_variation_filter}
                                />
                            </div>
                        }
                    </div>
            </div>
        );
    }
}

// This pane enables the user to edit the description and move attributes of the current position
// It doesn't care what node we are on.  If the description or category of the node changes due to a click,
// this component just updates what it is showing so they can edit it

interface EditProps {
    node_id: number;
    description: string;
    category: string;
    variation_label: string;
    joseki_source_id: number;
    tags: Array<any>;
    contributor: number;
    save_new_info: (move_type, variation_label, tags, description, joseki_source, marks) => void;
    update_marks: ({}) => void;
}

class EditPane extends React.Component<EditProps, any> {
    constructor(props) {
        super(props);

        this.state = {
            move_type: this.props.category === "new" ? Object.keys(MoveCategory)[0] : this.props.category,
            new_description: this.props.description,
            preview: this.props.description,
            node_id: this.props.node_id,
            joseki_source_list: [],
            joseki_source: this.props.joseki_source_id,
            available_tag_list: [],
            // 'tags' is the value of the multi-select.  It has to have keys of 'label' and 'value' apparently.
            // ('valueKey' and 'labelKey' aren't working for me)
            tags: (this.props.tags === null) ? [] : this.props.tags.map((t) => ({label: t.description, value: t.id})),
            variation_label: this.props.variation_label || '1'
        };

        // Get the list of joseki sources
        fetch(joseki_sources_url, {
            mode: 'cors',
            headers: godojo_headers()
        })
        .then(res => res.json())
        .then(body => {
            // console.log("Server response to josekisources GET:", body);
            this.setState({joseki_source_list: [{id: 'none', description: "(unknown)"}, ...body.sources]});
        }).catch((r) => {
            console.log("Sources GET failed:", r);
        });
    }

    static getDerivedStateFromProps = (nextProps, prevState) => {
        // Detect node changes (resulting from clicking on the board), so we can update
        if (nextProps.node_id !== prevState.node_id) {
            // console.log("Updating from props...");
            // console.log("gdsfp: ", nextProps, prevState);
            return {
                node_id: nextProps.node_id,
                move_type: nextProps.category === "new" ? Object.keys(MoveCategory)[0] : nextProps.category,
                new_description: nextProps.description,
                joseki_source: nextProps.joseki_source_id,
                tags: nextProps.tags === null ? [] : nextProps.tags.map((t) => ({label: t.description, value: t.id})),
                variation_label: nextProps.variation_label || '1'
            };
        }
        else {
            return null;
        }
    }

    onTypeChange = (e) => {
        this.setState({ move_type: e.target.value });
    }

    onSourceChange = (e) => {
        this.setState({ joseki_source: e.target.value });
    }

    onTagChange = (e) => {
        // console.log("changing tags", e);
        this.setState({ tags: e });
    }

    handleEditInput = (e) => {
        const new_description = e.target.value;

        this.props.update_marks(this.currentMarksInDescription(new_description));

        this.setState({ new_description });
    }

    saveNewInfo = (e) => {
        this.props.save_new_info(
            this.state.move_type,
            this.state.variation_label,
            this.state.tags.map((t) => (t.value)),
            this.state.new_description,
            this.state.joseki_source  !== 'none' ? this.state.joseki_source : undefined,
            this.currentMarksInDescription(this.state.new_description));
    }

    currentMarksInDescription = (description: string): Array<{label: string, position: string}> => {
        // Extract markup for "board marks"
        // maps markup of form "<label:position>"  to an array of {label, position} objects for each mark

        if (description === null) { // I don't see how, but Sentry logs seem to imply there is a way!
            return [];
        }

        // we have to grok each mark out of the multiline string then parse it, because es5.
        const mark_matches = description.match(/<[A-Z]:[A-Z][0-9]{1,2}>/mg);

        let current_marks = [];

        if (mark_matches) {
            mark_matches.forEach(mark => {
                const extract = mark.match(/<([A-Z]):([A-Z][0-9]{1,2})>/);
                current_marks.push({label: extract[1], position: extract[2]});
            });
        }

        return current_marks;

        /* The es2017 way:

        const mark_matches = Array.from(description.matchAll(/<([A-Z]):([A-Z][0-9]{1,2})>/mg));

        return mark_matches.map((mark_match) => ({label:mark_match[1], position: mark_match[2]}));
        */
    }

    promptForJosekiSource = (e) => {
        openModal(<JosekiSourceModal add_joseki_source={this.addJosekiSource} fastDismiss />);
    }

    addJosekiSource = (description, url) => {
        fetch(server_url + "josekisources/", {
            method: 'post',
            mode: 'cors',
            headers: godojo_headers(),
            body: JSON.stringify({ source: {description: description, url: url, contributor: this.props.contributor}})
        })
        .then(res => res.json())
        .then(body => {
            // console.log("Server response to joseki POST:", body);
            const new_source = {id: body.source.id, description: body.source.description};
            // console.log(new_source);
            this.setState({
                joseki_source_list: [new_source, ...this.state.joseki_source_list],
                joseki_source: new_source.id
            });
        }).catch((r) => {
            console.log("Sources PUT failed:", r);
        });
    }

    onLabelChange = (e) => {
        this.setState({ variation_label: e.target.value});
    }

    render = () => {
        //console.log("rendering EditPane with ", this.state.move_type, this.state.new_description, this.state.variation_label);

        // create the set of select option elements from the valid MoveCategory items, with the current one at the top
        let selections = Object.keys(MoveCategory).map((selection, i) => (
            <option key={i} value={MoveCategory[selection]}>{_(MoveCategory[selection])}</option>
        ));

        if (this.state.move_type !== "new") {
            selections.unshift(<option key={-1} value={MoveCategory[this.state.move_type]}>{_(MoveCategory[this.state.move_type])}</option>);
        }

        let labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '_'].map((label, i) => (
            <option key={i} value={label}>{label}</option>
        ));

        let sources = this.state.joseki_source_list.map((selection, i) => (
            <option key={i} value={selection["id"]}>{_(selection["description"])}</option>
        ));


        // console.log("EditPane render, tags", this.state.tags);

        // give feedback that we recognised their marks
        let preview = applyJosekiMarkdown(this.state.new_description);

        return (
            <div className="edit-container">
                <div className="move-attributes">
                    <div className="move-type-selection">
                        <span>{_("This sequence is")}:</span>
                        <select value={this.state.move_type} onChange={this.onTypeChange}>
                            {selections}
                        </select>
                    </div>
                    <div className="variation-order-select">
                        <span>{_("Variation label")}:</span>
                        <select value={this.state.variation_label} onChange={this.onLabelChange}>
                            {labels}
                        </select>
                    </div>

                    <div className="joseki-source-edit">
                        <div>{_("Source")}:</div>
                        <div className="joseki-source-edit-controls">
                            <select value={this.state.joseki_source} onChange={this.onSourceChange}>
                                {sources}
                            </select>
                            <i className="fa fa-plus-circle" onClick={this.promptForJosekiSource}/>
                        </div>
                    </div>
                    <div className="tag-edit">
                        <div>{_("Tags")}:</div>
                        <JosekiTagSelector
                            godojo_headers={godojo_headers()}
                            tag_list_url = {server_url + "tags"}
                            selected_tags= {this.state.tags}
                            on_tag_update={this.onTagChange}
                        />
                    </div>
                </div>
                <div className="description-edit">

                    <div className="edit-label">{_("Position description")}:</div>

                    {/* Here is the edit box for the markdown source of the description */}
                    <textarea onChange={this.handleEditInput} value={this.state.new_description} />

                    <div className="position-edit-button">
                        <button className="btn xs primary" onClick={this.saveNewInfo}>
                            {_("Save")}
                        </button>
                    </div>
                    <div className="edit-label">{_("Preview")}:</div>

                    {/* The actual description rendered here */}
                    {this.state.new_description.length !== 0 &&
                    <Markdown className="description-preview" source={preview} />
                    }

                    {/* and a placeholder for the description when the markdown is empty*/}
                    {this.state.new_description.length === 0 &&
                    <div className="description-preview edit-label">({_("position description")})</div>
                    }
                </div>
            </div>
        );
    }
}


