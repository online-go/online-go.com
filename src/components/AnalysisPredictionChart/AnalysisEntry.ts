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

export class AnalysisEntry {
    move: number;
    fast_prediction: number;
    full_prediction: number;

    constructor(obj) {
        this.move = obj.move;
        this.fast_prediction = obj.fast_prediction;
        this.full_prediction = obj.full_prediction;
    }

    copy() {
        return new AnalysisEntry(this);
    }

    merge(other:AnalysisEntry):AnalysisEntry {
        this.fast_prediction = other.fast_prediction;
        this.full_prediction = other.full_prediction;
        return this;
    }
}

export function makeAnalysisEntry(d:any):AnalysisEntry {
    return new AnalysisEntry({
        move: parseInt(d.move),
        fast_prediction: parseFloat(d.fast_prediction),
        full_prediction: parseFloat(d.full_prediction),
    });
}
