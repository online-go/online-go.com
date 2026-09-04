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

import * as React from "react";
import Select, { SelectComponentsConfig } from "react-select";

import { usePreference } from "@/lib/preferences";
import { ValidPreference } from "@/lib/preferences";

import { Toggle } from "@/components/Toggle";

export const MAX_AI_VAR_MOVES = 10;

export interface SettingGroupPageProps {
    state: SettingsState;
    vacation_base_time: number;
    refresh: () => () => void;
    updateSelfReportedAccountLinkages: (link: any) => void;
}

export interface SettingsState {
    profile?: any;
    notifications?: any;
    vacation_left?: string;
    hide_ui_class?: boolean;
    self_reported_account_linkages?: any;
}

export function PreferenceToggle(props: {
    name: string;
    preference: ValidPreference;
}): React.ReactElement {
    const [on, setPreference] = usePreference(props.preference);

    return (
        <div className="PreferenceToggle">
            <label>
                <span className="preference-toggle-name">{props.name}</span>
                <Toggle
                    id={`preference-toggle-${props.preference}`}
                    onChange={setPreference}
                    checked={!!on}
                />
            </label>
        </div>
    );
}

export function PreferenceLine(props: {
    title: string | React.ReactElement;
    description?: string;
    children: React.ReactNode;
    className?: string;
}): React.ReactElement {
    return (
        <div className={`PreferenceLine ${props.className || ""}`}>
            <span className="PreferenceLineTitle">
                {props.title}
                {props.description && (
                    <div className="PreferenceLineDescription">{props.description}</div>
                )}
            </span>
            <span className="PreferenceLineBody">{props.children}</span>
        </div>
    );
}

export interface PreferenceDropdownProps {
    value: any;
    options: Array<{ value: any; label: string }>;
    onChange: (value: any) => void;
}

type PreferenceOption = { value: any; label: string };

/* The custom parts are defined once at module scope. Defining them inline
 * in the render function gives react-select a new component type on every
 * parent re-render, which remounts every option element while the menu is
 * open. On iOS Safari a tap whose touchstart target is replaced before
 * touchend never becomes a click, so the options could not be selected
 * anywhere the parent re-renders often, such as the game view. */
const PREFERENCE_DROPDOWN_COMPONENTS: SelectComponentsConfig<PreferenceOption, false, never> = {
    Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
        <div
            ref={innerRef}
            {...innerProps}
            className={
                "PreferenceDropdown-option " +
                (isFocused ? "focused " : "") +
                (isSelected ? "selected" : "")
            }
        >
            {data.label}
        </div>
    ),
    SingleValue: ({ innerProps, data }) => (
        <span {...innerProps} className="PreferenceDropdown-value">
            {data.label}
        </span>
    ),
    ValueContainer: ({ children }) => (
        <div className="PreferenceDropdown-value-container">{children}</div>
    ),
};

export function PreferenceDropdown(props: PreferenceDropdownProps): React.ReactElement {
    return (
        <Select<PreferenceOption, false, never>
            className="PreferenceDropdown"
            classNamePrefix="ogs-react-select"
            value={props.options.filter((opt) => opt.value === props.value)[0]}
            getOptionValue={(data) => data.value}
            onChange={(data) => props.onChange(data?.value)}
            options={props.options}
            isClearable={false}
            isSearchable={false}
            blurInputOnSelect={true}
            components={PREFERENCE_DROPDOWN_COMPONENTS}
        />
    );
}
