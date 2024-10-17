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
import { ChallengeFilter, Challenge } from "@/lib/challenge_utils";

export function anyChallengesToShow(filter: ChallengeFilter, challenge_list: Challenge[]): boolean {
    return (
        (filter.showIneligible && (challenge_list.length as any)) ||
        challenge_list.reduce((accumulator, current) => {
            return accumulator || current.eligible || !!current.user_challenge;
        }, false)
    );
}
export function challenge_sort(A: Challenge, B: Challenge) {
    if (A.eligible && !B.eligible) {
        return -1;
    }
    if (!A.eligible && B.eligible) {
        return 1;
    }

    if (A.user_challenge && !B.user_challenge) {
        return -1;
    }
    if (!A.user_challenge && B.user_challenge) {
        return 1;
    }

    const t = A.username.localeCompare(B.username);
    if (t) {
        return t;
    }

    if (A.ranked && !B.ranked) {
        return -1;
    }
    if (!A.ranked && B.ranked) {
        return 1;
    }

    return A.challenge_id - B.challenge_id;
}

export function time_per_move_challenge_sort(A: Challenge, B: Challenge) {
    const comparison = Math.sign(A.time_per_move - B.time_per_move);

    if (comparison) {
        return comparison;
    }

    if (A.eligible && !B.eligible) {
        return -1;
    }
    if (!A.eligible && B.eligible) {
        return 1;
    }
    if (A.user_challenge && !B.user_challenge) {
        return -1;
    }
    if (!A.user_challenge && B.user_challenge) {
        return 1;
    }

    const createdA = A.created ? new Date(A.created).getTime() : -Infinity;
    const createdB = B.created ? new Date(B.created).getTime() : -Infinity;
    return createdA - createdB;
}
