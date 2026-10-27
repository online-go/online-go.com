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
import { format_message } from "@/components/Errcode";
import type { MessageId } from "@/lib/messages";
import { errorAlerter, ignore } from "@/lib/misc";
import { _, interpolate, moment, pgettext } from "@/lib/translate";
import {
    fetchReviewFeedbackStatus,
    markFeedbackDelivered,
    markReviewSeen,
    saveFeedback,
} from "@/views/PeerReview/api";
import { StarRating } from "@/views/PeerReview/StarRating";
import type { ReviewFeedbackStatus } from "@/views/PeerReview/types";
import "./PeerReviewFeedbackPanel.css";

interface PeerReviewFeedbackPanelProps {
    reviewId: number;
}

/** On a peer review: the requester rates it here; the reviewer reads the rating here. Nothing for anyone else. */
export function PeerReviewFeedbackPanel({
    reviewId,
}: PeerReviewFeedbackPanelProps): React.ReactElement | null {
    const [status, setStatus] = React.useState<ReviewFeedbackStatus | null>(null);
    const [score, setScore] = React.useState<number | null>(null);
    const [text, setText] = React.useState("");
    const [saved, setSaved] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const touched = React.useRef(false);

    const apply = React.useCallback((s: ReviewFeedbackStatus) => {
        setStatus(s);
        if (s.feedback) {
            setScore(s.feedback.score);
            setText(s.feedback.text);
        }
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        fetchReviewFeedbackStatus(reviewId)
            .then((s) => {
                if (cancelled) {
                    return;
                }
                if (s.state !== "submitted") {
                    setStatus(null);
                    return;
                }
                if (s.role === "requester" && s.review_seen_at === null && !touched.current) {
                    touched.current = true;
                    markReviewSeen(s.request_id).then(apply).catch(ignore);
                } else if (
                    s.role === "reviewer" &&
                    s.feedback &&
                    !s.feedback.delivered &&
                    !touched.current
                ) {
                    touched.current = true;
                    markFeedbackDelivered(s.request_id).then(apply).catch(ignore);
                }
                apply(s);
            })
            .catch(ignore);
        return () => {
            cancelled = true;
        };
    }, [reviewId, apply]);

    if (!status || status.state !== "submitted") {
        return null;
    }

    if (status.role === "reviewer") {
        const fb = status.feedback;
        return (
            <div className="PeerReviewFeedbackPanel reviewer">
                <h4>
                    {pgettext(
                        "Heading over the requester's rating of a peer review",
                        "Requester feedback",
                    )}
                </h4>
                {!fb ? (
                    <p>{_("Awaiting feedback")}</p>
                ) : fb.none_provided ? (
                    <p>{_("No feedback given")}</p>
                ) : (
                    <>
                        <StarRating value={fb.score} readOnly />
                        {fb.text && <p className="text">{fb.text}</p>}
                    </>
                )}
            </div>
        );
    }

    const fb = status.feedback;
    const closed =
        status.feedback_due_at !== null && new Date(status.feedback_due_at).getTime() <= Date.now();
    const frozen = (fb !== null && (fb.delivered || fb.none_provided)) || (closed && fb === null);
    const save = () => {
        if (score === null) {
            return;
        }
        setBusy(true);
        saveFeedback(status.request_id, score, text)
            .then((s) => {
                apply(s);
                setSaved(true);
            })
            .catch(errorAlerter)
            .finally(() => setBusy(false));
    };
    return (
        <div className="PeerReviewFeedbackPanel requester">
            <h4>
                {pgettext(
                    "Heading over the form where a requester rates a peer review",
                    "Rate this review",
                )}
            </h4>
            <StarRating
                value={score}
                onChange={
                    frozen
                        ? undefined
                        : (n) => {
                              setScore(n);
                              setSaved(false);
                          }
                }
                readOnly={frozen}
            />
            {frozen ? (
                <p className="state">
                    {fb && fb.delivered ? _("Delivered") : _("The feedback window has closed")}
                </p>
            ) : (
                <>
                    <textarea
                        value={text}
                        maxLength={status.max_chars}
                        onChange={(e) => {
                            setText(e.target.value);
                            setSaved(false);
                        }}
                        placeholder={_(
                            "Feedback or questions for the reviewer (only they will see this)",
                        )}
                    />
                    <div className="row">
                        <span className="count">
                            {interpolate(_("{{used}} / {{max}}"), {
                                used: text.length,
                                max: status.max_chars,
                            })}
                        </span>
                        {status.feedback_due_at && (
                            <span className="due">
                                {interpolate(_("Feedback closes {{when}}"), {
                                    when: moment(status.feedback_due_at).fromNow(),
                                })}
                            </span>
                        )}
                        <button
                            className="primary"
                            disabled={busy || score === null}
                            onClick={save}
                        >
                            {pgettext("Save a peer review rating", "Save")}
                        </button>
                        {saved && <span className="saved">{_("Saved")}</span>}
                    </div>
                </>
            )}
            {status.feedback_due_at === null && (
                <p className="state">
                    {format_message({ message_id: "peer_review_feedback_not_open" as MessageId })}
                </p>
            )}
        </div>
    );
}
