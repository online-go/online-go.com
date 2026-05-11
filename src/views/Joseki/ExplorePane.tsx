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
import { Link } from "react-router-dom";

import { _ } from "@/lib/translate";
import { AutoTranslate } from "@/components/AutoTranslate";
import { applyJosekiMarkdown } from "./joseki-utils";

export interface ExploreProps {
    position_id: string;
    description: string;
    position_type: string;
    see_also: number[];
}

export function ExplorePane(props: ExploreProps): React.ReactElement {
    const description = applyJosekiMarkdown(props.description);

    // Onboarding hint shown only at root with no curated description.
    const show_root_hint = props.position_id === "root" && !props.description;

    return (
        <div className="explore-pane">
            <div className="description-column">
                {props.position_type !== "new" && props.description && (
                    <div className="position-description">
                        <AutoTranslate source={description} source_language={"en"} markdown />
                    </div>
                )}
                {show_root_hint && (
                    <div className="joseki-root-hint">
                        {_(
                            "Click a marked stone to explore continuations. Lower variation numbers are more commonly chosen.",
                        )}
                    </div>
                )}
                {props.see_also.length !== 0 && (
                    <div className="see-also-block">
                        <div>{_("See also:")}</div>
                        {props.see_also.map((node, index) => (
                            <Link key={index} to={"/joseki/" + node}>
                                {node}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
