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

import { _, interpolate, npgettext } from "@/lib/translate";
import { JosekiVariationFilter, JosekiFilter } from "@/components/JosekiVariationFilter";
import { OJEJosekiTag } from "@/components/JosekiTagSelector";
import { server_url, MoveTypeWithComment } from "./joseki-utils";

export interface PlayProps {
    move_type_sequence: MoveTypeWithComment[];
    joseki_errors: number;
    josekis_played: number;
    josekis_completed: number;
    joseki_best_attempt: number;
    joseki_successes: number;
    the_joseki_tag: OJEJosekiTag;
    joseki_tags: OJEJosekiTag[];
    set_variation_filter(filter: JosekiFilter): void;
    current_filter: JosekiFilter;
}

type ExtraInfoPane = "none" | "variation-filter" | "results";

function iconFor(move_type: string): React.ReactElement | string {
    switch (move_type) {
        case "good":
            return <i className="fa fa-check" />;
        case "bad":
            return <i className="fa fa-times" />;
        case "computer":
            return <i className="fa fa-desktop" />;
        case "complete":
            return <i className="fa fa-star" />;
        default:
            return "";
    }
}

export function PlayPane(props: PlayProps): React.ReactElement {
    const [extra_info_selected, set_extra_info_selected] = React.useState<ExtraInfoPane>("none");
    const [forced_filter, set_forced_filter] = React.useState(false);

    const showFilterSelector = React.useCallback(() => {
        set_extra_info_selected("variation-filter");
    }, []);

    const showResults = React.useCallback(() => {
        set_extra_info_selected("results");
    }, []);

    const hideExtraInfo = React.useCallback(() => {
        set_extra_info_selected("none");
    }, []);

    // Mount-only: matches original componentDidMount behavior.
    // Intentionally omits deps -- this should only run once on mount.
    React.useEffect(() => {
        if (
            props.current_filter.contributor &&
            props.current_filter.tags &&
            props.current_filter.source
        ) {
            props.set_variation_filter({
                tags: [props.the_joseki_tag],
                contributor: undefined,
                source: undefined,
            });
            showFilterSelector();
            set_forced_filter(true);
        } else {
            showResults();
        }
    }, []);

    // getDerivedStateFromProps equivalent: switch from filter to results after first moves
    React.useEffect(() => {
        if (forced_filter && props.move_type_sequence.length > 1) {
            set_extra_info_selected("results");
            set_forced_filter(false);
        }
    }, [forced_filter, props.move_type_sequence.length]);

    const filter_active =
        (props.current_filter.tags && props.current_filter.tags.length !== 0) ||
        props.current_filter.contributor ||
        props.current_filter.source;

    return (
        <div className="play-columns">
            <div className="play-dashboard">
                {props.move_type_sequence.length === 0 && <div> Your move...</div>}
                {props.move_type_sequence.map((move_type, id) => (
                    <div key={id}>
                        {iconFor(move_type["type"])}
                        {move_type["comment"]}
                    </div>
                ))}
            </div>
            <div className={"extra-info-column extra-info-open"}>
                <div className="btn-group extra-info-selector">
                    <button
                        className={"btn s " + (extra_info_selected === "results" ? " primary" : "")}
                        onClick={extra_info_selected === "results" ? hideExtraInfo : showResults}
                    >
                        {_("Results")}
                    </button>
                    <button
                        className={
                            "btn s " +
                            (extra_info_selected === "variation-filter" ? " primary" : "")
                        }
                        onClick={
                            extra_info_selected === "variation-filter"
                                ? hideExtraInfo
                                : showFilterSelector
                        }
                    >
                        <span>{_("Filter")}</span>
                        {extra_info_selected === "variation-filter" ? (
                            <i className={"fa fa-filter hide"} />
                        ) : (
                            <i
                                className={"fa fa-filter" + (filter_active ? " filter-active" : "")}
                            />
                        )}
                    </button>
                </div>
                {extra_info_selected === "results" && (
                    <div className="play-results-container">
                        <h4>{_("Overall:")}</h4>
                        <div>
                            {_("Josekis played")}: {props.josekis_played}
                        </div>
                        <div>
                            {_("Josekis played correctly")}: {props.josekis_completed}
                        </div>

                        <h4>{_("This Sequence:")}</h4>
                        <div>
                            {_("Mistakes so far")}: {props.joseki_errors}
                        </div>

                        {!!props.joseki_successes && (
                            <div>
                                {_("Correct plays of this position")}: {props.joseki_successes}
                            </div>
                        )}
                        {!!props.joseki_best_attempt && (
                            <div>
                                {interpolate(_("Best attempt: {{mistakes}}"), {
                                    mistakes: props.joseki_best_attempt,
                                }) +
                                    " " +
                                    npgettext(
                                        "mistakes",
                                        "mistake",
                                        "mistakes",
                                        props.joseki_best_attempt,
                                    )}
                            </div>
                        )}
                    </div>
                )}

                {extra_info_selected === "variation-filter" && (
                    <div className="filter-container">
                        <JosekiVariationFilter
                            contributor_list_url={server_url + "contributors"}
                            source_list_url={server_url + "josekisources"}
                            current_filter={props.current_filter}
                            set_variation_filter={props.set_variation_filter}
                            joseki_tags={props.joseki_tags}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
