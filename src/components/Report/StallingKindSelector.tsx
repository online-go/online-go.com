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
import { STALLING_KIND_OPTIONS, type StallingKind } from "@/lib/stalling_kinds";

import "./StallingKindSelector.css";

interface StallingKindSelectorProps {
    value: StallingKind | "";
    onChange: (kind: StallingKind | "") => void;
}

/** Asks the reporter which way the other player stalled, in a stalling report. */
export function StallingKindSelector({
    value,
    onChange,
}: StallingKindSelectorProps): React.ReactElement {
    return (
        <select
            className={"StallingKindSelector" + (value === "" ? " required" : "")}
            value={value}
            onChange={(ev) => onChange(ev.target.value as StallingKind | "")}
        >
            <option value="">
                {pgettext(
                    "Prompt of the stall-kind selector in the stalling report form",
                    "How did the other player stall? (please select one)",
                )}
            </option>
            {STALLING_KIND_OPTIONS.map((option) => (
                <option key={option.kind} value={option.kind}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
