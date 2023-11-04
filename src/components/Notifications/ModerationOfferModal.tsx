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
import { _ } from "translate";
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
                <div className="header">{_("Community Moderation")}</div>
                <div className="moderation-offer-details">
                    <p>
                        If you're willing, we'd love to have you on board as a community moderator.
                    </p>
                    <p>
                        You'll get access to tools to vote on reports blah blah. We need you to
                        agree to be nice about it, and to vote correctly, or somefink like that.
                    </p>
                </div>
                <button onClick={this.accept}>Yes, please.</button>
                <button onClick={this.reject}>No, thanks.</button>
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
