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
import * as preferences from "preferences";
import { Stream, streamManager } from "./StreamManager";

export const GoTVIndicator: React.FC = () => {
    const [streamCount, setStreamCount] = useState(0);
    const [showGoTVIndicator] = preferences.usePreference("gotv.show-gotv-indicator");
    const [previousPath, setPreviousPath] = useState<string | null>(null);

    const location = useLocation();

    useEffect(() => {
        const updateStreamCount = (streams: Stream[]) => setStreamCount(streams.length);
        streamManager.on("update", updateStreamCount);

        setStreamCount(streamManager.getStreams().length);

        return () => {
            streamManager.off("update", updateStreamCount);
        };
    }, []);

    useEffect(() => {
        if (location.pathname !== "/gotv") {
            setPreviousPath(location.pathname);
        }
    }, [location.pathname]);

    const setLinkURL = () => {
        const currentPath = location.pathname;

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
                        <Link to={setLinkURL()} className="GoTVIndicator" title="GoTV">
                            <i className="fa fa-tv navbar-icon"></i>
                            <span className="count">{streamCount}</span>
                        </Link>
                    )}
                </>
            )}
        </>
    );
};
