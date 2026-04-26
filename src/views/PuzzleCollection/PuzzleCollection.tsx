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

import * as React from "react";
import { Navigate, useParams } from "react-router-dom";
import { get } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";

/**
 * Legacy /puzzle-collection/:collection_id route. Collections no longer have
 * a dedicated edit page — collection management lives inside the Puzzle view's
 * library/settings panels. This component just resolves the collection's
 * starting puzzle and redirects; the `?view-collection=1` query tells the
 * Puzzle view to open the library panel on mount.
 */
export function PuzzleCollection(): React.ReactElement | null {
    const { collection_id } = useParams<{ collection_id: string }>();
    const [target, setTarget] = React.useState<string | null>(null);

    React.useEffect(() => {
        get(`puzzles/collections/${collection_id}`)
            .then((collection) => {
                const start_id = collection?.starting_puzzle?.id;
                setTarget(start_id ? `/puzzle/${start_id}?view-collection=1` : "/puzzles/");
            })
            .catch(errorAlerter);
    }, [collection_id]);

    if (!target) {
        return null;
    }
    return <Navigate to={target} replace />;
}
