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
import { fetchConfig } from "./api";

/** Whether the launch switch is on. False until the config has loaded or if it cannot be read. */
export function usePeerReviewEnabled(): boolean {
    const [enabled, setEnabled] = React.useState(false);
    React.useEffect(() => {
        let cancelled = false;
        fetchConfig()
            .then((cfg) => {
                if (!cancelled) {
                    setEnabled(Boolean(cfg.enabled));
                }
            })
            .catch(() => {
                // Leave the feature hidden when the config cannot be read.
            });
        return () => {
            cancelled = true;
        };
    }, []);
    return enabled;
}
