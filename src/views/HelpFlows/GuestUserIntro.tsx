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
 * A help flow intended for guests who arrived on a Challenge Link
 */

export function GuestUserIntro(): React.ReactElement {
    return (
        <HelpFlow
            id="guest-user-intro"
            showInitially={false}
            debug={false}
            description={pgettext(
                "Name of a dynamic help flow",
                "Guest user introduction (for new Nav)",
            )}
        >
            <HelpItem target="toggle-right-nav" position={"bottom-left"}>
                <div>{_("To set your password, click here")} </div>
            </HelpItem>

            <HelpItem target="settings-nav-link" position={"center-left"} anchor={"top-right"}>
                <div>{_("To set your password, click here")} </div>
            </HelpItem>

            <HelpItem
                target="account-settings-button"
                position={"center-right"}
                anchor={"bottom-left"}
            >
                <div>{_("To set your password, click here")} </div>
            </HelpItem>

            <HelpItem target="password-entry" position={"top-center"}>
                <div>{_("You can enter your new password here.")} </div>
            </HelpItem>

            <HelpItem target="username-edit" position="top-centre" anchor="bottom-left">
                <div>{_("You can also change your username, here.")} </div>
            </HelpItem>
        </HelpFlow>
    );
}
