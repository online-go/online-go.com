/*
 * Copyright (C) 2012-2017  Online-Go.com
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

import {Challenge} from "data/Challenge";
import {to_old_style_rank} from "compatibility/Rank";

export function to_old_style_challenge(challenge: Challenge): any {
    let result: any = Object.assign({}, challenge);
    result.min_ranking = to_old_style_rank(challenge.min_ranking);
    result.max_ranking = to_old_style_rank(challenge.max_ranking);
    return result;
}
