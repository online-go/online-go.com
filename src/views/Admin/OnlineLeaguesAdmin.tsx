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

// A super-utilitarian page to see what COOL leagues there are, their auth_key, and add more.

import * as React from "react";
import { get, post, del } from "@/lib/requests";
import { useUser } from "@/lib/hooks";

export function OnlineLeaguesAdmin(): React.ReactElement {
    const [leagues, set_leagues] = React.useState<any[]>([]);
    const [new_league_name, set_new_league_name] = React.useState("");

    const user = useUser();

    const addNewLeague = () => {
        if (new_league_name) {
            post("admin/adminOnlineLeagues", { name: new_league_name })
                .then((response) => {
                    set_leagues([...leagues, response]);
                    set_new_league_name("");
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    };

    const removeLeague = (league_name: string) => {
        if (league_name) {
            del("admin/adminOnlineLeagues", { name: league_name })
                .then((response) => {
                    set_leagues(response);
                })
                .catch((err) => console.error(err));
        }
    };

    React.useEffect(() => {
        get("admin/adminOnlineLeagues")
            .then((data) => {
                set_leagues(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    if (!user.is_moderator) {
        return (
            <div>
                <i className="fa fa-eye-slash"></i>
            </div>
        );
    }

    return (
        <div id="COOLAdmin">
            <h1>Online Leagues</h1>

            <h2>League : Auth (members)</h2>

            <div className="leagues-list">
                {leagues.map((l, i) => (
                    <>
                        <span key={`${i}1`}>{l["name"]} : </span>
                        <span key={`${i}2`}>
                            {l["auth_key"]} ({l.member_count})
                            {(!l.member_count || null) && (
                                <i
                                    className="fa fa-minus-circle"
                                    onClick={() => {
                                        removeLeague(l.name);
                                    }}
                                />
                            )}
                        </span>
                    </>
                ))}
            </div>

            <div id="NewLeagueInput">
                <input
                    type="text"
                    value={new_league_name}
                    onChange={(e) => {
                        set_new_league_name(e.target.value);
                    }}
                    className="form-control"
                    id="new-league-name"
                    placeholder={"New league name"}
                />
                <i className="fa fa-plus-circle" onClick={addNewLeague} />
            </div>
        </div>
    );
}
