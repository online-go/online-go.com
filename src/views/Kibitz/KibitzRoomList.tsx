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
import type { KibitzRoomSummary } from "@/models/kibitz";
import { getKibitzRoomLockedTooltip } from "./kibitzAnalysisPolicyText";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import "./KibitzRoomList.css";

interface KibitzRoomListProps {
    rooms: KibitzRoomSummary[];
    activeRoomId: string;
    onSelectRoom: (roomId: string) => void;
    onCreateRoom?: () => void;
    canOpenCreateRoomFlow: boolean;
    signInHref: string;
    blockedRoomIds?: Set<string>;
    helpTargetId?: (typeof KIBITZ_HELP_TARGETS)[keyof typeof KIBITZ_HELP_TARGETS];
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
    helpTargetId,
}: KibitzRoomListProps): React.ReactElement {
    const roomListTarget = useKibitzHelpTarget(helpTargetId);

    return (
        <div className="KibitzRoomList" ref={roomListTarget?.ref}>
            <div className="KibitzRoomList-items">
                {rooms.map((room) => {
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
                          ? `${pgettext(
                                "Label shown before a kibitz room description for preset rooms",
                                "Preset",
                            )} · ${description}`
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
                            onClick={() => onSelectRoom(room.id)}
                        >
                            <span className="room-title">
                                {isBlocked ? <i className="fa fa-lock" aria-hidden="true" /> : null}
                                {room.title}
                            </span>
                            <span
                                className="room-viewer-count"
                                title={interpolate(
                                    pgettext(
                                        "Tooltip for the viewer count shown in the kibitz room list",
                                        "{{count}} people here",
                                    ),
                                    { count: room.viewer_count },
                                )}
                            >
                                {room.viewer_count}
                            </span>
                        </button>
                    );
                })}
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
