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
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzDebugState } from "@/models/kibitz";
import "./KibitzDebugPanel.css";

interface KibitzDebugPanelProps {
    debug: KibitzDebugState;
}

function formatTimestamp(timestamp?: number): string {
    if (!timestamp) {
        return pgettext("Fallback value for missing kibitz debug timestamps", "n/a");
    }

    return new Date(timestamp).toLocaleTimeString();
}

export function KibitzDebugPanel({ debug }: KibitzDebugPanelProps): React.ReactElement {
    return (
        <div className="KibitzDebugPanel">
            <div className="KibitzDebugPanel-header">
                <div className="title">
                    {pgettext("Title for the kibitz diagnostics panel", "Kibitz diagnostics")}
                </div>
                <div className="status">
                    {interpolate(
                        pgettext(
                            "Summary line for kibitz diagnostics socket and status state",
                            "Socket: {{socket_state}} | Hydration: {{status}}",
                        ),
                        {
                            socket_state: debug.socket_connected
                                ? pgettext("Socket state label in kibitz diagnostics", "connected")
                                : pgettext(
                                      "Socket state label in kibitz diagnostics",
                                      "disconnected",
                                  ),
                            status: debug.status,
                        },
                    )}
                </div>
            </div>
            <div className="KibitzDebugPanel-meta">
                <div>
                    {interpolate(
                        pgettext(
                            "Kibitz diagnostics timestamp label for hydration start",
                            "Started: {{time}}",
                        ),
                        { time: formatTimestamp(debug.last_hydration_started_at) },
                    )}
                </div>
                <div>
                    {interpolate(
                        pgettext(
                            "Kibitz diagnostics timestamp label for hydration end",
                            "Finished: {{time}}",
                        ),
                        { time: formatTimestamp(debug.last_hydration_finished_at) },
                    )}
                </div>
                {debug.error ? (
                    <div className="error">
                        {interpolate(
                            pgettext(
                                "Kibitz diagnostics label for a top-level hydration error",
                                "Error: {{error}}",
                            ),
                            { error: debug.error },
                        )}
                    </div>
                ) : null}
            </div>
            <div className="KibitzDebugPanel-rooms">
                {debug.rooms.map((room) => (
                    <div className="room-debug" key={room.room_id}>
                        <div className="room-title">{room.room_id}</div>
                        <div className="room-summary">
                            {interpolate(
                                pgettext(
                                    "Summary line for a kibitz room hydration diagnostic",
                                    "Results: {{count}} | Source: {{source}} | Pick: {{pick}} | Via: {{via}}",
                                ),
                                {
                                    count: room.query_count,
                                    source:
                                        room.query_source ??
                                        pgettext(
                                            "Fallback value for missing query source in kibitz diagnostics",
                                            "unknown",
                                        ),
                                    pick:
                                        room.picked_game_id?.toString() ??
                                        pgettext(
                                            "Fallback value for missing selected game id in kibitz diagnostics",
                                            "none",
                                        ),
                                    via:
                                        room.picked_via ??
                                        pgettext(
                                            "Fallback value for missing selection method in kibitz diagnostics",
                                            "none",
                                        ),
                                },
                            )}
                        </div>
                        {room.requested_size ? (
                            <div className="room-summary">
                                {interpolate(
                                    pgettext(
                                        "Requested board size label in kibitz diagnostics",
                                        "Requested size: {{size}}",
                                    ),
                                    { size: room.requested_size },
                                )}
                            </div>
                        ) : null}
                        {room.error ? (
                            <div className="error">
                                {interpolate(
                                    pgettext(
                                        "Kibitz diagnostics label for room-level selection errors",
                                        "Room error: {{error}}",
                                    ),
                                    { error: room.error },
                                )}
                            </div>
                        ) : null}
                        <div className="candidate-list">
                            {room.candidates.map((candidate) => (
                                <div className="candidate" key={candidate.id}>
                                    {interpolate(
                                        pgettext(
                                            "Kibitz diagnostics summary for one live-game candidate",
                                            "#{{id}} {{title}} ({{width}}x{{height}}, moves {{moves}})",
                                        ),
                                        {
                                            id: candidate.id,
                                            title: candidate.title,
                                            width: candidate.width ?? "?",
                                            height: candidate.height ?? "?",
                                            moves: candidate.move_count ?? "?",
                                        },
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
