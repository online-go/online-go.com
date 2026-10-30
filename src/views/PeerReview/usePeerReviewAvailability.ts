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

import { useData } from "@/lib/hooks";

export interface PeerReviewAvailability {
    /** True once the config has been read, so pages can tell "dark" from "not loaded yet". */
    loaded: boolean;
    /** Whether this user may see and use the feature: live, or dark and a moderator. */
    available: boolean;
    /** Whether the launch switch is on for everyone. */
    live: boolean;
}

const HIDDEN: PeerReviewAvailability = { loaded: false, available: false, live: false };

/**
 * Reads the peer review block that the server bundles into ui/config.
 * Everything stays hidden until the config has loaded.
 */
export function usePeerReviewAvailability(): PeerReviewAvailability {
    const [config] = useData("config");
    const cfg = config?.peer_review;
    if (!cfg) {
        return HIDDEN;
    }
    return { loaded: true, available: Boolean(cfg.available), live: Boolean(cfg.enabled) };
}
