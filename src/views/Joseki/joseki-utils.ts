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

/* cspell: words cfilterid tfilterid sfilterid josekisources tagcounts playrecord */

import * as data from "@/lib/data";
import { _ } from "@/lib/translate";
import { JosekiFilter } from "@/components/JosekiVariationFilter";

// This is a relic from when OJE was a separate project, and
// might have remained on a separate server.
// Would be nice to tidy up and use the normal API.
export const server_url = data.get("oje-url", "/oje/");

export const joseki_sources_url = server_url + "josekisources";

export const prefetch_url = (
    node_id: string,
    variation_filter?: JosekiFilter,
    mode?: string,
): string => {
    let url = server_url + "positions?id=" + node_id;
    if (variation_filter) {
        if (variation_filter.contributor) {
            url += "&cfilterid=" + variation_filter.contributor;
        }
        if (variation_filter.tags && variation_filter.tags.length !== 0) {
            url += "&tfilterid=" + variation_filter.tags.map((tag) => tag.value).join(",");
        }
        if (variation_filter.source) {
            url += "&sfilterid=" + variation_filter.source;
        }
    }
    if (mode) {
        url += "&mode=" + mode;
    }
    return url;
};

export const position_url = (
    node_id: string,
    variation_filter?: JosekiFilter,
    mode?: string,
): string => {
    let url = server_url + "position?id=" + node_id;
    if (variation_filter) {
        if (variation_filter.contributor) {
            url += "&cfilterid=" + variation_filter.contributor;
        }
        if (variation_filter.tags && variation_filter.tags.length !== 0) {
            url += "&tfilterid=" + variation_filter.tags.map((tag) => tag.value).join(",");
        }
        if (variation_filter.source) {
            url += "&sfilterid=" + variation_filter.source;
        }
    }
    if (mode) {
        url += "&mode=" + mode;
    }
    return url;
};

export const tag_count_url = (node_id: string): string =>
    server_url + "position/tagcounts?id=" + node_id;

// Joseki specific markdown
export const applyJosekiMarkdown = (markdown: string): string => {
    // Highlight marks in the text
    let result = markdown.replace(/<([A-Z]):([A-Z][0-9]{1,2})>/gm, "**$1**");

    // Transform position references into actual link
    result = result.replace(
        /<position: *([0-9]+)>/gim,
        "**[" + _("Position") + " $1](/joseki/$1)**",
    );

    return result;
};

export enum MoveCategory {
    // needs to match the definitions in the backend PlayCategory class
    // conceivably, should fetch these from the backend - the string value is used in comparisons :(
    IDEAL = "Ideal",
    GOOD = "Good",
    MISTAKE = "Mistake",
    TRICK = "Trick",
    QUESTION = "Question",
}

export const bad_moves = ["MISTAKE", "QUESTION"]; // moves the player is not allowed to play in Play mode

export enum PageMode {
    Explore = "0",
    Play = "1",
    Edit = "2",
    Admin = "3",
}

// These are the colors painted onto moves of each category
export const ColorMap: Record<string, string> = {
    IDEAL: "#008300",
    GOOD: "#436600",
    MISTAKE: "#b3001e",
    TRICK: "#ffff00",
    QUESTION: "#00ccff",
};

// Play mode move classification
export type MoveType = "bad" | "good" | "computer" | "complete";

export interface MoveTypeWithComment {
    type: MoveType;
    comment: string;
}
