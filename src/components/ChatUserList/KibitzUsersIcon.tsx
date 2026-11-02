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
            {/* centre figure, in front; the head sits low enough to leave
                the bubble's tail clear of it */}
            <circle cx="12" cy="8.9" r="2.2" />
            <path d="M6.8 16c0-2.9 2.3-4.8 5.2-4.8s5.2 1.9 5.2 4.8z" />
            {/* speech bubble above the centre figure, tail pointing at it */}
            <path d="M8.6 0h6.8a1.4 1.4 0 0 1 1.4 1.4v1.4a1.4 1.4 0 0 1-1.4 1.4h-3.6l-1.9 1.8V4.2H8.6A1.4 1.4 0 0 1 7.2 2.8V1.4A1.4 1.4 0 0 1 8.6 0z" />
        </svg>
    );
}
