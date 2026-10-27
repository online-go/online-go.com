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
import { pgettext } from "@/lib/translate";
import "./Honorific.css";

interface HonorificProps {
    name: string | null;
}

/** The reviewer's honorific after their name, with a tooltip saying what it is. Renders nothing when null. */
export function Honorific({ name }: HonorificProps): React.ReactElement | null {
    if (!name) {
        return null;
    }
    return (
        <span
            className="Honorific"
            title={pgettext(
                "Tooltip on a peer reviewer honorific",
                "Peer reviewer honorific, earned from rank, reviews completed and rating",
            )}
        >
            {name}
        </span>
    );
}
