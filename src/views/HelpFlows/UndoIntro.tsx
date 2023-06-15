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

import { _, pgettext } from "translate";

/**
 * A help flow shown when you first press the undo button
 */

export function UndoIntro(): JSX.Element {
    return (
        <HelpFlow
            id="undo-intro"
            showInitially={false}
            description={pgettext("Name of a dynamic help flow", "OGS Undo policy notification")}
        >
            <HelpItem target="undo-requested-message" position={"bottom-center"} hideOptOut>
                <div>
                    {_("Please note: at OGS, no-one is ever obliged to accept an undo request!")}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
