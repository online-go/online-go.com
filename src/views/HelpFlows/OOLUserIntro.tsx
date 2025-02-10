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

import React from "react";

import { HelpFlow, HelpItem } from "react-dynamic-help";

import { _, pgettext } from "@/lib/translate";

/**
 * A help flow intended for players who arrived on an OOL Game Link
 */

export function OOLUserIntro(): React.ReactElement {
    return (
        <HelpFlow
            id="ool-user-intro"
            showInitially={true}
            description={pgettext(
                "Name of a dynamic help flow",
                "Online League New User Introduction",
            )}
        >
            <HelpItem target="ready-button" position={"bottom-right"}>
                <div>{_("When both players have pressed this button, the game will start.")}</div>
            </HelpItem>

            <HelpItem target="not-ready-button" position={"bottom-right"}>
                <div>
                    {_("If you press this now, the game will not start, until you press it again.")}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
