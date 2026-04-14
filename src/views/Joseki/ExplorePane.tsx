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

import { _ } from "@/lib/translate";
import { get, post } from "@/lib/requests";
import { AutoTranslate } from "@/components/AutoTranslate";
import { Player } from "@/components/Player";
import { JosekiVariationFilter, JosekiFilter } from "@/components/JosekiVariationFilter";
import { OJEJosekiTag } from "@/components/JosekiTagSelector";
import { Throbber } from "@/components/Throbber";
import { chat_manager } from "@/lib/chat_manager";
import { server_url, applyJosekiMarkdown } from "./joseki-utils";

interface Comment {
    user_id: string;
    date: Date;
    comment: string;
}

export interface ExploreProps {
    position_id: string;
    description: string;
    position_type: string;
    see_also: number[];
    comment_count: number;
    can_comment: boolean;
    joseki_source: { url: string; description: string };
    joseki_tags: OJEJosekiTag[];
    tags: Array<{ description: string; group: number; id: number; [key: string]: string | number }>;
    set_variation_filter(filter: JosekiFilter): void;
    current_filter: JosekiFilter;
    child_count: number;
    show_comments: boolean;
}

type ExtraInfoPane = "none" | "variation-filter" | "comments" | "audit-log";

export function ExplorePane(props: ExploreProps): React.ReactElement {
    const [extra_info_selected, set_extra_info_selected] = React.useState<ExtraInfoPane>("none");
    const [commentary, set_commentary] = React.useState<Comment[]>([]);
    const [audit_log, set_audit_log] = React.useState<Comment[]>([]);
    const [next_comment, set_next_comment] = React.useState("");
    const [extra_throb, set_extra_throb] = React.useState(false);

    const prev_position_id = React.useRef(props.position_id);

    const extractCommentary = React.useCallback(
        (commentary_dto: {
            commentary: Array<{ user_id: string; date: string; comment: string }>;
            forum_thread_id: string | null;
        }) => {
            const comments = commentary_dto.commentary.map((comment) => ({
                user_id: comment.user_id,
                date: new Date(comment.date),
                comment: comment.comment,
            }));
            set_commentary(comments);
        },
        [],
    );

    const showComments = React.useCallback(() => {
        const comments_url = server_url + "commentary?id=" + props.position_id;
        set_extra_throb(true);

        get(comments_url)
            .then((body) => {
                extractCommentary(body);
            })
            .catch((r) => {
                console.log("Comments GET failed:", r);
            })
            .finally(() => {
                set_extra_throb(false);
            });
        set_extra_info_selected("comments");
    }, [props.position_id, extractCommentary]);

    const showAuditLog = React.useCallback(() => {
        const audits_url = server_url + "audits?id=" + props.position_id;
        set_extra_throb(true);
        get(audits_url)
            .then((body) => {
                set_audit_log(body);
            })
            .catch((r) => {
                console.log("Audits GET failed:", r);
            })
            .finally(() => {
                set_extra_throb(false);
            });

        set_extra_info_selected("audit-log");
    }, [props.position_id]);

    const showFilterSelector = React.useCallback(() => {
        set_extra_info_selected("variation-filter");
    }, []);

    const hideExtraInfo = React.useCallback(() => {
        set_extra_info_selected("none");
    }, []);

    // Mount-only: matches original componentDidMount behavior.
    // Intentionally omits deps -- this should only run once on mount.
    React.useEffect(() => {
        if (props.show_comments) {
            showComments();
        } else {
            showFilterSelector();
        }
    }, []);

    // On position change, reset to filter selector; or auto-show comments if requested
    React.useEffect(() => {
        if (prev_position_id.current !== props.position_id) {
            prev_position_id.current = props.position_id;
            showFilterSelector();
        } else if (props.position_id && props.show_comments && extra_info_selected === "none") {
            showComments();
        }
    }, [
        props.position_id,
        props.show_comments,
        extra_info_selected,
        showComments,
        showFilterSelector,
    ]);

    const postCommentToChat = React.useCallback((comment: string, position_url: string) => {
        const proxy = chat_manager.join("global-joseki");
        proxy.channel.send(`/me said at ${position_url}: "${comment}"`);
    }, []);

    const onCommentChange = React.useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (/\r|\n/.exec(e.target.value) && e.target.value.length > 1) {
                const comment_url = server_url + "comment?id=" + props.position_id;
                const comment = next_comment;
                post(comment_url, { comment })
                    .then((body) => {
                        extractCommentary(body);
                        postCommentToChat(comment, `joseki ${props.position_id}`);
                    })
                    .catch((r) => {
                        console.log("Comment PUT failed:", r);
                    });

                set_next_comment("");
            } else if (e.target.value.length < 200 && props.can_comment) {
                set_next_comment(e.target.value);
            }
        },
        [props.position_id, props.can_comment, next_comment, extractCommentary, postCommentToChat],
    );

    const filter_active =
        (props.current_filter.tags && props.current_filter.tags.length !== 0) ||
        props.current_filter.contributor ||
        props.current_filter.source;

    const description = applyJosekiMarkdown(props.description);

    return (
        <div className="explore-pane">
            <div className="description-column">
                {props.position_type !== "new" ? (
                    <div className="position-description">
                        <AutoTranslate source={description} source_language={"en"} markdown />
                    </div>
                ) : (
                    "" // "(new)"
                )}
                {(props.see_also.length !== 0 || null) && (
                    <div className="see-also-block">
                        <div>{_("See also:")}</div>
                        {props.see_also.map((node, index) => (
                            <Link key={index} to={"/joseki/" + node}>
                                {node}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <div className={"extra-info-column extra-info-open"}>
                <div className={"btn-group extra-info-selector"}>
                    <button
                        className={
                            "btn s " +
                            (extra_info_selected === "variation-filter" ? " primary" : "")
                        }
                        onClick={
                            extra_info_selected === "variation-filter"
                                ? hideExtraInfo
                                : showFilterSelector
                        }
                    >
                        <span>
                            {_("Filter") +
                                (extra_info_selected !== "variation-filter" && filter_active
                                    ? " *"
                                    : "")}
                        </span>
                        {extra_info_selected === "variation-filter" ? (
                            <i className={"fa fa-filter hide"} />
                        ) : (
                            <i
                                className={"fa fa-filter" + (filter_active ? " filter-active" : "")}
                            />
                        )}
                    </button>
                    <button
                        className={
                            "btn s " + (extra_info_selected === "comments" ? " primary" : "")
                        }
                        onClick={extra_info_selected === "comments" ? hideExtraInfo : showComments}
                    >
                        {_("Comments")} ({props.comment_count})
                    </button>
                    <button
                        className={
                            "btn s " + (extra_info_selected === "audit-log" ? " primary" : "")
                        }
                        onClick={extra_info_selected === "audit-log" ? hideExtraInfo : showAuditLog}
                    >
                        {_("Changes")}
                    </button>
                </div>

                {extra_info_selected === "comments" && (
                    <div className="discussion-container">
                        <div className="discussion-lines">
                            <Throbber throb={extra_throb} />
                            {commentary.map((comment, idx) => (
                                <div className="comment" key={idx}>
                                    <div className="comment-header">
                                        <Player user={parseInt(comment.user_id)}></Player>
                                        <div className="comment-date">
                                            {comment.date.toDateString()}
                                        </div>
                                    </div>
                                    <AutoTranslate
                                        className="comment-text"
                                        source={applyJosekiMarkdown(comment.comment)}
                                    />
                                </div>
                            ))}
                        </div>
                        <textarea
                            className="comment-input"
                            hidden={!props.can_comment}
                            rows={1}
                            value={next_comment}
                            onChange={onCommentChange}
                        />
                    </div>
                )}

                {extra_info_selected === "audit-log" && (
                    <div className="audit-container">
                        <Throbber throb={extra_throb} />
                        {audit_log.map((audit, idx) => (
                            <div className="audit-entry" key={idx}>
                                <div className="audit-header">
                                    <Player user={parseInt(audit.user_id)}></Player>
                                    <div className="audit-date">
                                        {new Date(audit.date).toDateString()}
                                    </div>
                                </div>
                                {audit.comment}
                            </div>
                        ))}
                    </div>
                )}

                {extra_info_selected === "variation-filter" && (
                    <div className={"filter-container" + (filter_active ? " filter-active" : "")}>
                        <JosekiVariationFilter
                            contributor_list_url={server_url + "contributors"}
                            source_list_url={
                                server_url + "josekisources" /* cspell: disable-line */
                            }
                            current_filter={props.current_filter}
                            set_variation_filter={props.set_variation_filter}
                            joseki_tags={props.joseki_tags}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
