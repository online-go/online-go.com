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

import React, { useState, useEffect, useRef } from "react";
import { StreamCard } from "./StreamCard";
import { _ } from "@/lib/translate";
import * as preferences from "@/lib/preferences";
import { Stream, streamManager } from "./StreamManager";
import { GoTVPreferences } from "@/views/Settings";
import { useLocation } from "react-router-dom";

let twitch_js_promise: Promise<void> | null = null;
declare let Twitch: any;

// Function to load the Twitch library
const load_twitch_library = () => {
    if (!twitch_js_promise) {
        twitch_js_promise = new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://embed.twitch.tv/embed/v1.js";
            script.async = true;
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                reject("Unable to load twitch");
            };
            document.head.appendChild(script);
        });
    }
    return twitch_js_promise;
};

// GoTV component manages the live stream display and user interactions
export function GoTV(): React.ReactElement {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    const [streams, setStreams] = useState<Stream[]>([]);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [showListPane, setShowListPane] = useState(true);
    const [showChatPane, setShowChatPane] = preferences.usePreference("gotv.expand-chat-pane");
    const [isLightTheme, setIsLightTheme] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showPreferences, setShowPreferences] = useState(false);
    const [twitchLibraryLoaded, setTwitchLibraryLoaded] = useState(false);
    const [streamSetFromNotification, setStreamSetFromNotification] = useState(false);

    const autoplay = preferences.get("gotv.auto-select-top-stream");
    const initialMount = useRef(true);
    const location = useLocation();

    useEffect(() => {
        // Load the Twitch library and set the state when loaded
        load_twitch_library()
            .then(() => {
                setTwitchLibraryLoaded(true);
            })
            .catch((error) => {
                console.error(error);
            });

        // Function to update the streams state
        const updateStreams = (streams: Stream[]) => {
            setStreams(streams);
            if (initialMount.current) {
                if (autoplay && streams.length > 0) {
                    setSelectedStream(streams[0]);
                }
                initialMount.current = false;
            }
            setIsLoading(false);
        };

        streamManager.on("update", updateStreams);

        const initialStreams = streamManager.getStreams();
        updateStreams(initialStreams);

        const bodyClassList = document.body.classList;
        setIsLightTheme(bodyClassList.contains("light"));

        // Setup a MutationObserver to detect theme changes for updating Twitch chat theme
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    setIsLightTheme(document.body.classList.contains("light"));
                }
            });
        });

        observer.observe(document.body, { attributes: true });

        // Handle window resize events to update mobile state
        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener("resize", handleResize);

        return () => {
            streamManager.off("update", updateStreams);
            observer.disconnect();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        // Embed the selected Twitch stream when Twitch library is loaded
        if (twitchLibraryLoaded && selectedStream) {
            const embedContainer = document.getElementById("twitch-embed");
            if (embedContainer) {
                embedContainer.innerHTML = "";
                new Twitch.Embed("twitch-embed", {
                    width: "100%",
                    height: "100%",
                    layout: "video",
                    channel: selectedStream.channel,
                    parent: getParentDomain(),
                });
            }
        }
    }, [selectedStream, isLightTheme, twitchLibraryLoaded]);

    useEffect(() => {
        if (!streamSetFromNotification && location.state && (location.state as any).streamId) {
            const state = location.state as { streamId: string };

            const streamFromNotification = streams.find(
                (stream) => stream.stream_id === state.streamId,
            );

            if (streamFromNotification) {
                setSelectedStream(streamFromNotification);
                setStreamSetFromNotification(true);
            }
        }
    }, [streams, location.state]);

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

    const parentDomain = getParentDomain();

    const togglePreferences = () => {
        setShowPreferences(!showPreferences);
    };

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
                        <i
                            className={
                                showPreferences
                                    ? "fa fa-times preference-toggle"
                                    : "fa fa-cog preference-toggle"
                            }
                            onClick={togglePreferences}
                        ></i>
                    </div>
                    {showPreferences ? (
                        <div className="Settings">
                            <GoTVPreferences />
                        </div>
                    ) : isLoading ? (
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
                    )}{" "}
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
                        <div id="twitch-embed"></div>
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
                    {selectedStream && (
                        <div className="chat-content">
                            <div className="chat-section active">
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
}

const getParentDomain = () => {
    return window.location.hostname;
};
