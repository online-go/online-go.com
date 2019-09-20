/*
 * Copyright (C) 2012-2019  Online-Go.com
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

import Select from 'react-select';

import { _, pgettext, interpolate } from "translate";

interface JosekiTagSelectorProps {
    godojo_headers: any;
    tag_list_url: string;
    selected_tags: number[];
    on_tag_update: any;
}

export class JosekiTagSelector extends React.PureComponent<JosekiTagSelectorProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            tag_list: [],
        };
    }

    componentDidMount = () => {
        fetch(this.props.tag_list_url, {
            mode: 'cors',
            headers: this.props.godojo_headers
        })
        .then(res => res.json())
        .then(body => {
            // console.log("Server response to tag GET:", body);
            const available_tags = body.tags.map((tag, i) => (
                { label: tag.description, value: tag.id }
            ));
            this.setState({tag_list: available_tags});
        }).catch((r) => {
            console.log("Tags GET failed:", r);
        });
    }

    onTagChange = (e) => {
        this.props.on_tag_update(e);
    }

    render() {
        // console.log("Tag selector render");
        // console.log("tags", this.state.tag_list);

        return (
            <Select className="joseki-tag-selector"
                value={this.props.selected_tags}
                options={this.state.tag_list}
                multi={true}
                onChange={this.onTagChange}
                valueRenderer={(v) => <span className="tag-value">{v.label}</span>}
                optionRenderer={(o) => <span className="tag-option">{o.label}</span>}
            />
        );
    }
}

