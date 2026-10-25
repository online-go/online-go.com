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
import { useGobanViewLayout } from "@/components/GobanView";
import { GameChat } from "./GameChat";

interface SidebarGameChatProps extends React.ComponentProps<typeof GameChat> {
    isMobile: boolean;
    /** The mobile chat toggle ("game.mobile-chat-visible"). */
    mobileChatVisible: boolean;
    /** Called with true while this shows the chat on mobile, false
     *  otherwise (and on unmount). Game uses it for the chat's unread
     *  marker, so it does not have to repeat the layout rules. */
    onMobileVisibleChange?: (visible: boolean) => void;
}

/** The game chat in the sidebar. Renders nothing while the chat is in the
 *  left column, so only one chat is mounted at a time. On mobile it follows
 *  the chat toggle, except in the scrolling layout, where the chat is
 *  always at the end of the scroll. */
export function SidebarGameChat({
    isMobile,
    mobileChatVisible,
    onMobileVisibleChange,
    ...props
}: SidebarGameChatProps): React.ReactElement | null {
    const layout = useGobanViewLayout();
    const shown = !layout.leftAside && (!isMobile || mobileChatVisible || layout.mobileScroll);
    const shown_on_mobile = isMobile && shown;

    React.useEffect(() => {
        onMobileVisibleChange?.(shown_on_mobile);
        return () => onMobileVisibleChange?.(false);
    }, [shown_on_mobile, onMobileVisibleChange]);

    return shown ? <GameChat {...props} /> : null;
}
