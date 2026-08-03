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
import { fromDatetimeLocalValue } from "@/lib/datetime_input";

export function BanDetails({ onChange }: { onChange: (d: any) => void }): React.ReactElement {
    const [public_reason, set_public_reason] = React.useState("");
    const [moderator_notes, set_moderator_notes] = React.useState("");
    const [expiration, set_expiration] = React.useState("");

    React.useEffect(() => {
        onChange({
            public_reason: public_reason,
            moderator_notes: moderator_notes,
            ban_expiration: fromDatetimeLocalValue(expiration),
        });
    }, [public_reason, moderator_notes, expiration]);

    return (
        <div>
            <h3>Public reason (displayed to user)</h3>
            <textarea onChange={(e) => set_public_reason(e.target.value)} value={public_reason} />

            <h3>Moderator only notes (optional)</h3>
            <textarea
                onChange={(e) => set_moderator_notes(e.target.value)}
                value={moderator_notes}
            />

            <h3>Ban expiration</h3>
            <input
                type="datetime-local"
                className="ban-expiration"
                value={expiration}
                onChange={(e) => set_expiration(e.target.value)}
            />
        </div>
    );
}
