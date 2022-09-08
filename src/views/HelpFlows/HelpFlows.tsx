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
import * as DynamicHelp from "react-dynamic-help";

import * as data from "data";

import { GuestUserIntroEXV6 } from "./GuestUserIntroEXV6";
import { GuestUserIntroOldNav } from "./GuestUserIntroOldNav";
import { GuestUserIntroRengo } from "./GuestUserIntroRengo";

/**
 * This component is a handy wrapper for all the Help Flows, and reset on login/logout
 *
 * When the logged-in user changes, we have to wait till we see the new state loaded, then update the help system with it
 */

export function HelpFlows(): JSX.Element {
    const { enableHelp, reloadUserState: reloadUserHelpState } = React.useContext(DynamicHelp.Api);

    React.useEffect(() => {
        const updateHelpState = () => {
            const user = data.get("config.user");
            if (!user?.anonymous) {
                reloadUserHelpState();
            } else {
                enableHelp(false);
            }
        };

        data.events.on("remote_data_sync_complete", updateHelpState);

        return () => {
            data.events.off("remote_data_sync_complete", updateHelpState);
        };
    }, [enableHelp]);

    return (
        <>
            <GuestUserIntroEXV6 />

            <GuestUserIntroOldNav />

            <GuestUserIntroRengo />
        </>
    );
}
