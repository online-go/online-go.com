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

import * as player_cache from "player_cache";
import { put } from "requests";

type Participant = {
    user_id: number;
    rating: number;
    username?: string;
};

// Convert player IDs to Participants with ratings.
function toParticipants(playerIDs: number[]): Promise<Participant[]> {
    const required_fields = ["username", "rating"];
    const promises: Promise<any>[] = [];
    for (const id of playerIDs) {
        const promise = player_cache.fetch(id, required_fields).then((entry) => {
            return {
                user_id: id,
                rating: entry.rating,
                username: entry.username,
            };
        });
        promises.push(promise);
    }
    return Promise.all(promises);
}

function sortParticipants(participants: Participant[]) {
    participants.sort((a, b) => a.rating - b.rating);
}

// Returns sum of ratings of both teams.
function sumRatings(participants: Participant[]): [number, number] {
    let evenSum = 0;
    let oddSum = 0;
    for (let i = 0; i < participants.length; i += 2) {
        evenSum += participants[i].rating;
    }
    for (let i = 1; i < participants.length; i += 2) {
        oddSum += participants[i].rating;
    }
    return [evenSum, oddSum];
}

// Decreases difference between average ratings by swapping one pair of adjacent players.
// Returns whether or not there's an improvement.
function improveBalance(participants: Participant[]): boolean {
    const [evenSum, oddSum] = sumRatings(participants);
    const evenCount = Math.ceil(participants.length / 2);
    const oddCount = Math.floor(participants.length / 2);

    // participants[bestI] and [bestJ] will switch teams later.
    let bestI = -1;
    let bestJ = -1;

    // Difference between average ratings.
    let bestDiff = Math.abs(evenSum / evenCount - oddSum / oddCount);

    for (let i = 1; i < participants.length; i++) {
        const a = participants[i - 1].rating;
        const b = participants[i].rating;

        // The new difference if a and b were to switch.
        const diff =
            i % 2 === 0
                ? Math.abs((evenSum - b + a) / evenCount - (oddSum + b - a) / oddCount)
                : Math.abs((evenSum - a + b) / evenCount - (oddSum + a - b) / oddCount);

        if (diff < bestDiff) {
            // Keep track of this pair. Switching them will make the teams more balanced.
            bestI = i - 1;
            bestJ = i;
            bestDiff = diff;
        }
    }

    if (bestI < 0 || bestJ < 0) {
        // I.e. no improvement found.
        return false;
    }

    [participants[bestI], participants[bestJ]] = [participants[bestJ], participants[bestI]];
    return true;
}

// Split even and odd groups.
function split(participants: Participant[]): [Participant[], Participant[]] {
    const even: Participant[] = [];
    const odd: Participant[] = [];
    for (let i = 0; i < participants.length; i += 2) {
        even.push(participants[i]);
    }
    for (let i = 1; i < participants.length; i += 2) {
        odd.push(participants[i]);
    }
    return [even, odd];
}

type BalancedResult = {
    black: Participant[];
    white: Participant[];
    blackAverageRating: number;
    whiteAverageRating: number;
};

// Returns a balanced grouping of players.
function autoBalance(participants: Participant[], maxIterations: number = 100): BalancedResult {
    // Participants are divided into two groups: even and odd.
    // One of those will be black/white.
    sortParticipants(participants); // initial guess
    for (let i = 0; i < maxIterations; i++) {
        if (!improveBalance(participants)) {
            break;
        }
    }

    // Determine who will be black/white.
    const [evenSum, oddSum] = sumRatings(participants);
    const [even, odd] = split(participants);
    const evenRating = evenSum / even.length;
    const oddRating = oddSum / odd.length;
    if (evenRating < oddRating) {
        return {
            black: even,
            white: odd,
            blackAverageRating: evenRating,
            whiteAverageRating: oddRating,
        };
    }
    return {
        black: odd,
        white: even,
        blackAverageRating: oddRating,
        whiteAverageRating: evenRating,
    };
}

type Challenge = socket_api.seekgraph_global.Challenge;
type RengoParticipantsDTO = rest_api.RengoParticipantsDTO;

export async function balanceTeams(challenge: Challenge): Promise<RengoParticipantsDTO> {
    const user_id = (p: Participant) => p.user_id;
    const participants = await toParticipants(challenge.rengo_participants);
    const result = autoBalance(participants);

    console.log("Balancing teams...");
    console.log("Black team:", result.black);
    console.log("Average rating:", result.blackAverageRating);
    console.log("White team:", result.white);
    console.log("Average rating:", result.whiteAverageRating);
    console.log(
        "Rating difference:",
        Math.abs(result.blackAverageRating - result.whiteAverageRating),
    );

    return put(`challenges/${challenge.challenge_id}/team`, {
        assign_black: result.black.map(user_id),
        assign_white: result.white.map(user_id),
    });
}

export function unassignPlayers(challenge: Challenge): Promise<RengoParticipantsDTO> {
    return put(`challenges/${challenge.challenge_id}/team`, {
        unassign: challenge.rengo_participants,
    });
}
