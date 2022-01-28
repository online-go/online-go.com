/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { put } from "requests";

interface ModToolsProps {
    user_id: number;
    show_mod_log: boolean;
}

export function ModTools(props: ModToolsProps): JSX.Element {
    const moderator_note = React.useRef<HTMLTextAreaElement>(null);
    const addModeratorNote = () => {
        const txt = moderator_note.current.value.trim();

        if (txt.length < 2) {
            moderator_note.current.focus();
            return;
        }

        put(`players/${props.user_id}/moderate`, {
            moderation_note: txt,
        })
            .then(() => {})
            .catch(errorAlerter);

        moderator_note.current.value = "";
    };

    const moderator_log_anchor = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (props.show_mod_log && moderator_log_anchor.current !== null) {
            moderator_log_anchor.current.scrollIntoView();
        }
    });

    return (
        <Card>
            {" "}
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
                        className: "",
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
                ]}
            />
            <b>Mod log</b>
            <div id="leave-moderator-note" ref={moderator_log_anchor}>
                <textarea ref={moderator_note} placeholder="Leave note" id="moderator-note" />
                <button onClick={addModeratorNote}>Add note</button>
            </div>
            <PaginatedTable
                className="moderator-log"
                name="moderator-log"
                source={`moderation?player_id=${props.user_id}`}
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
                        render: (X) => <Player user={X.moderator} />,
                    },
                    {
                        header: "",
                        className: "",
                        render: (X) => (
                            <div>
                                <div className="action">
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

function openNotes(notes) {
    openModal(<NotesModal notes={notes} fastDismiss />);
}
