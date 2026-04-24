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
    /** For takeover tabs: fires on any activation/deactivation driven by a
     *  user tab click. That includes deactivation caused by another
     *  takeover being opened (displacement). Not fired when the tab is
     *  removed or disabled while active. */
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
