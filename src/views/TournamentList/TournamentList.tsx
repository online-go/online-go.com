/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {Link, browserHistory} from "react-router";
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {Card} from "components";
import {AdUnit} from "AdUnit";
import preferences from "preferences";
import {errorAlerter} from "misc";
import {shortTimeControl, shortShortTimeControl, computeAverageMoveTime} from "TimeControl";
import {PaginatedTable} from "PaginatedTable";
import * as moment from "moment";
import {TOURNAMENT_TYPE_NAMES, TOURNAMENT_PAIRING_METHODS, rankRestrictionText, shortRankRestrictionText} from "Tournament";
import tooltip from "tooltip";

interface TournamentListMainViewProperties {
}
interface TournamentListProperties {
    filter: any;
}

export class TournamentListMainView extends React.PureComponent<TournamentListProperties, any> { /* {{{ */
    constructor(props) {
        super(props);
        this.state = {
            tab: preferences.get("tournaments-tab")
        };
    }

    setTabArchive = () => this.setTab("archive");
    setTabSchedule = () => this.setTab("schedule");
    setTabLive = () => this.setTab("live");
    setTabCorrespondence = () => this.setTab("correspondence");

    setTab(tab) {
        this.setState({tab: tab});
        preferences.set("tournaments-tab", tab);
    }

    render() {
        let tab = this.state.tab;

        return (
            <div className="TournamentList container">
                <AdUnit unit="cdm-zone-01" nag/>

                <Card>
                    <div className="tabhead">
                        <h2>{_("Tournaments")}</h2>
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
                            <h3>{_("Open Tournaments")}</h3>
                            <TournamentList filter={{
                                started__isnull: true,
                                ended__isnull: true,
                                time_per_move__lt: 3600,
                                time_per_move__gt: 0,
                            }}/>

                            <h3>{_("Active Tournaments")}</h3>
                            <TournamentList filter={{
                                started__isnull: false,
                                ended__isnull: true,
                                time_per_move__lt: 3600,
                                time_per_move__gt: 0,
                            }}/>
                        </div>
                    )}
                    {tab === "correspondence" && (
                        <div>
                            <h3>{_("Open Tournaments")}</h3>
                            <TournamentList filter={{
                                started__isnull: true,
                                ended__isnull: true,
                                time_per_move__gte: 3600,
                            }}/>

                            <h3>{_("Active Tournaments")}</h3>
                            <TournamentList filter={{
                                started__isnull: false,
                                ended__isnull: true,
                                time_per_move__gte: 3600,
                            }}/>
                        </div>
                    )}
                    {tab === "archive" && (
                        <div>
                            <h3>{_("Finished Tournaments")}</h3>
                            <TournamentList filter={{
                                started__isnull: false,
                                ended__isnull: false,
                            }}/>
                        </div>
                    )}
                </Card>
            </div>
        );
    }
} /* }}} */

class Schedule extends React.PureComponent<{}, any> { /* {{{ */
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
} /* }}} */
export class TournamentList extends React.PureComponent<TournamentListProperties, any> { /* {{{ */
    refs: {
        table
    };

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        let filter = this.props.filter;

        return (
            <div className="TournamentList">
                <PaginatedTable
                    className="TournamentList-table"
                    ref="table"
                    name="game-history"
                    source={`tournaments/`}
                    filter={filter}
                    orderBy={["-started", "time_start", "name"]}
                    columns={[
                        {header: _("Tournament"),  className: () => "name",
                         render: (tournament) => (
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

                        {header: _("When")        , className: "nobr center" , render: (tournament) => when(tournament.time_start)},
                        {header: _("Time Control"), className: "nobr center" , render: (tournament) => shortShortTimeControl(tournament.time_control_parameters)},
                        {header: _("Size")        , className: "nobr center" , render: (tournament) => (`${tournament.board_size}x${tournament.board_size}`)},
                        {header: _("Players")     , className: "nobr center" , render: (tournament) => tournament.player_count},
                        {header: _("Ranks")       , className: "nobr center" , render: (tournament) => shortRankRestrictionText(tournament.min_ranking, tournament.max_ranking)},
                    ]}
                />


                
            </div>
        );
    }
} /* }}} */

function mk32icon(path) {{{
    return path.replace(/-[0-9]+.png/, "-32.png");
}}}
function speedIcon(e) {{{
    let tpm = computeAverageMoveTime(e.time_control_parameters);
    if (tpm === 0 || tpm > 3600) {
        return "ogs-turtle";
    }
    if (tpm < 10) {
        return "fa fa-bolt";
    }
    return "fa fa-clock-o";
}}}
function timeIcon(time_per_move) {{{
    if (time_per_move === 0) {
    }
    else if (time_per_move < 20) {
        return "fa fa-bolt";
    }
    else if (time_per_move < 3600) {
        return "fa fa-clock-o";
    }
    return "ogs-turtle";
}}}

function rrule_description(entry) {{{
    let m = moment(new Date(entry.next_run)).add(entry.lead_time_seconds, "seconds");

    let rrule = entry.rrule;
    let interval = 1;
    let unit = "error";
    if (/interval.\s*([0-9]+)/i.test(rrule)) {
        let matches = rrule.match(/interval.\s*([0-9]+)/i);
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
}}}
function typeDescription(e) {{{
    return TOURNAMENT_TYPE_NAMES[e.tournament_type];
}}}
function datefmt(d, offset?) {{{
    if (!offset) {
        offset = 0;
    }
    return moment(new Date(d)).add(offset, "seconds").format("llll");
}}}
function timeControlDescription(e) {{{
    return shortTimeControl(e.time_control_parameters);
}}}
function calendar(d, offset?) {{{
    if (!offset) {
        offset = 0;
    }
    return moment(new Date(d)).add(offset, "seconds").calendar();
}}}
function fromNow(d, offset?) {{{
    if (!offset) {
        offset = 0;
    }
    return moment(new Date(d)).add(offset, "seconds").fromNow();
}}}
function when(t) {{{
    if (t) {
        let d = new Date(t);
        let diff = Math.round((d.getTime() - Date.now()) / 1000.0);

        //if (Math.abs(diff) > 7*86400) {
        if (diff > 7 * 86400) {
            return moment(d).format("ddd MMM Do, LT");
        } else {
            return moment(d).calendar();
        }
    } else {
        return "";
    }
}}}
