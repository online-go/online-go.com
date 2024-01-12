/*
 * Copyright (C)  Online-Go.com
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
import { browserHistory } from "ogsHistory";
import { put } from "requests";
import { errorAlerter } from "misc";
import * as player_cache from "player_cache";
import { _ } from "translate";

import { Modal, openModal } from "Modal";

interface Events {}

interface ModNoteModalProperties {
    player_id: number;
    draft: string;
}

export class ModNoteModal extends Modal<Events, ModNoteModalProperties, any> {
    constructor(props: ModNoteModalProperties) {
        super(props);

        this.state = {
            current_draft: this.props.draft,
        };
    }

    submitNote = async () => {
        this.close();
        try {
            await put(`players/${this.props.player_id}/moderate`, {
                moderation_note: this.state.current_draft,
            });
        } catch (e) {
            // since errorAlerter doesn't access the state of ModNoteModal,
            // it's okay for this action to happen after the modal is
            // closed
            errorAlerter(e);
        }
    };

    updateDraft = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            current_draft: e.target.value,
        });
    };

    render() {
        const player = player_cache.lookup(this.props.player_id);
        return (
            <div className="Modal ModNoteModal">
                <div className="header">
                    <h2>
                        {_("Add moderator note for: ")} {player?.username}
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
