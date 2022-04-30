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

import Select from "react-select";

export interface JosekiTag {
    value: string;
    label: string;
}

interface JosekiTagSelectorProps {
    available_tags: JosekiTag[];
    selected_tags: JosekiTag[];
    on_tag_update: (newvalue: any) => void;
}

interface JosekiTagSelectorState {}

export class JosekiTagSelector extends React.PureComponent<
    JosekiTagSelectorProps,
    JosekiTagSelectorState
> {
    constructor(props) {
        super(props);
    }

    onTagChange = (e) => {
        this.props.on_tag_update(e);
    };

    render() {
        // console.log("Tag selector render");
        // console.log("tags", this.state.tag_list);
        console.log("Selected tags: ", this.props.selected_tags);
        return (
            <Select
                className="joseki-tag-selector"
                classNamePrefix="ogs-react-select"
                value={this.props.selected_tags}
                options={this.props.available_tags}
                isMulti={true}
                onChange={this.onTagChange}
                getOptionLabel={(o) => o.label}
                getOptionValue={(o) => o.value}
                components={{
                    Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                        <div
                            ref={innerRef}
                            {...innerProps}
                            className={
                                (isFocused ? "focused " : "") + (isSelected ? "selected" : "")
                            }
                        >
                            {data.label}
                        </div>
                    ),
                }}
            />
        );
    }
}
