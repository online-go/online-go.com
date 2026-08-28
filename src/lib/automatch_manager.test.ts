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

/*
 * Unit tests for AutomatchManager's handling of automatch/start.
 *
 * A live automatch seek survives a brief socket reconnect on the server, but
 * the client used to forget it initiated the seek (last_find_match_uuid is
 * cleared on reconnect), so the automatch/start that followed never navigated
 * the player into their game. The player would then time out without playing
 * a move and receive a first-turn-escaper warning for a game they never saw.
 */

jest.mock("@/lib/sockets", () => ({
    socket: { on: jest.fn(), send: jest.fn() },
}));
jest.mock("@/lib/ogsHistory", () => ({ browserHistory: { push: jest.fn() } }));
jest.mock("@/lib/toast", () => ({ toast: jest.fn(() => ({ close: jest.fn() })) }));
jest.mock("@/lib/translate", () => ({
    pgettext: (_ctx: string, s: string) => s,
    interpolate: (s: string) => s,
}));

import { socket } from "@/lib/sockets";
import { browserHistory } from "@/lib/ogsHistory";
import { automatch_manager, AutomatchPreferences } from "./automatch_manager";

function socketHandler(event: string): (arg?: any) => void {
    const call = (socket.on as jest.Mock).mock.calls.find((c) => c[0] === event);
    if (!call) {
        throw new Error(`No socket handler registered for ${event}`);
    }
    return call[1];
}

function livePreferences(uuid: string): AutomatchPreferences {
    return {
        uuid,
        size_speed_options: [{ size: "19x19", speed: "live", system: "fischer" }],
        lower_rank_diff: 3,
        upper_rank_diff: 3,
        rules: { condition: "no-preference", value: "japanese" },
        handicap: { condition: "no-preference", value: "enabled" },
    };
}

describe("AutomatchManager automatch/start navigation", () => {
    beforeEach(() => {
        (browserHistory.push as jest.Mock).mockClear();
        // Reset manager state between tests, as it does on a disconnect
        socketHandler("disconnect")();
    });

    test("navigates to the game for a seek started in this session", () => {
        automatch_manager.findMatch(livePreferences("uuid-local"));

        socketHandler("automatch/start")({ uuid: "uuid-local", game_id: 42 });

        expect(browserHistory.push).toHaveBeenCalledWith("/game/42");
    });

    test("navigates to the game when the live seek was restored after a reconnect", () => {
        automatch_manager.findMatch(livePreferences("uuid-restored"));

        // Reconnect: state is cleared, then the server replays our live seek
        // in response to automatch/list.
        socketHandler("connect")();
        socketHandler("automatch/entry")(livePreferences("uuid-restored"));

        socketHandler("automatch/start")({ uuid: "uuid-restored", game_id: 43 });

        expect(browserHistory.push).toHaveBeenCalledWith("/game/43");
    });

    test("does not navigate for a seek this client knows nothing about", () => {
        socketHandler("connect")();

        socketHandler("automatch/start")({ uuid: "uuid-foreign", game_id: 44 });

        expect(browserHistory.push).not.toHaveBeenCalled();
    });

    test("does not navigate for a restored correspondence seek", () => {
        const prefs = livePreferences("uuid-corr");
        prefs.size_speed_options = [{ size: "19x19", speed: "correspondence", system: "fischer" }];

        socketHandler("connect")();
        socketHandler("automatch/entry")(prefs);

        socketHandler("automatch/start")({ uuid: "uuid-corr", game_id: 45 });

        expect(browserHistory.push).not.toHaveBeenCalled();
    });
});
