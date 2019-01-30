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
import * as jwt from "jsonwebtoken";

import * as data from "data";
import { _, pgettext, interpolate } from "translate";
import { KBShortcut } from "KBShortcut";
import { PersistentElement } from "PersistentElement";
import { errorAlerter, dup, ignore } from "misc";
import { Goban, GoMath } from "goban";
import { Resizable } from "Resizable";
import { getSectionPageCompleted } from "../LearningHub/util";

//const server_url = "http://ec2-54-175-51-176.compute-1.amazonaws.com:80/";
const server_url = "http://localhost:8081/";

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

export class Joseki extends React.Component<{}, any> {
    refs: {
        goban_container;
    };

    goban: Goban;
    goban_div: any;
    goban_opts: any = {};

    current_placement = "";  // the coordinates of the most recently placed stone
    current_position_url = ""; // the self url for the position that the server returned for the current placement
    next_moves: Array<any> = []; // these are the moves that the server has told us are available as joseki moves from the current board position

    new_description_pending = ""; // A description they've entered that we haven't sent to the server yet

    constructor(props) {
        super(props);

        this.state = {
            move_string: "",  // This is used for making sure we know what the current move is.
            position_description: "",
            current_move_category: "",
            new_description: "",
            mode: PageMode.Explore,
        };

        this.goban_div = $("<div className='Goban'>");

        this.initializeGoban();
    }

    initializeGoban = () => {
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
            "square_size": 20
        };

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

        this.resetJosekiSequence(); // initialise joseki playing sequence with server
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

        const payload = {
            username: user_info.username
        };

        const i = 'OGS';          // Issuer
        const s = 'Josekis';        // Subject
        const a = 'godojo'; // Audience

        const signOptions = {
            issuer: i,
            subject: s,
            audience: a,
            expiresIn: "12h",
            algorithm: "RS256" as any
        };

        const user_jwt = jwt.sign(payload, supposedly_private_key, signOptions);

        const verifyOptions = signOptions;
        verifyOptions.algorithm = ["RS256"];
        let legit = jwt.verify(user_jwt, totally_public_key, verifyOptions);
        console.log(legit);
        return user_jwt;
    }

    resetJosekiSequence = () => {
        /* Initiate joseki playing sequence with the root from the server */
        const serverRootPosition = server_url + "position?id=root";
        this.fetchNextMovesFor(serverRootPosition);
    }

    onResize = () => {
        this.goban.setSquareSizeBasedOnDisplayWidth(
            Math.min(this.refs.goban_container.offsetWidth, this.refs.goban_container.offsetHeight)
        );
    }

    fetchNextMovesFor = (placementUrl) => {
        /* TBD: error handling, cancel on new route */
        console.log("fetch headers:", godojo_headers);
        fetch(placementUrl, {
            mode: 'cors',
            headers: godojo_headers
        })
            .then(response => response.json()) // wait for the body of the response
            .then(body => {
                console.log("Server response:", body);
                this.processNewJosekiPosition(body);
            });
    }

    // Decode a response from the server into state we need, and display accordingly
    processNewJosekiPosition = (position) => {
        this.setState({
            position_description: position.description
        });
        this.current_position_url = position._links.self.href;
        this.next_moves = position._embedded.moves;
        this.renderJosekiPosition(this.next_moves);
    }

    // Draw all the positions that are joseki moves that we know about from the server (array of moves from the server)
    renderJosekiPosition = (next_moves: Array<any>) => {
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

    /* This is called every time a move is played on the Goban or anything else changes about the state of the board */
    onBoardUpdate = () => {
        let mvs = GoMath.decodeMoves(
            this.goban.engine.cur_move.getMoveStringToThisPoint(),
            this.goban.width,
            this.goban.height);
        let move_string = mvs.map((p) => GoMath.prettyCoords(p.x, p.y, this.goban.height)).join(",");
        if (move_string !== this.state.move_string) {
            console.log("Move placed: ", mvs[mvs.length - 1]);
            this.setState({ move_string });
            this.processPlacement(mvs[mvs.length - 1]);
        }
    }

    processPlacement(move: any) {
        /* They've clicked a stone onto the board in a new position */
        const placement = GoMath.prettyCoords(move.x, move.y, this.goban.height);
        console.log("Processing placement at:", placement);

        this.current_placement = placement;

        const chosen_move = this.next_moves.find(move => move.placement === placement);

        if (chosen_move !== undefined) {
            /* The database already knows about this move, so we just get and display the new position information */
            this.fetchNextMovesFor(chosen_move._links.self.href);
            this.setState({ current_move_category: chosen_move.category });
        } else {
            /* This isn't in the database */
            this.setState({
                position_description: "tbd",
                current_move_category: "new"
            });
        }
    }

    setExploreMode = () => {
        if (this.state.mode !== PageMode.Edit) { // If they were editing, they want to continue from the same place
            this.resetBoard();
            this.resetJosekiSequence();  // This re-triggers the joseki display machinery from the root position
        }
        this.setState({
            mode: PageMode.Explore,
        });
    }

    setPlayMode = () => {
        this.setState({
            mode: PageMode.Play,
        });
        this.resetBoard();
        // ... tbd - do playing with joseki :)
    }

    setEditMode = () => {
        this.setState({
            mode: PageMode.Edit,
        });
        /* (We don't reset the board here, they want to edit from this position!) */
    }

    resetBoard = () => {
        console.log("Resetting board...");
        this.next_moves = [];
        this.setState({
            move_string: "",
            current_move_category: ""
        });
        this.initializeGoban();
        this.onResize();
    }

    render() {
        return (
            <div className={"Joseki"}>
                <div className={"left-col"}>
                    <div ref="goban_container" className="goban-container">
                        <PersistentElement className="Goban" elt={this.goban_div} />
                    </div>
                </div>
                <div className="right-col">
                    <div className="top-stuff">
                        {this.renderModeControl()}
                        {this.renderModeMainPane()}
                    </div>
                    <div className="status-info">
                        <div className="move-category">
                            {this.state.current_move_category === "" ? "" :
                                "Last move: " +
                                (this.state.current_move_category === "new" ? (
                                    this.state.mode === PageMode.Explore ? "Experiment" : "Proposed Move") :
                                    this.state.current_move_category)}
                        </div>
                        {"Moves made: " + (this.state.move_string !== "" ? this.state.move_string : "(none)")}
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
            this.state.move_string === "" // you can't edit the empty board
        ) {
            return (
                <ExplorePane
                    title={this.state.position_title}
                    description={this.state.position_description} />
            );
        }
        else if (this.state.mode === PageMode.Edit) {
            return (
                <EditPane
                    title={this.state.position_title}
                    description={this.state.position_description}
                    save_new_sequence={this.saveNewSequence}
                    update_description={this.updateDescription} />
            );
        }
        else {
            return (
                <div> (not implemented yet!)</div>
            );
        }
    }

    updateDescription = (new_description, move_type) => {
        // Send the new description to the sever.
        // We can only do that if the move itself has already been saved
        // ... in which case, we save it now, with the current move_type.
        // move_type is only used if the move itself has _not_ been saved.
        // This method is not for editing an existing move_type.
        if (this.state.current_move_category === "new") {
            this.saveNewSequence(move_type);
            this.new_description_pending = new_description;
            console.log("set pending description ", this.new_description_pending);
        }
        else {
            fetch(this.current_position_url, {
                method: 'put',
                mode: 'cors',
                headers: godojo_headers,
                body: JSON.stringify({ description: new_description, move_type: "" })
            }).then(res => res.json())
                .then(body => {
                    console.log("Server response to description PUT:", body);
                    this.processNewJosekiPosition(body);
                });
            this.new_description_pending = "";
            console.log("reset pending description");
        }
    }

    saveNewSequence = (move_type) => {
        if (this.state.current_move_category !== "new") {
            // they must have pressed save on a current position.
            fetch(this.current_position_url, {
                method: 'put',
                mode: 'cors',
                headers: godojo_headers,
                body: JSON.stringify({ description: this.state.position_description, move_type: move_type.toUpperCase() })
            }).then(res => res.json())
                .then(body => {
                    console.log("Server response to sequence PUT:", body);
                    this.processNewJosekiPosition(body);
                });
        }
        else {
            // Here the person has added a bunch of moves then clicked "save"
            fetch(server_url + "positions/", {
                method: 'post',
                mode: 'cors',
                headers: godojo_headers,
                body: JSON.stringify({ sequence: this.state.move_string, category: move_type })
            }).then(res => res.json())
                .then(body => {
                    console.log("Server response to sequence POST:", body);
                    this.processNewJosekiPosition(body);
                    this.setState({
                        current_move_category: move_type
                    });
                    // Now that we have the new position in place, it is safe to save it's description
                    if (this.new_description_pending !== "") {
                        this.updateDescription(this.new_description_pending, move_type);
                    }
                });
        }
    }
}

interface EditProps {
    title: string;
    description: string;
    save_new_sequence: (move_type) => void;
    update_description: (description, move_type) => void;
}

class EditPane extends React.Component<EditProps, any> {
    selections: any = null;

    constructor(props) {
        super(props);

        this.state = {
            move_type: MoveCategory[Object.keys(MoveCategory)[0]],  // initialize with the first in the list
            new_description: this.props.description,  // the description with edit-updates
        };

        // create the set of select option elements from the valid MoveCategory items
        this.selections = Object.keys(MoveCategory).map((selection, i) => (
            <option key={i} value={MoveCategory[selection]}>{_(MoveCategory[selection])}</option>
        ));
    }

    componentDidUpdate = (prevProps, prevState) => {
        /* The parent updates the description when the user clicks on existing positions in Edit mode */
        if (prevProps.description !== this.props.description) {
            this.setState({ new_description: this.props.description });
        }
    }

    onTypeChange = (e) => {
        this.setState({ move_type: e.target.value });
    }

    saveNewSequence = (e) => {
        this.props.save_new_sequence(this.state.move_type);
    }

    handleEditInput = (e) => {
        this.setState({ new_description: e.target.value });
    }

    saveDescription = (e) => {
        this.props.update_description(this.state.new_description, this.state.move_type);
    }

    render = () => {
        return (
            <React.Fragment>
                <div className="move-type-selection">
                    <span>{_("This sequence is: ")}</span>
                    <select value={this.state.move_type} onChange={this.onTypeChange}>
                        {this.selections}
                    </select>
                    <button className="btn xs primary" onClick={this.saveNewSequence}>
                        {_("Save")}
                    </button>
                </div>

                <div className="description-edit">

                    <div className="edit-label">Position description:</div>
                    <textarea onChange={this.handleEditInput} value={this.state.new_description} />
                    <div className="position-edit-button">
                        <button className="btn xs primary" onClick={this.saveDescription}>
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
            </React.Fragment>
        );
    }
}

interface ExploreProps {
    title: string;
    description: string;
}

class ExplorePane extends React.Component<ExploreProps> {
    render = () => (
        <React.Fragment>
            <div className="position-header">
                <h2>{this.props.title}</h2>
            </div>
            <div className="position-description">
                <ReactMarkdown source={this.props.description} />
            </div>
        </React.Fragment>
    )
}


