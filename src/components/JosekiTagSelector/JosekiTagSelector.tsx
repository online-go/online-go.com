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
import { pgettext } from "@/lib/translate";

import Select, { MultiValue } from "react-select";

// I have no idea why this is different to the back end type
// It gets mapped to this from the backend type :shrug:
export interface OJEJosekiTag {
    value: string;
    label: string;
}

interface JosekiTagSelectorProps {
    available_tags: OJEJosekiTag[];
    selected_tags: OJEJosekiTag[];
    on_tag_update: (new_value: MultiValue<OJEJosekiTag>) => void;
}

export function JosekiTagSelector(props: JosekiTagSelectorProps) {
    const onTagChange = (e: MultiValue<OJEJosekiTag>) => {
        props.on_tag_update(e);
    };

    return (
        <Select
            className={
                "joseki-tag-selector " + (props.selected_tags.length > 0 ? "filter-active" : "")
            }
            classNamePrefix="ogs-react-select"
            value={props.selected_tags}
            options={props.available_tags}
            isMulti={true}
            onChange={onTagChange}
            getOptionLabel={(o) => pgettext("This is a Joseki Tag", o.label)}
            getOptionValue={(o) => o.value}
            components={{
                Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                    <div
                        ref={innerRef}
                        {...innerProps}
                        className={(isFocused ? "focused " : "") + (isSelected ? "selected" : "")}
                    >
                        {
                            pgettext(
                                "This is a Joseki Tag",
                                data.label,
                            ) /* translation of tag labels is forced in Joseki constructor */
                        }
                    </div>
                ),
            }}
        />
    );
}
