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
import * as data from "@/lib/data";
import moment from "moment";
import { usePreference } from "@/lib/preferences";

export function TournamentIndicator(): React.ReactElement | null {
    const [tournament, setTournament] = React.useState<any>(null);
    const [minutes_left, setMinutesLeft] = React.useState(0);
    const [seconds_left, setSecondsLeft] = React.useState(0);
    const [enabled] = usePreference("show-tournament-indicator");
    const [enabled_on_mobile] = usePreference("show-tournament-indicator-on-mobile");

    React.useEffect((): (() => void) | void => {
        if (enabled) {
            const onActiveTournament = (tournament: any) => {
                setTournament(tournament);
            };
            data.watch("active-tournament", onActiveTournament);
            return () => {
                data.unwatch("active-tournament", onActiveTournament);
            };
        } else {
            setTournament(null);
        }
    }, [enabled]);

    React.useEffect((): (() => void) | void => {
        if (tournament && enabled) {
            const update = () => {
                const t = (moment(tournament.expiration).toDate().getTime() - Date.now()) / 1000;
                if (t < 0) {
                    data.set("active-tournament", undefined);
                } else {
                    setMinutesLeft(Math.floor(t / 60));
                    setSecondsLeft(Math.floor(t % 60));
                }
            };

            const update_interval = setInterval(update, 1000);
            update();

            return () => {
                if (update_interval) {
                    clearInterval(update_interval);
                }
            };
        }
    }, [tournament, enabled]);

    if (!tournament) {
        return null;
    }

    const padded_seconds_left = seconds_left < 10 ? "0" + seconds_left : seconds_left;

    return (
        <Link
            to={tournament.link}
            className={`TournamentIndicator ${!enabled_on_mobile ? "hidden-on-mobile" : ""}`}
            title={tournament.text}
        >
            <i className="fa fa-trophy" />
            <span className="time">
                {minutes_left}:{padded_seconds_left}
            </span>
        </Link>
    );
}
