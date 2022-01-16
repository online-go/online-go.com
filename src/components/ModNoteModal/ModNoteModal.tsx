/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import * as data from "data";
import * as player_cache from "player_cache";
import * as React from "react";
import { browserHistory } from "ogsHistory";
import { put } from "requests";
import { errorAlerter } from "misc";
import { Player } from "Player";
import { _, pgettext, interpolate } from "translate";

import { Modal, openModal } from "Modal";
import { NumberFormatValues } from "react-number-format";

interface Events {}

interface ModNoteModalProperties {
    player_id: number;
    draft: string;
}

export class ModNoteModal extends Modal<Events, ModNoteModalProperties, any> {
    constructor(props) {
        super(props);

        this.state = {
            current_draft: this.props.draft,
        };
    }

    submitNote = () => {
        put(`players/${this.props.player_id}/moderate`, {
            moderation_note: this.state.current_draft,
        })
            .then(() => {})
            .catch(errorAlerter);

        this.close();
    };

    updateDraft = (e) => {
        this.setState({
            current_draft: e.target.value,
        });
    };

    render() {
        const current_draft: [string] = this.state.current_draft
            .split("\n")
            .map((line, idx) => <div key={idx}>{line}</div>);

        return (
            <div className="Modal ModNoteModal" ref="modal">
                <div className="header">
                    <h2>
                        {_("Add moderator note for: ")} <Player user={this.props.player_id} />
                    </h2>
                </div>
                <textarea
                    id="mod-note-text"
                    placeholder={_("New moderator note...")}
                    rows={5}
                    value={this.state.current_draft}
                    onChange={this.updateDraft}
                />

                <div className="buttons">
                    <button className="primary" onClick={this.submitNote}>
                        {_("Submit")}
                    </button>
                </div>
            </div>
        );
    }
}
export function createModeratorNote(player_id: number, draft: string) {
    browserHistory.push(`/user/view/${player_id}?show_mod_log=1`);
    return openModal(<ModNoteModal player_id={player_id} draft={draft} />);
}
