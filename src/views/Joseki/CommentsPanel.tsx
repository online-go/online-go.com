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
import { _, pgettext } from "@/lib/translate";
import { get, post } from "@/lib/requests";
import { AutoTranslate } from "@/components/AutoTranslate";
import { Player } from "@/components/Player";
import { Throbber } from "@/components/Throbber";
import { chat_manager } from "@/lib/chat_manager";
import { server_url, applyJosekiMarkdown } from "./joseki-utils";

interface Comment {
    user_id: string;
    date: Date;
    comment: string;
}

interface CommentsPanelProps {
    position_id: string;
    can_comment: boolean;
}

export function CommentsPanel(props: CommentsPanelProps): React.ReactElement {
    const [commentary, set_commentary] = React.useState<Comment[]>([]);
    const [next_comment, set_next_comment] = React.useState("");
    const [throb, set_throb] = React.useState(false);

    const extractCommentary = React.useCallback(
        (commentary_dto: {
            commentary: Array<{ user_id: string; date: string; comment: string }>;
            forum_thread_id: string | null;
        }) => {
            const comments = commentary_dto.commentary.map((c) => ({
                user_id: c.user_id,
                date: new Date(c.date),
                comment: c.comment,
            }));
            set_commentary(comments);
        },
        [],
    );

    React.useEffect(() => {
        if (!props.position_id) {
            return;
        }
        let cancelled = false;
        set_throb(true);
        get(server_url + "commentary?id=" + props.position_id)
            .then((body) => {
                if (cancelled) {
                    return;
                }
                extractCommentary(body);
            })
            .catch((r) => {
                if (!cancelled) {
                    console.log("Comments GET failed:", r);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    set_throb(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [props.position_id, extractCommentary]);

    const onCommentChange = React.useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            // Newline submits — no Send button to keep the narrow column tidy.
            if (/\r|\n/.exec(e.target.value) && e.target.value.length > 1) {
                const comment_url = server_url + "comment?id=" + props.position_id;
                const comment = next_comment;
                post(comment_url, { comment })
                    .then((body) => {
                        extractCommentary(body);
                        // chat_manager.join() creates a fresh ChatChannelProxy
                        // every call; .part() releases its listeners so we
                        // don't accumulate proxies for every comment posted.
                        const proxy = chat_manager.join("global-joseki");
                        proxy.channel.send(`/me said at joseki ${props.position_id}: "${comment}"`);
                        proxy.part();
                    })
                    .catch((r) => console.log("Comment POST failed:", r));
                set_next_comment("");
            } else if (e.target.value.length < 200 && props.can_comment) {
                set_next_comment(e.target.value);
            }
        },
        [props.position_id, props.can_comment, next_comment, extractCommentary],
    );

    return (
        <div className="discussion-container">
            <div className="discussion-lines">
                <Throbber throb={throb} />
                {commentary.length === 0 && !throb && (
                    <div className="no-comments">
                        {pgettext("Joseki comments empty state", "No comments yet — be the first.")}
                    </div>
                )}
                {commentary.map((comment, idx) => (
                    <div className="comment" key={idx}>
                        <div className="comment-header">
                            <Player user={parseInt(comment.user_id)} />
                            <div className="comment-date">{comment.date.toDateString()}</div>
                        </div>
                        <AutoTranslate
                            className="comment-text"
                            source={applyJosekiMarkdown(comment.comment)}
                        />
                    </div>
                ))}
            </div>
            {props.can_comment && (
                <textarea
                    className="comment-input"
                    rows={2}
                    value={next_comment}
                    onChange={onCommentChange}
                    placeholder={pgettext("Joseki comment composer", "Add a comment…")}
                />
            )}
            {!props.can_comment && (
                <div className="comment-input-disabled">{_("Sign in to leave a comment.")}</div>
            )}
        </div>
    );
}
