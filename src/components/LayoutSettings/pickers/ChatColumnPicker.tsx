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
import { usePreference } from "@/lib/preferences";
import { chatColumnOptions, chatColumnTitle } from "../options";
import { LayoutChoicePicker } from "@/components/LayoutChoicePicker/LayoutChoicePicker";
import { ChatColumnIllustration } from "../illustrations/ChatColumnIllustration";
import { ChatSidePanelIllustration } from "../illustrations/ChatSidePanelIllustration";

/** Illustrated picker for the "game.chat-column" preference. */
export function ChatColumnPicker({
    size,
    hideTitle,
}: {
    size: "compact" | "large";
    /** See `LayoutChoicePicker`'s prop of the same name. */
    hideTitle?: boolean;
}): React.ReactElement {
    const [chat_column, setChatColumn] = usePreference("game.chat-column");
    const [column, side_panel] = chatColumnOptions();
    return (
        <LayoutChoicePicker
            title={chatColumnTitle()}
            value={chat_column}
            onChange={setChatColumn}
            size={size}
            hideTitle={hideTitle}
            options={[
                { ...column, illustration: <ChatColumnIllustration /> },
                { ...side_panel, illustration: <ChatSidePanelIllustration /> },
            ]}
        />
    );
}
