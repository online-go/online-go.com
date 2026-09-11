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
import { GobanEnginePlayerEntry } from "goban";
import { _, pgettext } from "@/lib/translate";
import { Modal, openModal } from "@/components/Modal";
import { Player } from "@/components/Player";
import * as data from "@/lib/data";
import "./RengoTeamModal.css";

interface Events {}

interface RengoTeamModalProperties {
    color: "black" | "white";
    /** Team members in turn order. The first entry is the player whose turn it is. */
    players: GobanEnginePlayerEntry[];
}

/** Lists the members of one rengo team in turn order and marks the current user. */
export class RengoTeamModal extends Modal<Events, RengoTeamModalProperties, {}> {
    render() {
        const user_id: number | undefined = data.get("user")?.id;
        const title =
            this.props.color === "black"
                ? pgettext("Rengo team list modal title", "Black team")
                : pgettext("Rengo team list modal title", "White team");

        return (
            <div className="Modal RengoTeamModal">
                <div className="header">
                    <h2>{title}</h2>
                </div>
                <div className="body">
                    {this.props.players.map((player) => (
                        <div className="rengo-team-modal-row" key={player.id}>
                            <span className="rengo-team-modal-marker">
                                {player.id === user_id && (
                                    <i
                                        className="rengo-team-modal-you fa fa-chevron-right"
                                        title={pgettext(
                                            "Marks the current user in a rengo team list",
                                            "You",
                                        )}
                                    />
                                )}
                            </span>
                            <Player user={player} icon rank />
                        </div>
                    ))}
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}

export function openRengoTeamModal(
    color: "black" | "white",
    players: GobanEnginePlayerEntry[],
): void {
    openModal(<RengoTeamModal color={color} players={players} fastDismiss />);
}
