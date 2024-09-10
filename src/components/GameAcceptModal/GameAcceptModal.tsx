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
import { _ } from "@/lib/translate";
import { post } from "@/lib/requests";
import { openModal, Modal } from "@/components/Modal";
import { Player, PlayerObjectType } from "@/components/Player";
import { errorAlerter } from "@/lib/misc";
import { alert } from "@/lib/swal_config";
import { ChallengeDetailsReviewPane } from "../ChallengeDetailsReviewPane";
import { Challenge } from "@/lib/challenge_utils";

interface Events {}

interface GameAcceptModalProperties {
    challenge: Challenge;
    onAccept: (challenge: Challenge) => void;
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
}

export class GameAcceptModal extends Modal<Events, GameAcceptModalProperties, {}> {
    constructor(props: GameAcceptModalProperties) {
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

        post(`challenges/${this.props.challenge.challenge_id}/accept`, {})
            .then(() => {
                alert.close();
                this.close();
                this.props.onAccept(this.props.challenge);
            })
            .catch((err) => {
                alert.close();
                errorAlerter(err);
            });
    };

    render() {
        const challenge = this.props.challenge;
        const challenger_details: PlayerObjectType = {
            id: challenge.user_id,
            username: challenge.username,
            pro: !!challenge.pro,
            rank: challenge.rank,
        };

        return (
            <div className="Modal GameAcceptModal">
                <div className="header">
                    <div>
                        <h2>
                            <Player icon iconSize={32} user={challenger_details} />
                        </h2>
                        <h4>{challenge.name}</h4>
                    </div>
                </div>
                <div className="body">
                    <ChallengeDetailsReviewPane challenge={challenge} />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                    <button onClick={this.accept} className="primary">
                        {_("Accept Game")}
                    </button>
                </div>
            </div>
        );
    }
}

export function openGameAcceptModal(challenge: Challenge): Promise<any> {
    return new Promise((resolve) => {
        openModal(<GameAcceptModal challenge={challenge} onAccept={resolve} fastDismiss />);
    });
}

export function handicapText(handicap: number) {
    if (handicap < 0) {
        return _("Auto");
    }
    if (handicap === 0) {
        return _("None");
    }
    return handicap;
}
