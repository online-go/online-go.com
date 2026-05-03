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

import { _ } from "@/lib/translate";
import { JosekiFilter } from "@/components/JosekiVariationFilter";
import { OJEJosekiTag } from "@/components/JosekiTagSelector";
import { MoveTypeWithComment } from "./joseki-utils";

export interface PlayProps {
    move_type_sequence: MoveTypeWithComment[];
    the_joseki_tag: OJEJosekiTag;
    set_variation_filter(filter: JosekiFilter): void;
    current_filter: JosekiFilter;
}

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
    // Relax all-three-axes filter combinations on entry — they usually
    // return nothing playable.
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
        }
    }, []);

    return (
        <div className="play-columns">
            <div className="play-dashboard">
                {props.move_type_sequence.length === 0 && (
                    <div className="play-prompt">{_("Your move...")}</div>
                )}
                {props.move_type_sequence.map((move_type, id) => (
                    <div key={id}>
                        {iconFor(move_type["type"])}
                        {move_type["comment"]}
                    </div>
                ))}
            </div>
        </div>
    );
}
