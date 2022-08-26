/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { _ } from "translate";

/**
 * A help flow intended for guests who arrived on a Challenge Link for a Rengo game
 *
 */

export function GuestUserIntroRengo(): JSX.Element {
    return (
        <HelpFlow id="guest-user-intro-rengo" description="Guest user introduction for Rengo">
            <HelpItem target="active-rengo-management-pane" position={"bottom-centre"}>
                <div>{_("The organiser will start your Rengo game when it is ready")} </div>
            </HelpItem>
        </HelpFlow>
    );
}
