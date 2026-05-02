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
import Select, { MultiValue, SingleValue } from "react-select";
import { _ } from "@/lib/translate";
import * as DynamicHelp from "react-dynamic-help";

import * as player_cache from "@/lib/player_cache";
import { JosekiTagSelector, OJEJosekiTag } from "../JosekiTagSelector";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { get } from "@/lib/requests";
import "./JosekiVariationFilter.css";

type ContributorOption = { value: number; label: string };
type SourceOption = { value: number; label: string };

export type JosekiFilter = { contributor?: number; tags: OJEJosekiTag[]; source?: number };

interface JosekiVariationFilterProps {
    contributor_list_url: string;
    source_list_url: string;
    set_variation_filter: any;
    joseki_tags: OJEJosekiTag[];
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
        get(props.contributor_list_url)
            .then((body) => {
                const new_contributor_list: ContributorList = [];
                // Server occasionally returns null/undefined ids; drop them so
                // they don't render as "(player null)".
                const ids = (body as Array<number | null | undefined>).filter(
                    (id): id is number => id != null,
                );
                ids.forEach((id: number, idx: number) => {
                    const player = player_cache.lookup(id);
                    new_contributor_list[idx] = {
                        resolved: player !== null,
                        player: (player === null ? id : player) as any,
                    };

                    if (player === null) {
                        player_cache
                            .fetch(id)
                            .then((p) => {
                                new_contributor_list[idx] = { resolved: true, player: p };
                                setContributorList([...new_contributor_list]);
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

    const onTagChange = (tags: MultiValue<OJEJosekiTag>) => {
        const new_filter = { ...props.current_filter, tags };

        props.set_variation_filter(new_filter);
        signalUsed("joseki-position-filter");
        signalUsed("joseki-tag-filter");
    };

    const onContributorChange = (opt: SingleValue<ContributorOption>) => {
        props.set_variation_filter({
            ...props.current_filter,
            contributor: opt ? opt.value : undefined,
        });
    };

    const onSourceChange = (opt: SingleValue<SourceOption>) => {
        props.set_variation_filter({
            ...props.current_filter,
            source: opt ? opt.value : undefined,
        });
    };

    const contributorOptions: ContributorOption[] = contributor_list
        .map((c) =>
            c.resolved === true
                ? { value: c.player.id as number, label: c.player.username ?? "" }
                : { value: c.player as number, label: `(player ${c.player})` },
        )
        .filter((o) => o.value != null);

    const sourceOptions: SourceOption[] = source_list
        .map((s) => ({ value: parseInt(s.id), label: s.description }))
        .filter((o) => !isNaN(o.value));

    const selectedContributor =
        props.current_filter.contributor != null
            ? (contributorOptions.find((o) => o.value === props.current_filter.contributor) ?? null)
            : null;
    const selectedSource =
        props.current_filter.source != null
            ? (sourceOptions.find((o) => o.value === props.current_filter.source) ?? null)
            : null;

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
                <Select
                    className={
                        "joseki-filter-select" + (selectedContributor ? " filter-active" : "")
                    }
                    classNamePrefix="ogs-react-select"
                    value={selectedContributor}
                    options={contributorOptions}
                    onChange={onContributorChange}
                    isClearable={true}
                    isSearchable={true}
                    placeholder={_("Any contributor")}
                />
            </div>

            <div className="filter-set">
                <div className="filter-label">{_("Filter by Source")}</div>
                <Select
                    className={"joseki-filter-select" + (selectedSource ? " filter-active" : "")}
                    classNamePrefix="ogs-react-select"
                    value={selectedSource}
                    options={sourceOptions}
                    onChange={onSourceChange}
                    isClearable={true}
                    isSearchable={true}
                    placeholder={_("Any source")}
                />
            </div>
        </div>
    );
}
