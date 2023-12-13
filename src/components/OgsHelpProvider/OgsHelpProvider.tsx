/*
Copyright (c)  Online-Go.com.

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

import * as React from "react";
import { pgettext } from "translate";

import * as data from "data";

import { HelpProvider, HelpPopupDictionary } from "react-dynamic-help";
import * as DynamicHelp from "react-dynamic-help";

const helpPopupDictionary: HelpPopupDictionary = {
    "Skip this topic": pgettext("A button to dismiss a help popup topic", "Skip this topic"),
    OK: pgettext("A button to dismiss the current help popup", "OK"),
};

type OgsHelpProviderProps = {
    children: JSX.Element | JSX.Element[]; // This has to be the app and the help flows (as per RDH HelpProvider)
};

/**
 * Implement an RDH HelpProvider that uses OGS data storage
 */

export function OgsHelpProvider(props: OgsHelpProviderProps): JSX.Element {
    const [storageLoaded, setStorageLoaded] = React.useState(false);

    const debugDynamicHelp = data.get("debug-dynamic-help", false);
    const user = data.get("config.user");

    // Make help system use our server-based storage, to achieve logged-in-user-specific help state.

    // Prevent writing back rdhState till remote data is loaded

    React.useEffect(() => {
        data.events.on("remote_data_sync_complete", () => {
            debugDynamicHelp && console.log("Telling RDH: Storage loaded");
            setStorageLoaded(true);
        });
    }, []);

    // TBD should memo this
    const dynamicHelpStorage: DynamicHelp.DynamicHelpStorageAPI = {
        saveState: (rdhState: string) => {
            if (storageLoaded) {
                debugDynamicHelp &&
                    console.log("Writing rdhState", user.username, user.id, rdhState);
                return data.set(
                    "rdh-system-state",
                    rdhState,
                    data.Replication.REMOTE_OVERWRITES_LOCAL,
                ) as string;
            } else {
                debugDynamicHelp && console.log("NOT writing rdhState");
                return rdhState;
            }
        },
        getState: (defaultValue?: string) => {
            const newstate = data.get("rdh-system-state", defaultValue || "");
            debugDynamicHelp && console.log("Read rdhState", user.username, user.id, newstate);
            return newstate;
        },
    };

    return (
        <HelpProvider
            dictionary={helpPopupDictionary}
            storageApi={dynamicHelpStorage}
            storageReady={storageLoaded}
            debug={debugDynamicHelp}
        >
            {props.children}
        </HelpProvider>
    );
}
