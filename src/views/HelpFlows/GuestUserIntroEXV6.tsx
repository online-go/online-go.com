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
 * A help flow intended for guests who arrived on a Challenge Link
 * (targets components in the EXV6 flow)
 */

export function GuestUserIntroEXV6(): JSX.Element {
    return (
        <HelpFlow
            id="guest-user-intro-exv6"
            showInitially={false}
            debug={false}
            description="Guest user introduction"
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

            <HelpItem target="profile-edit-link" position="top-centre" anchor="bottom-left">
                <div>{_("You can also change your username, here.")} </div>
            </HelpItem>

            <HelpItem
                target="profile-edit-page"
                position="bottom-right"
                anchor="bottom-left"
                id="help-for-profile-edit-page-exv6"
            >
                <div>{_("In here you can change your profile appearance, then click 'Save'.")}</div>
            </HelpItem>
        </HelpFlow>
    );
}
