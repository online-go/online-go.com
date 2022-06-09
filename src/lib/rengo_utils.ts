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

import swal from "sweetalert2";
import { put, post, del } from "requests";
import { errorAlerter } from "misc";
import { _ } from "translate";

type Challenge = socket_api.seekgraph_global.Challenge;
type RengoParticipantsDTO = rest_api.RengoParticipantsDTO;

// This is used by the SeekGraph to perform this function, as well as the Play page...
export function nominateForRengoChallenge(
    c: Challenge,
    on_done?: (participants: RengoParticipantsDTO) => void,
) {
    swal({
        text: _("Joining..."), // translator: the server is processing their request to join a rengo game
        type: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    }).catch(swal.noop);

    put("challenges/%%/join", c.challenge_id, {})
        .then((res) => {
            swal.close();
            on_done(res);
        })
        .catch((err: any) => {
            swal.close();
            errorAlerter(err);
        });
}

export function assignToTeam(
    player_id: number,
    team: string,
    challenge,
    on_done?: (participants: RengoParticipantsDTO) => void,
) {
    const assignment =
        team === "rengo_black_team"
            ? "assign_black"
            : team === "rengo_white_team"
            ? "assign_white"
            : "unassign";

    put("challenges/%%/team", challenge.challenge_id, {
        [assignment]: [player_id], // back end expects an array of changes, but we only ever send one at a time.
    })
        .then(on_done)
        .catch((err) => {
            errorAlerter(err);
        });
}

export function kickRengoUser(player_id: number, on_done?: () => void) {
    put("challenges", {
        rengo_kick: player_id,
    })
        .then(on_done)
        .catch((err) => {
            errorAlerter(err);
        });
}

export function startOwnRengoChallenge(the_challenge: Challenge, on_done?: () => void) {
    swal({
        text: "Starting...",
        type: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    }).catch(swal.noop);

    post("challenges/%%/start", the_challenge.challenge_id, {})
        .then(() => {
            swal.close();
            on_done();
        })
        .catch((err) => {
            swal.close();
            errorAlerter(err);
        });
}

export function cancelChallenge(the_challenge: Challenge, on_done?: () => void) {
    del("challenges/%%", the_challenge.challenge_id).then(on_done).catch(errorAlerter);
}

export function unNominate(the_challenge: Challenge, on_done?: () => void) {
    swal({
        text: _("Withdrawing..."), // translator: the server is processing their request to withdraw from a rengo challenge
        type: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    }).catch(swal.noop);

    del("challenges/%%/join", the_challenge.challenge_id, {})
        .then(() => {
            swal.close();
            on_done();
        })
        .catch((err) => {
            swal.close();
            errorAlerter(err);
        });
}
