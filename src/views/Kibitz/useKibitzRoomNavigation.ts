/*
 * Copyright (C) Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/** Keep the default-room redirect from replacing an explicit room navigation. */
export function useKibitzRoomNavigation(defaultRoomId: string | null, creatingRoom: boolean) {
    const { key: locationKey } = useLocation();
    const { roomId } = useParams<"roomId">();
    const navigate = useNavigate();
    const pendingNavigation = React.useRef(false);

    React.useEffect(() => {
        // Any committed navigation can supersede the requested room, including
        // a return to /kibitz with no room selected.
        pendingNavigation.current = false;
    }, [locationKey]);

    React.useEffect(() => {
        if (roomId || !defaultRoomId || creatingRoom || pendingNavigation.current) {
            return;
        }
        void navigate(`/kibitz/${defaultRoomId}`, { replace: true });
    }, [creatingRoom, defaultRoomId, locationKey, navigate, roomId]);

    return React.useCallback(
        (nextRoomId: string | null) => {
            pendingNavigation.current = true;
            void navigate(nextRoomId ? `/kibitz/${nextRoomId}` : "/kibitz");
        },
        [navigate],
    );
}
