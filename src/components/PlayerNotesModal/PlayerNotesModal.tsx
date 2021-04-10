/*
 * Copyright (C) 2012-2021  Online-Go.com
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
import {_} from 'translate';
import {Modal, openModal} from "Modal";
import { get, set } from "remote_storage";
declare let swal;

interface Events {
}

interface PlayerNotesModalProperties {
    playerId: number;
}

export class PlayerNotesModal extends Modal<Events, PlayerNotesModalProperties, any> {

    playerNotes = {};

    constructor(props) {
        super(props);
        this.state = {
            notes: undefined
        };
    }

    componentDidMount = () => {
        super.componentDidMount(); /* this.close() doesn't work if you don't do this */
        get("player-notes")
        .then(
            (player_notes) => {
                this.playerNotes = player_notes || {};
                if (player_notes && player_notes[this.props.playerId]) {
                    this.setState({ notes: player_notes[this.props.playerId]});
                }
            },
            (err) => {
                console.log("Player notes fetch error: ", err);
            }
        );
    }

    updateNotes = (ev) => {
        this.setState({notes: ev.target.value});
    }

    saveNotes = () => {
        this.playerNotes[this.props.playerId] = this.state.notes;
        set("player-notes", this.playerNotes)
        .then(
            () => {console.log("Saved player notes..."); },
            (err) => {console.log("Whoa, error writing player notes!", err); });
        this.close();
    }

    render() {
        return (
          <div className="Modal PlayerNotesModal" ref="modal">
              <div className="body">
                <textarea placeholder={_("(no notes yet)")} value={this.state.notes} onChange={this.updateNotes} />
              </div>
              <div className="buttons">
                <button onClick={this.close}>{_("Cancel")}</button>
                <button className="primary bold" onClick={this.saveNotes}>{_("Save")}</button>
              </div>
          </div>
        );
    }
}


export function openPlayerNotesModal(player_id: number) {
    return openModal(<PlayerNotesModal playerId={player_id} />);  // Don't fast dismiss this, because they could well be mouse-dragging in this window
}
