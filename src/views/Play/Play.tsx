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
import * as preferences from "@/lib/preferences";

//import { _, pgettext } from "@/lib/translate";
import { _ } from "@/lib/translate";
import { QuickMatch } from "./QuickMatch";
import { CustomGames } from "./CustomGames";

export function Play(): JSX.Element {
    const [show_custom_games, setShowCustomGames] = preferences.usePreference(
        "automatch.show-custom-games",
    );
    const toggleCustomGames = React.useCallback(() => {
        setShowCustomGames(!show_custom_games);
    }, [show_custom_games]);

    React.useEffect(() => {
        window.document.title = _("Play");
    }, []);

    return (
        <div className="Play container">
            {/*
            <div className="tab-head">
                <h2 className="Matchmaking-header">
                    <i className="ogs-goban"></i> {pgettext("Play page", "Matchmaking")}
                </h2>

                <div className="tabs-container">
                    <span
                        className={"tab" + (tab === "automatch" ? " active" : "")}
                        onClick={() => setTab("automatch")}
                    >
                        {pgettext("Matchmaking tab (automatch / quick match)", "Quick Match")}
                    </span>
                    <span
                        className={"tab" + (tab === "custom" ? " active" : "")}
                        onClick={() => setTab("custom")}
                    >
                        {pgettext("Matchmaking tab", "Custom Games")}
                    </span>
                </div>
            </div>
            */}

            {/*
            {tab === "automatch" && <QuickMatch />}
            {tab === "custom" && <CustomGames />}
            */}
            <QuickMatch />

            <div>
                <div
                    className={
                        "custom-games-toggle-container " +
                        (show_custom_games ? "showing-custom-games" : "")
                    }
                >
                    <button className="custom-games-toggle" onClick={toggleCustomGames}>
                        {show_custom_games ? _("Hide custom games") : _("Explore custom games")}
                    </button>
                </div>
                {show_custom_games && <CustomGames />}
            </div>
        </div>
    );
}
