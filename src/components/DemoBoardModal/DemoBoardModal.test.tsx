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
import { act, fireEvent, render, screen } from "@testing-library/react";
import { post } from "@/lib/requests";
import * as data from "@/lib/data";
import { DemoBoardModal } from "./DemoBoardModal";

const BYOYOMI = {
    system: "byoyomi",
    speed: "live",
    main_time: 600,
    period_time: 30,
    periods: 5,
    pause_on_weekends: false,
};

jest.mock("@/lib/requests", () => ({ post: jest.fn(() => Promise.resolve({ id: 5 })) }));
jest.mock("@/lib/data", () => ({ get: jest.fn(() => ({ id: 77 })), set: jest.fn() }));
jest.mock("@/lib/ogsHistory", () => ({ browserHistory: { push: jest.fn() } }));
jest.mock("@/lib/swal_config", () => ({ alert: { fire: jest.fn() } }));
jest.mock("@/lib/misc", () => ({ errorAlerter: jest.fn() }));
jest.mock("@/components/TimeControl", () => ({
    TimeControlPicker: ({ onChange }: { onChange: (tc: object) => void }) => (
        <button onClick={() => onChange({ ...BYOYOMI, main_time: 300 })}>pick 5 minutes</button>
    ),
}));
jest.mock("@/components/TimeControl/TimeControlUpdates", () => ({
    recallTimeControlSettings: () => BYOYOMI,
}));

const mockPost = jest.mocked(post);

beforeEach(() => {
    mockPost.mockClear();
});

async function create() {
    await act(async () => {
        fireEvent.click(screen.getByText("Create Demo"));
    });
    return mockPost.mock.calls[0][1] as { time_control?: unknown };
}

function renderModal() {
    render(<DemoBoardModal eventsRef={{ close: jest.fn() }} />);
}

describe("demo board time control", () => {
    test("a new demo board has no time control unless one is chosen", async () => {
        renderModal();
        expect(screen.queryByText("pick 5 minutes")).toBeNull();
        expect((await create()).time_control).toBeNull();
    });

    test("a chosen time control is sent with the new demo board", async () => {
        renderModal();
        fireEvent.click(screen.getByLabelText("Use a time control"));
        fireEvent.click(screen.getByText("pick 5 minutes"));
        expect((await create()).time_control).toEqual({
            ...BYOYOMI,
            main_time: 300,
            time_control: "byoyomi",
        });
    });

    test("the time control is remembered for the next demo board", async () => {
        renderModal();
        fireEvent.click(screen.getByLabelText("Use a time control"));
        await create();
        expect(data.set).toHaveBeenCalledWith(
            "demo.settings",
            expect.objectContaining({ time_control: BYOYOMI }),
        );
    });
});
