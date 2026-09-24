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

import { visiblePollQuestions } from "./pollVisibility";
import type { WhatsNewPollQuestion } from "./types";

const questions: WhatsNewPollQuestion[] = [
    {
        id: "q1",
        type: "single",
        text: "Do you play?",
        choices: [
            { id: "yes", label: "Yes" },
            { id: "no", label: "No" },
        ],
    },
    {
        id: "q2",
        type: "multiple",
        text: "Which sizes?",
        choices: [
            { id: "s19", label: "19x19" },
            { id: "s13", label: "13x13" },
            { id: "s9", label: "9x9" },
        ],
        show_if: { question: "q1", choices: ["yes"] },
    },
    {
        id: "q3",
        type: "text",
        text: "Why small boards?",
        show_if: { question: "q2", choices: ["s13", "s9"] },
    },
    { id: "q4", type: "text", text: "Anything else?" },
];

function ids(answers: Record<string, string[] | string>): string[] {
    return visiblePollQuestions(questions, answers).map((q) => q.id);
}

test("questions without a condition are always visible", () => {
    expect(ids({})).toEqual(["q1", "q4"]);
});

test("a condition is met when the answer contains a listed choice", () => {
    expect(ids({ q1: ["yes"] })).toEqual(["q1", "q2", "q4"]);
    expect(ids({ q1: ["no"] })).toEqual(["q1", "q4"]);
});

test("any one of the listed choices meets the condition", () => {
    expect(ids({ q1: ["yes"], q2: ["s19"] })).toEqual(["q1", "q2", "q4"]);
    expect(ids({ q1: ["yes"], q2: ["s19", "s9"] })).toEqual(["q1", "q2", "q3", "q4"]);
    expect(ids({ q1: ["yes"], q2: ["s13"] })).toEqual(["q1", "q2", "q3", "q4"]);
});

test("a question is hidden when the question it depends on is hidden", () => {
    expect(ids({ q1: ["no"], q2: ["s9"], q3: "kept" })).toEqual(["q1", "q4"]);
});

test("a text answer never meets a condition", () => {
    const withText: WhatsNewPollQuestion[] = [
        { id: "t", type: "text", text: "Free" },
        { id: "d", type: "text", text: "Dependent", show_if: { question: "t", choices: ["x"] } },
    ];
    expect(visiblePollQuestions(withText, { t: "x" }).map((q) => q.id)).toEqual(["t"]);
});

test("display order is kept", () => {
    expect(ids({ q1: ["yes"], q2: ["s9"] })).toEqual(["q1", "q2", "q3", "q4"]);
});

describe("after_previous", () => {
    const progressive: WhatsNewPollQuestion[] = [
        ...questions,
        { id: "last", type: "scale", text: "Overall?", after_previous: true },
    ];
    const ids = (answers: Record<string, string[] | string | number>) =>
        visiblePollQuestions(progressive, answers).map((q) => q.id);

    test("waits until every visible earlier question is answered", () => {
        expect(ids({})).not.toContain("last");
        expect(ids({ q1: ["no"] })).not.toContain("last");
        expect(ids({ q1: ["no"], q4: "fine" })).toContain("last");
        expect(ids({ q1: ["yes"], q4: "fine" })).not.toContain("last");
        expect(ids({ q1: ["yes"], q2: ["s19"], q4: "fine" })).toContain("last");
    });

    test("does not count whitespace as a text answer", () => {
        const withText: WhatsNewPollQuestion[] = [
            { id: "t", type: "text", text: "Why?" },
            { id: "next", type: "single", text: "Next", choices: [], after_previous: true },
        ];
        expect(visiblePollQuestions(withText, { t: "  " }).map((q) => q.id)).toEqual(["t"]);
        expect(visiblePollQuestions(withText, { t: "ok" }).map((q) => q.id)).toEqual(["t", "next"]);
    });
});
