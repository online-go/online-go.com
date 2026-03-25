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
import { Link, useNavigate, useParams } from "react-router-dom";
import * as data from "@/lib/data";
import { get, post, put } from "@/lib/requests";
import { _, pgettext, current_language, moment } from "@/lib/translate";
import { errorAlerter } from "@/lib/misc";
import { alert } from "@/lib/swal_config";
import { Markdown } from "@/components/Markdown";
import { useUser } from "@/lib/hooks";
import { UIPush } from "@/components/UIPush";
import { LoadingPage } from "@/components/Loading";
import "./WhatsNew.css";

const EMOJI_DISPLAY: Record<string, string> = {
    thumbs_up: "\uD83D\uDC4D",
    heart: "\u2764\uFE0F",
    rocket: "\uD83D\uDE80",
    tada: "\uD83C\uDF89",
};

const ALL_EMOJIS = Object.keys(EMOJI_DISPLAY);

interface NavLink {
    id: number;
    title: string;
}

interface WhatsNewPost {
    id: number;
    created_at: string;
    updated_at: string;
    title: string;
    content: string | null;
    reaction_counts: Record<string, number>;
    previous: NavLink | null;
    next: NavLink | null;
    user_reactions: string[];
}

export function WhatsNew(): React.ReactElement | null {
    const user = useUser();
    const navigate = useNavigate();
    const { postId: postIdParam } = useParams<"postId">();
    const [currentPost, setCurrentPost] = React.useState<WhatsNewPost | null>(null);
    const [reactionCounts, setReactionCounts] = React.useState<Record<string, number>>({});
    const [userReactions, setUserReactions] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [feedbackOpen, setFeedbackOpen] = React.useState(false);
    const [feedbackText, setFeedbackText] = React.useState("");
    const [feedbackSending, setFeedbackSending] = React.useState(false);
    const [feedbackSent, setFeedbackSent] = React.useState(false);
    const [originalPost, setOriginalPost] = React.useState<WhatsNewPost | null>(null);
    const [showOriginal, setShowOriginal] = React.useState(false);
    const feedbackSentTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const activePostIdRef = React.useRef<number | null>(null);
    const isTranslated = current_language !== "en";

    function applyPost(p: WhatsNewPost): void {
        activePostIdRef.current = p.id;
        setCurrentPost(p);
        setReactionCounts(p.reaction_counts || {});
        setUserReactions(p.user_reactions || []);
        void navigate(`/whats-new/${p.id}`, { replace: true });
    }

    function loadPost(id?: number): void {
        setLoading(true);
        setError(null);
        setOriginalPost(null);
        setShowOriginal(false);
        const idParam = id ? `&id=${id}` : "";
        get(`whats_new/?language=${encodeURIComponent(current_language)}${idParam}`)
            .then((data: WhatsNewPost[]) => {
                if (data.length > 0) {
                    applyPost(data[0]);

                    if (isTranslated) {
                        const postIdAtLoad = data[0].id;
                        get(`whats_new/?language=en${idParam}`)
                            .then((enData: WhatsNewPost[]) => {
                                if (enData.length > 0 && activePostIdRef.current === postIdAtLoad) {
                                    setOriginalPost(enData[0]);
                                }
                            })
                            .catch(console.error);
                    }
                }
            })
            .catch((err: unknown) => {
                setError(_("Failed to load post"));
                errorAlerter(err);
            })
            .finally(() => setLoading(false));
    }

    React.useEffect(() => {
        window.document.title = _("What's New");
        const targetId = postIdParam ? parseInt(postIdParam) : undefined;
        activePostIdRef.current = null;
        loadPost(targetId);

        setFeedbackOpen(false);
        setFeedbackText("");
        setFeedbackSending(false);
        setFeedbackSent(false);
        if (feedbackSentTimer.current) {
            clearTimeout(feedbackSentTimer.current);
            feedbackSentTimer.current = null;
        }

        // Mark as read if there's an unread whats_new in the config
        const config = data.get("config");
        if (config?.whats_new) {
            put("whats_new/mark_read/")
                .then(() => {
                    data.set("config", { ...config, whats_new: undefined });
                })
                .catch(errorAlerter);
        }

        return () => {
            if (feedbackSentTimer.current) {
                clearTimeout(feedbackSentTimer.current);
                feedbackSentTimer.current = null;
            }
        };
    }, [postIdParam]);

    function toggleReaction(emoji: string): void {
        if (!currentPost || user.anonymous) {
            return;
        }

        const wasReacted = userReactions.includes(emoji);
        const adding = !wasReacted;

        setReactionCounts((prev) => {
            const newCount = Math.max(0, (prev[emoji] || 0) + (adding ? 1 : -1));
            const newCounts = { ...prev };
            if (newCount > 0) {
                newCounts[emoji] = newCount;
            } else {
                delete newCounts[emoji];
            }
            return newCounts;
        });
        setUserReactions((prev) => (adding ? [...prev, emoji] : prev.filter((e) => e !== emoji)));

        post(`whats_new/${currentPost.id}/reactions/`, { emoji })
            .then((response: { action: string; emoji: string; counts: Record<string, number> }) => {
                setReactionCounts(response.counts);
            })
            .catch(errorAlerter);
    }

    function handleReactionCountsPush(data: { post_id: number; counts: Record<string, number> }) {
        if (data.post_id === currentPost?.id) {
            setReactionCounts(data.counts);
        }
    }

    function submitFeedback(): void {
        if (!currentPost || !feedbackText.trim()) {
            return;
        }
        const postIdAtSubmit = currentPost.id;
        setFeedbackSending(true);
        post(`whats_new/${currentPost.id}/feedback/`, { text: feedbackText })
            .then(() => {
                if (activePostIdRef.current !== postIdAtSubmit) {
                    return;
                }
                setFeedbackText("");
                setFeedbackOpen(false);
                setFeedbackSent(true);
                if (feedbackSentTimer.current) {
                    clearTimeout(feedbackSentTimer.current);
                }
                feedbackSentTimer.current = setTimeout(() => {
                    setFeedbackSent(false);
                    feedbackSentTimer.current = null;
                }, 3000);
            })
            .catch((err: unknown) => {
                if (activePostIdRef.current !== postIdAtSubmit) {
                    return;
                }
                const status = (err as { status?: number })?.status;
                if (status === 429) {
                    void alert.fire({ text: _("Rate limit reached. Please try again later.") });
                } else {
                    errorAlerter(err);
                }
            })
            .finally(() => {
                if (activePostIdRef.current !== postIdAtSubmit) {
                    return;
                }
                setFeedbackSending(false);
            });
    }

    if (loading) {
        return <LoadingPage />;
    }

    if (error || !currentPost) {
        return (
            <div className="WhatsNew">
                <div className="error">{error || _("No posts found")}</div>
            </div>
        );
    }

    return (
        <div className="WhatsNew">
            <UIPush
                channel={`whats-new-${currentPost.id}`}
                event="reaction-counts"
                action={handleReactionCountsPush}
            />

            <h1 className="post-title">
                {showOriginal && originalPost ? originalPost.title : currentPost.title}
            </h1>
            <div className="post-meta">{moment(currentPost.created_at).format("ll")}</div>
            <div className="post-body">
                <Markdown
                    source={
                        showOriginal && originalPost
                            ? (originalPost.content ?? "")
                            : (currentPost.content ?? "")
                    }
                />
            </div>
            {isTranslated && (
                <div className="translation-notice">
                    <span className="translation-notice-text">
                        {showOriginal
                            ? pgettext(
                                  "Label indicating the user is viewing the original English text of a post",
                                  "Original text",
                              )
                            : pgettext(
                                  "Label indicating the post has been automatically translated from English",
                                  "Auto-translated",
                              )}
                    </span>
                    <button
                        className="translation-toggle"
                        onClick={() => setShowOriginal(!showOriginal)}
                        disabled={!showOriginal && originalPost === null}
                    >
                        {showOriginal
                            ? pgettext(
                                  "Button to switch back to the translated version of a post",
                                  "Show translation",
                              )
                            : pgettext(
                                  "Button to view the original English version of a post",
                                  "Show original",
                              )}
                    </button>
                </div>
            )}
            <div className="reactions-bar">
                {ALL_EMOJIS.map((emoji) => {
                    const count = reactionCounts[emoji] || 0;
                    const active = count > 0;
                    const reacted = userReactions.includes(emoji);
                    return (
                        <button
                            key={emoji}
                            className={
                                "reaction-button" +
                                (active ? " active" : "") +
                                (reacted ? " reacted" : "")
                            }
                            onClick={() => toggleReaction(emoji)}
                            disabled={user.anonymous}
                            title={emoji.replace(/_/g, " ")}
                        >
                            <span className="reaction-emoji">{EMOJI_DISPLAY[emoji]}</span>
                            <span className="reaction-count">{count > 0 ? count : "\u00A0"}</span>
                        </button>
                    );
                })}
                {!user.anonymous && (
                    <button
                        className={"feedback-toggle" + (feedbackOpen ? " active" : "")}
                        onClick={() => {
                            const opening = !feedbackOpen;
                            setFeedbackOpen(opening);
                            if (opening && feedbackSent) {
                                setFeedbackSent(false);
                                if (feedbackSentTimer.current) {
                                    clearTimeout(feedbackSentTimer.current);
                                    feedbackSentTimer.current = null;
                                }
                            }
                        }}
                        title={_("Send feedback")}
                    >
                        <i className="fa fa-reply" />
                    </button>
                )}
            </div>
            {feedbackOpen && (
                <div className="feedback-form">
                    <textarea
                        className="feedback-textarea"
                        placeholder={_("Tell the team what you think")}
                        value={feedbackText}
                        onChange={(ev) => setFeedbackText(ev.target.value.slice(0, 2048))}
                        maxLength={2048}
                        rows={3}
                    />
                    <button
                        className="primary feedback-send"
                        onClick={submitFeedback}
                        disabled={feedbackSending || !feedbackText.trim()}
                    >
                        {feedbackSending ? _("Sending...") : _("Send")}
                    </button>
                </div>
            )}
            {feedbackSent && (
                <div className="feedback-confirmation">{_("Feedback sent. Thank you!")}</div>
            )}
            {(currentPost.next || currentPost.previous) && (
                <div className="post-nav">
                    <span>
                        {currentPost.next && (
                            <Link to={`/whats-new/${currentPost.next.id}`}>
                                <i className="fa fa-chevron-left" /> {currentPost.next.title}
                            </Link>
                        )}
                    </span>
                    <span>
                        {currentPost.previous && (
                            <Link to={`/whats-new/${currentPost.previous.id}`}>
                                {currentPost.previous.title} <i className="fa fa-chevron-right" />
                            </Link>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
}
