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
import { pgettext } from "translate";
import { openModal, Modal } from "Modal";
import { alert } from "swal_config";
import { patch } from "requests";

import { errorAlerter } from "misc";

interface Events {}

interface ModerationOfferModalProperties {
    player_id: number;
    offered_powers: number; // Must be the full bitfield that the person is going to get
    onResolved: () => void;
}

export class ModerationOfferModal extends Modal<Events, ModerationOfferModalProperties, {}> {
    constructor(props) {
        super(props);
    }

    accept = () => {
        void alert.fire({
            text: "Accepting...",
            icon: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        });

        patch("me/moderation", {
            moderator_powers: this.props.offered_powers,
        })
            .then(() => {
                alert.close();
                this.props.onResolved();
            })
            .catch(errorAlerter);
        this.close();
    };

    reject = () => {
        void alert.fire({
            text: "OK, noted...",
            icon: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        });

        patch("me/moderation", {
            mod_powers_rejected: true,
        })
            .then(() => {
                alert.close();
                this.props.onResolved();
            })
            .catch(errorAlerter);
        this.close();
    };

    render() {
        return (
            <div className="Modal ModerationOfferModal">
                <div className="header">
                    {pgettext(
                        "Header telling people about community moderation powers they are offered",
                        "Community Moderation",
                    )}
                </div>
                <div className="moderation-offer-details">
                    <p>
                        {pgettext(
                            "Part of the description offering community moderation powers to a user.",
                            "If you're willing, we'd love to have you on board as a community moderator.",
                        )}
                    </p>
                    <p>
                        {pgettext(
                            "Part of the description offering community moderation powers to a user.",
                            "You'll get access to tools that will allow you to vote on reports raised by users - that will tell us how to handle those reports.",
                        )}
                    </p>
                    <p>
                        {pgettext(
                            "Part of the description offering community moderation powers to a user.",
                            "We just need your agreement to use the powers in the best interests of the OGS community, and in line with current policies and practices.",
                        )}
                    </p>
                </div>
                <button onClick={this.accept}>
                    {pgettext("Button for accepting community moderator powers", "Yes, please.")}
                </button>
                <button onClick={this.reject}>
                    {pgettext("Button for declining community moderator powers", "No, thanks.")}
                </button>
            </div>
        );
    }
}

export function openModerationOfferModal(player_id, offered_powers, onResolved) {
    openModal(
        <ModerationOfferModal
            player_id={player_id}
            offered_powers={offered_powers}
            onResolved={onResolved}
            fastDismiss
        />,
    );
}
