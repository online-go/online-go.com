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
import type { KibitzRoomSummary, KibitzStreamItem } from "@/models/kibitz";
import "./KibitzRoomStream.css";

interface KibitzRoomStreamProps {
    room: KibitzRoomSummary;
    items: KibitzStreamItem[];
}

export function KibitzRoomStream({ room, items }: KibitzRoomStreamProps): React.ReactElement {
    return (
        <div className="KibitzRoomStream">
            <div className="KibitzRoomStream-title">
                {pgettext("Heading for the main message stream in a kibitz room", "Room stream")}
            </div>
            <div className="KibitzRoomStream-items">
                {items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.id} className={"stream-item " + item.type}>
                            {item.text}
                        </div>
                    ))
                ) : (
                    <div className="stream-empty">
                        {pgettext(
                            "Placeholder when a kibitz room has no stream items yet",
                            "Messages, proposals, and variation posts for this room will appear here.",
                        )}
                    </div>
                )}
            </div>
            <div className="KibitzRoomStream-footer">{room.channel}</div>
        </div>
    );
}
