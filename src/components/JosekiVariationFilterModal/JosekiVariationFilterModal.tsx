/*
 * Copyright (C) 2012-2017  Online-Go.com
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

import { _ } from 'translate';
import { Modal } from "Modal";

import { Player } from "Player";

interface Events {
}

interface JosekiVariationFilterModalProperties {
    contributor_list_url: string;
    godojo_headers: {};
    set_contributor_filter: any;
}

export class JosekiVariationFilterModal extends Modal<Events, JosekiVariationFilterModalProperties, any> {
    constructor(props) {
        super(props);

        this.state = {
            contributor_list: [],
            selected_contributor: 0
        };
    }

    componentDidMount = () => {
        // Get the list of contributors to chose from
        fetch(this.props.contributor_list_url, {
            mode: 'cors',
            headers: this.props.godojo_headers
        })
        .then(res => res.json())
        .then(body => {
            console.log("Server response to contributors GET:", body);
            this.setState({contributor_list: body});
        });
    }

    onContributorChange = (e) => {
        this.setState({selected_contributor: e.target.value});
    }

    applyFilter = () => {
        this.props.set_contributor_filter(this.state.selected_contributor);
        this.close();
    }

    render() {
        console.log("Variation filter...", this.state.contributor_list);

        let contributors = this.state.contributor_list.map((c, i) => (
        <option key={i} value={c}>Player with id {c}</option>
        ));

        contributors.unshift(<option key={-1} value={0}>({_("clear")})</option>);

        return (
            <div className="Modal JosekiVariationFilterModal" ref="modal">
                <div className="header">Filter by Contributor</div>
                <select value={this.state.selected_contributor} onChange={this.onContributorChange}>
                            {contributors}
                </select>
                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                    <button className="primary" onClick={this.applyFilter}>{_("Save")}</button>
                </div>
            </div>
        );
    }
}
