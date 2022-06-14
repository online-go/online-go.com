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

import * as React from "react";

import * as data from "data";

import { pgettext } from "translate";

import {
    DEFAULT_DYNAMIC_HELP_CONFIG,
    DynamicHelpSet,
    initializeHelpSet,
    hideHelpSet,
    allItemsVisible,
    initialItemsVisible,
    someItemsVisible,
} from "dynamic_help_config";

import { PreferenceLine } from "SettingsCommon";

export function HelpSettings(): JSX.Element {
    const help_sets = Object.keys(DEFAULT_DYNAMIC_HELP_CONFIG) as DynamicHelpSet[];

    // Here, we keep the settings visibility value as state so we rerender when we change it.
    // We get the initial value for the state by reading it from datam, or using the
    // default values if it has never been set.
    const [visibility, setVisibility] = React.useState<{ [help_set: string]: boolean }>(
        Object.fromEntries(
            help_sets.map((help_set) => [
                help_set,
                data.get(`dynamic-help.${help_set}`, DEFAULT_DYNAMIC_HELP_CONFIG[help_set])
                    .show_set,
            ]),
        ),
    );

    const show = (help_set: DynamicHelpSet) => {
        initializeHelpSet(help_set);
        setVisibility({ ...visibility, [help_set]: true });
    };

    const hide = (help_set: DynamicHelpSet) => {
        hideHelpSet(help_set);
        setVisibility({ ...visibility, [help_set]: false });
    };

    return (
        <div>
            {help_sets.map((help_set) => (
                <PreferenceLine
                    key={help_set}
                    title={DEFAULT_DYNAMIC_HELP_CONFIG[help_set].set_title}
                >
                    <button onClick={() => show(help_set)}>
                        {pgettext("Press this button to show all the initial items", "Reset")}
                    </button>
                    <button onClick={() => hide(help_set)}>
                        {pgettext("Press this button to hide this help set", "Hide set")}
                    </button>
                    <span>
                        {pgettext(
                            "Following this label is the status of currently visible help items",
                            "Currently:",
                        )}
                    </span>
                    <span>
                        {allItemsVisible(help_set)
                            ? "All"
                            : initialItemsVisible(help_set)
                            ? "Initial"
                            : someItemsVisible(help_set)
                            ? "Some"
                            : "None"}
                    </span>
                </PreferenceLine>
            ))}
        </div>
    );
}
