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
import type { KibitzRoomSummary, KibitzRoomUser } from "@/models/kibitz";

import { KibitzPresence } from "./KibitzPresence";
import "./KibitzPresencePanel.css";

interface KibitzPresencePanelProps {
    room: KibitzRoomSummary;
    users: KibitzRoomUser[];
}

export function KibitzPresencePanel({ room, users }: KibitzPresencePanelProps): React.ReactElement {
    return (
        <div className="KibitzPresencePanel">
            <div className="KibitzPresencePanel-title">
                {pgettext("Heading for the Kibitz presence panel", "Room")}
            </div>
            <KibitzPresence room={room} users={users} />
        </div>
    );
}
