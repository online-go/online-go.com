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
import { EmbeddedChatCard } from "Chat";
import { StreamCard } from "./StreamCard";
import { _ } from "translate";
import * as preferences from "preferences";
import { streamManager } from "./StreamManager";

export interface Stream {
    stream_id: string;
    title: string;
    channel: string;
    username: string;
    viewer_count: number;
    language: string;
    thumbnail_url: string;
    source: string;
    is_mature: boolean;
}

export const GoTV = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    const [streams, setStreams] = useState<Stream[]>([]);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [showListPane, setShowListPane] = useState(true);
    const [showChatPane, setShowChatPane] = preferences.usePreference("gotv.expand-chat-pane");
    const [activeChatTab, setActiveChatTab] = preferences.usePreference("gotv.selected-chat");
    const [isLightTheme, setIsLightTheme] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const autoplay = preferences.get("gotv.auto-select-top-stream");

    useEffect(() => {
        const updateStreams = (streams: Stream[]) => {
            setStreams(streams);
            setIsLoading(false);
            if (streams.length > 0 && !selectedStream && autoplay) {
                setSelectedStream(streams[0]);
            }
        };

        streamManager.subscribe(updateStreams);

        const initialStreams = streamManager.getStreams();
        if (initialStreams.length > 0) {
            updateStreams(initialStreams);
        } else {
            setIsLoading(true);
        }

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

        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener("resize", handleResize);

        return () => {
            streamManager.unsubscribe(updateStreams);
            observer.disconnect();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

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

    const handleChatTabChange = (tab: string) => {
        setActiveChatTab(tab);
    };

    const parentDomain = getParentDomain();

    return (
        <div id="gotv-container" className="gotv-container">
            <div className="gotv-layout">
                <div className={`list-pane ${showListPane ? "expanded" : "collapsed"}`}>
                    <div className="streams-header">
                        <h2>{_("Live Streams")}</h2>
                        {isMobile && (
                            <button className="back-button" onClick={handleToggleStreamsPane}>
                                <i className="fa fa-arrow-up"></i>
                            </button>
                        )}
                    </div>
                    {isLoading ? (
                        <div className="loading-message">{_("Loading streams...")}</div>
                    ) : streams.length > 0 ? (
                        streams.map((stream) => (
                            <StreamCard
                                key={stream.stream_id}
                                stream={stream}
                                isSelected={selectedStream?.stream_id === stream.stream_id}
                                onClick={() => handleStreamClick(stream)}
                            />
                        ))
                    ) : (
                        <div className="no-streams-message">
                            {_("No streams are currently available.")}
                        </div>
                    )}
                </div>
                <div
                    className={`list-pane-control ${showListPane ? "expanded" : "collapsed"}`}
                    onClick={handleToggleStreamsPane}
                >
                    {isMobile && <span>{_("Streams")}</span>}
                </div>
                <div
                    className={`stream-pane ${showListPane ? "shrunk" : "expanded"} ${
                        showChatPane ? "chat-open" : ""
                    }`}
                >
                    {isLoading ? (
                        <div className="loading-message">{_("Loading streams...")}</div>
                    ) : streams.length > 0 && selectedStream ? (
                        <iframe
                            key={selectedStream.stream_id}
                            src={`https://player.twitch.tv/?channel=${selectedStream.channel}&parent=${parentDomain}&autoplay=true&muted=false`}
                            allowFullScreen={true}
                            aria-label={`Live stream of ${selectedStream.title}`}
                        ></iframe>
                    ) : (
                        <>
                            {streams.length > 0 ? (
                                <div className="select-stream-message">
                                    <p>{_("Select a stream from the list to start watching")}</p>
                                </div>
                            ) : (
                                <div className="no-streams-available-message">
                                    <h2>{_("No Streams Available")}</h2>
                                    <p>
                                        {_(
                                            "Unfortunately, there are no live streams available at the moment. Please check back later for exciting Go content.",
                                        )}
                                    </p>
                                    <p>
                                        <strong>
                                            {_("Want to see your stream featured here?")}
                                        </strong>
                                        <br />{" "}
                                        {_(
                                            "Stream in the Go category on Twitch or the Board Games category using the go, weiqi, or baduk tags. We welcome all Go enthusiasts to share their games and experiences. Your participation helps grow our community!",
                                        )}
                                    </p>
                                </div>
                            )}
                        </>
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
                                    key={selectedStream.stream_id}
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
