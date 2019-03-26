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

/* A page for looking up and playing against josekis */

import * as React from "react";
import * as ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import * as jwt from "jsonwebtoken";

import * as data from "data";
import { _, pgettext, interpolate } from "translate";
import { KBShortcut } from "KBShortcut";
import { PersistentElement } from "PersistentElement";
import { errorAlerter, dup, ignore } from "misc";
import { Goban, GoMath } from "goban";
import { Resizable } from "Resizable";
import { getSectionPageCompleted } from "../LearningHub/util";
import { PlayerIcon } from "PlayerIcon";
import { Player } from "Player";

import {openModal} from 'Modal';
import {JosekiSourceModal} from "JosekiSourceModal";

const server_url = "http://ec2-3-82-225-94.compute-1.amazonaws.com:80/godojo/";

//const server_url = "http://localhost:8081/godojo/";

const position_url = (node_id) => {
    return server_url + "position?id=" + node_id;
};

const joseki_sources_url = server_url + "josekisources";

let godojo_headers = {        // note: user JWT is added to this later
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Godojo-Auth-Token': 'foofer'
};

enum MoveCategory {
    // needs to match definition in BoardPosition.java
    // conceivably, should fetch these from the back end?
    IDEAL = "Ideal",
    GOOD = "Good",
    MISTAKE = "Mistake",
    TRICK = "Trick",
    QUESTION = "Question"
}

const bad_moves = ["MISTAKE", "TRICK", "QUESTION"] as any;

enum PageMode {
    Explore, Play, Edit
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
    refs: {
        goban_container;
    };

    goban: Goban;
    goban_div: any;
    goban_opts: any = {};

    last_server_placement = ""; // the most recent placement that the server returned to us
    next_moves: Array<any> = []; // these are the moves that the server has told us are available as joseki moves from the current board position

    load_sequence_to_board = false; // True if we need to load the stones from the whole sequence received from the server onto the board

    previous_position = {} as any; // Saving the information of the node we have moved from, so we can get back to it
    backstepping = false;   // Set to true when the person clicks the back arrow, to indicate we need to fetch the position information
    played_mistake = false;
    our_turn = false;  // in Play mode, when we are placing the computer's stone

    constructor(props) {
        super(props);

        console.log(props);
        this.state = {
            move_string: "",         // This is used for making sure we know what the current move is.
            current_node_id: null,   // The server's ID for this node, so we can uniquely identify it and create our own route for it",
            position_description: "",
            current_move_category: "",
            mode: PageMode.Explore,
            move_type_sequence: [] as string[],
            joseki_source: null as {}
        };

        this.goban_div = $("<div className='Goban'>");

        this.initializeGoban();
    }

    initializeGoban = (initial_position?) => {
        // this can be called at any time to reset the board
        if (this.goban != null) {
            this.goban.destroy();
        }

        let opts = {
            "board_div": this.goban_div,
            "interactive": true,
            "mode": "puzzle",
            "player_id": 0,
            "server_socket": null,
            "square_size": 20,
        };

        if (initial_position !== undefined) {
            opts["moves"] = initial_position;
        }
        this.goban_opts = opts;
        this.goban = new Goban(opts);
        this.goban.setMode("puzzle");
        this.goban.on("update", () => this.onBoardUpdate());
        window["global_goban"] = this.goban;
    }

    componentDidMount = () => {
        $(window).on("resize", this.onResize as () => void);
        this.onResize();  // make Goban size itself properly after the DOM is rendered

        godojo_headers["X-User-Info"] = this.fakeUpUserinfo();

        const target_position = this.props.match.params.pos || "root";

        if (target_position !== "root") {
            this.load_sequence_to_board = true;
        }

        this.resetJosekiSequence(target_position); // initialise joseki playing sequence with server
    }

    fakeUpUserinfo = () => {
        /* Fake up user details JWT - OGS server will provide this */
        const supposedly_private_key = "\
-----BEGIN RSA PRIVATE KEY-----\n\
MIIBOgIBAAJBAIwcsDli8iZtiIV9VjKXBxsmiSGkRCf3vi6y3wIaG7XDLEaXOzME\
HsV8s+oRl2VUDc2UbzoFyApX9Zc/FtHEi1MCAwEAAQJBAIBCbstJmXO2Byhz0Olk\
uZuQDi5eqgmQT2d+VIkfD0i15pPykN7VH7fiWBfVB/a5HYoyjse83Go6dm5TfjVM\
FOECIQD5lx/q1bPYfESipVHz8C6Icm309cTQ2JQ/Z8YiyU+r8QIhAI+10tL0gf0r\
CX7ncB7qj8A4YqLc9/VBuE6Wjxfh43+DAiBA6fpGJICa/G8Jcj/nVv9zQ3evr0Aa\
JUohV4cjwwHysQIgPQajLj3ybUW3VJKHRDmrLZ9EE5DuItHzqDu7LBMafm0CIGij\
DC+PapafkYFst0MSOS3wj3fvip7rs+moEF4D1ZQG\n\
-----END RSA PRIVATE KEY-----";

        const totally_public_key = "\
-----BEGIN PUBLIC KEY-----\n\
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIwcsDli8iZtiIV9VjKXBxsmiSGkRCf3\
vi6y3wIaG7XDLEaXOzMEHsV8s+oRl2VUDc2UbzoFyApX9Zc/FtHEi1MCAwEAAQ==\n\
-----END PUBLIC KEY-----";

        const user_info = data.get("user");

        // console.log("Loaded user info: ", user_info);

        const payload = {
            username: user_info.username,
            user_id: user_info.id
        };

        const i = 'OGS';     // Issuer
        const s = 'Josekis'; // Subject
        const a = 'godojo';  // Audience

        const signOptions = {
            issuer: i,
            subject: s,
            audience: a,
            expiresIn: "12h",
            algorithm: "RS256" as any
        };

        const user_jwt = jwt.sign(payload, supposedly_private_key, signOptions);
        console.log("Generated token:", user_jwt);

        const verifyOptions = signOptions;
        verifyOptions.algorithm = ["RS256"];
        let legit = jwt.verify(user_jwt, totally_public_key, verifyOptions);
        console.log(legit);
        return user_jwt;
    }

    resetJosekiSequence = (pos: String) => {
        // ask the server for the moves from postion pos
        this.fetchNextMovesFor(pos);
    }

    onResize = () => {
        this.goban.setSquareSizeBasedOnDisplayWidth(
            Math.min(this.refs.goban_container.offsetWidth, this.refs.goban_container.offsetHeight)
        );
    }

    fetchNextMovesFor = (node_id) => {
        /* TBD: error handling, cancel on new route */
        this.setState({position_description: ""})
        console.log("fetching for ", node_id); // visual indication that we are processing their click
        fetch(position_url(node_id), {
            mode: 'cors',
            headers: godojo_headers
        })
            .then(response => response.json()) // wait for the body of the response
            .then(body => {
                console.log("Server response:", body);

                if (this.load_sequence_to_board) {
                    // when they clicked a position link, we have to load the whole sequence we recieved onto the board
                    // to get to that position
                    this.loadSequenceToBoard(body.play);
                    this.load_sequence_to_board = false;
                }

                this.processNewJosekiPosition(body);

                if (this.state.mode === PageMode.Play) {

                    const good_moves = body.next_moves.filter( (move) => (!bad_moves.includes(move.category)));

                    if ((body.labels.includes("joseki") || good_moves.length === 0) && !this.played_mistake) {
                        this.setState({move_type_sequence: [...this.state.move_type_sequence, "** Joseki!"]});
                    }

                    if (this.our_turn || this.played_mistake) {
                        // obviously, don't place another stone if we just placed one
                        // also, if they made a mistake, then they get another go.
                        this.our_turn = false;
                        if (this.played_mistake) {
                            console.log("finishing mistake processing");
                            this.played_mistake = false;
                        }
                    }
                    else if (body.next_moves.length > 0 && this.state.move_string !== "") {
                        // the computer plays both good and bad moves
                        const next_play = body.next_moves[Math.floor(Math.random() * body.next_moves.length)];
                        const location = this.goban.engine.decodeMoves(next_play.placement)[0];
                        console.log("Will play: ", next_play, location);
                        this.our_turn = true;
                        this.goban.engine.place(location.x, location.y);
                        this.onBoardUpdate();
                    }
                }
                if (this.backstepping) {
                    console.log("finishing backstep");
                    this.backstepping = false;
                }
            });
    }

    loadSequenceToBoard = (sequence: string) => {
        // We expect sequence to come from the server in the form ".root.K10.L11"
        console.log("Loading server supplied position", sequence);
        const ogs_move_string = sequence.substr(6).replace(/\./g, '');
        this.initializeGoban(ogs_move_string);
        this.onBoardUpdate();
    }

    // Decode a response from the server into state we need, and display accordingly
    processNewJosekiPosition = (position) => {
        this.setState({
            position_description: position.description,
            contributor_id: position.contributor,
            current_move_category: position.category,
            current_node_id: position.node_id,
            current_comment_count: position.comment_count,
            joseki_source: position.joseki_source
        });
        this.last_server_placement = position.placement;
        this.next_moves = position.next_moves;
        this.previous_position = position.parent;
        if (this.state.mode !== PageMode.Play || this.state.move_string === "") {
            this.renderJosekiPosition(this.next_moves);
        }
    }

    // Draw all the positions that are joseki moves that we know about from the server (array of moves from the server)
    renderJosekiPosition = (next_moves: Array<any>) => {
        //console.log("rendering josekis ", next_moves);
        this.goban.engine.cur_move.clearMarks();  // these usually get removed when the person clicks ... but just in case.
        let new_options = {};
        next_moves.forEach((option, index) => {
            const id = GoMath.num2char(index).toUpperCase();
            new_options[id] = {};
            new_options[id].move = GoMath.encodePrettyCoord(option["placement"], this.goban.height);
            new_options[id].color = ColorMap[option["category"]];
        });
        this.goban.setColoredMarks(new_options);
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

        if (mvs.length > 0) {
            move_string = mvs.map((p) => GoMath.prettyCoords(p.x, p.y, this.goban.height)).join(",");
            the_move = mvs[mvs.length - 1];
        }
        else { // empty board
            move_string = "";
            the_move = null;
        }
        if (move_string !== this.state.move_string) {
            console.log("Move placed: ", the_move);
            this.setState({ move_string });
            this.processPlacement(the_move);
        }
    }

    processPlacement(move: any) {
        /* They've either
            clicked a stone onto the board in a new position,
            or hit "back" to arrive at an old position,
            or we got here during "loading a new sequence" */
        const placement = move !== null ?
            GoMath.prettyCoords(move.x, move.y, this.goban.height) :
            "root";

        console.log("Processing placement at:", placement);

        if (this.backstepping) {
            if (this.state.current_move_category !== "new") {
                this.fetchNextMovesFor(this.previous_position.node_id);
                this.setState({ current_move_category: this.previous_position.category });
            }
            else if (placement === this.last_server_placement) {
                // We have back stepped back to known moves
                this.fetchNextMovesFor(this.state.current_node_id);
            }
        }
        else if (this.load_sequence_to_board) {
            console.log("nothing to do in process placement");
        }
        else { // they must have clicked a stone onto the board
            const chosen_move = this.next_moves.find(move => move.placement === placement);

            if (this.state.mode === PageMode.Play &&
                !this.our_turn &&  // computer is allowed/expected to play mistake moves to test the response to them
                (chosen_move === undefined ||  // not in valid list of next_moves
                bad_moves.includes(chosen_move.category))) {
                console.log("mistake!");
                this.played_mistake = true;
            }

            if (chosen_move !== undefined && !this.played_mistake) {
                /* The database already knows about this move, so we just get and display the new position information */
                this.fetchNextMovesFor(chosen_move.node_id);

            } else if (chosen_move === undefined) {
                /* This isn't in the database */
                console.log("exploratory");
                this.setState({
                    position_description: "## Joseki",
                    current_move_category: "new"
                });
            }

            if (this.state.mode === PageMode.Play) {
                const this_play_type = (chosen_move === undefined) ? "Not Joseki" : chosen_move.placement + ": " + MoveCategory[chosen_move.category];
                this.setState({move_type_sequence: [...this.state.move_type_sequence, this_play_type]});
            }

            if (this.state.mode === PageMode.Play && this.played_mistake && !this.backstepping && !this.our_turn) {
                // They clicked a non-Joseki move
                console.log("Ooops: ", this.state.current_move_category);
                this.backOneMove();
             }

            console.log("pp exit");
        }
    }

    componentDidUpdate(prevProps) {
        console.log("did update...");
        if (prevProps.location.key !== this.props.location.key) {
            this.componentDidMount();  // force reload of position if they click a position link
        }
    }

    setExploreMode = () => {
        if (this.state.mode !== PageMode.Edit) { // If they were editing, they want to continue from the same place
            this.resetBoard();
        }
        this.setState({
            mode: PageMode.Explore,
        });
    }

    setPlayMode = () => {
        this.setState({
            mode: PageMode.Play,
            played_mistake: false,
            move_type_sequence: []
        });
    }

    setEditMode = () => {
        this.setState({
            mode: PageMode.Edit,
        });
    }

    resetBoard = () => {
        console.log("Resetting board...");
        this.next_moves = [];
        this.setState({
            move_string: "",
            current_move_category: "",
            move_type_sequence: []
        });
        this.initializeGoban();
        this.onResize();
        this.resetJosekiSequence("root");
    }

    backOneMove = () => {
        // They clicked the back button ... tell goban and let it call us back with the result
        console.log("backstepping...");
        this.backstepping = true;  // make sure we know the reason why the goban called us back
        this.goban.showPrevious();
    }

    render() {
        console.log("rendering ", this.state.move_string);
        return (
            <div className={"Joseki"}>
                <div className={"left-col"}>
                    <div ref="goban_container" className="goban-container">
                        <PersistentElement className="Goban" elt={this.goban_div} />
                    </div>
                </div>
                <div className="right-col">
                    <div className="top-bar">
                        <div className="move-controls">
                            <i className="fa fa-fast-backward" onClick={this.resetBoard}></i>
                            <i className={"fa fa-step-backward" + (this.state.mode !== PageMode.Play ? "" : " hide")} onClick={this.backOneMove}></i>
                        </div>
                        {this.renderModeControl()}
                    </div>

                    {this.renderModeMainPane()}

                    <div className={"status-info" + (this.state.move_string === "" ? " hide" : "")} >
                        <div className="move-category">
                            {this.state.current_move_category === "" ? "" :
                                "Last move: " +
                                (this.state.current_move_category === "new" ? (
                                    this.state.mode === PageMode.Explore ? "Experiment" : "Proposed Move") :
                                    this.state.current_move_category)}
                        </div>

                        <div className={"contributor" +
                            ((this.state.current_move_category === "new") ? " hide" : "")}>

                            <span>Contributor:</span> <Player user={this.state.contributor_id} />
                        </div>
                            <div>Moves made:</div>
                            <div className="moves-made">
                            {this.state.current_move_category !== "new" ?
                            <Link to={'/joseki/' + this.state.current_node_id}>{this.state.move_string}</Link> :
                            <span>{this.state.move_string}</span>}
                            </div>
                    </div>
                </div>
            </div>
        );
    }

    renderModeControl = () => (
        <div className="mode-control">
            <button className={"btn s primary " + (this.state.mode === PageMode.Explore ? "selected" : "")} onClick={this.setExploreMode}>
                {_("Explore")}
            </button>
            <button className={"btn s primary " + (this.state.mode === PageMode.Play ? "selected" : "")} onClick={this.setPlayMode}>
                {_("Play")}
            </button>
            <button className={"btn s primary " + (this.state.mode === PageMode.Edit ? "selected" : "")} onClick={this.setEditMode}>
                {this.state.current_move_category === "new" && this.state.mode === PageMode.Explore ? _("Save") : _("Edit")}
            </button>
        </div>
    )

    renderModeMainPane = () => {
        if (this.state.mode === PageMode.Explore ||
            (this.state.mode === PageMode.Edit && this.state.move_string === "" )// you can't edit the empty board
        ) {
            return (
                <ExplorePane
                    description={this.state.position_description}
                    position_type={this.state.current_move_category}
                    comment_count={this.state.current_comment_count}
                    position_id={this.state.current_node_id}
                    joseki_source={this.state.joseki_source}
                />
            );
        }
        else if (this.state.mode === PageMode.Edit) {
            return (
                <EditPane
                    category={this.state.current_move_category}
                    description={this.state.position_description}
                    joseki_source_id={this.state.joseki_source ? this.state.joseki_source.id : 0}
                    contributor={this.state.contributor_id}
                    save_new_info={this.saveNewPositionInfo}
                />
            );
        }
        else {
            return (
                <PlayPane
                    move_type_sequence={this.state.move_type_sequence}
                />
            );
        }
    }

    saveNewPositionInfo = (move_type, description, joseki_source_id) => {
        if (this.state.current_move_category !== "new") {
            // they must have pressed save on a current position.

            fetch(position_url(this.state.current_node_id), {
                method: 'put',
                mode: 'cors',
                headers: godojo_headers,
                body: JSON.stringify({ description: description, category: move_type.toUpperCase(), joseki_source_id: joseki_source_id })
            }).then(res => res.json())
                .then(body => {
                    console.log("Server response to sequence PUT:", body);
                    this.processNewJosekiPosition(body);
                    this.setExploreMode();
                });
        }
        else {
            // Here the person has added one or more moves then clicked "save"
            // First we save the new position(s)
            fetch(server_url + "positions/", {
                method: 'post',
                mode: 'cors',
                headers: godojo_headers,
                body: JSON.stringify({ sequence: this.state.move_string, category: move_type , joseki_source_id: joseki_source_id})
            }).then(res => res.json())
                .then(body => {
                    console.log("Server response to sequence POST:", body);
                    this.processNewJosekiPosition(body);

                    // Now we can save the description on the final new position, if they supplied one
                    if (description !== "") {
                        fetch(position_url(this.state.current_node_id), {
                            method: 'put',
                            mode: 'cors',
                            headers: godojo_headers,
                            body: JSON.stringify({ description: description, category: "" })
                        }).then(res => res.json())
                            .then(body => {
                                console.log("Server response to description PUT:", body);
                                this.processNewJosekiPosition(body);
                                this.setExploreMode();
                            });
                    }
                });
        }
    }
}

// We should display entertaining gamey encouragement for playing Josekies correctly here...
interface PlayProps {
    move_type_sequence: string[];
}

class PlayPane extends React.Component<PlayProps, any> {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render = () => {
        return (
            <div className="play-dashboard">
                {this.props.move_type_sequence.length === 0 &&
                <div> Your move...</div>}
                {this.props.move_type_sequence.map( (move_type, id) => (<div key={id}>{move_type}
                </div>))}
            </div>
        );
    }
}


// This pane enables the user to edit the description and category of the current position
// It doesn't care what node we are on.  If the description or category of the node changes due to a click,
// this component just updates what it is showing so they can edit it

interface EditProps {
    description: string;
    category: string;
    joseki_source_id: number;
    contributor: number;
    save_new_info: (move_type, description, joseki_source) => void;
}

class EditPane extends React.Component<EditProps, any> {
    selections: any = null;

    constructor(props) {
        super(props);

        // Get the list of joseki sources
        fetch(joseki_sources_url, {
            mode: 'cors',
            headers: godojo_headers
        }).then(res => res.json())
            .then(body => {
                console.log("Server response to josekisources GET:", body);
                this.setState({joseki_source_list: [{id: 0, description: "(unknown)"}, ...body.sources]});
            });

        this.state = {
            move_type: this.props.category === "new" ? Object.keys(MoveCategory)[0] : this.props.category,
            new_description: this.props.description,
            prop_category: this.props.category,
            prop_description: this.props.description,
            joseki_source_list: [],
            joseki_source: this.props.joseki_source_id
        };
    }

    static getDerivedStateFromProps = (nextProps, prevState) => {
        console.log("gdsfp: ", nextProps, prevState);
        // Detect description/category changes (resulting from clicking on the board), so we can update
        if (nextProps.description !== prevState.prop_description ||
            nextProps.category !== prevState.prop_category) {
            return {
                move_type: nextProps.category === "new" ? Object.keys(MoveCategory)[0] : nextProps.category,
                new_description: nextProps.description,
                prop_category: nextProps.category,
                prop_description: nextProps.description
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

    handleEditInput = (e) => {
        this.setState({ new_description: e.target.value });
    }

    saveNewInfo = (e) => {
        this.props.save_new_info(this.state.move_type, this.state.new_description, this.state.joseki_source);
    }

    promptForJosekiSource = (e) => {
        openModal(<JosekiSourceModal add_joseki_source={this.addJosekiSource} fastDismiss />);
    }

    addJosekiSource = (description, url) => {
        console.log("CONTRIBUTOR", this.props.contributor);
        fetch(server_url + "josekisources/", {
            method: 'post',
            mode: 'cors',
            headers: godojo_headers,
            body: JSON.stringify({ source: {description: description, url: url, contributor: this.props.contributor}})
        }).then(res => res.json())
            .then(body => {
                console.log("Server response to joseki POST:", body);
                const new_source = {id: body.source.id, description: body.source.description};
                console.log(new_source);
                this.setState({
                    joseki_source_list: [new_source, ...this.state.joseki_source_list],
                    joseki_source: new_source.id
                });
            });
    }

    render = () => {
        console.log("rendering with ", this.state.move_type, this.state.new_description);

        // create the set of select option elements from the valid MoveCategory items, with the current one at the top
        let selections = Object.keys(MoveCategory).map((selection, i) => (
            <option key={i} value={MoveCategory[selection]}>{_(MoveCategory[selection])}</option>
        ));

        if (this.state.move_type !== "new") {
            selections.unshift(<option key={-1} value={MoveCategory[this.state.move_type]}>{_(MoveCategory[this.state.move_type])}</option>);
        }

        let sources = this.state.joseki_source_list.map((selection, i) => (
            <option key={i} value={selection["id"]}>{_(selection["description"])}</option>
        ));

        return (
            <div className="edit-container">
                <div className="move-type-selection">
                    <span>{_("This sequence is: ")}</span>
                    <select value={this.state.move_type} onChange={this.onTypeChange}>
                        {selections}
                    </select>
                </div>
                <div className="joseki-source-edit">
                    <div>Source:</div>
                    <div className="joseki-source-edit-controls">
                        <select value={this.state.joseki_source} onChange={this.onSourceChange}>
                            {sources}
                        </select>
                        <i className="fa fa-plus-circle" onClick={this.promptForJosekiSource}/>
                    </div>
                </div>
                <div className="description-edit">

                    <div className="edit-label">Position description:</div>
                    <textarea onChange={this.handleEditInput} value={this.state.new_description} />
                    <div className="position-edit-button">
                        <button className="btn xs primary" onClick={this.saveNewInfo}>
                            {_("Save")}
                        </button>
                    </div>
                    <div className="edit-label">Preview:</div>


                    {/* The actual description always rendered here */}
                    <ReactMarkdown source={this.state.new_description} />

                    {/* Here is the edit box for the markdown source of the description */}
                    {this.state.new_description.length === 0 ?
                        <div className="edit-label">(position description)</div> : ""
                    }
                </div>
            </div>
        );
    }
}

// This pane responds to changes in position ID by showing the new node information
interface ExploreProps {
    position_id: string;
    description: string;
    position_type: string;
    comment_count: number;
    joseki_source: {url: string, description: string};
}

class ExplorePane extends React.Component<ExploreProps, any> {

    constructor(props) {
        super(props);

        this.state = {
            extra_info_selected: "none",
            current_position: "",
            commentary: [],
            audit_log: [],
            next_comment: ""
        };
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
    }

    showComments = () => {
        // TBD don't re-fetch if we already have them for this node
        const comments_url = server_url + "commentary?id=" + this.props.position_id;
        console.log("Fetching comments ", comments_url);
        console.log(godojo_headers);
        fetch(comments_url, {
            mode: 'cors',
            headers: godojo_headers
        })
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            console.log("Server response:", body);
            this.extractCommentary(body.commentary);
        });
        this.setState({ extra_info_selected: "comments" });
    }

    extractCommentary = (commentary_dto) => {
        let commentary = commentary_dto.map((comment) => (
            {
                user_id: comment.userId,
                date: new Date(comment.date),
                comment: comment.comment
            }
        ));
        this.setState({ commentary: commentary });
    }

    hideComments = () => {
        this.setState({ extra_info_selected: "none" });
    }

    showAuditLog = () => {
        const audits_url = server_url + "audits?id=" + this.props.position_id;
        console.log("Fetching audit logs ", audits_url);
        fetch(audits_url, {
            mode: 'cors',
            headers: godojo_headers
        })
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            console.log("Server response: ", body);
            this.extractAuditLog(body.audits);
        });
        this.setState({ extra_info_selected: "audit-log" });
    }

    extractAuditLog = (audit_log_dto) => {
        // the format is basically what we need.  Just capture it!
        this.setState({ audit_log: audit_log_dto});
    }

    hideAudit = () => {
        this.setState({ extra_info_selected: "none" });
    }

    onCommentChange = (e) => {
        // If they hit enter, we intercept and save.  Otherwise just let them keep typing characters, up to the max length
        if (/\r|\n/.exec(e.target.value)) {
            const comment_url = server_url + "comment?id=" + this.props.position_id;
            fetch(comment_url, {
                method: 'post',
                mode: 'cors',
                headers: godojo_headers,
                body: this.state.next_comment
            }).then(res => res.json())
                .then(body => {
                    console.log("Server response to sequence POST:", body);
                    this.extractCommentary(body.commentary);
                });
            this.setState({ next_comment: "" });
        }
        else if (e.target.value.length < 100) {
            this.setState({ next_comment: e.target.value });
        }
    }

    render = () => {
        return (
            <div className="position-details">
                <div className="description-column">
                    {this.props.position_type !== "new" ?
                        <React.Fragment>
                            <div className="position-description">
                                <ReactMarkdown source={this.props.description} />
                            </div>
                            {this.props.joseki_source !== null && this.props.joseki_source.url.length > 0 &&
                            <div className="position-joseki-source">
                                <span>Source:</span><a href={this.props.joseki_source.url}>{this.props.joseki_source.description}</a>
                            </div>}
                            {this.props.joseki_source !== null && this.props.joseki_source.url.length === 0 &&
                            <div className="position-joseki-source">
                                <span>Source:</span><span>{this.props.joseki_source.description}</span>
                            </div>}
                        </React.Fragment>
                    : ""}
                </div>
                <div className={"extra-info-column" + (this.state.extra_info_selected !== "none" ? " open" : "")}>
                    {this.state.extra_info_selected === "none" && this.props.position_type !== "new" &&
                        <React.Fragment>
                            {(this.props.comment_count !== 0 ?
                                <i className="fa fa-comments-o fa-lg" onClick={this.showComments} /> :
                                <i className="fa fa-comment-o fa-lg" onClick={this.showComments} />)}

                            <i className="fa fa-history" onClick={this.showAuditLog}></i>
                        </React.Fragment>
                    }

                    {this.state.extra_info_selected === "comments" &&
                        <React.Fragment>
                            <div className="discussion-container">
                                <div className="discussion-header">
                                    <div>Discussion:</div>
                                    <i className="fa fa-caret-right" onClick={this.hideComments} />
                                </div>
                                <div className="discussion-lines">
                                    {this.state.commentary.map((comment, idx) =>
                                        <div className="comment" key={idx}>
                                            <div className="comment-header">
                                                <Player user={comment.user_id}></Player>
                                                <div className="comment-date">{comment.date.toDateString()}</div>
                                            </div>
                                            <div className="comment-text">{comment.comment}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <textarea className="comment-input" rows={1} value={this.state.next_comment} onChange={this.onCommentChange} />
                        </React.Fragment>
                    }

                    {this.state.extra_info_selected === "audit-log" &&
                        <React.Fragment>
                            <div className="audit-container">
                                <div className="audit-header">
                                        <div>Audit Log:</div>
                                        <i className="fa fa-caret-right" onClick={this.hideAudit} />
                                </div>
                                <div className="audit-entries">
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
                            </div>
                        </React.Fragment>
                    }
                </div>
            </div>
        );
    }
}

