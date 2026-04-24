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

export interface GobanViewTabProps {
    id: string;
    icon?: string | React.ReactNode;
    type: "toggle" | "takeover" | "action" | "always";
    defaultVisible?: boolean;
    mobilePosition?: "top" | "bottom";
    align?: "left" | "center" | "right";
    title?: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    /** For takeover tabs: fires whenever this tab transitions between active
     *  and inactive. Called with `true` when the user clicks the tab to open
     *  it, and with `false` when the tab deactivates — whether by the user
     *  clicking it again to close, another takeover being opened
     *  (displacement), or GobanView forcibly closing it because the tab has
     *  been removed from the render tree or gained `disabled`. Consumers
     *  should treat this as the sole authoritative signal to tear down
     *  per-tab state. */
    onToggle?: (active: boolean) => void;
    children?: React.ReactNode;
}

/**
 * Declarative tab definition for GobanView.
 * This component does not render anything itself -- GobanView reads its props
 * to build the tab bar and content panels.
 */
export function GobanViewTab(_props: GobanViewTabProps): React.ReactElement | null {
    return null;
}

GobanViewTab.displayName = "GobanViewTab";
