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
import { PeerReviewFeedbackPanel } from "./PeerReviewFeedbackPanel";
import * as api from "@/views/PeerReview/api";

jest.mock("@/lib/translate", () => ({
    _: (s: string) => s,
    pgettext: (_c: string, s: string) => s,
    interpolate: (s: string, p: Record<string, unknown>) =>
        s.replace(/{{(\w+)}}/g, (_m, k) => String(p[k])),
    moment: () => ({ fromNow: () => "in 2 days" }),
}));
jest.mock("@/views/PeerReview/api", () => ({
    fetchReviewFeedbackStatus: jest.fn(),
    markReviewSeen: jest.fn(),
    saveFeedback: jest.fn(),
    markFeedbackDelivered: jest.fn(),
}));
jest.mock("@/components/Errcode", () => ({
    format_message: (m: { message_id: string }) => m.message_id,
}));

const mocked = api as jest.Mocked<typeof api>;
const base = {
    request_id: 5,
    state: "submitted" as const,
    review_seen_at: null,
    feedback_due_at: null,
    max_chars: 20,
    feedback: null,
};

async function flush() {
    await act(async () => {
        await Promise.resolve();
    });
}

test("renders nothing when the request is not submitted and does not mark seen", async () => {
    mocked.fetchReviewFeedbackStatus.mockResolvedValue({
        ...base,
        role: "requester",
        state: "claimed",
    });
    const { container } = render(<PeerReviewFeedbackPanel reviewId={77} />);
    await flush();
    expect(container.querySelector(".PeerReviewFeedbackPanel")).toBeNull();
    expect(mocked.markReviewSeen).not.toHaveBeenCalled();
});

test("requester: marks seen once, saves a rating, then shows delivered", async () => {
    mocked.fetchReviewFeedbackStatus.mockResolvedValue({ ...base, role: "requester" });
    const seen = {
        ...base,
        role: "requester" as const,
        review_seen_at: "2026-10-27T12:00:00Z",
        feedback_due_at: "2026-10-29T12:00:00Z",
    };
    mocked.markReviewSeen.mockResolvedValue(seen);
    mocked.saveFeedback.mockResolvedValue({
        ...seen,
        feedback: { score: 4, text: "nice", none_provided: false, delivered: false },
    });
    render(<PeerReviewFeedbackPanel reviewId={77} />);
    await flush();
    expect(mocked.markReviewSeen).toHaveBeenCalledWith(5);
    fireEvent.click(screen.getAllByRole("radio")[3]);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "nice" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await flush();
    expect(mocked.saveFeedback).toHaveBeenCalledWith(5, 4, "nice");
    expect(screen.getByText("Saved")).toBeTruthy();
});

test("reviewer: shows the feedback and marks it delivered once", async () => {
    mocked.fetchReviewFeedbackStatus.mockResolvedValue({
        ...base,
        role: "reviewer",
        feedback: { score: 5, text: "thanks", none_provided: false, delivered: false },
    });
    mocked.markFeedbackDelivered.mockResolvedValue({
        ...base,
        role: "reviewer",
        feedback: { score: 5, text: "thanks", none_provided: false, delivered: true },
    });
    render(<PeerReviewFeedbackPanel reviewId={77} />);
    await flush();
    expect(screen.getByText("thanks")).toBeTruthy();
    expect(mocked.markFeedbackDelivered).toHaveBeenCalledTimes(1);
});
