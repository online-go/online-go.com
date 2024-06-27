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
import { UIPush } from "UIPush";
import { Link, useLocation } from "react-router-dom";
import * as preferences from "preferences";
import { get } from "requests";
import { Stream } from "GoTV";

export const GoTVIndicator: React.FC = () => {
    const [streamCount, setStreamCount] = useState(0);
    const [showGoTVIndicator] = preferences.usePreference("gotv.show-gotv-indicator");
    const [allowMatureStreams] = preferences.usePreference("gotv.allow-mature-streams");
    const [selectedLanguages] = preferences.usePreference("gotv.selected-languages");
    const [previousPath, setPreviousPath] = useState<string | null>(null);

    const location = useLocation();

    const handleStreamUpdate = (data: any) => {
        const updatedStreams = JSON.parse(data);
        setStreamCount(filterStreams(updatedStreams).length);
    };

    const filterStreams = (streams: Stream[]) => {
        let filteredStreams = streams;
        if (!allowMatureStreams) {
            filteredStreams = filteredStreams.filter((stream: Stream) => !stream.is_mature);
        }
        if (selectedLanguages.length > 0 && selectedLanguages[0] !== "") {
            filteredStreams = filteredStreams.filter((stream: Stream) =>
                selectedLanguages.includes(stream.language),
            );
        }
        return filteredStreams;
    };

    useEffect(() => {
        if (showGoTVIndicator) {
            get("gotv/streams")
                .then((streams: Stream[]) => {
                    setStreamCount(filterStreams(streams).length);
                })
                .catch((error) => {
                    console.error("Error fetching streams:", error);
                });
        }
    }, [showGoTVIndicator, allowMatureStreams, selectedLanguages]);

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
            <UIPush channel="gotv" event="update_streams" action={handleStreamUpdate} />

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
