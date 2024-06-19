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

import React, { useState, useEffect } from "react";
import { UIPush } from "UIPush";
import Select from "react-select";
import { get } from "requests";
import { EmbeddedChatCard } from "Chat";
import { StreamCard } from "GoTV";

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

export const GoTV = () => {
    const [streams, setStreams] = useState<Stream[]>([]);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [showStreamsPane, setShowStreamsPane] = useState(true);
    const [showChatPane, setShowChatPane] = useState(false);
    const [filterLanguage, setFilterLanguage] = useState("");

    useEffect(() => {
        const url = "gotv/streams/";
        get(url)
            .then((data: Stream[]) => {
                const streamsData = data.map((stream) => ({
                    ...stream,
                    stream_id: String(stream.stream_id),
                }));
                setStreams(streamsData);
                if (streamsData.length > 0) {
                    setSelectedStream(streamsData[0]);
                }
            })
            .catch((error) => console.error("Error fetching live streams:", error));
    }, []);

    const handleStreamUpdate = (data: any) => {
        const updatedStreams = JSON.parse(data).map((stream: Stream) => ({
            ...stream,
            stream_id: String(stream.stream_id),
        }));
        setStreams(updatedStreams);
        if (!selectedStream && updatedStreams.length > 0) {
            setSelectedStream(updatedStreams[0]);
        }
    };

    const handleStreamClick = (stream: Stream) => {
        setSelectedStream(stream);
    };

    const handleToggleStreamsPane = () => {
        setShowStreamsPane(!showStreamsPane);
    };

    const handleToggleChatPane = () => {
        setShowChatPane(!showChatPane);
    };

    const handleFilterChange = (selectedOption: any) => {
        setFilterLanguage(selectedOption ? selectedOption.value : "");
    };

    const filteredStreams = filterLanguage
        ? streams.filter((stream) => stream.language === filterLanguage)
        : streams;

    const parentDomain = getParentDomain();

    const languageOptions = Array.from(new Set(streams.map((stream) => stream.language))).map(
        (lang) => ({
            value: lang,
            label: lang,
        }),
    );

    return (
        <div id="gotv-container" className="gotv-container">
            <UIPush channel="gotv" event="update_streams" action={handleStreamUpdate} />
            <div className="gotv-layout">
                <div className={`streams-list ${showStreamsPane ? "expanded" : "collapsed"}`}>
                    <div className="streams-header">
                        <h2>Live Streams</h2>
                        <Select
                            options={languageOptions}
                            onChange={handleFilterChange}
                            isClearable
                            placeholder="All Languages"
                            className="language-select"
                        />
                    </div>
                    {filteredStreams.map((stream) => (
                        <StreamCard
                            key={stream.stream_id}
                            stream={stream}
                            isSelected={selectedStream?.stream_id === stream.stream_id}
                            onClick={() => handleStreamClick(stream)}
                        />
                    ))}
                </div>
                <div
                    className={`list-pane-tab ${showStreamsPane ? "expanded" : "collapsed"}`}
                    onClick={handleToggleStreamsPane}
                />
                <div
                    className={`stream-pane ${showStreamsPane ? "shrunk" : "expanded"} ${
                        showChatPane ? "chat-open" : ""
                    }`}
                >
                    {selectedStream && (
                        <iframe
                            src={`https://player.twitch.tv/?channel=${selectedStream.channel}&parent=${parentDomain}&autoplay=true&muted=false`}
                            allowFullScreen={true}
                            aria-label={`Live stream of ${selectedStream.title}`}
                        ></iframe>
                    )}
                </div>
                <div
                    className={`chat-pane-tab ${showChatPane ? "expanded" : "collapsed"}`}
                    onClick={handleToggleChatPane}
                />
                <div className={`chat-pane ${showChatPane ? "expanded" : "collapsed"}`}>
                    {selectedStream && (
                        <EmbeddedChatCard
                            channel={`GoTV-${selectedStream.username}`}
                            updateTitle={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const getParentDomain = () => {
    return window.location.hostname;
};
