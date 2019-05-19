/*
 * Copyright 2012-2019 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import GoTheme from "../GoTheme";
import {_} from "../translate";
import * as data from "data";

data.setDefault("custom.board", "#DCB35C");
data.setDefault("custom.line", "#000000");

// Converts a six-digit hex string to rgba() notation
function hexToRgba(raw: string, alpha: number = 1): string {
    let hex = raw.replace("#", "");
    if (hex.length !== 6) {
        return raw;
    }
    let r = parseInt(`0x${hex.substr(0, 2)}`);
    let g = parseInt(`0x${hex.substr(2, 2)}`);
    let b = parseInt(`0x${hex.substr(4, 2)}`);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function(GoThemes) {

    class Plain extends GoTheme {
        sort() { return 0; }
        getBackgroundCSS() {
            return {
                "background-color": data.get("custom.board"),
                "background-image": ""
            };
        }
        getLineColor() { return data.get("custom.line"); }
        getFadedLineColor() { return hexToRgba(data.get("custom.line"), 0.5); }
        getStarColor() { return data.get("custom.line"); }
        getFadedStarColor() { return hexToRgba(data.get("custom.line"), 0.5); }
        getBlankTextColor() { return data.get("custom.line"); }
        getLabelTextColor() { return hexToRgba(data.get("custom.line"), 0.75); }
    }


    _("Plain"); // ensure translation exists
    GoThemes["board"]["Plain"] = Plain;

    class Night extends GoTheme {
        sort() {
            return 100;
        }
        getBackgroundCSS() {
            return {
                "background-color": "#444444",
                "background-image": ""
            };
        }
        getLineColor() { return "#555555"; }
        getFadedLineColor() { return "#333333"; }
        getStarColor() { return "#555555"; }
        getFadedStarColor() { return "#333333"; }
        getBlankTextColor() { return "#777777"; }
        getLabelTextColor() { return "#555555"; }
    }

    _("Night Play"); // ensure translation exists
    GoThemes["board"]["Night Play"] = Night;



    class HNG extends GoTheme {
        static C = "#00193E";
        static C2 = "#004C75";
        sort() { return 105; }
        getBackgroundCSS() {
            return {
                "background-color": "#00e7fc",
                "background-image": ""
            };
        }
        getLineColor() { return HNG.C; }
        getFadedLineColor() { return "#00AFBF"; }
        getStarColor() { return HNG.C; }
        getFadedStarColor() { return "#00AFBF"; }
        getBlankTextColor() { return HNG.C2; }
        getLabelTextColor() { return HNG.C2; }
    }

    _("HNG"); // ensure translation exists
    GoThemes["board"]["HNG"] = HNG;



    class HNGNight extends GoTheme {
        static C = "#007591";
        sort() { return 105; }
        getBackgroundCSS() {
            return {
                "background-color": "#090C1F",
                "background-image": ""
            };
        }
        getLineColor() { return HNGNight.C; }
        getFadedLineColor() { return "#4481B5"; }
        getStarColor() { return HNGNight.C; }
        getFadedStarColor() { return "#4481B5"; }
        getBlankTextColor() { return "#3591DE"; }
        getLabelTextColor() { return "#4481B5"; }
    }

    _("HNG Night"); // ensure translation exists
    GoThemes["board"]["HNG Night"] = HNGNight;


    class Book extends GoTheme {
        sort() {
            return 110;
        }
        getBackgroundCSS() {
            return {
                "background-color": "#ffffff",
                "background-image": ""
            };
        }
        getLineColor() { return "#555555"; }
        getFadedLineColor() { return "#999999"; }
        getStarColor() { return "#555555"; }
        getFadedStarColor() { return "#999999"; }
        getBlankTextColor() { return "#000000"; }
        getLabelTextColor() { return "#555555"; }
    }


    _("Book"); // ensure translation exists
    GoThemes["board"]["Book"] = Book;
}
