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

export function OJEIntro(): React.ReactElement {
    return (
        <HelpFlow
            id="oje-intro"
            showInitially={true}
            description={pgettext(
                "Name of a dynamic help flow helping with OGS Joseki Explorer",
                "OJE Intro",
            )}
        >
            <HelpItem target="joseki-position-filter" position={"centre-left"}>
                <div>{_("Use this filter to control what variations you see")}</div>
            </HelpItem>

            <HelpItem target="joseki-tag-filter" position={"centre-left"} anchor="top-right">
                <div>
                    {_(
                        "By default only 'actual joseki' are shown.  You can clear the filter to see more variations",
                    )}
                </div>
            </HelpItem>
        </HelpFlow>
    );
}
