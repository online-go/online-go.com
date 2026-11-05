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
import { interpolate, npgettext, pgettext } from "@/lib/translate";
import type { KibitzRoomSummary } from "@/models/kibitz";
import { getKibitzRoomLockedTooltip } from "./kibitzAnalysisPolicyText";
import "./KibitzRoomList.css";

interface KibitzRoomListProps {
    rooms: KibitzRoomSummary[];
    activeRoomId: string;
    onSelectRoom: (roomId: string) => void;
    onCreateRoom?: () => void;
    canOpenCreateRoomFlow: boolean;
    signInHref: string;
    blockedRoomIds?: Set<string>;
}

/**
 * The rooms of the Kibitz left aside, laid out like the chat page's channel
 * list: one line per room with the viewer count on the right, the active
 * room filled with the primary colour, and a "+ Room" row at the bottom.
 */
export function KibitzRoomList({
    rooms,
    activeRoomId,
    onSelectRoom,
    onCreateRoom,
    canOpenCreateRoomFlow,
    signInHref,
    blockedRoomIds,
}: KibitzRoomListProps): React.ReactElement {
    const roomGroups = [
        {
            id: "preset",
            label: pgettext("Heading above preset Kibitz rooms", "Preset rooms"),
            rooms: rooms.filter((room) => room.kind === "preset"),
        },
        {
            id: "other",
            label: rooms.some((room) => room.kind === "broadcast")
                ? pgettext(
                      "Heading above non-preset Kibitz rooms including broadcasts",
                      "Other rooms",
                  )
                : pgettext("Heading above user-created Kibitz rooms", "User rooms"),
            rooms: rooms.filter((room) => room.kind !== "preset"),
        },
    ].filter((group) => group.rooms.length > 0);

    return (
        <div className="KibitzRoomList">
            <div className="KibitzRoomList-items">
                {roomGroups.map((group, groupIndex) => (
                    <section
                        className="KibitzRoomList-group"
                        aria-label={group.label}
                        key={group.id}
                    >
                        <h4 className="KibitzRoomList-groupHeading">
                            <span>{group.label}</span>
                            {groupIndex === 0 && (
                                <span
                                    className="KibitzRoomList-countHeading"
                                    role="img"
                                    aria-label={pgettext("Kibitz room count column", "Spectators")}
                                    title={pgettext("Kibitz room count column", "Spectators")}
                                >
                                    <i className="fa fa-user" aria-hidden="true" />
                                </span>
                            )}
                        </h4>
                        {group.rooms.map((room) => {
                            const isActive = room.id === activeRoomId;
                            const isBlocked = blockedRoomIds?.has(room.id) ?? false;
                            const description =
                                room.description ??
                                pgettext(
                                    "Fallback subtitle shown in the kibitz room list when no room description exists",
                                    "No room description",
                                );
                            const tooltip = isBlocked
                                ? getKibitzRoomLockedTooltip()
                                : room.kind === "preset"
                                  ? interpolate(
                                        pgettext(
                                            "Tooltip on a preset kibitz room: the Preset label and the room description",
                                            "Preset · {{description}}",
                                        ),
                                        { description },
                                    )
                                  : description;

                            return (
                                <button
                                    key={room.id}
                                    type="button"
                                    className={
                                        "KibitzRoomList-item" +
                                        (isActive ? " active" : "") +
                                        (isBlocked ? " blocked" : "")
                                    }
                                    disabled={isBlocked}
                                    title={tooltip}
                                    aria-label={interpolate(
                                        npgettext(
                                            "Kibitz room name and spectator count",
                                            "{{room}}, {{count}} spectator",
                                            "{{room}}, {{count}} spectators",
                                            room.viewer_count,
                                        ),
                                        { room: room.title, count: room.viewer_count },
                                    )}
                                    onClick={() => onSelectRoom(room.id)}
                                >
                                    <span className="room-title">
                                        {isBlocked ? (
                                            <i className="fa fa-lock" aria-hidden="true" />
                                        ) : null}
                                        {room.title}
                                    </span>
                                    <span
                                        className="room-viewer-count"
                                        title={interpolate(
                                            npgettext(
                                                "Tooltip for the viewer count shown in the kibitz room list",
                                                "{{count}} spectator",
                                                "{{count}} spectators",
                                                room.viewer_count,
                                            ),
                                            { count: room.viewer_count },
                                        )}
                                    >
                                        {room.viewer_count}
                                    </span>
                                </button>
                            );
                        })}
                    </section>
                ))}
            </div>
            {onCreateRoom ? (
                canOpenCreateRoomFlow ? (
                    <button
                        type="button"
                        className="KibitzRoomList-footerAction KibitzRoomList-createButton"
                        onClick={onCreateRoom}
                    >
                        <i className="fa fa-plus" aria-hidden="true" />{" "}
                        {pgettext(
                            "Row at the bottom of the Kibitz room list that creates a room",
                            "Room",
                        )}
                    </button>
                ) : (
                    <a
                        className="KibitzRoomList-footerAction KibitzRoomList-createButton"
                        href={signInHref}
                    >
                        {pgettext(
                            "Button label for signing in before creating a Kibitz room",
                            "Sign in to create room",
                        )}
                    </a>
                )
            ) : null}
        </div>
    );
}
