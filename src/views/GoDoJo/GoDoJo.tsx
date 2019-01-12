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

    /* This is called every time a move is played or anything else changes about the state of the board */
    onUpdate = () => {
        let mvs = GoMath.decodeMoves(
            this.goban.engine.cur_move.getMoveStringToThisPoint(),
            this.goban.width,
            this.goban.height);
        console.log(mvs);
        let move_string = mvs.map((p) => GoMath.prettyCoords(p.x, p.y, this.goban.height)).join(",");
        this.setState({ move_string });
    }

    componentDidMount = () => {
        /* sanity testing that we can manipulate the board
        this.goban.engine.place(0, 0);
        this.goban.setMarks({"A" : GoMath.encodeMove(1, 1)});
        this.goban.setMarks({"A" : GoMath.encodeMove(2, 2)});
        this.goban.clearMark(1, 1, "B");
        */

        /* Initiate joseki playing sequence with the root from the server */
        fetch('http://localhost:8081/position', {mode: 'cors'})
            .then(response => response.json()) // wait for the body of the response
            .then(body => {
                this.renderJosekiPosition(body);
            } );
    }

    encodeServerPlacement = (placement) => {
        // seems like this function should be part of GoMath, but I can't see how to get at the board height from in there.
        const x = placement.charAt(0).toLowerCase();
        const y = GoMath.num2char(this.goban.height - parseInt(placement.charAt(1)));
        return x + y;
    }

    renderJosekiPosition = (joseki_node) => {
        this.goban.engine.cur_move.clearMarks();
        console.log(joseki_node);
        joseki_node["_embedded"]["moves"].forEach((option, index) => {
            const id = GoMath.num2char(index).toUpperCase();
            let mark = {};
            mark[id]= this.encodeServerPlacement(option["placement"]);
            this.goban.setMarks(mark);
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
                    Moves made: {this.state.move_string}
                </div>
            </div>
        );
    }
}
