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
import React from "react";

interface Stream {
    stream_id: string;
    title: string;
    channel: string;
    username: string;
    viewer_count: number;
    language: string;
    thumbnail_url: string;
    source: string;
}

interface StreamCardProps {
    stream: Stream;
    isSelected: boolean;
    onClick: (stream: Stream) => void;
}

// StreamCard component displays information about a live stream
export function StreamCard({ stream, isSelected, onClick }: StreamCardProps): React.ReactElement {
    return (
        <div
            // Apply "selected-stream" class if this stream is selected
            className={`stream-item ${isSelected ? "selected-stream" : ""}`}
            onClick={() => onClick(stream)} // Handle stream selection on click
        >
            <div className="overlay"></div>
            <img
                src={stream.thumbnail_url.replace("{width}", "320").replace("{height}", "180")}
                alt={stream.title}
                className="stream-thumbnail"
            />
            <div className="stream-username">{stream.username}</div>
            <span className="viewer-count">
                {stream.viewer_count} {stream.viewer_count === 1 ? "viewer" : "viewers"}
            </span>
            <div className="stream-info">
                <h3>{stream.title}</h3>
                <span className="language">{stream.language}</span>
            </div>
            <div className="full-title">{stream.title}</div>
        </div>
    );
}
