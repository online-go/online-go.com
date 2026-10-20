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
import { act, render, screen } from "@testing-library/react";
import { EventEmitter } from "eventemitter3";
import { GobanMovesArray, JGOFAIReview, JGOFAIReviewMove } from "goban";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import { GobanControllerContext } from "@/views/Game/goban_context";
import { TEST_USER } from "@/views/Game/test_user";
import { ai_socket } from "@/lib/sockets";
import { AIReview, AIReviewEntry } from "./AIReview";

const REVIEW_UUID = "test-review-uuid";

jest.mock("@/lib/sockets", () => {
    const { EventEmitter: MockEventEmitter } = jest.requireActual("eventemitter3");
    return {
        ...jest.requireActual("@/lib/sockets"),
        ai_socket: Object.assign(new MockEventEmitter(), { connected: false, send: jest.fn() }),
    };
});

const mockGet = jest.fn();
jest.mock("@/lib/requests", () => ({
    get: (...args: unknown[]) => mockGet(...args),
    post: jest.fn(() => Promise.resolve({})),
    put: jest.fn(() => Promise.resolve({})),
    del: jest.fn(() => Promise.resolve({})),
    patch: jest.fn(() => Promise.resolve({})),
}));

jest.mock("@moderator-ui/FairPlay", () => ({
    FairPlayGameSummary: () => null,
}));

interface ChartRender {
    entries: Array<AIReviewEntry>;
    /** Copy of the review's scores at the time of the render */
    scores: Array<number> | undefined;
}
const mockChartRenders: ChartRender[] = [];

jest.mock("./ReviewChart", () => ({
    ReviewChart: (props: { entries: Array<AIReviewEntry>; ai_review: JGOFAIReview }) => {
        mockChartRenders.push({
            entries: props.entries.map((e) => ({ ...e })),
            scores: props.ai_review.scores ? [...props.ai_review.scores] : undefined,
        });
        return <div data-testid="review-chart" />;
    },
}));

const MOVES: GobanMovesArray = [
    [3, 3, 1000],
    [15, 15, 2000],
];

function makeReview(): JGOFAIReview {
    return {
        id: 1,
        uuid: REVIEW_UUID,
        type: "full",
        engine: "katago",
        engine_version: "1.0",
        network: "",
        network_size: "",
        strength: 1000,
        date: 0,
        win_rate: 0.5,
        win_rates: [0.5, 0.5, 0.5],
        scores: [0, 0, 0],
        moves: {},
    };
}

function reviewMove(move_number: number, win_rate: number, score: number): JGOFAIReviewMove {
    return {
        move_number,
        move: { x: 3, y: 3 },
        win_rate,
        score,
        branches: [],
    };
}

function makeController(): GobanController {
    return new GobanController({
        game_id: 1234,
        phase: "finished",
        black_player_id: 987,
        white_player_id: 456,
        moves: MOVES,
        players: {
            black: { id: 987, username: "black" },
            white: { id: 456, username: "white" },
        },
    });
}

const mockAiSocket = ai_socket as unknown as EventEmitter;

/* Other requests, such as the site config, are left pending, so that their
 * results do not replace the test user. */
function mockReviews(reviews: JGOFAIReview[]): void {
    mockGet.mockImplementation((url: string) =>
        url === "games/1234/ai_reviews" ? Promise.resolve(reviews) : new Promise(() => {}),
    );
}

function lastChartRender(): ChartRender {
    return mockChartRenders[mockChartRenders.length - 1];
}

describe("AIReview chart", () => {
    beforeEach(() => {
        data.set("user", { ...TEST_USER, id: 0, anonymous: true });
        mockChartRenders.length = 0;
        mockAiSocket.removeAllListeners();
        mockReviews([makeReview()]);
    });

    /* The chart entries are derived from `win_rates` during render. A move
     * result that streams in must reach `win_rates` and `scores` before that
     * render, because no later render follows to pick it up. */
    test("a streamed move result is in the chart after the update", async () => {
        const controller = makeController();
        const goban = controller.goban;
        if (!goban) {
            throw new Error("GobanController did not create a goban");
        }

        render(
            <GobanControllerContext.Provider value={controller}>
                <AIReview
                    game_id={1234}
                    move={goban.engine.cur_move}
                    hidden={false}
                    onAIReviewSelected={() => {}}
                    moves={MOVES}
                />
            </GobanControllerContext.Provider>,
        );
        await screen.findByTestId("review-chart");
        expect(lastChartRender().entries[1].win_rate).toBe(0.5);

        await act(async () => {
            mockAiSocket.emit(REVIEW_UUID, { "move-1": reviewMove(1, 0.9, 7) });
            await new Promise((resolve) => setTimeout(resolve, 50));
        });

        expect(lastChartRender().entries[1].win_rate).toBe(0.9);
        expect(lastChartRender().scores?.[1]).toBe(7);
    });

    test("move results in the loaded review are in the first chart render", async () => {
        const review = makeReview();
        review.moves = { "1": reviewMove(1, 0.8, 4) };
        mockReviews([review]);
        const controller = makeController();
        const goban = controller.goban;
        if (!goban) {
            throw new Error("GobanController did not create a goban");
        }

        render(
            <GobanControllerContext.Provider value={controller}>
                <AIReview
                    game_id={1234}
                    move={goban.engine.cur_move}
                    hidden={false}
                    onAIReviewSelected={() => {}}
                    moves={MOVES}
                />
            </GobanControllerContext.Provider>,
        );
        await screen.findByTestId("review-chart");

        expect(mockChartRenders[0].entries[1].win_rate).toBe(0.8);
        expect(mockChartRenders[0].scores?.[1]).toBe(4);
    });
});
