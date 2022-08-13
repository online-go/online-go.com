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

/**
 * This component is a handy wrapper for all the Help Flows, and reset on login/logout
 *
 * When the logged-in user changes, we have to wait till we see the new state loaded, then update the help system with it
 */

export function HelpFlows(): JSX.Element {
    const { enableHelp } = React.useContext(DynamicHelp.Api);

    React.useEffect(() => {
        const updateHelpState = () => {
            data.unwatch("rdh-system-state", updateHelpState);
            const user = data.get("config.user");
            if (!user?.anonymous) {
                enableHelp(true);
            } else {
                enableHelp(false);
            }
        };
        const updateHelpWhenStateArrives = () => {
            data.watch(
                "rdh-system-state",
                updateHelpState,
                /* call undefined */ false,
                /* dont call immediately */ true,
            );
        };

        data.watch(
            "config.user",
            updateHelpWhenStateArrives,
            /* call undefined */ false,
            /* dont call immediately */ true,
        );

        return () => {
            data.unwatch("rdh-system-state", updateHelpState);
            data.unwatch("config.user", updateHelpWhenStateArrives);
        };
    }, [enableHelp]);

    return (
        <>
            <GuestUserIntroEXV6 />

            <GuestUserIntroOldNav />
        </>
    );
}
