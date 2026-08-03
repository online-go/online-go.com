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
import { put } from "@/lib/requests";
import { _ } from "@/lib/translate";
import { errorAlerter } from "@/lib/misc";
import { Modal } from "@/components/Modal";
import * as player_cache from "@/lib/player_cache";
import { BanDetails } from "./BanDetails";
import "./BanModal.css";

interface Events {}

interface BanModalProperties {
    player_id: number;
}

export class BanModal extends Modal<Events, BanModalProperties, any> {
    constructor(props: BanModalProperties) {
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
        const player = player_cache.lookup(this.props.player_id);

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
            <div className="Modal BanModal">
                <div className="Modal-content">
                    <span className="player-name">
                        {player ? player.username : `Player ${this.props.player_id}`}
                    </span>
                    <BanDetails onChange={(details) => this.setState({ details: details })} />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                    <button
                        className="reject"
                        onClick={ban}
                        disabled={this.state.details.public_reason.length < 3}
                    >
                        {_("Suspend")}
                    </button>
                </div>
            </div>
        );
    }
}
