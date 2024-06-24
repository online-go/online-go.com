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
import { Link } from "react-router-dom";
import * as preferences from "preferences";
import { get } from "requests";

export const GoTVIndicator: React.FC = () => {
    const [streamCount, setStreamCount] = useState(0);
    const [showGoTVIndicator] = preferences.usePreference("gotv.show-gotv-indicator");

    const handleStreamUpdate = (data: any) => {
        const updatedStreams = JSON.parse(data);
        setStreamCount(updatedStreams.length);
    };

    useEffect(() => {
        if (showGoTVIndicator) {
            get("gotv/streams")
                .then((data) => {
                    setStreamCount(data.length);
                })
                .catch((error) => {
                    console.error("Error fetching streams:", error);
                });
        }
    }, []);

    return (
        <>
            <UIPush channel="gotv" event="update_streams" action={handleStreamUpdate} />

            {showGoTVIndicator && (
                <>
                    {streamCount > 0 && (
                        <Link to="/gotv" className="GoTVIndicator" title="GoTV">
                            <i className="fa fa-tv navbar-icon"></i>
                            <span className="count">{streamCount}</span>
                        </Link>
                    )}
                </>
            )}
        </>
    );
};
