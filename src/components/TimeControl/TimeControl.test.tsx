/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */

import "./TimeControl";
import { TimeControlTypes } from "./TimeControl";
import { updateSpeed } from "./TimeControlUpdates";
import { getDefaultTimeControl } from "./util";
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

test.each(TimeControlTypes.ALL_SYSTEMS_EXCEPT_NONE)(
    "Updating speed away from correspondence clears pause-on-weekends for %s",
    (system) => {
        const tc = getDefaultTimeControl("correspondence", system);

        const updated = updateSpeed(tc, "live", 19, 19);

        expect(updated.pause_on_weekends).toBe(false);
        expect(updated.speed).toBe("live");
        expect(updated.system).toBe(system);
    },
);
