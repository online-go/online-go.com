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
import type {
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzStreamItem,
} from "@/models/kibitz";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzRoomStage } from "./KibitzRoomStage";
import { KibitzRoomStream } from "./KibitzRoomStream";
import { KibitzPresence } from "./KibitzPresence";
import "./Kibitz.css";

const placeholderRooms: KibitzRoomSummary[] = [
    {
        id: "top-19x19",
        channel: "kibitz-top-19x19",
        title: "Top 19x19",
        kind: "preset",
        viewer_count: 0,
        proposals_enabled: true,
    },
    {
        id: "tournament-pick",
        channel: "kibitz-tournament-pick",
        title: "Tournament Pick",
        kind: "preset",
        viewer_count: 0,
        proposals_enabled: true,
    },
    {
        id: "top-9x9",
        channel: "kibitz-top-9x9",
        title: "Top 9x9",
        kind: "preset",
        viewer_count: 0,
        proposals_enabled: true,
    },
];

const placeholderStream: KibitzStreamItem[] = [];

const defaultSecondaryPane: KibitzSecondaryPaneState = {
    collapsed: false,
};

export function Kibitz(): React.ReactElement {
    const [activeRoomId, setActiveRoomId] = React.useState<string>(placeholderRooms[0].id);

    const activeRoom =
        placeholderRooms.find((room) => room.id === activeRoomId) ?? placeholderRooms[0];

    return (
        <div className="Kibitz">
            <div className="Kibitz-header">
                <h1>{pgettext("Title for the kibitz page", "Kibitz")}</h1>
            </div>
            <div className="Kibitz-layout">
                <KibitzRoomList
                    rooms={placeholderRooms}
                    activeRoomId={activeRoom.id}
                    onSelectRoom={setActiveRoomId}
                />
                <div className="Kibitz-main">
                    <KibitzRoomStage room={activeRoom} secondaryPane={defaultSecondaryPane} />
                    <div className="Kibitz-sidebar">
                        <KibitzRoomStream room={activeRoom} items={placeholderStream} />
                        <KibitzPresence room={activeRoom} />
                    </div>
                </div>
            </div>
        </div>
    );
}
