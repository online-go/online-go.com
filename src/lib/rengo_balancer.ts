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

import { errorAlerter } from "misc";
import * as player_cache from "player_cache";
import { put } from "requests";

type Participant = {
    user_id: number;
    rating: number;
};

// Convert player IDs to Participants with ratings.
function toParticipants(playerIDs: number[]): Promise<Participant[]> {
    const required_fields = ["rating"];
    const promises = [];
    for (const id of playerIDs) {
        const promise = player_cache.fetch(id, required_fields).then((entry) => {
            return {
                user_id: id,
                rating: entry.rating,
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
// Ratings are not included in result.
function split(participants: Participant[]): [number[], number[]] {
    const even = [];
    const odd = [];
    for (let i = 0; i < participants.length; i += 2) {
        even.push(participants[i].user_id);
    }
    for (let i = 1; i < participants.length; i += 2) {
        odd.push(participants[i].user_id);
    }
    return [even, odd];
}

type BalancedResult = {
    black: number[]; // Player ids only
    white: number[];
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
        };
    }
    return {
        black: odd,
        white: even,
    };
}

type Challenge = socket_api.seekgraph_global.Challenge;

export async function balanceTeams(challenge: Challenge) {
    const participants = await toParticipants(challenge.rengo_participants);
    const { black, white } = autoBalance(participants);
    put("challenges/%%/team", challenge.challenge_id, {
        assign_black: black,
        assign_white: white,
    }).catch(errorAlerter);
}
