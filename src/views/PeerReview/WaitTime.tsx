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
import { hoursSince, waitBucket, waitLabel } from "./wait_time";
import "./WaitTime.css";

interface WaitTimeProps {
    since: string;
    now?: number;
}

export function WaitTime({ since, now }: WaitTimeProps): React.ReactElement {
    const hours = hoursSince(since, now);
    return <span className={`WaitTime wait-${waitBucket(hours)}`}>{waitLabel(hours)}</span>;
}
