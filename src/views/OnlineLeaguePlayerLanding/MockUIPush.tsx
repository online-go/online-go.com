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

// collect up all the actions found on UIPush components, so we can call them when we want to
export const uiPushActions = {};

interface UIPushProperties {
    event: string;
    channel?: string;
    action: () => void;
}

function MockUIPush({ event, action }: UIPushProperties): JSX.Element {
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
