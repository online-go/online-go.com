/*
 * Copyright 2012-2017 Online-Go.com
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
import {Goban} from '../Goban';


export default function(GoThemes) {
    class Kaya extends GoTheme {
        sort() { return 10; }
        getBackgroundCSS() {
            return {
                "background-color": "#DCB35C",
                "background-image": "url('" + Goban.getCDNReleaseBase() + "/img/kaya.jpg')"
            };
        };
        getLineColor() { return "#000000"; };
        getFadedLineColor() { return "#888888"; };
        getStarColor() { return "#000000"; };
        getFadedStarColor() { return "#888888"; };
        getBlankTextColor() { return "#000000"; };
        getLabelTextColor() { return "#444444"; };
    }

    _("Kaya"); // ensure translation
    GoThemes["board"]["Kaya"] = Kaya;


    class RedOak extends GoTheme {
        sort() { return  20; }
        getBackgroundCSS() {
            return {
                "background-color": "#DCB35C",
                "background-image": "url('" + Goban.getCDNReleaseBase() + "/img/oak.jpg')"
            };
        };
        getLineColor() { return "#000000"; };
        getFadedLineColor() { return "#888888"; };
        getStarColor() { return "#000000"; };
        getFadedStarColor() { return "#888888"; };
        getBlankTextColor() { return "#000000"; };
        getLabelTextColor() { return "#000000"; };
    }


    _("Red Oak"); // ensure translation
    GoThemes["board"]["Red Oak"] = RedOak;



    class Persimmon extends GoTheme {
        sort() { return  30; }
        getBackgroundCSS() {
            return {
                "background-color": "#DCB35C",
                "background-image": "url('" + Goban.getCDNReleaseBase() + "/img/persimmon.jpg')"
            };
        };
        getLineColor() { return "#000000"; };
        getFadedLineColor() { return "#888888"; };
        getStarColor() { return "#000000"; };
        getFadedStarColor() { return "#888888"; };
        getBlankTextColor() { return "#000000"; };
        getLabelTextColor() { return "#000000"; };
    }


    _("Persimmon"); // ensure translation
    GoThemes["board"]["Persimmon"] = Persimmon;


    class BlackWalnut extends GoTheme {
        sort() { return  40; }
        getBackgroundCSS() {
            return {
                "background-color": "#DCB35C",
                "background-image": "url('" + Goban.getCDNReleaseBase() + "/img/black_walnut.jpg')"
            };
        };
        getLineColor() { return "#000000"; };
        getFadedLineColor() { return "#4A2F24"; };
        getStarColor() { return "#000000"; };
        getFadedStarColor() { return "#4A2F24"; };
        getBlankTextColor() { return "#000000"; };
        getLabelTextColor() { return "#000000"; };
    }


    _("Black Walnut"); // ensure translation
    GoThemes["board"]["Black Walnut"] = BlackWalnut;


    class Granite extends GoTheme {
        sort() { return  40; }
        getBackgroundCSS() {
            return {
                "background-color": "#DCB35C",
                "background-image": "url('" + Goban.getCDNReleaseBase() + "/img/granite.jpg')"
            };
        };
        getLineColor() { return "#cccccc"; };
        getFadedLineColor() { return "#888888"; };
        getStarColor() { return "#cccccc"; };
        getFadedStarColor() { return "#888888"; };
        getBlankTextColor() { return "#cccccc"; };
        getLabelTextColor() { return "#cccccc"; };
    }


    _("Granite"); // ensure translation
    GoThemes["board"]["Granite"] = Granite;
}
