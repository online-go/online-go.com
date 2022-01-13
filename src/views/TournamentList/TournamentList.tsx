/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {Link} from "react-router-dom";
import {_, pgettext, interpolate} from "translate";
import {get} from "requests";
import * as preferences from "preferences";
import {errorAlerter} from "misc";
import {shortTimeControl, shortShortTimeControl} from "TimeControl";
import {computeAverageMoveTime} from 'goban';
import {PaginatedTable} from "PaginatedTable";
import * as moment from "moment";
import {TOURNAMENT_TYPE_NAMES, shortRankRestrictionText} from "Tournament";
import tooltip from "tooltip";
import { Toggle } from "Toggle";

interface TournamentListProperties {
    phase: 'open'|'active'|'finished';
    speed?: 'live'|'correspondence';
    hide_stale?: boolean;     // Hides tournaments that were supposed to have started already
    hide_exclusive?: boolean; // Hides tournaments that are invite-only or members-only
    group?: number;
}

interface TournamentListMainViewState {
    tab: 'schedule'|'live'|'archive'|'correspondence';
    show_all: boolean;
}


interface TournamentListMainViewState {
    tab: 'schedule'|'live'|'archive'|'correspondence';
}

export class TournamentListMainView extends React.PureComponent<{}, TournamentListMainViewState> {
    constructor(props) {
        super(props);
        this.state = {
            tab: preferences.get("tournaments-tab"),
            show_all: preferences.get("tournaments-show-all"),
            //show_all: false,
        };
    }

    componentDidMount() {
        window.document.title = _("Tournaments");
    }

    setTabArchive = () => this.setTab("archive");
    setTabSchedule = () => this.setTab("schedule");
    setTabLive = () => this.setTab("live");
    setTabCorrespondence = () => this.setTab("correspondence");

    setTab(tab) {
        this.setState({tab: tab});
        preferences.set("tournaments-tab", tab);
    }
    toggleShowAll(show_all: boolean) {
        this.setState({show_all: show_all});
        preferences.set("tournaments-show-all", show_all);
    }

    render() {
        const tab = this.state.tab;

        const frag_open_tournament = (speed: 'live'|'correspondence') => (
            <React.Fragment>
                <div className="open-tourney-header">
                    <h3>{_("Open Tournaments")}</h3>
                    <div>
                        {_("Show all")}
                        <Toggle height={14} width={30} checked={this.state.show_all} onChange={tf => this.toggleShowAll(tf)} />
                    </div>
                </div>
                <TournamentList
                    phase='open'
                    speed={speed}
                    hide_stale={!this.state.show_all}
                    hide_exclusive={!this.state.show_all}
                />
            </React.Fragment>);

        return (

            <div className="page-width">
                <div className="TournamentList container">
                    <div className="tabhead">
                        <h2><i className="fa fa-trophy"></i> {_("Tournaments")}</h2>
                        <div>
                            <span className={"tab" + (tab === "schedule" ? " active" : "")} onClick={this.setTabSchedule}>
                                <i className="fa fa-calendar"></i>
                                {_("Schedule")}
                            </span>
                            <span className={"tab" + (tab === "live" ? " active" : "")} onClick={this.setTabLive}>
                                <i className="fa fa-clock-o"></i>
                                {_("Live")}
                            </span>
                            <span className={"tab" + (tab === "correspondence" ? " active" : "")} onClick={this.setTabCorrespondence}>
                                <i className="ogs-turtle"></i>
                                {_("Correspondence")}
                            </span>
                            <span className={"tab" + (tab === "archive" ? " active" : "")} onClick={this.setTabArchive}>
                                <i className="fa fa-university"></i>
                                {_("Archive")}
                            </span>
                        </div>
                    </div>
                    <hr/>

                    {tab === "schedule" && <Schedule/>}
                    {tab === "live" && (
                        <div>
                            {frag_open_tournament('live')}

                            <h3>{_("Active Tournaments")}</h3>
                            <TournamentList phase='active' speed='live'/>
                        </div>
                    )}
                    {tab === "correspondence" && (
                        <div>
                            {frag_open_tournament('correspondence')}

                            <h3>{_("Active Tournaments")}</h3>
                            <TournamentList phase='active' speed='correspondence'/>
                        </div>
                    )}
                    {tab === "archive" && (
                        <div>
                            <h3>{_("Finished Tournaments")}</h3>
                            <TournamentList phase='finished'/>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

class Schedule extends React.PureComponent<{}, any> {
    constructor(props) {
        super(props);
        this.state = {
            schedules: []
        };
    }

    componentDidMount() {
        get("tournament_schedules/", {page_size: 100})
        .then((res) => {
            res.results.sort((a, b) => {
                return new Date(a.next_run).getTime() - new Date(b.next_run).getTime();
            });
            this.setState({schedules: res.results});
        } )
        .catch(errorAlerter);
    }

    render() {
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
                        {this.state.schedules.map((entry, idx) => (
                            <tr key={idx} >
                                <td>
                                    <h4>
                                        <i className={speedIcon(entry) + " site-tourny"}></i>
                                        {entry.name}
                                    </h4>
                                    <div><i>{rrule_description(entry)}</i></div>
                                </td>
                                <td>
                                    <div>{typeDescription(entry)}</div>
                                </td>
                                <td>
                                    <div>{datefmt(entry.next_run)}</div>
                                    <div><i>{fromNow(entry.next_run)}</i></div>
                                </td>
                                <td>
                                    <div>{datefmt(entry.next_run, entry.lead_time_seconds)}</div>
                                    <div><i>{fromNow(entry.next_run, entry.lead_time_seconds)}</i></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>


            </div>
        );
    }
}
export class TournamentList extends React.PureComponent<TournamentListProperties> {
    constructor(props) {
        super(props);
    }

    static makeFilter(
        phase: "open" | "active" | "finished",
        speed?: "live" | "correspondence",
        hide_stale?: boolean,
        hide_exclusive?: boolean,
        group?: number) {

        const filter: { [key: string]: any } = {};
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
            filter["time_start__gte"] = (new Date()).toISOString();
        }

        if (hide_exclusive) {
            filter["exclusivity"] = "open";
        }

        if (group !== undefined) {
            filter["group"] = group;
        }

        return filter;
    }

    render() {
        const filter = TournamentList.makeFilter(
            this.props.phase,
            this.props.speed,
            this.props.hide_stale,
            this.props.hide_exclusive,
            this.props.group);

        return (
            <div className="TournamentList">
                <PaginatedTable
                    className="TournamentList-table"
                    name="game-history"
                    source={`tournaments/`}
                    filter={filter}
                    orderBy={["-started", "time_start", "name"]}
                    columns={[
                        {
                            header: _("Tournament"),
                            className: () => "name",
                            render: (tournament: rest_api.Tournament) => (
                                <div className="tournament-name">
                                    <i className={timeIcon(tournament.time_per_move) + (tournament.group ? " group-tourny" : " site-tourny")} />
                                    {tournament.group
                                    ? <Link to={`/group/${tournament.group.id}`}>
                                        <img src={mk32icon(tournament.icon)}
                                            data-title={tournament.group.name}
                                            onMouseOver={tooltip}
                                            onMouseOut={tooltip}
                                            onMouseMove={tooltip}
                                        />
                                    </Link>
                                    : <img src={tournament.icon}
                                        data-title={_("OGS Site Wide Tournament")}
                                        onMouseOver={tooltip}
                                        onMouseOut={tooltip}
                                        onMouseMove={tooltip}
                                    />
                                    }
                                    <Link to={`/tournament/${tournament.id}`}>{tournament.name}</Link>
                                </div>
                            )
                        },

                        {header: _("When")        , className: "nobr" , render: (tournament) => when(tournament.time_start)},
                        {header: _("Time Control"), className: "nobr" , render: (tournament) => shortShortTimeControl(tournament.time_control_parameters)},
                        {header: _("Size")        , className: "nobr" , render: (tournament) => (`${tournament.board_size}x${tournament.board_size}`)},
                        {header: _("Players")     , className: "nobr" , render: (tournament) => tournament.player_count},
                        {header: _("Ranks")       , className: "nobr" , render: (tournament) => shortRankRestrictionText(tournament.min_ranking, tournament.max_ranking)},
                    ]}
                />



            </div>
        );
    }
}

function mk32icon(path) {
    return path.replace(/-[0-9]+.png/, "-32.png");
}
function speedIcon(e) {
    const tpm = computeAverageMoveTime(e.time_control_parameters);
    if (tpm === 0 || tpm > 3600) {
        return "ogs-turtle";
    }
    if (tpm < 10) {
        return "fa fa-bolt";
    }
    return "fa fa-clock-o";
}
function timeIcon(time_per_move) {
    if (time_per_move === 0) {
        return "ogs-turtle";
    } else if (time_per_move < 20) {
        return "fa fa-bolt";
    } else if (time_per_move < 3600) {
        return "fa fa-clock-o";
    }
    return "ogs-turtle";
}

function rrule_description(entry) {
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

    if (/freq.daily/i.test(rrule))    { unit = "daily";   }
    if (/freq.hourly/i.test(rrule))   { unit = "hourly";   }
    if (/freq.minutely/i.test(rrule)) { unit = "minutely"; }
    if (/freq.weekly/i.test(rrule))   { unit = "weekly";   }
    if (/freq.monthly/i.test(rrule))  { unit = "monthly";  }
    if (/freq.yearly/i.test(rrule))   { unit = "yearly";   }

    if (interval === 1) {
        switch (unit) {
            case "hourly": return m.format("m") !== "0" ? interpolate(_("Occurs %s minutes past the hour every hour"), [m.format("m")]) : _("Occurs every hour on the hour");
            case "daily": return interpolate(_("Occurs daily at %s"), [m.format("LT")]);
            case "weekly": return interpolate(pgettext("Every <day of week> at <time>", "Occurs every %s at %s"), [m.format("dddd"), m.format("LT")]);
            case "monthly": return interpolate(pgettext("The <day of month> at <time>", "Occurs on the %s of every month at %s"), [m.format("Do"), m.format("LT")]);
            case "yearly": return interpolate(pgettext("<day of year> of every year at <time>", "Occurs %s of every year at %s"), [m.format("MMMM Do"), m.format("LT")]);
        }
    } else {
        switch (unit) {
            case "minutely": return interpolate(_("Occurs every %s minutes"), [interval]);
            case "hourly": return m.format("m") !== "0" ? interpolate(_("Occurs %s minutes past the hour every %s hours"), [m.format("m"), interval])
                                                        : interpolate(_("Occurs every %s hours on the hour"), [interval]);
            case "daily": return interpolate(_("Occurs every %s days at %s"), [interval, m.format("LT")]);
            case "weekly": return interpolate(_("Occurs every %s weeks on %s at %s"), [interval, m.format("dddd"), m.format("LT")]);
            case "monthly": return interpolate(pgettext("The <day of month> every <n> months at <time>", "Occurs on the %s every %s months at %s"), [m.format("Do"), interval,  m.format("LT")]);
        }
    }
    console.log("Failed: ", unit, interval);
}
function typeDescription(e) {
    return TOURNAMENT_TYPE_NAMES[e.tournament_type];
}
function datefmt(d, offset?) {
    if (!offset) {
        offset = 0;
    }
    return moment(new Date(d)).add(offset, "seconds").format("llll");
}
function timeControlDescription(e) {
    return shortTimeControl(e.time_control_parameters);
}
function calendar(d, offset?) {
    if (!offset) {
        offset = 0;
    }
    return moment(new Date(d)).add(offset, "seconds").calendar();
}
function fromNow(d, offset?) {
    if (!offset) {
        offset = 0;
    }
    return moment(new Date(d)).add(offset, "seconds").fromNow();
}
function when(t) {
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
