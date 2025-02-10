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

/**
 * This is the schema for the data functions (e.g. get(), set()).  It defines
 * all the possible keys as well as the associated value types.
 */

export type Challenge = socket_api.seekgraph_global.Challenge;

export interface ChallengeFilter {
    showIneligible: boolean;
    showRanked: boolean;
    showUnranked: boolean;
    show19x19: boolean;
    show13x13: boolean;
    show9x9: boolean;
    showOtherSizes: boolean;
    showRengo: boolean;
    showHandicap: boolean;
}

export type ChallengeFilterKey = keyof ChallengeFilter;

export function shouldDisplayChallenge(c: Challenge, filter: ChallengeFilter): boolean {
    if (c.user_challenge) {
        return true;
    }
    const matchesSize =
        (filter.show19x19 && c.width === 19 && c.height === 19) ||
        (filter.show13x13 && c.width === 13 && c.height === 13) ||
        (filter.show9x9 && c.width === 9 && c.height === 9) ||
        (filter.showOtherSizes &&
            (c.width !== c.height || (c.width !== 19 && c.width !== 13 && c.width !== 9)));
    const matchesRanked =
        (filter.showUnranked && !c.ranked && !c.rengo) ||
        (filter.showRanked && c.ranked) ||
        (filter.showRengo && c.rengo);
    const matchesHandicap = filter.showHandicap || c.handicap === 0;
    return (c.eligible || filter.showIneligible) && matchesRanked && matchesSize && matchesHandicap;
}
