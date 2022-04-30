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
    source_list_url: string;
    set_variation_filter: any;
    joseki_tags: JosekiTag[];
    current_filter: { contributor: number; tags: JosekiTag[]; source: number };
}

type ResolvedContributor = { resolved: true; player: PlayerCacheEntry };
type UnresolvedContributor = { resolved: false; player: number };
type ContributorList = (ResolvedContributor | UnresolvedContributor)[];

export function JosekiVariationFilter(props: JosekiVariationFilterProps) {
    const [contributor_list, setContributorList] = React.useState<ContributorList>([]);
    const [source_list, setSourceList] = React.useState<{ id: string; description: string }[]>([]);

    React.useEffect(() => {
        // Get the list of contributors to chose from
        fetch(props.contributor_list_url, {
            mode: "cors",
            headers: props.oje_headers,
        })
            .then((res) => res.json())
            .then((body) => {
                console.log("Server response to contributors GET:", body);
                const new_contributor_list: ContributorList = [];
                body.forEach((id, idx) => {
                    //console.log("Looking up player", id, idx);
                    const player = player_cache.lookup(id);
                    new_contributor_list[idx] = {
                        resolved: player !== null,
                        player: player === null ? id : player,
                    };

                    if (player === null) {
                        //console.log("fetching player", id, idx);
                        player_cache
                            .fetch(id)
                            .then((p) => {
                                //console.log("fetched player", p.username, id, idx);
                                new_contributor_list[idx] = { resolved: true, player: p };
                                setContributorList(new_contributor_list);
                            })
                            .catch((r) => {
                                console.log("Player cache fetch failed:", r);
                            });
                    }
                });
                setContributorList(new_contributor_list);
            })
            .catch((r) => {
                console.log("Contributors GET failed:", r);
            });

        fetch(props.source_list_url, {
            mode: "cors",
            headers: props.oje_headers,
        })
            .then((res) => res.json())
            .then((body) => {
                // This can possibly be changed to !== undefined or != null,
                // But I don't want to touch this right now -BPJ
                // eslint-disable-next-line eqeqeq
                if (body.sources != undefined) {
                    // Sentry reports that we somehow receive a body with undefined source_list!?
                    setSourceList(body.sources);
                }
            })
            .catch((r) => {
                console.log("Sources GET failed:", r);
            });
    }, []);

    const onTagChange = (tags: JosekiTag[]) => {
        console.log("Variation filter update:", tags);
        //const tags = (e === null || e.length === 0) ? null : e.map(t => typeof(t) === 'number' ? t : t.value);
        const new_filter = { ...props.current_filter, tags };

        // console.log("new tag filter", new_filter);
        props.set_variation_filter(new_filter); // tell parent the fiter changed, so the view needs to change
    };

    const onContributorChange = (e) => {
        const val = e.target.value === "none" ? null : parseInt(e.target.value);
        const new_filter = { ...props.current_filter, contributor: val };
        props.set_variation_filter(new_filter);
    };

    const onSourceChange = (e) => {
        const val = e.target.value === "none" ? null : parseInt(e.target.value);
        const new_filter = { ...props.current_filter, source: val };
        props.set_variation_filter(new_filter);
    };

    const contributors = contributor_list.map((c, i) => {
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

    const sources = source_list.map((s, i) => (
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
        props.current_filter.contributor === null ? "none" : props.current_filter.contributor;

    const current_source =
        props.current_filter.source === null ? "none" : props.current_filter.source;

    return (
        <div className="joseki-variation-filter">
            <div className="filter-set">
                <div className="filter-label">{_("Filter by Tag")}</div>
                <JosekiTagSelector
                    available_tags={props.joseki_tags}
                    selected_tags={props.current_filter?.tags || []}
                    on_tag_update={onTagChange}
                />
            </div>

            <div className="filter-set">
                <div className="filter-label">{_("Filter by Contributor")}</div>
                <select value={current_contributor} onChange={onContributorChange}>
                    {contributors}
                </select>
            </div>

            <div className="filter-set">
                <div className="filter-label">{_("Filter by Source")}</div>
                <select value={current_source} onChange={onSourceChange}>
                    {sources}
                </select>
            </div>
        </div>
    );
}
