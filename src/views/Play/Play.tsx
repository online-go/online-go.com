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

import { _, pgettext } from "@/lib/translate";
import { QuickMatch } from "./QuickMatch";
import { CustomGames } from "./CustomGames";

export function Play(): JSX.Element {
    const [tab, setTab] = preferences.usePreference("play.tab");

    React.useEffect(() => {
        window.document.title = _("Play");
    }, []);

    return (
        <div className="Play container">
            <div className="tab-head">
                <h2>
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

            {tab === "automatch" && <QuickMatch />}
            {tab === "custom" && <CustomGames />}
        </div>
    );
}
