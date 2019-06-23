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
import { _, pgettext, interpolate } from "translate";

import * as player_cache from "player_cache";

interface JosekiVariationFilterProps {
    godojo_headers: any;
    contributor_list_url: string;
    set_contributor_filter: any;
    current_filter: {};
}

export class JosekiVariationFilter extends React.PureComponent<JosekiVariationFilterProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            contributor_list: [],
            selected_contributor: this.props.current_filter['contributor']
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
            let contributor_list = [];
            body.forEach((id, idx) => {
                console.log("Looking up", id, idx);
                const player = player_cache.lookup(id);
                contributor_list[idx] = {resolved: player !== null, player: player === null ? id : player};

                if (player === null) {
                    console.log("fetching", id, idx);
                    player_cache.fetch(id).then((p) => {
                        console.log("fetched", p, id, idx); // by some javascript miracle this is the correct value of idx
                        let contributor_list = [...this.state.contributor_list];
                        contributor_list[idx] = {resolved: true, player: p};
                        console.log("setting ", contributor_list);
                        this.setState({contributor_list});
                    });
                }
            });
            this.setState({contributor_list});
        });
    }

    onContributorChange = (e) => {
        this.setState({selected_contributor: e.target.value});
        this.props.set_contributor_filter(parseInt(e.target.value));
    }

    render() {
        console.log("Variation filter...", this.state.contributor_list);

        let contributors = this.state.contributor_list.map((c, i) => {
            if (c.resolved) {
                return <option key={i} value={c.player.id}>{c.player.username}</option>;
            }
            else {
                return <option key={i} value={c.player}>{"(player " + c.player + ")"}</option>;
            }
        });

        contributors.unshift(<option key={-1} value={0}>({_("none")})</option>);

        return (
            <div className="joseki-variation-filter">
                <div className="contributor-label">Filter by Contributor</div>
                <select value={this.state.selected_contributor} onChange={this.onContributorChange}>
                            {contributors}
                </select>
            </div>
        );
    }


}

