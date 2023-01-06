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

import "./TimeControl";
import { TimeControlTypes } from "./TimeControl";
import { updateSpeed } from "./TimeControlUpdates";
// import { classifyGameSpeed, getDefaultTimeControl } from "./util";

// test("Default time controls fit their respective categories", () => {
//     const sizes = [9, 13, 19];

//     for (const speed of TimeControlTypes.ALL_SPEEDS) {
//         for (const system of TimeControlTypes.ALL_SYSTEMS) {
//             for (const size of sizes) {
//                 const tc = getDefaultTimeControl(speed, system);
//                 const calculatedSpeed = classifyGameSpeed(tc, size, size);
//                 try {
//                     expect(calculatedSpeed).toEqual(tc.speed);
//                 } catch (err) {
//                     err.message = `${err.message}
//                                     time control: ${JSON.stringify(tc)}
//                                     size: ${size}`;
//                     throw err;
//                 }
//             }
//         }
//     }
// });

test("Updating speed away from correspondence + none should not maintain 'none' as the speed", () => {
    const tc: TimeControlTypes.None = {
        system: "none",
        speed: "correspondence",
        pause_on_weekends: false,
    };
    const updated = updateSpeed(tc, "live", 19, 19);
    expect(updated.system).not.toEqual("none");
});

test("Updating speed away from correspondence + 'pause on weekends' should not maintain 'pause on weekends'", () => {
    const tc: TimeControlTypes.Absolute = {
        speed: "correspondence",
        pause_on_weekends: true,
        system: "absolute",
        total_time: 0,
    };
    const updated = updateSpeed(tc, "live", 19, 19);
    expect(updated.pause_on_weekends).toEqual(false);
});
