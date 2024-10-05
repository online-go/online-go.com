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

import { alert } from "@/lib/swal_config";
import { put, post, del } from "@/lib/requests";
import { _ } from "@/lib/translate";

type Challenge = socket_api.seekgraph_global.Challenge;
type RengoParticipantsDTO = rest_api.RengoParticipantsDTO;

// This is used by the SeekGraph to perform this function, as well as the Play page...
export function nominateForRengoChallenge(c: Challenge): Promise<RengoParticipantsDTO> {
    void alert.fire({
        text: _("Joining..."), // translator: the server is processing their request to join a rengo game
        icon: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    });

    return put(`challenges/${c.challenge_id}/join`, {}).then((res) => {
        alert.close();
        return res;
    });
}

export function assignToTeam(
    player_id: number,
    team: string,
    challenge: Challenge,
): Promise<RengoParticipantsDTO> {
    const assignment =
        team === "rengo_black_team"
            ? "assign_black"
            : team === "rengo_white_team"
              ? "assign_white"
              : "unassign";

    return put(`challenges/${challenge.challenge_id}/team`, {
        [assignment]: [player_id], // back end expects an array of changes, but here we send one at a time.
    });
}

export function kickRengoUser(player_id: number): Promise<void> {
    return put("challenges", {
        rengo_kick: player_id,
    });
}

export function startOwnRengoChallenge(the_challenge: Challenge): Promise<void> {
    void alert.fire({
        text: "Starting...",
        icon: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    });

    return post(`challenges/${the_challenge.challenge_id}/start`, {}).then(() => {
        alert.close();
    });
}

export function cancelRengoChallenge(the_challenge: Challenge): Promise<void> {
    return del(`challenges/${the_challenge.challenge_id}`);
}

export function unNominate(the_challenge: Challenge): Promise<RengoParticipantsDTO> {
    void alert.fire({
        text: _("Withdrawing..."), // translator: the server is processing their request to withdraw from a rengo challenge
        icon: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    });

    return del(`challenges/${the_challenge.challenge_id}/join`, {}).then((res) => {
        alert.close();
        return res;
    });
}

export function setTeams(teams: RengoParticipantsDTO): Promise<RengoParticipantsDTO> {
    void alert.fire({
        text: _("Setting teams..."), // translator: the server is processing their request to set Rengo teams
        icon: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    });

    return put(`challenges/${teams.challenge}/team`, { set_teams: teams }).then((res) => {
        alert.close();
        return res;
    });
}
