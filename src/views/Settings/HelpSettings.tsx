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

import { Toggle } from "Toggle";

import { DEFAULT_DYNAMIC_HELP_CONFIG, DynamicHelpSet, toggleHelpSet } from "dynamic_help_config";

import { PreferenceLine } from "SettingsCommon";

export function HelpSettings(): JSX.Element {
    const help_sets = Object.keys(DEFAULT_DYNAMIC_HELP_CONFIG) as DynamicHelpSet[];

    // Keep the settings visivbility value as state so we rerender when we change it...
    const [visibility, setVisibility] = React.useState<{ [help_set: string]: boolean }>(
        Object.fromEntries(
            help_sets.map((help_set) => [
                help_set,
                data.get(`dynamic-help.${help_set}`, DEFAULT_DYNAMIC_HELP_CONFIG[help_set])
                    .show_set,
            ]),
        ),
    );

    // toggle the state to be the value that we toggle the actual setting to...
    const toggleVisibility = (help_set: DynamicHelpSet) => {
        console.log("click");
        setVisibility({ ...visibility, [help_set]: toggleHelpSet(help_set) });
    };

    return (
        <div>
            {help_sets.map((help_set) => (
                <PreferenceLine
                    key={help_set}
                    title={DEFAULT_DYNAMIC_HELP_CONFIG[help_set].set_title}
                >
                    <Toggle
                        checked={visibility[help_set]}
                        onChange={() => toggleVisibility(help_set)}
                    />
                </PreferenceLine>
            ))}
        </div>
    );
}
