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
import {KBShortcut} from "KBShortcut";
import {PersistentElement} from "PersistentElement";
import {errorAlerter, dup, ignore} from "misc";
import {Goban, GoMath} from "goban";
import {Resizable} from "Resizable";

export class GoDoJo extends React.Component<{}, any> {
    refs: {
        goban_container;
    };

    goban: Goban;
    goban_div: any;
    goban_opts: any = {};

    next_moves: Array<any> = []; // these are the moves that the server has told us are avaiable as joseki moves from the current board position

    constructor(props) {
        super(props);

        this.state = {
            move_string: "",
        };

        this.goban_div = $("<div className='Goban'>");

        let opts = {
            "board_div": this.goban_div,
            "interactive": true,
            "mode": "puzzle",
            "player_id": 0,
            "server_socket": null,
            "square_size": 30
        };

        this.goban_opts = opts;
        this.goban = new Goban(opts);
        this.goban.setMode("puzzle");
        this.goban.on("update", () => this.onUpdate());
        window["global_goban"] = this.goban;
    }

    componentDidMount = () => {
        /* Initiate joseki playing sequence with the root from the server */
        const serverRootPosition = "http://localhost:8081/position/?id=root";
        this.fetchNextMovesFor(serverRootPosition);
    }

    fetchNextMovesFor = (placementUrl) => {
        fetch(placementUrl, {mode: 'cors'})
        .then(response => response.json()) // wait for the body of the response
        .then(body => {
            console.log("Server response:", body);
            this.processNewJosekiPosition(body);
        } );
    }

    processNewJosekiPosition = (position) => {
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

    /* This is called every time a move is played or anything else changes about the state of the board */
    onUpdate = () => {
        let mvs = GoMath.decodeMoves(
            this.goban.engine.cur_move.getMoveStringToThisPoint(),
            this.goban.width,
            this.goban.height);
        console.log("Move placed: ", mvs);
        let move_string = mvs.map((p) => GoMath.prettyCoords(p.x, p.y, this.goban.height)).join(",");
        if (move_string !== this.state.move_string) {
            this.setState({ move_string });
            this.processPlacement(mvs[mvs.length - 1]);
        }
    }

    processPlacement(move: any) {
        const placement = GoMath.prettyCoords(move.x, move.y, this.goban.height);
        console.log("Processing placement at:", placement);
        this.next_moves.forEach((option) => {
            if (option.placement === placement) {
                this.fetchNextMovesFor(option._links.self.href);
            }
        });
    }

    render() {
        return (
            <div className={"GoDoJo"}>
                <div className={"center-col"}>
                    <div ref="goban_container" className="goban-container">
                        <PersistentElement className="Goban" elt={this.goban_div}/>
                    </div>
                </div>
                <div>
                    {this.state.move_string !== "" ? "Moves made: " + this.state.move_string: ""}
                </div>
            </div>
        );
    }
}
