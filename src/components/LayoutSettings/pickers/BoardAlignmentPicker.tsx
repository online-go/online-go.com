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
import { normalizeBoardAlignment } from "@/components/GobanView/layout";
import { boardAlignmentOptions, boardAlignmentTitle } from "../options";
import { LayoutChoicePicker } from "@/components/LayoutChoicePicker/LayoutChoicePicker";
import { BoardAlignContainerIllustration } from "../illustrations/BoardAlignContainerIllustration";
import { BoardAlignGroupIllustration } from "../illustrations/BoardAlignGroupIllustration";
import { BoardAlignWindowIllustration } from "../illustrations/BoardAlignWindowIllustration";

/**
 * Illustrated picker for the "goban-view-board-alignment" preference. The
 * alignment only applies to the landscape layout, so there are only
 * desktop drawings.
 */
export function BoardAlignmentPicker({
    size,
    hideTitle,
}: {
    size: "compact" | "large";
    /** See `LayoutChoicePicker`'s prop of the same name. */
    hideTitle?: boolean;
}): React.ReactElement {
    const [stored, setBoardAlignment] = usePreference("goban-view-board-alignment");
    const board_alignment = normalizeBoardAlignment(stored);
    const [in_window, beside_sidebar, with_sidebar] = boardAlignmentOptions();
    return (
        <LayoutChoicePicker
            title={boardAlignmentTitle()}
            value={board_alignment}
            onChange={setBoardAlignment}
            size={size}
            hideTitle={hideTitle}
            options={[
                { ...in_window, illustration: <BoardAlignWindowIllustration /> },
                { ...beside_sidebar, illustration: <BoardAlignContainerIllustration /> },
                { ...with_sidebar, illustration: <BoardAlignGroupIllustration /> },
            ]}
        />
    );
}
