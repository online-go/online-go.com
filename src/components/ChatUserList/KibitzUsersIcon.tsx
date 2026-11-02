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
import "./KibitzUsersIcon.css";

/**
 * The `fa-users` heads with a speech bubble above them: the chat user-list
 * toggle shows this in place of `fa-users` when kibitz rooms are watching
 * the game. Inline SVG because the OGS icon font has no generator in the
 * repository; sized by CSS to the `fa-users` glyph box.
 */
export function KibitzUsersIcon(): React.ReactElement {
    return (
        <svg
            className="KibitzUsersIcon"
            viewBox="0 0 24 16"
            aria-hidden="true"
            focusable="false"
            fill="currentColor"
        >
            {/* side figures */}
            <circle cx="5.5" cy="7.2" r="1.9" />
            <path d="M1.2 13.6c0-2.3 1.9-3.9 4.3-3.9s4.3 1.6 4.3 3.9V15H1.2z" />
            <circle cx="18.5" cy="7.2" r="1.9" />
            <path d="M14.2 13.6c0-2.3 1.9-3.9 4.3-3.9s4.3 1.6 4.3 3.9V15h-8.6z" />
            {/* centre figure, in front */}
            <circle cx="12" cy="8.2" r="2.5" />
            <path d="M6.6 16c0-3 2.4-5 5.4-5s5.4 2 5.4 5z" />
            {/* speech bubble above the centre figure */}
            <path d="M8.6 0h8.4a1.6 1.6 0 0 1 1.6 1.6v1.6a1.6 1.6 0 0 1-1.6 1.6h-4.2l-1.9 1.6V4.8H8.6A1.6 1.6 0 0 1 7 3.2V1.6A1.6 1.6 0 0 1 8.6 0z" />
        </svg>
    );
}
