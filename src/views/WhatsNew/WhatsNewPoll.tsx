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
import { Link } from "react-router-dom";
import { put } from "@/lib/requests";
import { pgettext } from "@/lib/translate";
import { useUser } from "@/lib/hooks";
import { PollSaveQueue } from "./pollSaveQueue";
import { recallPollAnswers, rememberPollAnswers } from "./pollAnswerMemory";
import { visiblePollQuestions } from "./pollVisibility";
import { WhatsNewPollQuestion } from "./WhatsNewPollQuestion";
import type {
    WhatsNewPoll as WhatsNewPollData,
    WhatsNewPollAnswer,
    WhatsNewPollAnswers,
} from "./types";
import "./WhatsNewPoll.css";

interface WhatsNewPollProps {
    postId: number;
    /** The poll to display. This can change language without resetting the answers. */
    poll: WhatsNewPollData;
    initialAnswers: WhatsNewPollAnswers | null;
}

type SubmitStatus = "idle" | "saving" | "saved" | "error";

export function WhatsNewPoll({
    postId,
    poll,
    initialAnswers,
}: WhatsNewPollProps): React.ReactElement {
    const user = useUser();
    const [answers, setAnswers] = React.useState<WhatsNewPollAnswers>(
        () => recallPollAnswers(postId) ?? initialAnswers ?? {},
    );
    const answersRef = React.useRef(answers);
    const queueRef = React.useRef<PollSaveQueue | null>(null);
    const [submitStatus, setSubmitStatus] = React.useState<SubmitStatus>("idle");

    React.useEffect(() => {
        const queue = new PollSaveQueue({
            save: (a) => put(`whats_new/${postId}/poll/response/`, { answers: a }),
            onError: (err) => console.error(err),
        });
        queueRef.current = queue;
        const onPageHide = () => queue.flush();
        window.addEventListener("pagehide", onPageHide);
        return () => {
            window.removeEventListener("pagehide", onPageHide);
            queue.dispose();
            if (queueRef.current === queue) {
                queueRef.current = null;
            }
        };
    }, [postId]);

    const disabled = user.anonymous || !poll.is_open;

    function updateAnswer(
        questionId: string,
        value: WhatsNewPollAnswer | null,
    ): WhatsNewPollAnswers {
        const next = { ...answersRef.current };
        if (value === null || (typeof value !== "number" && value.length === 0)) {
            delete next[questionId];
        } else {
            next[questionId] = value;
        }
        answersRef.current = next;
        rememberPollAnswers(postId, next);
        setAnswers(next);
        setSubmitStatus("idle");
        return next;
    }

    function onChoicesChange(questionId: string, choices: string[]): void {
        if (disabled) {
            return;
        }
        queueRef.current?.saveNow(updateAnswer(questionId, choices));
    }

    function onScaleChange(questionId: string, value: number | null): void {
        if (disabled) {
            return;
        }
        queueRef.current?.saveNow(updateAnswer(questionId, value));
    }

    function onTextChange(questionId: string, text: string): void {
        if (disabled) {
            return;
        }
        queueRef.current?.saveDebounced(updateAnswer(questionId, text));
    }

    function onTextBlur(): void {
        queueRef.current?.flush();
    }

    function onSubmit(): void {
        const queue = queueRef.current;
        if (disabled || !queue) {
            return;
        }
        setSubmitStatus("saving");
        queue.submit(answersRef.current).then(
            () => setSubmitStatus("saved"),
            () => setSubmitStatus("error"),
        );
    }

    const questions = visiblePollQuestions(poll.questions, answers);

    return (
        <div className="WhatsNewPoll">
            {user.anonymous ? (
                <div className="poll-note">
                    <Link to={`/sign-in#/whats-new/${postId}`}>
                        {pgettext(
                            "Link shown on a What's New poll to users who are not signed in",
                            "Sign in to answer this poll",
                        )}
                    </Link>
                </div>
            ) : (
                !poll.is_open && (
                    <div className="poll-note">
                        {pgettext(
                            "Note shown on a What's New poll that no longer accepts answers",
                            "This poll is closed",
                        )}
                    </div>
                )
            )}
            {questions.map((question) => (
                <WhatsNewPollQuestion
                    key={question.id}
                    question={question}
                    value={answers[question.id]}
                    disabled={disabled}
                    onChoicesChange={onChoicesChange}
                    onScaleChange={onScaleChange}
                    onTextChange={onTextChange}
                    onTextBlur={onTextBlur}
                />
            ))}
            {!disabled && (
                <div className="poll-submit">
                    <button
                        type="button"
                        className="primary"
                        onClick={onSubmit}
                        disabled={submitStatus === "saving" || Object.keys(answers).length === 0}
                    >
                        {pgettext("Button to submit answers to a What's New poll", "Submit")}
                    </button>
                    {submitStatus === "saved" && (
                        <span className="poll-submit-status">
                            {pgettext(
                                "Message shown after What's New poll answers are saved",
                                "Thank you, your answers are saved",
                            )}
                        </span>
                    )}
                    {submitStatus === "error" && (
                        <span className="poll-submit-status error">
                            {pgettext(
                                "Message shown when What's New poll answers could not be saved",
                                "Your answers could not be saved. Please try again.",
                            )}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
