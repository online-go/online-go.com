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
import "./ThemeAdvancedSection.css";

interface ThemeAdvancedSectionProperties {
    /** Open the section on the first render, used when the settings are not the default ones. */
    defaultOpen?: boolean;
    children: React.ReactNode;
}

/** Collapsible section that hides the less used parts of a custom theme editor. */
export function ThemeAdvancedSection({
    defaultOpen,
    children,
}: ThemeAdvancedSectionProperties): React.ReactElement {
    const [open, setOpen] = React.useState(!!defaultOpen);

    return (
        <div className="ThemeAdvancedSection">
            <button
                type="button"
                className="advanced-toggle"
                aria-expanded={open}
                onClick={() => setOpen((is_open) => !is_open)}
            >
                <i className={`fa fa-caret-${open ? "down" : "right"}`} />
                <span>{pgettext("Advanced custom theme settings", "Advanced")}</span>
            </button>

            {open && <div className="advanced-content">{children}</div>}
        </div>
    );
}
