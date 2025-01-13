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
 * A help flow shown when you first press the undo button
 */

export function UndoRequestedIntro(): React.ReactElement {
    return (
        <HelpFlow
            id="undo-requested-intro"
            showInitially={false}
            description={pgettext(
                "Name of a dynamic help flow helping with waiting for undo acceptance",
                "OGS Undo policy notification (requested)",
            )}
        >
            <HelpItem target="undo-requested-message" position={"bottom-center"}>
                <div>
                    {_(
                        "Your opponent may now decide to accept the undo request or not. Please note they are not obliged to do so.",
                    )}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}

/**
 * A help flow shown when you first get asked for undo
 */

export function UndoRequestReceivedIntro(): React.ReactElement {
    return (
        <HelpFlow
            id="undo-request-received-intro"
            showInitially={false}
            description={pgettext(
                "Name of a dynamic help flow helping with receiving an undo",
                "OGS Undo policy notification (received)",
            )}
        >
            <HelpItem target="accept-undo-button" position={"bottom-left"}>
                <div>
                    {_(
                        "Your opponent requested an undo: you may decide to accept the undo request or not - you are not obliged to do so.",
                    )}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
