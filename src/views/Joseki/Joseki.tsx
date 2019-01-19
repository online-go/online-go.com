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

import {_, pgettext, interpolate} from "translate";
import {KBShortcut} from "KBShortcut";
import {PersistentElement} from "PersistentElement";
import {errorAlerter, dup, ignore} from "misc";
import {Goban, GoMath} from "goban";
import {Resizable} from "Resizable";
import { getSectionPageCompleted } from "../LearningHub/util";


enum MoveCategory {
    // needs to match Move.java
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

enum EditState {
    UpdatePosition, FinalizeMove, PositionSaved
}

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

    constructor(props) {
        super(props);

        this.state = {
            move_string: "",  // This is used for making sure we know what the current move is.
            position_title: "",
            position_description: "",
            current_move_category: "",
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

        this.resetJosekiSequence(); // initialise joseki playing sequence with server
    }

    resetJosekiSequence = () => {
        /* Initiate joseki playing sequence with the root from the server */
        const serverRootPosition = "http://localhost:8081/position/?id=root";
        this.fetchNextMovesFor(serverRootPosition);
    }

    onResize = () => {
        this.goban.setSquareSizeBasedOnDisplayWidth(
            Math.min(this.refs.goban_container.offsetWidth, this.refs.goban_container.offsetHeight)
        );
    }

    fetchNextMovesFor = (placementUrl) => {
        /* TBD: error handling, cancel on new route */
        fetch(placementUrl, {mode: 'cors'})
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            console.log("Server response:", body);
            this.processNewJosekiPosition(body);
        } );
    }

    processNewJosekiPosition = (position) => {
        this.setState({
            position_title: position.title,
            position_description: position.description
        });
        this.current_position_url = position._links.self.href;
        this.next_moves = position._embedded.moves;
        this.renderJosekiPosition(this.next_moves);
    }

    // Draw all the positions that are joseki moves that we know about from the server (array of moves from the server)
    renderJosekiPosition = (next_moves:  Array<any>) => {
        this.goban.engine.cur_move.clearMarks();  // these usually get removed when the person clicks ... but just in case.
        next_moves.forEach((option, index) => {
            const id = GoMath.num2char(index).toUpperCase();
            let mark = {};
            mark[id] = GoMath.encodePrettyCoord(option["placement"], this.goban.height);
            this.goban.setMarks(mark);
        });
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
            this.setState({current_move_category: chosen_move.category});
        } else {
            /* This isn't in the database */
            if (this.state.mode === PageMode.Edit) {
                this.setState({
                    position_title: "tbd",
                    position_description: "tbd",
                    current_move_category : "Proposed Position"
                });
                this.finalizeNewMove();
            } else {
                this.setState({
                    position_title: "",
                    position_description: "",
                    current_move_category : "Experiment"
                });
            }
        }
    }

    finalizeNewMove = () => {
        /* They plonked a stone on the board that might be a new move proposal.  Find out, and save it if so... */
        this.setState({edit_state: EditState.FinalizeMove});
    }

    setExploreMode = () => {
        if (this.state.mode !== PageMode.Edit) { // If they were editing, they want to continue from the same place
            this.resetBoard();
            this.resetJosekiSequence();  // This triggers the joseki display machinery
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
        // If they clicked in new moves before going into edit mode, let them add them now
        const new_edit_state: EditState = (this.state.current_move_category === "Experiment") ?
            EditState.FinalizeMove : EditState.UpdatePosition;

        this.setState({
            mode: PageMode.Edit,
            edit_state: new_edit_state
        });
       /* (We don't reset the board here, they want to edit from this position!) */
    }

    resetBoard = () => {
        console.log("Resetting board...");
        this.next_moves = [];
        this.setState({move_string: ""});
        this.initializeGoban();
        this.onResize();
    }

    render() {
        return (
            <div className={"Joseki"}>
                <div className={"left-col"}>
                    <div ref="goban_container" className="goban-container">
                        <PersistentElement className="Goban" elt={this.goban_div}/>
                    </div>
                </div>
                <div className="right-col">
                    <div className = "top-stuff">
                        {this.renderModeControl()}
                        {this.renderModePane()}
                    </div>
                    <div className="status-info">
                        <div className="move-category">
                            {this.state.current_move_category === "" ? "" :
                            "Last move: " + this.state.current_move_category}
                        </div>
                        {"Moves made: " + (this.state.move_string !== "" ? this.state.move_string : "(none)")}
                    </div>
                </div>
            </div>
        );
    }

    renderModeControl = () => (
        <div className="mode-control">
            <button className="btn s primary" onClick={this.setExploreMode}>
                 {_("Explore")}
            </button>
            <button className="btn s primary" onClick={this.setPlayMode}>
                {_("Play")}
            </button>
            <button className="btn s primary" onClick={this.setEditMode}>
                {_("Edit")}
            </button>
        </div>
    )

    renderModePane = () => {
        switch (this.state.mode) {
            case (PageMode.Explore) :
                return (
                    <ExplorePane
                        title={this.state.position_title}
                        description={this.state.position_description}/>
                );
            case (PageMode.Edit) :
                return (
                    <EditPane
                        title={this.state.position_title}
                        description={this.state.position_description}
                        edit_state={this.state.edit_state}
                        save_new_move={this.saveNewMove}
                        update_description={this.updateDescription}/>
                );
            default :
                return (
                    <div> (not implemented yet!)</div>
                );
        }
    }

    updateDescription = (new_description) => {
        // send the new description to the sever.
        /// when that is done:
        this.setState({edit_state: EditState.PositionSaved});
    }

    saveNewMove = (move_type) => {
        // Here the person has confirmed that the move sequence on the board is of "move_type" and should be saved to the server
        // Ultimately this could be a series of moves from the last known board position.
        // Assuming it is just one move for now.

        fetch(this.current_position_url, {
            method: 'post',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({placement: this.current_placement, category: move_type})
          }).then(res => res.json())
            .then(body => {
                console.log("Server response to POST:", body);
                this.processNewJosekiPosition(body);
                this.setState({edit_state: EditState.UpdatePosition});
            });
    }
}

interface EditProps {
    title: string;
    description: string;
    edit_state: EditState;
    save_new_move: (move_type) => void;
    update_description: (description) => void;
}

class EditPane extends React.Component<EditProps, any> {
    selections: any = null;

    constructor(props) {
        super(props);

        this.state = {
            move_type: MoveCategory[Object.keys(MoveCategory)[0]],  // the first in the list
            description: this.props.description,
            editing_position: true
        };

        // create the set of select option elements from the valid MoveCategory items
        this.selections = Object.keys(MoveCategory).map((selection, i) => (
            <option key={i} value={MoveCategory[selection]}>{_(MoveCategory[selection])}</option>
        ));
    }

    componentWillReceiveProps = (new_props) => {
        // the description of the current position gets updated as the parent fetches the new moves
        this.setState({description: new_props.description});
    }

    onTypeChange = (e) => {
        this.setState({move_type: e.target.value});
    }

    saveNewMove = (e) => {
        this.props.save_new_move(this.state.move_type);
        this.setState({editing_position: true});
    }

    handleEditInput = (e) => {
        this.setState({description: e.target.value});
    }

    saveDescription = (e) => {
        this.props.update_description(this.state.description);
        this.setState({editing_position: false});
    }

    editDescription = () => {
        this.setState({editing_position: true});
    }

    render = () => {
        if (this.props.edit_state === EditState.FinalizeMove) {
            return (
                <div className="move-type-selection">
                    <span>{_("This sequence is: ")}</span>
                    <select value={this.state.move_type} onChange={this.onTypeChange}>
                        {this.selections}
                    </select>
                    <button className="btn xs primary" onClick={this.saveNewMove}>
                        {_("Save")}
                    </button>
                </div>
            );
        } else {
            return (
                <React.Fragment>
                    <div className="position-header">
                        <h2>{this.props.title}</h2>
                    </div>

                    <div className="description-edit">
                        {this.state.editing_position ?
                            /* Entry form for the new description */
                            <React.Fragment>
                                <div className="edit-label">Position description:</div>
                                <textarea onChange={this.handleEditInput} value={this.state.description}/>
                                <div className="position-edit-button">
                                    <button className="btn xs primary" onClick={this.saveDescription}>
                                        {_("Save")}
                                    </button>
                                </div>
                                <div className="edit-label">Preview:</div>
                            </React.Fragment> : ""
                        }

                        {/* The actual description always rendered here */}
                        <ReactMarkdown source={this.state.description}/>

                        { ! this.state.editing_position ?
                            <React.Fragment>
                            { this.state.description.length === 0 ?
                                <div className="edit-label">(position description)</div> : ""
                            }
                            <div className="position-edit-button">
                                <button className="btn xs primary" onClick={this.editDescription}>
                                    {_("Edit")}
                                </button>
                            </div>
                            </React.Fragment> : "" }
                    </div>
                </React.Fragment>
            );
        }
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
                <ReactMarkdown source={this.props.description}/>
            </div>
        </React.Fragment>
    )
}


