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

import * as React from "react";
import "@testing-library/jest-dom";

// mock UIPush to emulate server socket pushes

// ** Note: this component needs to be imported before the React components that are under test.

// Use this hash: it collects up all the actions found on UIPush components in the React tree,
// so you can call their action by event name in a test.
//
// For example:
/*
        // go to game when the server tells us it's ready
        await act(async () => {
            uiPushActions["online-league-game-commencement"]({
                matchId: 1,
                gameId: 999,
            });
        });
*/

export const uiPushActions: { [event: string]: () => void } = {};

interface UIPushProperties {
    event: string;
    channel?: string;
    action: () => void;
}

function MockUIPush({ event, action }: UIPushProperties): React.ReactElement | null {
    React.useEffect(() => {
        uiPushActions[event] = action;
    }, [event, action]);
    return null;
}
jest.mock("../../../src/components/UIPush", () => {
    return {
        UIPush: jest.fn(MockUIPush),
    };
});
