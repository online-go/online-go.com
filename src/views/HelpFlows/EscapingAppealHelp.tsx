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

import { pgettext } from "@/lib/translate";

/**
 * Help flow for users suspended due to escaping (stopping play), providing
 * guidance on how to appeal and what is expected.
 */

export function EscapingAppealHelp(): React.ReactElement {
    return (
        <HelpFlow
            id="escaping-appeal-help"
            showInitially={false}
            description={pgettext("Name of a dynamic help flow", "Escaping Appeal Help")}
        >
            <HelpItem target="escaping-suspension-reason" position={"bottom-center"}>
                <div>
                    {pgettext(
                        "Help text for users suspended due to escaping - part 1",
                        "Your account was suspended because you repeatedly abandoned games without finishing them properly.",
                    )}
                </div>
            </HelpItem>
            <HelpItem target="escaping-suspension-reason" position={"bottom-center"}>
                <div>
                    {pgettext(
                        "Help text for users suspended due to escaping - part 2",
                        "When you just leave, your opponent has to wait for your clock to run out. This wastes their time and is considered poor sportsmanship.",
                    )}
                </div>
            </HelpItem>
            <HelpItem target="escaping-suspension-reason" position={"bottom-center"}>
                <div>
                    {pgettext(
                        "Help text for users suspended due to escaping - part 3",
                        "To appeal, please confirm that you understand why this is a problem and that you will finish games properly\
                         - either by resigning if you have definitely lost, or passing and promptly accepting the correct score.",
                    )}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
