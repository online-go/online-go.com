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

import { AdHocPauseControl, JGOFTimeControl } from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { del } from "@/lib/requests";
import { GobanController } from "@/lib/GobanController";
import { exitVacationIfPaused } from "./auto_exit_vacation";

jest.mock("@/lib/requests", () => ({ del: jest.fn(() => Promise.resolve()) }));

const ME = { id: 123, username: "test_user" };
const OPPONENT = { id: 456, username: "test_user2" };

const CORRESPONDENCE: JGOFTimeControl = {
    system: "fischer",
    speed: "correspondence",
    initial_time: 259200,
    time_increment: 86400,
    max_time: 604800,
    pause_on_weekends: false,
};

const LIVE: JGOFTimeControl = {
    system: "fischer",
    speed: "live",
    initial_time: 600,
    time_increment: 30,
    max_time: 1200,
    pause_on_weekends: false,
};

const MY_VACATION: AdHocPauseControl = { [`vacation-${ME.id}`]: true };

function moveIn(time_control: JGOFTimeControl, pause_control: AdHocPauseControl) {
    const controller = new GobanController({
        width: 19,
        height: 19,
        time_control,
        players: { black: ME, white: OPPONENT },
    });
    controller.goban.pause_control = pause_control;
    exitVacationIfPaused(controller.goban);
}

beforeEach(() => {
    data.set("user", { ...ME, anonymous: false } as rest_api.UserConfig);
    preferences.set("auto-exit-vacation-on-move", true);
    jest.mocked(del).mockClear();
});

afterEach(() => {
    data.remove("user");
    preferences.set("auto-exit-vacation-on-move", false);
});

describe("exitVacationIfPaused", () => {
    test("ends vacation in a correspondence game paused by the user's vacation", () => {
        moveIn(CORRESPONDENCE, MY_VACATION);

        expect(del).toHaveBeenCalledTimes(1);
        expect(del).toHaveBeenCalledWith("me/vacation");
    });

    test("does nothing when the preference is off", () => {
        preferences.set("auto-exit-vacation-on-move", false);

        moveIn(CORRESPONDENCE, MY_VACATION);

        expect(del).not.toHaveBeenCalled();
    });

    test("does nothing when only the opponent is on vacation", () => {
        moveIn(CORRESPONDENCE, { [`vacation-${OPPONENT.id}`]: true });

        expect(del).not.toHaveBeenCalled();
    });

    test("does nothing in a live game", () => {
        moveIn(LIVE, MY_VACATION);

        expect(del).not.toHaveBeenCalled();
    });
});
