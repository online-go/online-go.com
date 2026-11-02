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

import { act, renderHook, waitFor } from "@testing-library/react";
import { TypedEventEmitter } from "@/lib/TypedEventEmitter";
import { post } from "@/lib/requests";
import { alert } from "@/lib/swal_config";
import {
    notification_manager,
    NotificationManagerEvents,
} from "@/components/Notifications/NotificationManager";
import { useAcceptChallengePrompt } from "./useAcceptChallengePrompt";

jest.mock("@/lib/requests", () => ({ post: jest.fn(() => Promise.resolve({})) }));
jest.mock("@/lib/swal_config", () => ({ alert: { fire: jest.fn() } }));
jest.mock("@/lib/misc", () => ({ errorAlerter: jest.fn() }));
jest.mock("@/components/ChallengeModal", () => ({
    challenge_text_description: () => "9x9 correspondence",
}));
jest.mock("@/components/Notifications/NotificationManager", () => ({
    notification_manager: { ordered_notifications: [], event_emitter: null },
}));

const GAME_ID = 51751818;

function challengeArrives() {
    act(() => {
        notification_manager.ordered_notifications.push({
            id: "7:abc",
            type: "challenge",
            game_id: GAME_ID,
            challenge_id: 19685447,
            user: { username: "alice" },
        });
        notification_manager.event_emitter.emit("notification-list-updated");
    });
}

beforeEach(() => {
    notification_manager.ordered_notifications = [];
    notification_manager.event_emitter = new TypedEventEmitter<NotificationManagerEvents>();
    jest.mocked(post).mockClear();
    jest.mocked(alert.fire).mockReset();
    // jsdom can't reload the page, and says so
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

test("the challenge is offered once the player's notifications have it, and accepting it accepts it", async () => {
    jest.mocked(alert.fire).mockResolvedValue({ value: true } as never);
    renderHook(() => useAcceptChallengePrompt(GAME_ID, true));
    expect(alert.fire).not.toHaveBeenCalled();

    challengeArrives();
    challengeArrives();

    expect(alert.fire).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(post).toHaveBeenCalledWith("me/challenges/19685447/accept", {}));
});

test("a player who leaves it for later isn't made to accept it", async () => {
    jest.mocked(alert.fire).mockResolvedValue({ value: false } as never);
    renderHook(() => useAcceptChallengePrompt(GAME_ID, true));

    challengeArrives();
    await act(async () => {});

    expect(alert.fire).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();
});

test("nothing is offered for a game that has started", () => {
    renderHook(() => useAcceptChallengePrompt(GAME_ID, false));

    challengeArrives();

    expect(alert.fire).not.toHaveBeenCalled();
});
