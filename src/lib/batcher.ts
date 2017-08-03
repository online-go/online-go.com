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

// There are some cases where it is more efficient to perform a series of
// operations together asynchronously than it is to perform them one at a
// time when the need arises. The classic example of this is requests to
// the back end.
export class Batcher<T> {
    private action: (values: Array<T>) => void;
    private values: Array<T>;

    constructor(action: (values: Array<T>) => void) {
        this.action = action;
        this.values = [];
    }

    // Perform the action on the given value soon. It is OK to call
    // this method from within the action function, but the action will
    // not be executed on the new values immediately.
    soon(value: T): void {
        if (this.values.length === 0) {
            setTimeout(this.perform, 0);
        }
        this.values.push(value);
    }

    private perform = () => {
        let values = this.values;
        this.values = [];
        this.action(values);
    }
}
