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

/* cspell: words tourny tournies */

import * as React from "react";
import { Link } from "react-router-dom";
import { _, pgettext, interpolate } from "@/lib/translate";
import { get } from "@/lib/requests";
import * as preferences from "@/lib/preferences";
import { errorAlerter } from "@/lib/misc";
import { shortShortTimeControl } from "@/components/TimeControl";
import { computeAverageMoveTime } from "goban";
import { PaginatedTable, Filter } from "@/components/PaginatedTable";
import moment from "moment";
import { TOURNAMENT_TYPE_NAMES, shortRankRestrictionText } from "@/views/Tournament";
import tooltip from "@/lib/tooltip";
import { Toggle } from "@/components/Toggle";
import { IdType } from "@/lib/types";
import { useUser } from "@/lib/hooks";

interface TournamentListProperties {
    phase: "open" | "active" | "finished";
    speed?: "live" | "correspondence";
    hide_stale?: boolean; // Hides tournaments that were supposed to have started already
    hide_exclusive?: boolean; // Hides tournaments that are invite-only or members-only
    group?: IdType;
}

type TabValues = "my-tournaments" | "schedule" | "live" | "archive" | "correspondence";

export function TournamentListMainView(): React.ReactElement {
    const [tab, _setTab] = React.useState<TabValues>(preferences.get("tournaments-tab"));
    const [show_all, setShowAll] = React.useState<boolean>(preferences.get("tournaments-show-all"));
    const user = useUser();

    React.useEffect(() => {
        window.document.title = _("Tournaments");
    }, []);

    const setTab = (tab: TabValues) => {
        preferences.set("tournaments-tab", tab);
        _setTab(tab);
    };

    const setMyTournaments = () => setTab("my-tournaments");
    const setTabArchive = () => setTab("archive");
    const setTabSchedule = () => setTab("schedule");
    const setTabLive = () => setTab("live");
    const setTabCorrespondence = () => setTab("correspondence");

    const toggleShowAll = (show_all: boolean) => {
        setShowAll(show_all);
        preferences.set("tournaments-show-all", show_all);
    };

    const frag_open_tournament = (speed: "live" | "correspondence") => (
        <React.Fragment>
            <div className="open-tourney-header">
                <h3>{_("Open Tournaments")}</h3>
                <div>
                    {_("Show all")}
                    <Toggle
                        height={14}
                        width={30}
                        checked={show_all}
                        onChange={(tf) => toggleShowAll(tf)}
                    />
                </div>
            </div>
            <TournamentList
                phase="open"
                speed={speed}
                hide_stale={!show_all}
                hide_exclusive={!show_all}
            />
        </React.Fragment>
    );

    return (
        <div className="page-width">
            <div className="TournamentList container">
                <div className="tab-head">
                    <h2>
                        <i className="fa fa-trophy"></i> {_("Tournaments")}
                    </h2>
                    <div className="tabs-container">
                        {!user.anonymous && (
                            <span
                                className={"tab" + (tab === "my-tournaments" ? " active" : "")}
                                onClick={setMyTournaments}
                            >
                                <i className="fa fa-home"></i>
                                {_("My Tournaments")}
                            </span>
                        )}
                        <span
                            className={"tab" + (tab === "schedule" ? " active" : "")}
                            onClick={setTabSchedule}
                        >
                            <i className="fa fa-calendar"></i>
                            {_("Schedule")}
                        </span>
                        <span
                            className={"tab" + (tab === "live" ? " active" : "")}
                            onClick={setTabLive}
                        >
                            <i className="fa fa-clock-o"></i>
                            {_("Live")}
                        </span>
                        <span
                            className={"tab" + (tab === "correspondence" ? " active" : "")}
                            onClick={setTabCorrespondence}
                        >
                            <i className="ogs-turtle"></i>
                            {_("Correspondence")}
                        </span>
                        <span
                            className={"tab" + (tab === "archive" ? " active" : "")}
                            onClick={setTabArchive}
                        >
                            <i className="fa fa-university"></i>
                            {_("Archive")}
                        </span>
                    </div>
                </div>
                <hr />

                {tab === "my-tournaments" && <MyTournaments />}
                {tab === "schedule" && <Schedule />}
                {tab === "live" && (
                    <div>
                        {frag_open_tournament("live")}

                        <h3>{_("Active Tournaments")}</h3>
                        <TournamentList phase="active" speed="live" />
                    </div>
                )}
                {tab === "correspondence" && (
                    <div>
                        {frag_open_tournament("correspondence")}

                        <h3>{_("Active Tournaments")}</h3>
                        <TournamentList phase="active" speed="correspondence" />
                    </div>
                )}
                {tab === "archive" && (
                    <div>
                        <h3>{_("Finished Tournaments")}</h3>
                        <TournamentList phase="finished" />
                    </div>
                )}
            </div>
        </div>
    );
}

function MyTournaments(): React.ReactElement {
    return (
        <TournamentListImpl
            source={`me/tournaments/`}
            orderBy={["-ended", "-started", "time_start"]}
        />
    );
}

function Schedule(): React.ReactElement {
    const [schedules, setSchedules] = React.useState<any[]>([]);

    React.useEffect(() => {
        get("tournament_schedules/", { page_size: 100 })
            .then((res) => {
                res.results.sort((a: { next_run: number }, b: { next_run: number }) => {
                    return new Date(a.next_run).getTime() - new Date(b.next_run).getTime();
                });
                setSchedules(res.results);
            })
            .catch(errorAlerter);
    }, []);

    return (
        <div className="TournamentList-Schedule">
            <table className="schedule-table">
                <thead>
                    <tr>
                        <th>{_("Tournament")}</th>
                        <th>{_("Type")}</th>
                        <th>{_("Registration")}</th>
                        <th>{_("Start time")}</th>
                    </tr>
                </thead>
                <tbody>
                    {schedules.map((entry, idx) => (
                        <tr key={idx}>
                            <td>
                                <h4>
                                    <i className={speedIcon(entry) + " site-tourny"}></i>
                                    {entry.name}
                                </h4>
                                <div>
                                    <i>{rrule_description(entry)}</i>
                                </div>
                            </td>
                            <td>
                                <div>{typeDescription(entry)}</div>
                            </td>
                            <td>
                                <div>{dateFmt(entry.next_run)}</div>
                                <div>
                                    <i>{fromNow(entry.next_run)}</i>
                                </div>
                            </td>
                            <td>
                                <div>{dateFmt(entry.next_run, entry.lead_time_seconds)}</div>
                                <div>
                                    <i>{fromNow(entry.next_run, entry.lead_time_seconds)}</i>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function TournamentList(props: TournamentListProperties) {
    const filter = makeTournamentFilter(
        props.phase,
        props.speed,
        props.hide_stale,
        props.hide_exclusive,
        props.group,
    );

    return (
        <TournamentListImpl
            filter={filter}
            source={`tournaments/`}
            orderBy={["-started", "time_start", "name"]}
        />
    );
}

function TournamentListImpl({
    filter,
    source,
    orderBy,
}: {
    filter?: Filter;
    source: string;
    orderBy: Array<string>;
}): React.ReactElement {
    return (
        <div className="TournamentList">
            <PaginatedTable
                className="TournamentList-table"
                name="game-history"
                source={source}
                filter={filter}
                orderBy={orderBy}
                columns={[
                    {
                        header: _("Tournament"),
                        className: () => "name",
                        render: (tournament: rest_api.Tournament) => (
                            <div className="tournament-name">
                                <i
                                    className={
                                        timeIcon(tournament.time_per_move) +
                                        (tournament.group ? " group-tourny" : " site-tourny")
                                    }
                                />
                                {tournament.group ? (
                                    <Link to={`/group/${tournament.group.id}`}>
                                        <img
                                            src={mk32icon(tournament.icon)}
                                            data-title={tournament.group.name}
                                            onMouseOver={tooltip}
                                            onMouseOut={tooltip}
                                            onMouseMove={tooltip}
                                        />
                                    </Link>
                                ) : (
                                    <img
                                        src={tournament.icon}
                                        data-title={_("OGS Site Wide Tournament")}
                                        onMouseOver={tooltip}
                                        onMouseOut={tooltip}
                                        onMouseMove={tooltip}
                                    />
                                )}
                                <Link to={`/tournament/${tournament.id}`}>{tournament.name}</Link>
                            </div>
                        ),
                    },

                    {
                        header: _("When"),
                        className: "nobr",
                        render: (tournament) =>
                            tournament.ended
                                ? when(tournament.started) + " - " + when(tournament.ended)
                                : tournament.started
                                  ? when(tournament.started)
                                  : when(tournament.time_start),
                    },
                    {
                        header: _("Time Control"),
                        className: "nobr",
                        render: (tournament) =>
                            shortShortTimeControl(tournament.time_control_parameters as any),
                    },
                    {
                        header: _("Size"),
                        className: "nobr",
                        render: (tournament) => `${tournament.board_size}x${tournament.board_size}`,
                    },
                    {
                        header: _("Players"),
                        className: "nobr",
                        render: (tournament) =>
                            tournament.started ||
                            tournament.player_count >= tournament.players_start
                                ? tournament.player_count
                                : `${tournament.player_count}/${tournament.players_start}`,
                    },
                    {
                        header: _("Ranks"),
                        className: "nobr",
                        render: (tournament) =>
                            shortRankRestrictionText(
                                tournament.min_ranking,
                                tournament.max_ranking,
                            ),
                    },
                ]}
            />
        </div>
    );
}

function makeTournamentFilter(
    phase: "open" | "active" | "finished",
    speed?: "live" | "correspondence",
    hide_stale?: boolean,
    hide_exclusive?: boolean,
    group?: IdType,
) {
    const filter: Filter = {};
    switch (phase) {
        case "open":
            filter["started__isnull"] = true;
            filter["ended__isnull"] = true;
            break;
        case "active":
            filter["started__isnull"] = false;
            filter["ended__isnull"] = true;
            break;
        case "finished":
            filter["started__isnull"] = false;
            filter["ended__isnull"] = false;
            break;
    }

    if (speed !== undefined) {
        switch (speed) {
            case "live":
                filter["time_per_move__lt"] = 3600;
                filter["time_per_move__gt"] = 0;
                break;
            case "correspondence":
                filter["time_per_move__gte"] = 3600;
                break;
        }
    }

    if (hide_stale) {
        filter["time_start__gte"] = new Date().toISOString();
    }

    if (hide_exclusive) {
        filter["exclusivity"] = "open";
    }

    if (group !== undefined) {
        filter["group"] = group;
    }

    return filter;
}

function mk32icon(path: string) {
    return path.replace(/-[0-9]+.png/, "-32.png");
}
function speedIcon(e: any) {
    const tpm = computeAverageMoveTime(e.time_control_parameters, e.size, e.size);
    if (tpm === 0 || tpm > 3600) {
        return "ogs-turtle";
    }
    if (tpm < 10) {
        return "fa fa-bolt";
    }
    return "fa fa-clock-o";
}
function timeIcon(time_per_move: number) {
    if (time_per_move === 0) {
        return "ogs-turtle";
    } else if (time_per_move < 20) {
        return "fa fa-bolt";
    } else if (time_per_move < 3600) {
        return "fa fa-clock-o";
    }
    return "ogs-turtle";
}

function rrule_description(entry: any): string {
    const m = moment(new Date(entry.next_run)).add(entry.lead_time_seconds, "seconds");

    const rrule = entry.rrule;
    let interval = 1;
    let unit = "error";
    if (/interval.\s*([0-9]+)/i.test(rrule)) {
        const matches = rrule.match(/interval.\s*([0-9]+)/i);
        interval = parseInt(matches[1]);
    } else {
        console.log("error parsing rrule interval:", rrule);
    }

    if (/freq.daily/i.test(rrule)) {
        unit = "daily";
    }
    if (/freq.hourly/i.test(rrule)) {
        unit = "hourly";
    }
    if (/freq.minutely/i.test(rrule)) {
        unit = "minutely";
    }
    if (/freq.weekly/i.test(rrule)) {
        unit = "weekly";
    }
    if (/freq.monthly/i.test(rrule)) {
        unit = "monthly";
    }
    if (/freq.yearly/i.test(rrule)) {
        unit = "yearly";
    }

    if (interval === 1) {
        switch (unit) {
            case "hourly":
                return m.format("m") !== "0"
                    ? interpolate(_("Occurs %s minutes past the hour every hour"), [m.format("m")])
                    : _("Occurs every hour on the hour");
            case "daily":
                return interpolate(_("Occurs daily at %s"), [m.format("LT")]);
            case "weekly":
                return interpolate(
                    pgettext("Every <day of week> at <time>", "Occurs every %s at %s"),
                    [m.format("dddd"), m.format("LT")],
                );
            case "monthly":
                return interpolate(
                    pgettext(
                        "The <day of month> at <time>",
                        "Occurs on the %s of every month at %s",
                    ),
                    [m.format("Do"), m.format("LT")],
                );
            case "yearly":
                return interpolate(
                    pgettext(
                        "<day of year> of every year at <time>",
                        "Occurs %s of every year at %s",
                    ),
                    [m.format("MMMM Do"), m.format("LT")],
                );
        }
    } else {
        switch (unit) {
            case "minutely":
                return interpolate(_("Occurs every %s minutes"), [interval]);
            case "hourly":
                return m.format("m") !== "0"
                    ? interpolate(_("Occurs %s minutes past the hour every %s hours"), [
                          m.format("m"),
                          interval,
                      ])
                    : interpolate(_("Occurs every %s hours on the hour"), [interval]);
            case "daily":
                return interpolate(_("Occurs every %s days at %s"), [interval, m.format("LT")]);
            case "weekly":
                return interpolate(_("Occurs every %s weeks on %s at %s"), [
                    interval,
                    m.format("dddd"),
                    m.format("LT"),
                ]);
            case "monthly":
                return interpolate(
                    pgettext(
                        "The <day of month> every <n> months at <time>",
                        "Occurs on the %s every %s months at %s",
                    ),
                    [m.format("Do"), interval, m.format("LT")],
                );
        }
    }
    console.log("Failed: ", unit, interval);
    return "error formatting rrule";
}
function typeDescription(e: any) {
    return (TOURNAMENT_TYPE_NAMES as any)[e.tournament_type];
}
function dateFmt(d: number, offset?: number) {
    if (!offset) {
        offset = 0;
    }
    return moment(new Date(d)).add(offset, "seconds").format("llll");
}
function fromNow(d: number, offset?: number) {
    if (!offset) {
        offset = 0;
    }
    return moment(new Date(d)).add(offset, "seconds").fromNow();
}
function when(t: number | string) {
    if (t) {
        const d = new Date(t);
        const diff = Math.round((d.getTime() - Date.now()) / 1000.0);

        //if (Math.abs(diff) > 7*86400) {
        if (diff > 7 * 86400) {
            return moment(d).format("ddd MMM Do, LT");
        } else {
            return moment(d).calendar();
        }
    } else {
        return "";
    }
}
