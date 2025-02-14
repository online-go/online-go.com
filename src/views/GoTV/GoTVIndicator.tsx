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

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as preferences from "@/lib/preferences";
import { Stream, streamManager } from "./StreamManager";
import { GoTVNotifier } from "./GoTVNotifier";

// GoTVIndicator component shows the number of live streams and a link to GoTV
export function GoTVIndicator(): React.ReactElement {
    const [streams, setStreams] = useState<Stream[]>([]);
    const [streamCount, setStreamCount] = useState(0);
    const [showGoTVIndicator] = preferences.usePreference("gotv.show-gotv-indicator");
    const [previousPath, setPreviousPath] = useState<string | null>(null);

    const location = useLocation();

    // Function to update the streams state and count
    const updateStreams = (streams: Stream[]) => {
        setStreams(streams);
        setStreamCount(streams.length);
    };

    useEffect(() => {
        // Listen for stream updates
        streamManager.on("update", updateStreams);

        // Get initial streams and update the state
        const initialStreams = streamManager.getStreams();
        updateStreams(initialStreams);

        // Cleanup listener on component unmount
        return () => {
            streamManager.off("update", updateStreams);
        };
    }, []);

    useEffect(() => {
        // Store the previous path if not currently on the GoTV page
        if (location.pathname !== "/gotv") {
            setPreviousPath(location.pathname);
        }
    }, [location.pathname]);

    // Function to determine the link URL for the GoTV indicator
    const setLinkURL = () => {
        const currentPath = location.pathname;

        // Toggle between GoTV and previous path
        if (currentPath === "/gotv") {
            return previousPath || "/";
        } else {
            return "/gotv";
        }
    };

    return (
        <>
            {showGoTVIndicator && (
                <>
                    {streamCount > 0 && (
                        // Link to GoTV with stream count indicator
                        <Link to={setLinkURL()} className="GoTVIndicator" title="GoTV">
                            <i className="fa fa-tv navbar-icon"></i>
                            <span className="count">{streamCount}</span>
                        </Link>
                    )}
                </>
            )}
            {/* Display notifications for live streams */}
            <GoTVNotifier streams={streams} />
        </>
    );
}
