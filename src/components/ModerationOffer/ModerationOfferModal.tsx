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
import { pgettext } from "@/lib/translate";
import { openModal, Modal } from "@/components/Modal";
import { alert } from "@/lib/swal_config";
import { patch } from "@/lib/requests";

import { errorAlerter } from "@/lib/misc";
import { MODERATOR_POWERS, MOD_POWER_NAMES } from "@/lib/moderation";

interface Events {}

interface ModerationOfferModalProperties {
    player_id: number;
    current_moderator_powers: number;
    offered_moderator_powers: number; // Must be the full bitfield that the person is going to get
    onResolved?: () => void;
}

export class ModerationOfferModal extends Modal<Events, ModerationOfferModalProperties, {}> {
    constructor(props: ModerationOfferModalProperties) {
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
            moderator_powers: this.props.offered_moderator_powers,
        })
            .then(() => {
                alert.close();
                this.props.onResolved?.();
                // reload so that we see the new tools we accepted
                window.location.reload();
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
                this.props.onResolved?.();
            })
            .catch(errorAlerter);
        this.close();
    };

    render() {
        if (this.props.current_moderator_powers) {
            const new_power = (this.props.offered_moderator_powers &
                ~this.props.current_moderator_powers) as MODERATOR_POWERS;

            const new_power_name = MOD_POWER_NAMES[new_power];
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
                                "You've been offered another moderation power:",
                            )}
                        </p>
                        <p>{new_power_name}</p>
                    </div>
                    <button onClick={this.accept}>
                        {pgettext(
                            "Button for accepting community moderator powers",
                            "Yes, please.",
                        )}
                    </button>
                    <button onClick={this.reject}>
                        {pgettext("Button for declining community moderator powers", "No, thanks.")}
                    </button>
                </div>
            );
        } else {
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
                            <a href="https://github.com/online-go/online-go.com/wiki/Community-Moderation-%E2%80%90-Community-Moderator-Guide">
                                {pgettext("Link to trial guidelines", "Community Moderation Trial")}
                            </a>
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
                        {pgettext(
                            "Button for accepting community moderator powers",
                            "Yes, please.",
                        )}
                    </button>
                    <button onClick={this.reject}>
                        {pgettext("Button for declining community moderator powers", "No, thanks.")}
                    </button>
                </div>
            );
        }
    }
}

export function openModerationOfferModal(
    player_id: number,
    current_moderator_powers: number,
    offered_moderator_powers: number,
    onResolved?: () => void,
) {
    openModal(
        <ModerationOfferModal
            player_id={player_id}
            current_moderator_powers={current_moderator_powers}
            offered_moderator_powers={offered_moderator_powers}
            onResolved={onResolved}
            fastDismiss
        />,
    );
}
