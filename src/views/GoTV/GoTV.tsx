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
import { StreamCard } from "./StreamCard";

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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    const [streams, setStreams] = useState<Stream[]>([]);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [showListPane, setShowListPane] = useState(true);
    const [showChatPane, setShowChatPane] = useState(false);
    const [filterLanguage, setFilterLanguage] = useState("");
    const [activeChatTab, setActiveChatTab] = useState("OGS");
    const [isLightTheme, setIsLightTheme] = useState(false);

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

        const bodyClassList = document.body.classList;
        setIsLightTheme(bodyClassList.contains("light"));

        // Setup a MutationObserver to detect theme changes so we can update twitch chat on theme change
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    setIsLightTheme(document.body.classList.contains("light"));
                }
            });
        });

        observer.observe(document.body, { attributes: true });

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", handleResize);
        };
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
        if (isMobile) {
            setShowListPane(false);
        }
    };

    const handleToggleStreamsPane = () => {
        setShowListPane(!showListPane);
    };

    const handleToggleChatPane = () => {
        setShowChatPane(!showChatPane);
    };

    const handleFilterChange = (selectedOption: any) => {
        setFilterLanguage(selectedOption ? selectedOption.value : "");
    };

    const handleChatTabChange = (tab: string) => {
        setActiveChatTab(tab);
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
                <div className={`list-pane ${showListPane ? "expanded" : "collapsed"}`}>
                    <div className="streams-header">
                        <h2>Live Streams</h2>
                        <Select
                            options={languageOptions}
                            onChange={handleFilterChange}
                            isClearable
                            placeholder="All Languages"
                            className="language-select"
                            classNamePrefix="ogs-react-select"
                        />
                        {isMobile && (
                            <button className="back-button" onClick={handleToggleStreamsPane}>
                                <i className="fa fa-arrow-up"></i>
                            </button>
                        )}
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
                    className={`list-pane-control ${showListPane ? "expanded" : "collapsed"}`}
                    onClick={handleToggleStreamsPane}
                >
                    {isMobile && <span>Streams</span>}
                </div>
                <div
                    className={`stream-pane ${showListPane ? "shrunk" : "expanded"} ${
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
                    className={`chat-pane-control ${showChatPane ? "expanded" : "collapsed"}`}
                    onClick={handleToggleChatPane}
                />
                <div className={`chat-pane ${showChatPane ? "expanded" : "collapsed"}`}>
                    <div className="chat-tabs">
                        <div
                            className={`chat-tab ${activeChatTab === "OGS" ? "active" : ""}`}
                            onClick={() => handleChatTabChange("OGS")}
                        >
                            <span className="ogs-chat-tab-logo"></span>
                        </div>
                        <div
                            className={`chat-tab ${activeChatTab === "Twitch" ? "active" : ""}`}
                            onClick={() => handleChatTabChange("Twitch")}
                        >
                            <span className="twitch-chat-tab-logo"></span>
                        </div>
                    </div>
                    {selectedStream && (
                        <div className="chat-content">
                            <div
                                className={`chat-section ${
                                    activeChatTab === "OGS" ? "active" : "hidden"
                                }`}
                            >
                                <EmbeddedChatCard
                                    channel={`GoTV-${selectedStream.username}`}
                                    updateTitle={false}
                                />
                            </div>
                            <div
                                className={`chat-section ${
                                    activeChatTab === "Twitch" ? "active" : "hidden"
                                }`}
                            >
                                <iframe
                                    src={`https://www.twitch.tv/embed/${
                                        selectedStream.channel
                                    }/chat?${
                                        isLightTheme ? "" : "darkpopout"
                                    }&parent=${parentDomain}`}
                                    height="100%"
                                    width="100%"
                                    aria-label={`Twitch chat for ${selectedStream.channel}`}
                                ></iframe>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const getParentDomain = () => {
    return window.location.hostname;
};
