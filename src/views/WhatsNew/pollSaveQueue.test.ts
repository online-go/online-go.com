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

import { PollSaveQueue } from "./pollSaveQueue";
import type { WhatsNewPollAnswers } from "./types";

interface Deferred {
    resolve: () => void;
    reject: (err: unknown) => void;
}

function setup(debounceMs = 800) {
    const sent: WhatsNewPollAnswers[] = [];
    const requests: Deferred[] = [];
    const errors: unknown[] = [];
    const queue = new PollSaveQueue({
        save: (answers) => {
            sent.push(answers);
            return new Promise<void>((resolve, reject) => {
                requests.push({ resolve, reject });
            });
        },
        onError: (err) => errors.push(err),
        debounceMs,
    });
    return { queue, sent, requests, errors };
}

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) {
        await Promise.resolve();
    }
}

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

test("saveNow sends at once", () => {
    const { queue, sent } = setup();
    queue.saveNow({ q1: ["a"] });
    expect(sent).toEqual([{ q1: ["a"] }]);
});

test("saveDebounced waits for the delay after the last change", () => {
    const { queue, sent } = setup();
    queue.saveDebounced({ q1: "h" });
    jest.advanceTimersByTime(500);
    queue.saveDebounced({ q1: "he" });
    jest.advanceTimersByTime(799);
    expect(sent).toEqual([]);
    jest.advanceTimersByTime(1);
    expect(sent).toEqual([{ q1: "he" }]);
});

test("flush sends debounced answers at once", () => {
    const { queue, sent } = setup();
    queue.saveDebounced({ q1: "hello" });
    queue.flush();
    expect(sent).toEqual([{ q1: "hello" }]);
    jest.advanceTimersByTime(1000);
    expect(sent).toHaveLength(1);
});

test("flush does nothing when no answers are waiting", () => {
    const { queue, sent } = setup();
    queue.flush();
    expect(sent).toEqual([]);
});

test("saveNow replaces a waiting debounced save", () => {
    const { queue, sent } = setup();
    queue.saveDebounced({ q1: "hi" });
    queue.saveNow({ q1: "hi", q2: ["a"] });
    jest.advanceTimersByTime(1000);
    expect(sent).toEqual([{ q1: "hi", q2: ["a"] }]);
});

test("only one save is in flight, and only the newest answers are sent after it", async () => {
    const { queue, sent, requests } = setup();
    queue.saveNow({ q1: ["a"] });
    queue.saveNow({ q1: ["b"] });
    queue.saveNow({ q1: ["c"] });
    expect(sent).toEqual([{ q1: ["a"] }]);

    requests[0].resolve();
    await settle();
    expect(sent).toEqual([{ q1: ["a"] }, { q1: ["c"] }]);

    requests[1].resolve();
    await settle();
    expect(sent).toHaveLength(2);
});

test("a debounced change made during a save waits for its delay", async () => {
    const { queue, sent, requests } = setup();
    queue.saveNow({ q1: ["a"] });
    queue.saveDebounced({ q1: ["a"], q2: "x" });
    requests[0].resolve();
    await settle();
    expect(sent).toHaveLength(1);

    jest.advanceTimersByTime(800);
    expect(sent).toEqual([{ q1: ["a"] }, { q1: ["a"], q2: "x" }]);
});

test("a debounced save that becomes due during a save is sent after it", async () => {
    const { queue, sent, requests } = setup();
    queue.saveNow({ q1: ["a"] });
    queue.saveDebounced({ q1: ["a"], q2: "x" });
    jest.advanceTimersByTime(800);
    expect(sent).toHaveLength(1);

    requests[0].resolve();
    await settle();
    expect(sent).toEqual([{ q1: ["a"] }, { q1: ["a"], q2: "x" }]);
});

test("a failed save is reported and not retried until the next change", async () => {
    const { queue, sent, requests, errors } = setup();
    queue.saveNow({ q1: ["a"] });
    const err = new Error("network");
    requests[0].reject(err);
    await settle();
    expect(errors).toEqual([err]);
    jest.advanceTimersByTime(5000);
    expect(sent).toHaveLength(1);

    queue.saveNow({ q1: ["a"], q2: ["b"] });
    expect(sent).toEqual([{ q1: ["a"] }, { q1: ["a"], q2: ["b"] }]);
});

test("a save function that throws is reported and does not block later saves", async () => {
    const errors: unknown[] = [];
    let calls = 0;
    const queue = new PollSaveQueue({
        save: () => {
            calls++;
            if (calls === 1) {
                throw new Error("sync");
            }
            return Promise.resolve();
        },
        onError: (err) => errors.push(err),
    });
    queue.saveNow({ q1: ["a"] });
    await settle();
    expect(errors).toHaveLength(1);
    queue.saveNow({ q1: ["b"] });
    expect(calls).toBe(2);
});

test("dispose sends waiting answers and ignores later changes", async () => {
    const { queue, sent, requests } = setup();
    queue.saveDebounced({ q1: "typed" });
    queue.dispose();
    expect(sent).toEqual([{ q1: "typed" }]);

    queue.saveNow({ q1: "late" });
    queue.saveDebounced({ q1: "later" });
    requests[0].resolve();
    await settle();
    jest.advanceTimersByTime(1000);
    expect(sent).toHaveLength(1);
});

test("dispose during a save still sends the newest waiting answers after it", async () => {
    const { queue, sent, requests } = setup();
    queue.saveNow({ q1: ["a"] });
    queue.saveDebounced({ q1: ["a"], q2: "x" });
    queue.dispose();
    expect(sent).toHaveLength(1);

    requests[0].resolve();
    await settle();
    expect(sent).toEqual([{ q1: ["a"] }, { q1: ["a"], q2: "x" }]);
});
