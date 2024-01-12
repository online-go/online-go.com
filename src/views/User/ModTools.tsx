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
import { PaginatedTable } from "PaginatedTable";
import { Card } from "material";
import * as moment from "moment";
import { Player } from "Player";
import { openModal } from "Modal";
import { NotesModal } from "NotesModal";
import { _ } from "translate";
import { Link } from "react-router-dom";
import { chat_markup } from "Chat";
import { errorAlerter } from "misc";
import { put, get } from "requests";
import { IPDetails } from "Moderator";
import { usePreference } from "preferences";

interface ModToolsProps {
    user_id: number;
    show_mod_log: boolean;
    collapse_same_users?: boolean;
}

export function ModTools(props: ModToolsProps): JSX.Element | null {
    const [hide_moderator_controls] = usePreference("moderator.hide-profile-information");
    const [aliases, setAliases] = React.useState<any[]>([]);
    const moderator_note = React.useRef<HTMLTextAreaElement>(null);
    const addModeratorNote = async () => {
        const txt = moderator_note.current?.value.trim() ?? "";

        if (txt.length < 2) {
            moderator_note.current?.focus();
            return;
        }

        if (moderator_note.current !== null) {
            moderator_note.current.value = "";
        }

        try {
            await put(`players/${props.user_id}/moderate`, {
                moderation_note: txt,
            });
        } catch (e) {
            errorAlerter(e);
        }
    };
    const moderator_log_anchor = React.useRef<HTMLDivElement>(null);
    /*
    React.useEffect(() => {
        if (props.show_mod_log && moderator_log_anchor.current !== null) {
            moderator_log_anchor.current.scrollIntoView();
        }
    });
    */

    React.useEffect(() => {
        if (props.collapse_same_users) {
            get(`players/${props.user_id}/aliases/`, { page_size: 100 })
                .then((data: any) => {
                    const aliases = data.results;
                    setAliases(aliases);
                })
                .catch(errorAlerter);
        }
    }, [props.user_id, props.collapse_same_users]);

    if (hide_moderator_controls) {
        return null;
    }

    return (
        <Card className="ModTools">
            {" "}
            {props.collapse_same_users ? (
                <div>
                    <b>Aliases: </b>
                    {aliases.map((alias, idx) => (
                        <React.Fragment key={alias.username}>
                            {idx > 0 ? ", " : ""}
                            <Player user={alias} />
                        </React.Fragment>
                    ))}
                </div>
            ) : (
                <div>
                    <b>Users with the same IP or Browser ID</b>
                    <PaginatedTable
                        className="aliases"
                        name="aliases"
                        source={`players/${props.user_id}/aliases/`}
                        columns={[
                            {
                                header: "Registered",
                                className: "date",
                                render: (X) => moment(X.registration_date).format("YYYY-MM-DD"),
                            },
                            {
                                header: "Last Login",
                                className: "date",
                                render: (X) => moment(X.last_login).format("YYYY-MM-DD"),
                            },
                            {
                                header: "Browser ID",
                                sortable: true,
                                className: "browser_id",
                                render: (X) => X.last_browser_id,
                            },
                            {
                                header: "User",
                                className: "user",
                                render: (X) => (
                                    <span>
                                        <Player user={X} />
                                        {(X.has_notes || null) && (
                                            <i
                                                className="fa fa-file-text-o clickable"
                                                onClick={() => openNotes(X.moderator_notes)}
                                            />
                                        )}
                                    </span>
                                ),
                            },
                            {
                                header: "Banned",
                                className: "banned",
                                render: (X) => (X.is_banned ? _("Yes") : _("No")),
                            },
                            {
                                header: "Shadowbanned",
                                className: "banned",
                                render: (X) => (X.is_shadowbanned ? _("Yes") : _("No")),
                            },
                            {
                                header: "Timezone",
                                className: "timezone",
                                render: (X) => X.last_timezone_offset / -60,
                            },
                            {
                                header: "Inet",
                                className: "inet",
                                render: (X) => (
                                    <a
                                        href={
                                            "https://online-go.com/api/v1/moderation/recent_users?id=" +
                                            X.id
                                        }
                                        target={"_blank"}
                                    >
                                        <IPDetails ip={X.last_ip} details={X.ip_details} />
                                    </a>
                                ),
                            },
                            {
                                header: "Shared BIDs",
                                className: "bid_match",
                                render: (X) => X.bid_match && <i className="fa fa-check" />,
                            },
                        ]}
                    />
                </div>
            )}
            <b>Mod log</b>
            <div id="leave-moderator-note" ref={moderator_log_anchor}>
                <textarea ref={moderator_note} placeholder="Leave note" id="moderator-note" />
                <button onClick={addModeratorNote}>Add note</button>
            </div>
            <PaginatedTable
                className="moderator-log"
                name="moderator-log"
                source={`moderation?player_id=${props.user_id}`}
                pageSizeOptions={[1, 2, 3, 5, 7, 10, 20, 25, 50, 100]}
                uiPushProps={{
                    event: `modlog-${props.user_id}-updated`,
                    channel: "moderators",
                }}
                columns={[
                    {
                        header: "",
                        className: "date",
                        render: (X) => moment(X.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                    },
                    {
                        header: "",
                        className: "",
                        render: (X) => {
                            return X?.moderator?.id ? <Player user={X.moderator} /> : "-";
                        },
                    },
                    {
                        header: "",
                        className: "",
                        render: (X) => (
                            <div>
                                <div className="action">
                                    {X.incident_report?.id ? (
                                        <Link to={`/reports-center/all/${X.incident_report.id}`}>
                                            R{X.incident_report.id.toString().substr(-3)}
                                        </Link>
                                    ) : null}
                                    {X.game ? (
                                        <Link to={`/game/${X.game.id}`}>{X.game.id}</Link>
                                    ) : null}
                                    {X.action}
                                </div>
                                {X.incident_report && (
                                    <div>
                                        {X.incident_report.cleared_by_user ? (
                                            <div>
                                                <b>Cleared by user</b>
                                            </div>
                                        ) : null}
                                        <div>{X.incident_report.url}</div>
                                        <div>{X.incident_report.system_note}</div>
                                        <div>{X.incident_report.reporter_note}</div>
                                        {X.incident_report.moderator ? (
                                            <Player user={X.incident_report.moderator} />
                                        ) : null}
                                        <i> {X.incident_report.moderator_note}</i>
                                    </div>
                                )}
                                <pre>{chat_markup(X.note, undefined, 1024 * 128)}</pre>
                            </div>
                        ),
                    },
                ]}
            />
        </Card>
    );
}

function openNotes(notes: string) {
    openModal(<NotesModal notes={notes} fastDismiss />);
}
