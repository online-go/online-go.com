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

import {get_handicap_adjustment} from 'rank_utils';

export class RatingEntry {
    ended: Date;
    game_id:number;
    played_black:boolean;
    handicap:number;
    rating:number;
    deviation:number;
    volatility:number;
    opponent_id:number;
    opponent_rating:number;
    opponent_deviation:number;
    outcome:number;
    extra:any;
    count:number;
    starting_rating:number;
    starting_deviation:number;
    increase:boolean;
    wins:number;
    losses:number;
    strong_wins:number;
    strong_losses:number;
    weak_wins:number;
    weak_losses:number;

    constructor(obj) {
        this.ended = obj.ended;
        this.game_id = obj.game_id;
        this.played_black = obj.played_black;
        this.handicap = obj.handicap;
        this.rating = obj.rating;
        this.deviation = obj.deviation;
        this.volatility = obj.volatility;
        this.opponent_id = obj.opponent_id;
        this.opponent_rating = obj.opponent_rating;
        this.opponent_deviation = obj.opponent_deviation;
        this.outcome = obj.outcome;
        this.extra = obj.extra;
        this.count = obj.count;
        this.starting_rating = obj.starting_rating;
        this.starting_deviation = obj.starting_deviation;
        this.increase = obj.increase;
        this.wins = obj.wins;
        this.losses = obj.losses;
        this.strong_wins = obj.strong_wins;
        this.strong_losses = obj.strong_losses;
        this.weak_wins = obj.weak_wins;
        this.weak_losses = obj.weak_losses;
    }

    copy() {
        return new RatingEntry(this);
    }

    merge(other:RatingEntry):RatingEntry {
        this.rating = other.rating;
        this.deviation = other.deviation;
        this.volatility = other.volatility;
        this.wins += other.wins;
        this.losses += other.losses;
        this.count += other.count;
        this.increase = other.increase;
        this.strong_wins += other.strong_wins;
        this.strong_losses += other.strong_losses;
        this.weak_wins += other.weak_wins;
        this.weak_losses += other.weak_losses;
        return this;
    }
}

export function makeRatingEntry(d:any):RatingEntry {
    let played_black = parseInt(d.played_black) === 1;
    let effective_rating = parseFloat(d.rating);
    let effective_opponent_rating = parseFloat(d.opponent_rating);
    let handicap = parseInt(d.handicap);
    let won = parseInt(d.outcome) === 2 ? 1 : 0;
    let lost = 1 - won;
    let extra = JSON.parse(d.extra);

    if (d.opponent_id <= 0) {
        lost = 0;
    }

    if (handicap > 0) {
        if (played_black) {
            effective_rating += get_handicap_adjustment(effective_rating, handicap);
        } else {
            effective_opponent_rating += get_handicap_adjustment(effective_opponent_rating, d.handicap);
        }
    }


    return new RatingEntry({
        ended              : new Date(parseInt(d.ended) * 1000),
        game_id            : parseInt(d.game_id),
        played_black       : played_black,
        handicap           : handicap,
        rating             : parseFloat(d.rating),
        deviation          : parseFloat(d.deviation),
        starting_rating    : parseFloat(d.rating),
        starting_deviation : parseFloat(d.deviation),
        volatility         : parseFloat(d.volatility),
        opponent_id        : parseInt(d.opponent_id),
        opponent_rating    : parseFloat(d.oppponent_rating),
        opponent_deviation : parseFloat(d.opponent_deviation),
        outcome            : parseInt(d.outcome),
        extra              : extra,
        count              : d.opponent_id > 0 ? 1 : 0,
        wins               : won,
        losses             : lost,
        strong_wins        : effective_rating < effective_opponent_rating ? won : 0,
        strong_losses      : effective_rating < effective_opponent_rating ? lost : 0,
        weak_wins          : effective_rating >= effective_opponent_rating ? won : 0,
        weak_losses        : effective_rating >= effective_opponent_rating ? lost : 0,
    });
}
