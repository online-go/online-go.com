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
import { _ } from "translate";
import { Modal, openModal } from "Modal";
import * as data from "data";

interface Events {}

interface PlayerNotesModalProperties {
    playerId: number;
}

export class PlayerNotesModal extends Modal<Events, PlayerNotesModalProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            notes: undefined,
        };
    }

    componentDidMount = () => {
        super.componentDidMount(); /* this.close() doesn't work if you don't do this */
        const user = data.get("config.user");
        this.setState({ notes: data.get(`player-notes.${user.id}.${this.props.playerId}`) });
    };

    updateNotes = (ev) => {
        const new_notes = ev.target.value;
        if (new_notes.length < 5000) {
            this.setState({ notes: ev.target.value });
        }
    };

    saveNotes = () => {
        const user = data.get("config.user");
        const notes = this.state.notes.trim();
        if (notes) {
            data.set(
                `player-notes.${user.id}.${this.props.playerId}`,
                notes,
                data.Replication.REMOTE_OVERWRITES_LOCAL,
            );
        } else {
            data.remove(
                `player-notes.${user.id}.${this.props.playerId}`,
                data.Replication.REMOTE_OVERWRITES_LOCAL,
            );
        }
        this.close();
    };

    render() {
        return (
            <div className="Modal PlayerNotesModal">
                <div className="body">
                    <textarea
                        placeholder={_("(no notes yet)")}
                        value={this.state.notes}
                        onChange={this.updateNotes}
                    />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                    <button className="primary bold" onClick={this.saveNotes}>
                        {_("Save")}
                    </button>
                </div>
            </div>
        );
    }
}

export function openPlayerNotesModal(player_id: number) {
    // Note: this modal is deliberately not fastDismiss, because we don't want to accidentally dismiss while drag-selecting a large area of text.
    return openModal(<PlayerNotesModal playerId={player_id} />);
}
