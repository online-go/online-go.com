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

import * as React from "react";
import Datetime from "react-datetime";
import { put } from "requests";
import { _ } from "translate";
import { errorAlerter } from "misc";
import { Modal } from "Modal";
import { Player } from "Player";

interface Events {}

interface BanModalProperties {
    player_id: string | number;
}

export class BanModal extends Modal<Events, BanModalProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            details: {
                public_reason: "",
                moderator_notes: "",
                ban_expiration: null,
            },
        };
    }

    render() {
        const ban = () => {
            const player_id = this.props.player_id;
            console.log("Banning player", this.props.player_id);
            console.log(this.state.details);

            const obj = {
                moderation_note: this.state.details.moderator_notes,
                is_banned: true,
                ban_reason: this.state.details.public_reason,
                ban_expiration: this.state.details.ban_expiration?.toISOString(),
            };

            console.log("Banning player", player_id, obj);

            put("players/" + player_id + "/moderate", obj)
                .then(() => console.log("Player banned"))
                .catch(errorAlerter);
            this.close();
        };

        return (
            <div className="Modal BanModal" ref="modal">
                <div className="Modal-content">
                    <Player user={this.props.player_id} />
                    <BanDetails onChange={(details) => this.setState({ details: details })} />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                    <button
                        className="reject"
                        onClick={ban}
                        disabled={this.state.details.public_reason.length < 3}
                    >
                        {_("Ban")}
                    </button>
                </div>
            </div>
        );
    }
}

function BanDetails({ onChange }: { onChange: (d: any) => void }): JSX.Element {
    const [public_reason, set_public_reason] = React.useState("");
    const [moderator_notes, set_moderator_notes] = React.useState("");
    const [expiration, set_expiration] = React.useState(null);

    React.useEffect(() => {
        onChange({
            public_reason: public_reason,
            moderator_notes: moderator_notes,
            ban_expiration: expiration,
        });
    }, [public_reason, moderator_notes, expiration]);

    return (
        <div>
            <h3>Public reason (displayed to user)</h3>
            <textarea onChange={(e) => set_public_reason(e.target.value)} value={public_reason} />

            <h3>Moderator only notes (optional)</h3>
            <textarea
                onChange={(e) => set_moderator_notes(e.target.value)}
                value={moderator_notes}
            />

            <h3>Ban expiration</h3>
            <Datetime value={expiration} onChange={(d: any) => set_expiration(d._d)} />
        </div>
    );
}
