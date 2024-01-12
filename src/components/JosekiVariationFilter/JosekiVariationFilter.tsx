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
import * as ReactSelect from "react-select";
import { _ } from "translate";
import * as DynamicHelp from "react-dynamic-help";

import * as player_cache from "player_cache";
import { JosekiTagSelector, JosekiTag } from "../JosekiTagSelector";
import { PlayerCacheEntry } from "player_cache";
import { get } from "requests";

export type JosekiFilter = { contributor?: number; tags: JosekiTag[]; source?: number };

interface JosekiVariationFilterProps {
    contributor_list_url: string;
    source_list_url: string;
    set_variation_filter: any;
    joseki_tags: JosekiTag[];
    current_filter: JosekiFilter;
}

type ResolvedContributor = { resolved: true; player: PlayerCacheEntry };
type UnresolvedContributor = { resolved: false; player: number };
type ContributorList = (ResolvedContributor | UnresolvedContributor)[];

export function JosekiVariationFilter(props: JosekiVariationFilterProps) {
    const [contributor_list, setContributorList] = React.useState<ContributorList>([]);
    const [source_list, setSourceList] = React.useState<{ id: string; description: string }[]>([]);

    const { registerTargetItem, signalUsed } = React.useContext(DynamicHelp.Api);
    const { ref: joseki_position_filter } = registerTargetItem("joseki-position-filter");
    const { ref: joseki_tag_filter } = registerTargetItem("joseki-tag-filter");

    React.useEffect(() => {
        // Get the list of contributors to chose from
        get(props.contributor_list_url)
            .then((body) => {
                //console.log("Server response to contributors GET:", body);
                const new_contributor_list: ContributorList = [];
                body.forEach((id: number, idx: number) => {
                    //console.log("Looking up player", id, idx);
                    const player = player_cache.lookup(id);
                    (new_contributor_list as any)[idx] = {
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

        get(props.source_list_url)
            .then((body) => {
                if (body.sources != null) {
                    // Sentry reports that we somehow receive a body with undefined source_list!?
                    setSourceList(body.sources);
                }
            })
            .catch((r) => {
                console.log("Sources GET failed:", r);
            });
    }, []);

    const onTagChange = (tags: ReactSelect.MultiValue<JosekiTag>) => {
        const new_filter = { ...props.current_filter, tags };

        props.set_variation_filter(new_filter); // tell parent the filter changed, so the view needs to change
        signalUsed("joseki-position-filter");
        signalUsed("joseki-tag-filter");
    };

    const onContributorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value === "none" ? null : parseInt(e.target.value);
        const new_filter = { ...props.current_filter, contributor: val };
        props.set_variation_filter(new_filter);
    };

    const onSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
        <div className="joseki-variation-filter" ref={joseki_position_filter}>
            <div className="filter-set" ref={joseki_tag_filter}>
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
