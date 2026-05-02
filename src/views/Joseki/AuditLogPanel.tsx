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
import { pgettext } from "@/lib/translate";
import { get } from "@/lib/requests";
import { Player } from "@/components/Player";
import { Throbber } from "@/components/Throbber";
import { server_url } from "./joseki-utils";

interface AuditEntry {
    user_id: string;
    date: string;
    comment: string;
}

interface AuditLogPanelProps {
    position_id: string;
}

export function AuditLogPanel(props: AuditLogPanelProps): React.ReactElement {
    const [audit_log, set_audit_log] = React.useState<AuditEntry[]>([]);
    const [throb, set_throb] = React.useState(false);

    React.useEffect(() => {
        if (!props.position_id) {
            return;
        }
        let cancelled = false;
        // Clear the previous position's entries so the throbber takes
        // over the panel cleanly while the new fetch is in flight.
        set_audit_log([]);
        set_throb(true);
        get(server_url + "audits?id=" + props.position_id)
            .then((body) => {
                if (cancelled) {
                    return;
                }
                set_audit_log(body);
            })
            .catch((r) => {
                if (!cancelled) {
                    console.log("Audits GET failed:", r);
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
    }, [props.position_id]);

    return (
        <div className="audit-container">
            <Throbber throb={throb} />
            {audit_log.length === 0 && !throb && (
                <div className="no-audit">
                    {pgettext("Joseki change-log empty state", "No changes recorded.")}
                </div>
            )}
            {audit_log.map((audit, idx) => (
                <div className="audit-entry" key={idx}>
                    <div className="audit-header">
                        <Player user={parseInt(audit.user_id)} />
                        <div className="audit-date">{new Date(audit.date).toDateString()}</div>
                    </div>
                    {audit.comment}
                </div>
            ))}
        </div>
    );
}
