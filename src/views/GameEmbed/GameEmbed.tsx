/*
 * Copyright (C) 2012-2022  Online-Go.com
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

/**
 * @overview A barebones version of Game.tsx that is optimized for iframe embeds.
 */

import * as React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useResizeDetector } from "react-resize-detector";
import { MiniGoban } from "MiniGoban";

// For the layout, this seems to give just enough room for the point tally on
// the right and left.
const PADDING = 36;

export function GameEmbed(): JSX.Element {
    const params = useParams<"game_id">();
    const [searchParams] = useSearchParams();
    // Suppressing unused var lint error - we'll use this soon!
    React.useEffect(() => console.log(searchParams), [searchParams]);

    const game_id = params.game_id ? parseInt(params.game_id) : 0;

    // Hide NavBar, announcements, PMs etc.
    React.useEffect(() => {
        const body = document.getElementsByTagName("body")[0];
        body.classList.add("zen");

        return () => {
            body.classList.remove("zen");
        };
    }, []);

    const { width, ref } = useResizeDetector();

    return (
        <div className="goban-embed" ref={ref}>
            <MiniGoban id={game_id} displayWidth={width - PADDING} openLinksInNewTab />
        </div>
    );
}
