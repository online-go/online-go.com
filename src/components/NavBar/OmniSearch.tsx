/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import * as player_cache from "player_cache";
import { get, abort_requests_in_flight } from "requests";
import { _ } from "translate";
import { Link } from "react-router-dom";
import { Player } from "Player";
import { ignore } from "misc";

export function OmniSearch({ search }: { search: string }): JSX.Element {
    const [omnisearch_string, setOmnisearchString] = React.useState("");
    const [omnisearch_loading, setOmnisearchLoading] = React.useState(false);
    const [omnisearch_sitemap, setOmnisearchSitemap] = React.useState([]);
    const [omnisearch_players, setOmnisearchPlayers] = React.useState([]);
    const [omnisearch_groups, setOmnisearchGroups] = React.useState([]);
    const [omnisearch_tournaments, setOmnisearchTournaments] = React.useState([]);

    const omnisearch_result_count =
        omnisearch_players.length +
        omnisearch_tournaments.length +
        omnisearch_groups.length +
        omnisearch_sitemap.length;

    React.useEffect(() => {
        if (search) {
            const q = search.trim();
            setOmnisearchString(q);
            if (q !== "") {
                setOmnisearchLoading(true);
                setOmnisearchString(q);
                setOmnisearchSitemap(match_sitemap(q));
                setOmnisearchPlayers([]);
                setOmnisearchTournaments([]);
                setOmnisearchGroups([]);

                get("ui/omniSearch", { q: q.trim() })
                    .then((res) => {
                        player_cache.update(res.players);
                        setOmnisearchLoading(false);
                        setOmnisearchPlayers(res.players);
                        setOmnisearchTournaments(res.tournaments);
                        setOmnisearchGroups(res.groups);
                    })
                    .catch(ignore);

                return () => {
                    abort_requests_in_flight("ui/omniSearch");
                };
            }
        } else {
            setOmnisearchString("");
        }
    }, [search]);

    if (omnisearch_string === "") {
        return null;
    }

    return (
        <aside className="OmniSearch">
            {(omnisearch_sitemap.length || null) && (
                <div className="results">
                    <h3>{_("Site")}</h3>
                    {omnisearch_sitemap.map((e, idx) => (
                        <div className="result" key={idx}>
                            {e?.[1]?.[0] === "/" ? (
                                <Link to={e[1]}>{e[0]}</Link>
                            ) : (
                                <a href={e[1]} target="_blank">
                                    {e[0]}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {(omnisearch_loading || null) && <div className="loading">{_("Loading...")}</div>}
            {((!omnisearch_loading && omnisearch_result_count === 0) || null) && (
                <div className="no-results">
                    {_("No results.") /* translators: No search results */}
                </div>
            )}

            {(omnisearch_players.length || null) && (
                <div className="results">
                    <h3>{_("Players")}</h3>
                    {omnisearch_players.map((e) => (
                        <div className="result" key={e.id}>
                            <Player user={e} icon rank nodetails />
                        </div>
                    ))}
                </div>
            )}
            {(omnisearch_groups.length || null) && (
                <div className="results">
                    <h3>{_("Groups")}</h3>
                    {omnisearch_groups.map((e) => (
                        <div className="result" key={e.id}>
                            <img src={e.icon} />
                            <Link to={`/group/${e.id}`}>{e.name}</Link>
                        </div>
                    ))}
                </div>
            )}
            {(omnisearch_tournaments.length || null) && (
                <div className="results">
                    <h3>{_("Tournaments")}</h3>
                    {omnisearch_tournaments.map((e) => (
                        <div className="result" key={e.id}>
                            <img src={e.icon} />
                            <Link to={`/tournament/${e.id}`}>{e.name}</Link>
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
}

const omnisearch_sitemap = {};

omnisearch_sitemap[_("Home")] = [_("Home"), "/overview"];
omnisearch_sitemap[_("Play")] = [_("Play"), "/play"];
omnisearch_sitemap[_("Games")] = [_("Games"), "/observe-games"];
omnisearch_sitemap[_("Players")] = [_("Players"), "/user/list"];
omnisearch_sitemap[_("Tournaments")] = [_("Tournaments"), "/tournaments"];
omnisearch_sitemap[_("Ladders")] = [_("Ladders"), "/ladders"];
omnisearch_sitemap[_("Developers")] = [_("Developers & API Access"), "/developer"];
omnisearch_sitemap[_("API Access")] = [_("Developers & API Access"), "/developer"];
omnisearch_sitemap[_("API")] = [_("Developers & API Access"), "/developer"];
omnisearch_sitemap[_("Mail")] = [_("Mail"), "/mail"];
omnisearch_sitemap[_("Chat")] = [_("Chat & Lobby"), "/chat"];
omnisearch_sitemap[_("Lobby")] = [_("Chat & Lobby"), "/chat"];
omnisearch_sitemap[_("Settings")] = [_("Settings"), "/user/settings"];
omnisearch_sitemap[_("Configuration")] = [_("Settings"), "/user/settings"];
omnisearch_sitemap[_("Options")] = [_("Settings"), "/user/settings"];
omnisearch_sitemap[_("Support OGS")] = [_("Support OGS"), "/user/supporter"];
omnisearch_sitemap[_("Donate")] = [_("Donations"), "/user/supporter"];
omnisearch_sitemap[_("Money")] = [_("Donations"), "/user/supporter"];
omnisearch_sitemap[_("Contributing")] = [_("Contributing"), "/user/supporter"];
omnisearch_sitemap[_("Price")] = [_("Donations"), "/user/supporter"];
omnisearch_sitemap[_("Learn to play Go")] = [_("Learn to play Go"), "/learn-to-play-go"];
omnisearch_sitemap[_("Learn")] = [_("Learn to play Go"), "/learn-to-play-go"];
omnisearch_sitemap[_("Tutorial")] = [_("Learn to play Go"), "/learn-to-play-go"];
omnisearch_sitemap[_("How to play go")] = [_("Learn to play Go"), "/learn-to-play-go"];
omnisearch_sitemap[_("FAQ")] = [_("F.A.Q."), "https://forums.online-go.com/c/faq"];
omnisearch_sitemap[_("F.A.Q.")] = [_("F.A.Q."), "https://forums.online-go.com/c/faq"];
omnisearch_sitemap[_("Help")] = [_("F.A.Q."), "https://forums.online-go.com/c/faq"];
omnisearch_sitemap[_("Changelog")] = [_("Changelog"), "docs/changelog"];
omnisearch_sitemap[_("About")] = [_("About"), "/docs/about"];
omnisearch_sitemap[_("Refund Policy")] = [_("Refund Policy"), "/docs/refund-policy"];
omnisearch_sitemap[_("Terms of Service")] = [_("Terms of Service"), "/docs/terms-of-service"];
omnisearch_sitemap["ToS"] = [_("Terms of Service"), "/docs/terms-of-service"];
omnisearch_sitemap[_("Privacy Policy")] = [_("Privacy Policy"), "/docs/privacy-policy"];
omnisearch_sitemap[_("Contact Information")] = [
    _("Contact Information"),
    "/docs/contact-information",
];

function match_sitemap(q: string): [string, string][] {
    q = q.trim().toLowerCase();

    const res: [string, string][] = [];

    for (const k in omnisearch_sitemap) {
        if (q.length >= Math.min(5, k.length) && k.toLowerCase().indexOf(q) === 0) {
            res.push(omnisearch_sitemap[k]);
        }
    }
    return res;
}
