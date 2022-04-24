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
import { _ } from "translate";

import * as player_cache from "player_cache";
import { JosekiTagSelector, JosekiTag } from "../JosekiTagSelector";
import { PlayerCacheEntry } from "player_cache";

interface JosekiVariationFilterProps {
    oje_headers: HeadersInit;
    contributor_list_url: string;
    tag_list_url: string;
    source_list_url: string;
    set_variation_filter: any;
    current_filter: { contributor: number; tags: JosekiTag[]; source: number };
}

type ResolvedContributor = { resolved: true; player: PlayerCacheEntry };
type UnresolvedContributor = { resolved: false; player: number };

interface JosekiVariationFilterState {
    contributor_list: (ResolvedContributor | UnresolvedContributor)[];
    tag_list: JosekiTag[];
    source_list: { id: string; description: string }[];
    selected_filter: {
        tags: JosekiTag[];
        contributor: number;
        source: number;
    };
}

export class JosekiVariationFilter extends React.PureComponent<
    JosekiVariationFilterProps,
    JosekiVariationFilterState
> {
    constructor(props) {
        super(props);
        this.state = {
            contributor_list: [],
            tag_list: [],
            source_list: [],
            selected_filter: {
                tags: this.props.current_filter["tags"],
                contributor: this.props.current_filter["contributor"],
                source: this.props.current_filter["source"],
            },
        };
    }

    componentDidMount = () => {
        // Get the list of contributors to chose from
        fetch(this.props.contributor_list_url, {
            mode: "cors",
            headers: this.props.oje_headers,
        })
            .then((res) => res.json())
            .then((body) => {
                // console.log("Server response to contributors GET:", body);
                const contributor_list = [];
                body.forEach((id, idx) => {
                    // console.log("Looking up player", id, idx);
                    const player = player_cache.lookup(id);
                    contributor_list[idx] = {
                        resolved: player !== null,
                        player: player === null ? id : player,
                    };

                    if (player === null) {
                        // console.log("fetching player", id, idx);
                        player_cache
                            .fetch(id)
                            .then((p) => {
                                // console.log("fetched player", p, id, idx); // by some javascript miracle this is the correct value of idx
                                const contributor_list = [...this.state.contributor_list];
                                contributor_list[idx] = { resolved: true, player: p };
                                this.setState({ contributor_list });
                            })
                            .catch((r) => {
                                console.log("Player cache fetch failed:", r);
                            });
                    }
                });
                this.setState({ contributor_list });
            })
            .catch((r) => {
                console.log("Contributors GET failed:", r);
            });

        fetch(this.props.source_list_url, {
            mode: "cors",
            headers: this.props.oje_headers,
        })
            .then((res) => res.json())
            .then((body) => {
                // This can possibly be changed to !== undefined or != null,
                // But I don't want to touch this right now -BPJ
                // eslint-disable-next-line eqeqeq
                if (body.sources != undefined) {
                    // Sentry reports that we somehow receive a body with undefined source_list!?
                    this.setState({ source_list: body.sources });
                }
            })
            .catch((r) => {
                console.log("Sources GET failed:", r);
            });
    };

    onTagChange = (tags) => {
        // console.log("Variation filter update:", e);
        //const tags = (e === null || e.length === 0) ? null : e.map(t => typeof(t) === 'number' ? t : t.value);
        const new_filter = { ...this.state.selected_filter, tags };

        // console.log("new tag filter", new_filter);
        this.props.set_variation_filter(new_filter);
        this.setState({ selected_filter: new_filter });
    };

    onContributorChange = (e) => {
        const val = e.target.value === "none" ? null : parseInt(e.target.value);
        const new_filter = { ...this.state.selected_filter, contributor: val };
        this.props.set_variation_filter(new_filter);
        this.setState({ selected_filter: new_filter });
    };

    onSourceChange = (e) => {
        const val = e.target.value === "none" ? null : parseInt(e.target.value);
        const new_filter = { ...this.state.selected_filter, source: val };
        this.props.set_variation_filter(new_filter);
        this.setState({ selected_filter: new_filter });
    };

    render() {
        // console.log("Variation filter render");
        // console.log("contributors", this.state.contributor_list);
        // console.log("sources", this.state.source_list);
        // console.log(" filter", this.state.selected_filter);

        console.log(this.state.contributor_list);

        const contributors = this.state.contributor_list.map((c, i) => {
            if (c.resolved === true) {
                return (
                    <option key={i} value={c.player.id}>
                        {c.player.username}
                    </option>
                );
            } else {
                return (
                    <option key={i} value={c.player}>
                        {"(player " + c.player + ")"}
                    </option>
                );
            }
        });

        contributors.unshift(
            <option key={-1} value={"none"}>
                ({_("none")})
            </option>,
        );

        const sources = this.state.source_list.map((s, i) => (
            <option key={i} value={s.id}>
                {s.description}
            </option>
        ));
        sources.unshift(
            <option key={-1} value={"none"}>
                ({_("none")})
            </option>,
        );

        const current_contributor =
            this.state.selected_filter.contributor === null
                ? "none"
                : this.state.selected_filter.contributor;

        const current_source =
            this.state.selected_filter.source === null ? "none" : this.state.selected_filter.source;

        return (
            <div className="joseki-variation-filter">
                <div className="filter-set">
                    <div className="filter-label">{_("Filter by Tag")}</div>
                    <JosekiTagSelector
                        oje_headers={this.props.oje_headers}
                        tag_list_url={this.props.tag_list_url}
                        selected_tags={this.state.selected_filter.tags}
                        on_tag_update={this.onTagChange}
                    />
                </div>

                <div className="filter-set">
                    <div className="filter-label">{_("Filter by Contributor")}</div>
                    <select value={current_contributor} onChange={this.onContributorChange}>
                        {contributors}
                    </select>
                </div>

                <div className="filter-set">
                    <div className="filter-label">{_("Filter by Source")}</div>
                    <select value={current_source} onChange={this.onSourceChange}>
                        {sources}
                    </select>
                </div>
            </div>
        );
    }
}
