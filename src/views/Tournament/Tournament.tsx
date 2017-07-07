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
import * as ReactDOM from "react-dom";
import {Link, browserHistory} from "react-router";
import {_, pgettext, interpolate} from "translate";
import {abort_requests_in_flight, del, put, post, get} from "requests";
import {ignore, errorAlerter, rulesText, dup} from "misc";
import {handicapText} from "GameAcceptModal";
import {timeControlDescription, computeAverageMoveTime} from "TimeControl";
import {Markdown} from "Markdown";
import {Player, setExtraActionCallback} from "Player";
import * as moment from "moment";
import * as Datetime from "react-datetime";
import {UIPush} from "UIPush";
import {Card} from "material";
import {EmbeddedChat} from "Chat";
import * as data from "data";
import {PaginatedTable} from "PaginatedTable";
import {PersistentElement} from "PersistentElement";
import {PlayerAutocomplete} from "PlayerAutocomplete";
import {MiniGoban} from "MiniGoban";
import * as player_cache from "player_cache";
import {Steps} from "Steps";
import {TimeControlPicker} from "TimeControl";
import {close_all_popovers} from "popover";
import * as d3 from "d3";
import {Rank, dan, rank_short_string, rank_long_string} from "data/Rank";
import {find_rank_short_string, find_rank_long_string} from "compatibility/Rank";
import {is_registered} from "data/Player";


declare var swal;

let ranks = (() => {
    let ranks: Array<Rank> = [];
    for (let i = -29; i <= 7; i++) {
        ranks.push(dan(i));
    }
    return ranks;
})();

interface TournamentProperties {
    params: any;
}

/* TODO: Implement me TD Options */

export class Tournament extends React.PureComponent<TournamentProperties, any> {
    refs: {
        player_list;
        time_control_picker;
        tournament_name;
        description;
        players_start;
        max_players;
    };

    elimination_tree_container = $(`<div class="tournament-elimination-container">`);
    elimination_tree = $(`<svg xmlns="http://www.w3.org/2000/svg">`);

    constructor(props) { /* {{{ */
        super(props);

        let tournament_id = parseInt(this.props.params.tournament_id) || 0;

        this.state = {
            new_tournament_group_id: parseInt(this.props.params.group_id) || 0,
            tournament_id: tournament_id,
            loading: true,
            tournament: {
                id: tournament_id,
                name: "",
                director: tournament_id === 0 ? data.get("user") : {},
                time_start: moment(new Date()).add(1, "hour").startOf("hour").format(),

                board_size: "19",
                rules: "japanese",
                description: "",
                handicap: "0",
                time_control_parameters: {
                    system: "fischer",
                    speed: "correspondence",
                    initial_time: 3 * 86400,
                    max_time: 7 * 86400,
                    time_increment: 86400,
                },
                tournament_type: "mcmahon",
                min_ranking: "0",
                max_ranking: "36",
                analysis_enabled: true,
                exclude_provisional: true,
                auto_start_on_max: false,
                exclusivity: "open",
                first_pairing_method: "slide",
                subsequent_pairing_method: "slaughter",
                players_start: 4,
                settings: {
                    lower_bar: "10",
                    upper_bar: "20",
                    num_rounds: "3",
                    group_size: "3",
                    maximum_players: 100,
                },
                lead_time_seconds: 1800,
                base_points: 10.0,


            },
            editing: tournament_id === 0,
            raw_rounds: [],
            rounds: [],
            selected_round: 0,
            sorted_players: [],
            players: {},
            is_joined: null,
            invite_result: null,
            elimination_tree: null,
        };

        this.elimination_tree_container.append(this.elimination_tree);
    } /* }}} */

    componentWillMount() {{{
        setExtraActionCallback(this.renderExtraPlayerActions);
    }}}
    componentDidMount() {{{
        if (this.state.tournament_id) {
            this.resolve(this.state.tournament_id);
        }
        if (this.state.new_tournament_group_id) {
            get(`groups/${this.state.new_tournament_group_id}`)
            .then((group) => {
                this.setState({tournament: Object.assign({}, this.state.tournament, {group: group})});
            })
            .catch(errorAlerter);
        }
    }}}
    componentWillUnmount() {{{
        this.abort_requests();
        setExtraActionCallback(null);
    }}}
    componentWillReceiveProps(next_props) {{{
        if (next_props.params.tournament_id !== this.props.params.tournament_id) {
            this.setState({tournament_id: parseInt(next_props.params.tournament_id)});
            this.resolve(parseInt(next_props.params.tournament_id));
        }
    }}}
    abort_requests() {{{
        abort_requests_in_flight(`tournaments/${this.state.tournament_id}`);
        abort_requests_in_flight(`tournaments/${this.state.tournament_id}/rounds`);
        abort_requests_in_flight(`tournaments/${this.state.tournament_id}/players/all`);
    }}}
    resolve(tournament_id: number) {{{
        this.abort_requests();

        Promise.all([
            get(`tournaments/${tournament_id}`),
            get(`tournaments/${tournament_id}/rounds`),
            this.refreshPlayerList(tournament_id),
        ])
        .then((res) => {
            let tournament = res[0];
            let rounds = res[1];
            let raw_rounds = res[1];
            let players = res[2];

            while (rounds.length && rounds[rounds.length - 1].matches.length === 0) {
                rounds.pop(); /* account for server bugs that can create empty last rounds */
            }

            let use_elimination_trees = false;
            if (tournament.tournament_type === "elimination" || tournament.tournament_type === "double_elimination") {
                use_elimination_trees = true;
                setTimeout(() => this.updateEliminationTrees(), 1);
            } else {
                rounds = rounds.map((r) => this.groupify(r, players));
                this.linkPlayersToRoundMatches(rounds, players);
            }

            this.setState({
                loading: false,
                tournament: tournament,
                raw_rounds: raw_rounds,
                rounds: rounds,
                selected_round: rounds.length - 1,
                use_elimination_trees: use_elimination_trees,
            });
        })
        .catch(errorAlerter);
    }}}
    reloadTournament = () => {{{
        this.resolve(this.state.tournament_id);
    }}}
    refreshPlayerList = (tournament_id?) => {{{
        if (typeof(tournament_id) !== "number") {
            tournament_id = this.state.tournament_id;
        }
        let user = data.get("user");

        let ret = get(`tournaments/${tournament_id}/players/all`);
        ret
        .then((players) => {
            for (let id in players) {
                let p = players[id];
                player_cache.update(p);

                p.points = parseFloat(p.points);
                p.sos = parseFloat(p.sos);
                p.sodos = parseFloat(p.sodos);
                p.net_points = parseFloat(p.net_points);

                p.notes = "";
                if (p.disqualified) {
                    p.notes = _("Disqualified");
                }
                if (p.resigned) {
                    p.notes = _("Resigned");
                }
                if (p.eliminated) {
                    p.notes = _("Eliminated");
                }
            }

            let sorted = Object.keys(players).map((id) => players[id]).sort(this.compareUserRank);

            let new_state: any = {
                sorted_players: sorted,
                players: players,
                is_joined: user.id in players &&
                    !players[user.id].disqualified && !players[user.id].resigned && !players[user.id].eliminated
            };

            if (this.state.rounds.length) {
                new_state.rounds = this.state.rounds.map((r) => this.groupify(r, players));
            }

            this.setState(new_state);
            //this.linkPlayersToRoundMatches(this.state.rounds, players);
            setTimeout(() => this.updateEliminationTrees(), 1);
        })
        .catch(errorAlerter);
        return ret;
    }}}
    linkPlayersToRoundMatches(rounds, players) {{{
        for (let round of rounds) {
            if (!round.groupify) {
                for (let match of round.matches) {
                    match.player = players[match.player.id];
                }
            }
        }
    }}}
    compareUserRank = (a, b) => { /* {{{ */
        if (!a && !b) { return 0; }
        if (!a) { return -1; }
        if (!b) { return 1; }

        let pa = this.state.players[a.id];
        let pb = this.state.players[b.id];
        if (!pa && !pb) { return 0; }
        if (!pa) { console.log("Tournament game listed user " + a.id + " but player was not in TournamentPlayer list for this tournament"); return -1; }
        if (!pb) { console.log("Tournament game listed user " + b.id + " but player was not in TournamentPlayer list for this tournament"); return 1; }
        if (pa.rank !== pb.rank) { return pa.rank - pb.rank; }
        if (pa.points !== pb.points) { return parseFloat(pb.points) - parseFloat(pa.points); }
        if (pa.sos !== pb.sos) { return parseFloat(pb.sos) - parseFloat(pa.sos); }
        if (pa.sodos !== pb.sodos) { return parseFloat(pb.sodos) - parseFloat(pa.sodos); }
        //if (pa.net_points !== pb.net_points) return parseFloat(pb.net_points) - parseFloat(pa.net_points);
        if (pa.ranking !== pb.ranking) { return pb.ranking - pa.ranking; }
        if (pa.username < pb.username) { return 1; }
        if (pa.username > pb.username) { return -1; }
        return 0;
    } /* }}} */

    startTournament = () => {
        swal({
            text: _("Start this tournament now?"),
            showCancelButton: true,
            focusCancel: true
        })
        .then(() => {
            post("tournaments/" + this.state.tournament.id + "/start", {})
            .then(ignore)
            .catch(errorAlerter);
        })
        .catch(ignore);
    }
    deleteTournament = () => {
        swal({
            text: _("Delete this tournament?"),
            showCancelButton: true,
            focusCancel: true
        })
        .then(() => {
            del("tournaments/" + this.state.tournament.id)
            .then(() => {
                browserHistory.push("/");
            })
            .catch(errorAlerter);
        })
        .catch(ignore);
    }
    setUserToInvite = (user) => {{{
        this.setState({user_to_invite: user});
    }}}
    inviteUser = () => {{{
        post(`tournaments/${this.state.tournament_id}/players`, {"username": this.state.user_to_invite.username })
        .then((res) => {
            console.log(res);
            _("Player invited"); /* for translations */
            this.setState({invite_result: _(res.success)});
        })
        .catch((res) => {
            try {
                _("Player already has an outstanding invite"); /* for translations */
                _("Player is already participating in this tournament"); /* for translations */
                this.setState({invite_result: _(JSON.parse(res.responseText).error)});
            } catch (e) {
                console.error(res);
                console.error(e);
            }
        });
    }}}
    joinTournament = () => {{{
        post(`tournaments/${this.state.tournament_id}/players`, {})
        .then((res) => {
            this.setState({is_joined: true});
        })
        .catch(errorAlerter);
    }}}
    partTournament = () => {{{
        post(`tournaments/${this.state.tournament_id}/players`, {"delete": true})
        .then((res) => {
            this.setState({is_joined: false});
        })
        .catch(errorAlerter);
    }}}
    resign = () => {{{
        swal({
            text: _("Are you sure you want to resign from the tournament? This will also resign you from all games you are playing in this tournament."),
            showCancelButton: true,
            focusCancel: true
        })
        .then(this.partTournament)
        .catch(errorAlerter);
    }}}
    updateEliminationTrees() {{{
        let tournament = this.state.tournament;
        let rounds = this.state.rounds;
        let players = this.state.players;

        if (tournament.tournament_type === "elimination" || tournament.tournament_type === "double_elimination") {
            if (Object.keys(players).length === 0 || rounds.length === 0) {
                return;
            }

            let elimination_tree = this.elimination_tree[0];
            let position_scale = 10.0;
            let spacing = 0;
            let container = this.elimination_tree_container;
            let lastbucket = {};
            let lastcurbucket = {};
            let curbucket = {};
            let depths = [];
            let em_4 = $("#em10").width() * 0.4 / 10.0;
            let em_5 = $("#em10").width() * 0.5 / 10.0;
            let em_6 = $("#em10").width() * 0.6 / 10.0;
            let em2_5 = $("#em10").width() * 2.5 / 10.0;
            let namewidth = $("#em10").width() * 12.0 / 10.0;
            let minspace = $("#em10").width() * 0.5 / 10.0;
            let h = em2_5 + minspace;
            let w = namewidth + $("#em10").width() * 4.0 / 10.0;

            let bindHovers = (div, id) => { /* {{{ */
                div.mouseover(() => {
                    $(".elimination-player-hover").removeClass("elimination-player-hover");
                    $(".elimination-player-" + id).addClass("elimination-player-hover");
                });
                div.mouseout(() => {
                    $(".elimination-player-hover").removeClass("elimination-player-hover");
                });
            }; /* }}} */

            let all_objects = [];
            for (let round_num = 0; round_num < rounds.length; ++round_num) { /* {{{ */
                let round = rounds[round_num];

                for (let match_num = 0; match_num < round.matches.length; ++match_num) {
                    let match = round.matches[match_num];
                    let matchdiv = $("<div>").addClass("matchdiv");

                    let black = $("<div>").addClass("black").addClass("elimination-player-" + match.black);
                    let white = $("<div>").addClass("white").addClass("elimination-player-" + match.white);
                    ReactDOM.render((<Player user={players[match.black]} icon rank />), black[0]);
                    ReactDOM.render((<Player user={players[match.white]} icon rank />), white[0]);


                    black.prepend($("<a class='elimination-game'><i class='ogs-goban'></i> </a>").attr("href", "/game/view/" + match.gameid));
                    white.prepend($("<a class='elimination-game'><i class='ogs-goban'></i> </a>").attr("href", "/game/view/" + match.gameid));

                    bindHovers(black, match.black);
                    bindHovers(white, match.white);

                    if (match.result[0] === "B") { black.addClass("win"); }
                    if (match.result[0] === "W") { white.addClass("win"); }

                    matchdiv.append(black);
                    matchdiv.append(white);

                    let obj = {
                        div: matchdiv,
                        black_src: round_num > 0 ? lastbucket[match.black] : null,
                        white_src: round_num > 0 ? lastbucket[match.white] : null,
                        black_won: match.result[0] === "B",
                        match: match,
                        second_bracket: false,
                        round: round_num,
                    };
                    if (obj.black_src) {
                        obj.black_src.parent = obj;
                        obj.black_src.feeding_black = true;
                    }
                    if (obj.white_src) {
                        obj.white_src.parent = obj;
                        obj.black_src.feeding_white = true;
                    }
                    all_objects.push(obj);

                    curbucket[match.black] = obj;
                    curbucket[match.white] = obj;

                    container.append(matchdiv);
                }
                for (let bye_num = 0; bye_num < round.byes.length; ++bye_num) {
                    let bye = round.byes[bye_num];
                    let byediv = $("<div>").addClass("byediv");
                    let byee = $("<div>").addClass("bye").addClass("elimination-player-" + bye);
                    ReactDOM.render((<Player user={players[bye]} icon rank />), byee[0]);
                    bindHovers(byee, bye);
                    byediv.append(byee);
                    let obj = {
                        div: byediv,
                        bye_src: round_num > 0 ? lastbucket[bye] : null,
                        black_won: true,
                        second_bracket: false,
                        round: round_num,
                        player_id: bye,
                    };
                    if (obj.bye_src) {
                        obj.bye_src.parent = obj;
                    }
                    curbucket[bye] = obj;
                    all_objects.push(obj);

                    container.append(byediv);
                }

                for (let k in curbucket) {
                    lastbucket[k] = curbucket[k];
                }
                lastcurbucket = curbucket;
                curbucket = {};
            } /* }}} */

            let lastcurbucket_arr = [];
            for (let k in lastcurbucket) { lastcurbucket_arr.push(lastcurbucket[k]); }

            let playerWon = (obj, player_id) => { /* {{{ */
                if (!obj.match) {
                    return true;
                }
                if (obj.match.result[0] === "B" && obj.match.black === player_id) {
                    return true;
                }
                if (obj.match.result[0] === "W" && obj.match.white === player_id) {
                    return true;
                }
                return false;
            }; /* }}} */

            for (let i = 0; i < all_objects.length; ++i) { /* {{{ */
                let obj = all_objects[i];
                if (obj.round === 0) { continue; }
                if (obj.bye_src) {
                    obj.second_bracket = obj.bye_src.second_bracket || !playerWon(obj.bye_src, obj.player_id);
                }
                if (obj.black_src && obj.white_src) {
                    if (playerWon(obj.black_src, obj.match.black)) {
                        obj.second_bracket = obj.black_src.second_bracket;
                    } else if (playerWon(obj.white_src, obj.match.white)) {
                        obj.second_bracket = obj.white_src.second_bracket;
                    } else {
                        obj.second_bracket = true;
                    }
                }

                if (obj.round === rounds.length - 1 && lastcurbucket_arr.length <= 2) {
                    obj.second_bracket = false;
                }

                if (obj.second_bracket) {
                    //obj.div.css({"background-color": "red", "opacity": 0.5});
                }
            } /* }}} */


            let svg_extents = {x: 0, y: 0};

            let last_visit_order = 0;
            let layout = (collection) => { /* {{{ */
                let computeVisitOrder = (obj) => { /* {{{ */
                    if (obj.visit_order) { return; }

                    if (!obj.second_bracket && obj.black_src && obj.black_src.second_bracket) {
                        if (obj.white_src) { computeVisitOrder(obj.white_src); }
                    }
                    if (!obj.second_bracket && obj.white_src && obj.white_src.second_bracket) {
                        if (obj.black_src) { computeVisitOrder(obj.black_src); }
                    }

                    if (obj.bye_src)   { computeVisitOrder(obj.bye_src);   }
                    if (obj.black_src) { computeVisitOrder(obj.black_src); }
                    if (obj.white_src) { computeVisitOrder(obj.white_src); }

                    obj.visit_order = ++last_visit_order;

                }; /* }}} */

                let arr = [];
                for (let k in collection) {
                    arr.push(collection[k]);
                }
                arr.sort((a, b) => {
                    let d = a.second_bracket - b.second_bracket;
                    if (d !== 0) {
                        return d;
                    }

                    let arank = a.player_id ? players[a.player_id].ranking * 2 : players[a.match.black].ranking + players[a.match.white].ranking;
                    let brank = b.player_id ? players[b.player_id].ranking * 2 : players[b.match.black].ranking + players[b.match.white].ranking;
                    return -(arank - brank);
                });


                /* If we have the leader in the top bracket drop out before the second bracket completes so we get
                 * to our final match, the final match players both come from the second bracket. To account for this
                 * we look for the most recently finished game in the top bracket, make sure it's not the end game (that's
                 * the black/white_src.second_bracket check), and run our layout first starting from that node. */
                let max_se_round = 0;
                for (let i = 0; i < all_objects.length; ++i) {
                    if (!all_objects[i].second_bracket) {
                        if ( all_objects[i].black_src && all_objects[i].black_src.second_bracket
                              && all_objects[i].white_src && all_objects[i].white_src.second_bracket
                        ) {
                            continue;
                        }
                        max_se_round = Math.max(max_se_round, all_objects[i].round);
                    }
                }

                for (let i = 0; i < all_objects.length; ++i) {
                    if (!all_objects[i].second_bracket && max_se_round === all_objects[i].round) {
                        if ( all_objects[i].black_src && all_objects[i].black_src.second_bracket
                              && all_objects[i].white_src && all_objects[i].white_src.second_bracket
                        ) {
                            continue;
                        }
                        computeVisitOrder(all_objects[i]);
                    }
                }

                /* Now lay out our collections from the very end */
                for (let i = 0; i < arr.length; ++i) {
                    computeVisitOrder(arr[i]);
                    //console.log(arr[i].second_bracket);
                }


                //computeVisitOrder(obj);
                all_objects.sort((a, b) => { /* {{{ */
                    if (!a.visit_order) { a.visit_order = ++last_visit_order; }
                    if (!b.visit_order) { b.visit_order = ++last_visit_order; }

                    if (a.second_bracket !== b.second_bracket) {
                        return (a.second_bracket - b.second_bracket);
                    }
                    if (a.round !== b.round) {
                        return (a.round - b.round);
                    }
                    return (a.visit_order - b.visit_order);
                }); /* }}} */


                let y = {0: 0};
                let base_y = 0;
                let bracket_spacing = 75;
                for (let i = 0; i < all_objects.length; ++i) {
                    let obj = all_objects[i];
                    obj.laid_out = true;

                    if (obj.round === 0 && (i + 1) < all_objects.length && all_objects[i + 1].round === 1) {
                        for (let r = 1; r < rounds.length; ++r) {
                            y[r] = base_y + bracket_spacing;
                        }
                    }

                    if (!obj.second_bracket) {
                        if (obj.bye_src) {
                            if (obj.bye_src.second_bracket === obj.second_bracket) {
                                obj.top = obj.bye_src.top;
                            } else {
                                obj.top = y[obj.round];
                                y[obj.round] += h;
                            }
                        } else {
                            if (
                                (obj.black_src && obj.black_src.second_bracket === obj.second_bracket &&
                                 obj.white_src && obj.white_src.second_bracket === obj.second_bracket)
                                //|| obj.round === rounds.length-1

                            ) {
                                obj.top = (obj.black_src.top + obj.white_src.top) / 2.0;
                            }
                            else if (obj.black_src && obj.black_src.second_bracket === obj.second_bracket) {
                                obj.top = obj.black_src.top;
                            }
                            else if (obj.white_src && obj.white_src.second_bracket === obj.second_bracket) {
                                obj.top = obj.white_src.top;
                            }
                            else {
                                obj.top = y[obj.round];
                                y[obj.round] += h;
                            }
                        }
                    } else {
                        obj.top = y[obj.round];
                        y[obj.round] += h;
                    }



                    obj.left =  w * obj.round;
                    obj.right = obj.left + namewidth;
                    obj.bottom = obj.top + em2_5;

                    obj.div.css({
                        top: obj.top,
                        left: obj.left,
                    });

                    svg_extents.x = Math.max(svg_extents.x, obj.right);
                    svg_extents.y = Math.max(svg_extents.y, obj.bottom + 10);

                    if (obj.round === 0) {
                        base_y = Math.max(base_y, obj.bottom + h + 10);
                    }
                }
            }; /* }}} */

            //for (let k in lastcurbucket) {
                layout(lastcurbucket);
            //}

            let not_laid_out = 0;
            for (let i = 0; i < all_objects.length; ++i) {
                if (!all_objects[i].laid_out) {
                    ++not_laid_out;
                }
            }
            if (not_laid_out) {
                swal("Warning: " + not_laid_out + " matches not laid out");
            }


            let svg = d3.select(elimination_tree);
            svg.attr("width", svg_extents.x);
            svg.attr("height", svg_extents.y);

            //let line_style = "basis";
            //let line_style = "linear";
            //let line_style = "step-before";
            let line_style = "monotone";

            let drawLine = (path) => { /* {{{ */
                let line_function = d3.line()
                                        .curve(d3.curveMonotoneX)
                                        .x((xy: any) => xy.x)
                                        .y((xy: any) => xy.y)
                                        ;
                svg.append("path")
                    .attr("d", line_function(path))
                    .attr("stroke", "#888")
                    .attr("stroke-width", 1.0)
                    .attr("fill", "none");
            }; /* }}} */

            let bottom_padding = 3.0;
            let left_padding = 5.0;

            let getWinnerBottom = (obj) => { /* {{{ */
                if (obj.black_won) {
                    return Math.round((obj.top + obj.bottom) / 2.0);
                }
                return Math.round(obj.bottom + bottom_padding);
            }; /* }}} */

            let drawLines = (obj) => { /* {{{ */
                if (obj.black_src) {
                    drawLines(obj.black_src);
                    if (!obj.second_bracket || obj.second_bracket === obj.black_src.second_bracket) {
                        drawLine([
                            {x: obj.black_src.left, y: getWinnerBottom(obj.black_src)},
                            {x: obj.black_src.right, y: getWinnerBottom(obj.black_src)},
                            {x: obj.left - left_padding, y: Math.round(obj.black_won ? ((obj.top + obj.bottom) / 2.0) : obj.top + em_6) },
                            {x: obj.left, y: Math.round(obj.black_won ? ((obj.top + obj.bottom) / 2.0) : obj.top + em_6) },
                        ]);
                    }
                }
                if (obj.white_src) {
                    drawLines(obj.white_src);
                    if (!obj.second_bracket || obj.second_bracket === obj.white_src.second_bracket) {
                        drawLine([
                            {x: obj.white_src.left, y: getWinnerBottom(obj.white_src)},
                            {x: obj.white_src.right, y: getWinnerBottom(obj.white_src)},
                            {x: obj.left - left_padding, y: Math.round(obj.black_won ? (obj.bottom - em_4) : obj.bottom + bottom_padding)},
                            {x: obj.left, y: Math.round(obj.black_won ? (obj.bottom - em_4) : obj.bottom + bottom_padding)},
                        ]);
                    }
                }
                if (obj.bye_src)   {
                    drawLines(obj.bye_src);
                    if (!obj.second_bracket || obj.second_bracket === obj.bye_src.second_bracket) {
                        drawLine([
                            {x: obj.bye_src.left, y: getWinnerBottom(obj.bye_src)},
                            {x: obj.bye_src.right, y: getWinnerBottom(obj.bye_src)},
                            {x: obj.left, y: Math.round((obj.top + obj.bottom) / 2.0)},
                        ]);
                    }
                }
            }; /* }}} */

            for (let k in lastcurbucket) {
                //drawLines(lastcurbucket[k], rounds.length-1);
                drawLines(lastcurbucket[k]);
            }
        }
    }}}
    groupify(round, players) { /* {{{ */
        try {
        let match_map = {};
        let result_map = {};
        let color_map = {};
        let game_id_map = {};
        let matches = [];
        let byes = [];

        for (let i = 0; i < round.matches.length; ++i) {
            let m = round.matches[i];
            //console.log(m.result, m);
            matches.push({ "player": players[m.black], "opponent": players[m.white]});
            matches.push({ "player": players[m.white], "opponent": players[m.black]});
            if (!(m.black in match_map)) {
                match_map[m.black] = {"matches": {}, "id": m.black, "player": players[m.black]};
            }
            if (!(m.white in match_map)) {
                match_map[m.white] = {"matches": {}, "id": m.white, "player": players[m.white]};
            }
            match_map[m.black].matches[m.white] = m;
            match_map[m.white].matches[m.black] = m;
            game_id_map[m.black + "x" + m.white] = m.gameid;
            game_id_map[m.white + "x" + m.black] = m.gameid;
            result_map[m.black + "x" + m.white] = m.result ? (m.result[0] === "B" ? "win" : (m.result[0] === "W" ? "loss" : "?")) : "?";
            result_map[m.white + "x" + m.black] = m.result ? (m.result[0] === "W" ? "win" : (m.result[0] === "B" ? "loss" : "?")) : "?";
            color_map[m.black + "x" + m.white] = m.result ? (m.result[0] === "B" ? "win" : (m.result[0] === "W" ? "loss" : "no-result")) : "?";
            color_map[m.white + "x" + m.black] = m.result ? (m.result[0] === "W" ? "win" : (m.result[0] === "B" ? "loss" : "no-result")) : "?";
        }

        for (let i = 0; i < round.byes.length; ++i) {
            byes.push(players[round.byes[i]]);
        }

        let last_group = 0;
        for (let player_id in match_map) {
            let group = -1;
            if ("group" in match_map[player_id]) {
                group = match_map[player_id].group;
            } else {
                group = match_map[player_id].group = last_group++;
            }

            for (let opponent_id in match_map[player_id].matches) {
                let ogr = match_map[opponent_id].group;
                if (ogr && ogr !== group) {
                    console.log("Group collision detected between player ", match_map[player_id], "and", match_map[opponent_id]);

                    for (let id in match_map) {
                        if (match_map[id].group === ogr || match_map[id].group === group) {
                            match_map[id].group = -1;
                            //console.log("Moved ", id, " out of group and into generic list group")
                        }
                    }

                    //throw "Group collision: " + ogr + " !== " + group + " hmm..";
                } else {
                    match_map[opponent_id].group = group;
                }
            }
        }

        let groups = new Array(last_group);
        let broken_list = new Array();
        for (let i = 0; i < groups.length; ++i) {
            groups[i] = {"players": []};
        }
        for (let player_id in match_map) {
            let m = match_map[player_id];
            if (m.group === -1) {
                broken_list.push(match_map[player_id]);
            } else {
                groups[m.group].players.push(match_map[player_id]);
            }
        }

        let max_len = 0;
        for (let i = 0; i < groups.length; ++i) {
            groups[i].players = groups[i].players.sort(this.compareUserRank);
            max_len = Math.max(max_len, groups[i].players.length);
        }
        groups = groups.sort((a, b) => {
            return this.compareUserRank(a.players[0], b.players[0]);
        });
        matches = matches.sort((a, b) => {
            return this.compareUserRank(a.player, b.player);
        });
        byes = byes.sort(this.compareUserRank);

        //console.log("Byes: ", byes);

        for (let i = groups.length - 1; i >= 0; --i) {
            if (groups[i].players.length === 0) {
                console.log("Removing  group", i);
                groups.splice(i, 1);
            }
        }

        broken_list = broken_list.sort(this.compareUserRank);
        let broken_players = {};
        for (let i = 0; i < broken_list.length; ++i) {
            broken_players[broken_list[i].player.id] = broken_list[i].player;
        }
        for (let i = 0; i < broken_list.length; ++i) {
            let opponents = [];
            for (let opponent_id in broken_list[i].matches) {
                //let opponent_id = broken_list[i].matches[j].black === broken_list[i].id ? broken_list[i].matches[j].white : broken_list[i].matches[j].black;
                opponents.push({
                    "game_id": broken_list[i].matches[opponent_id].gameid,
                    "player": broken_players[opponent_id],
                });
                broken_list[i].opponents = opponents;
            }
        }

        return {
            groups: groups,
            broken_list: broken_list,
            matches: matches,
            byes: byes,
            groupify: max_len > 2,
            results: result_map,
            game_ids: game_id_map,
            colors: color_map
        };

        } catch (e) {
            setTimeout(() => {throw e; }, 1);
        }
    } /* }}} */
    setSelectedRound = (selected_round: number) => {{{
        this.setState({selected_round: selected_round});
    }}}

    startEditing = () => this.setState({editing: true});
    save = () => {
        let tournament: any = dup(this.state.tournament);

        tournament.name = tournament.name.trim();
        tournament.description = tournament.description.trim();

        if (tournament.name.length < 5) {
            this.refs.tournament_name.focus();
            swal(_("Please provide a name for the tournament"));
            return;
        }

        if (tournament.description.length < 5) {
            this.refs.description.focus();
            swal(_("Please provide a description for the tournament"));
            return;
        }

        let max_players = parseInt(tournament.settings.maximum_players);
        if (max_players > 10 && tournament.tournament_type === "roundrobin") {
            this.refs.max_players.focus();
            swal(_("Round Robin tournaments are limited to a maximum of 10 players"));
            return;
        }
        if (max_players < 2) {
            this.refs.max_players.focus();
            swal(_("You need at least two players in a tournament"));
            return;
        }

        tournament.time_start = moment(new Date(tournament.time_start)).utc().format();
        tournament.group = this.state.new_tournament_group_id || (this.state.group && this.state.group.id);
        if (!tournament.group) {
            delete tournament.group;
        }
        tournament.time_control_parameters.time_control = tournament.time_control_parameters.system;

        delete tournament.settings.active_round;

        if (this.state.tournament.id) {
            put(`tournaments/${this.state.tournament.id}`, tournament)
            .then(() => this.resolve(this.state.tournament_id))
            .catch(errorAlerter);
        } else {
            post(`tournaments/`, tournament)
            .then((res) => browserHistory.push(`/tournament/${res.id}`))
            .catch(errorAlerter);
        }


        this.setState({editing: false});
    }
    setTournamentName = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {name: ev.target.value})});
    setStartTime = (t) => this.setState({tournament: Object.assign({}, this.state.tournament, {time_start: t.format()})});
    setTournamentType = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {tournament_type: ev.target.value})});
    setLowerBar = (ev) => {
        let newSettings = Object.assign({}, this.state.tournament.settings, {lower_bar: ev.target.value});
        this.setState({tournament: Object.assign({}, this.state.tournament, {settings: newSettings})});
    }
    setUpperBar = (ev) => {
        let newSettings = Object.assign({}, this.state.tournament.settings, {upper_bar: ev.target.value});
        this.setState({tournament: Object.assign({}, this.state.tournament, {settings: newSettings})});
    }
    setPlayersStart = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {players_start: ev.target.value})});
    setMaximumPlayers = (ev) => {
        let newSettings = Object.assign({}, this.state.tournament.settings, {maximum_players: ev.target.value});
        this.setState({tournament: Object.assign({}, this.state.tournament, {settings: newSettings})});
    }
    setAutoStartOnMax = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {auto_start_on_max: ev.target.checked})});
    setFirstPairingMethod = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {first_pairing_method: ev.target.value})});
    setSubsequentPairingMethod = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {subsequent_pairing_method: ev.target.value})});
    setTournamentExclusivity = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {exclusivity: ev.target.value})});

    setNumberOfRounds = (ev) => {
        let newSettings = Object.assign({}, this.state.tournament.settings, {num_rounds: ev.target.value});
        this.setState({tournament: Object.assign({}, this.state.tournament, {settings: newSettings})});
    }
    setGroupSize = (ev) => {
        let newSettings = Object.assign({}, this.state.tournament.settings, {group_size: ev.target.value});
        this.setState({tournament: Object.assign({}, this.state.tournament, {settings: newSettings})});
    }
    setRules = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {rules: ev.target.value})});
    setHandicap = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {handicap: ev.target.value})});
    setBoardSize = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {board_size: ev.target.value})});
    setAnalysisEnabled = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {analysis_enabled: ev.target.checked})});
    setMinRank = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {min_ranking: ev.target.value})});
    setMaxRank = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {max_ranking: ev.target.value})});
    setExcludeProvisionalPlayers = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {exclude_provisional: !ev.target.checked})});
    setDescription = (ev) => this.setState({tournament: Object.assign({}, this.state.tournament, {description: ev.target.value})});
    setTimeControl = (tc) => {
        console.log(tc);
        this.setState({tournament: Object.assign({}, this.state.tournament, {time_control_parameters: tc})});
    }

    render() {{{
        try {
        let editing = this.state.editing;
        let loading = this.state.loading;
        let user = data.get("user");
        let tournament = this.state.tournament;
        let players = this.state.players;
        let rounds = this.state.rounds;
        let selected_round = rounds && rounds.length > this.state.selected_round ? this.state.rounds[this.state.selected_round] : null;
        let raw_selected_round = rounds && rounds.length > this.state.selected_round ? this.state.raw_rounds[this.state.selected_round] : null;
        window["tournament"] = tournament;

        let tournament_time_start_text = "";
        if (tournament.time_start) {
            tournament_time_start_text = moment(new Date(tournament.time_start)).format("LLLL");
            if (tournament.auto_start_on_max) {
                tournament_time_start_text = interpolate(_("Start time: {{time}} or when tournament is full") /* translators: Tournament starts at the designated time or when full */, {time: tournament_time_start_text});
            } else {
                tournament_time_start_text = interpolate(_("Start time: {{time}}") /* translators: Tournament starts at the designated time */, {time: tournament_time_start_text});
            }
        }

        let date_text = "";
        if (tournament.started) {
            if (tournament.ended) {
                let started = new Date(tournament.started).toLocaleDateString();
                let ended = new Date(tournament.ended).toLocaleDateString();
                if (started !== ended) {
                    date_text = started + " - " + ended;
                } else {
                    date_text = new Date(tournament.started).toLocaleString() + " - " + new Date(tournament.ended).toLocaleTimeString();
                }
            } else {
                date_text += new Date(tournament.started).toLocaleString();
            }
        }

        let time_control_text = timeControlDescription(tournament.time_control_parameters);

        let tournament_type_name = TOURNAMENT_TYPE_NAMES[tournament.tournament_type] || "(Unknown)";
        let tournament_rules_name = rulesText(tournament.rules);
        let first_pairing_method_text = TOURNAMENT_PAIRING_METHODS[tournament.first_pairing_method] || "(Unknown)";
        let subsequent_pairing_method_text = TOURNAMENT_PAIRING_METHODS[tournament.subsequent_pairing_method] || "(Unknown)";
        let handicap_text = handicapText(tournament.handicap);
        let rank_restriction_text = rankRestrictionText(tournament.min_ranking, tournament.max_ranking);
        let provisional_players_text = tournament.exclude_provisional ? _("Not allowed") : _("Allowed");
        let analysis_mode_text = tournament.analysis_enabled ? _("Allowed") : _("Not allowed");

        let min_bar = "";
        let max_bar = "";
        let maximum_players = 0;
        let num_rounds = 0;
        let group_size = 0;
        try {
            min_bar = find_rank_short_string(tournament.settings.lower_bar);
            max_bar = find_rank_short_string(tournament.settings.upper_bar);
        } catch (e) { }
        try { maximum_players = parseInt(tournament.settings.maximum_players); } catch (e) { console.error(e); }
        try { num_rounds = parseInt(tournament.settings.num_rounds); } catch (e) { }
        try { group_size = parseInt(tournament.settings.group_size); } catch (e) { }

        let tournament_exclusivity = "";
        switch (tournament.exclusivity) {
            case "open": tournament_exclusivity = pgettext("Open tournament", "Open"); break;
            case "group": tournament_exclusivity = pgettext("Group tournament", "Members only"); break;
            case "invite": tournament_exclusivity = pgettext("Group tournament", "Invite only"); break;
        }

        let is_tournament_moderator = user.is.tournament_moderator || tournament.director.id === user.id;


        /* TODO */
        //let is_joined = user && (user.id in players) && !players[global_user.id].disqualified && !players[global_user.id].resigned && !players[global_user.id].eliminated;
        //let is_joined = false;
        let can_join = true;
        let cant_join_reason = "";

        if (!is_registered(user)) {
            can_join = false;
            cant_join_reason = _("You must sign in to join this tournament.");
        } else if (tournament.exclusivity === "group" && !tournament.player_is_member_of_group) {
            can_join = false;
            cant_join_reason = _("You must be a member of the group to join this tournament");
        } else if (!tournament.is_open || tournament.exclusivity === "invite") {
            can_join = false;
            cant_join_reason = _("This is a closed tournament, you must be invited to join.");
        } else if (tournament.exclude_provisional && user.is.provisional) {
            can_join = false;
            cant_join_reason = _("This tournament is closed to provisional players. You need to establish your rank by playing ranked games before you can join this tournament.");
        }

        let time_per_move = computeAverageMoveTime(tournament.time_control_parameters);

        let use_elimination_trees = false;
        if (tournament.tournament_type === "elimination" || tournament.tournament_type === "double_elimination") {
            use_elimination_trees = true;
            setTimeout(() => this.updateEliminationTrees(), 1);
        }


        return (
        <div className="Tournament">
            <UIPush event="players-updated" channel={`tournament-${this.state.tournament_id}`} action={this.reloadTournament}/>
            <UIPush event="reload-tournament" channel={`tournament-${this.state.tournament_id}`} action={this.reloadTournament}/>

            <div className="top-details">{/* {{{ */}
                <div >
                    {!editing
                        ? <h2>{tournament.name}</h2>
                        : <input ref="tournament_name" className="fill big" value={tournament.name} placeholder={_("Tournament Name")} onChange={this.setTournamentName} />
                    }
                    {!editing && !loading &&
                        <div>
                            {((is_tournament_moderator
                               && !tournament.started && !tournament.start_waiting) || null) &&
                                <button className="xs" onClick={this.startEditing}>{_("Edit Tournament")}</button>
                            }

                            {(tournament.started == null && is_tournament_moderator || null) &&
                                <button className="danger xs" onClick={this.startTournament}>{_("Start Tournament Now")}</button>
                            }
                            {(tournament.started == null && is_tournament_moderator || null) &&
                                <button className="reject xs" onClick={this.deleteTournament}>{_("Delete Tournament")}</button>
                            }

                            {(tournament.started && !tournament.ended && this.state.is_joined || null) &&
                                <button className="reject xs" onClick={this.resign}>{_("Resign from Tournament")}</button>
                            }
                        </div>
                    }


                    {!loading && (!tournament.started || null) && <h4>{tournament_time_start_text}</h4>}
                    {!editing && !loading && <h4>{date_text}</h4>}
                    {editing &&
                          <div className="form-group" style={{marginTop: "1rem"}}>
                             <label className="control-label" htmlFor="start-time">
                               <span>{_("Start time") /* translators: When the tournament starts */}: </span>
                             </label>
                             <div className="controls">
                                 <div className="checkbox">
                                     <Datetime onChange={this.setStartTime} value={new Date(tournament.time_start)}/>
                                 </div>
                             </div>
                          </div>
                    }
                    {!editing && !loading && <p><b>{_("Clock:")}</b> {time_control_text}</p>}
                    {editing &&
                        <TimeControlPicker ref="time_control_picker" value={tournament.time_control_parameters} onChange={this.setTimeControl} />
                    }
                    {!editing
                        ? <Markdown source={tournament.description}/>
                        : <textarea ref="description" rows={7} className="fill" value={tournament.description} placeholder={_("Description")} onChange={this.setDescription} />
                    }
                </div>
                <div className="top-right-details">
                    <table>
                        <tbody>
                        {(tournament.group || null) &&
                            <tr>
                                <th>{_("Group")}</th>
                                <td><Link to={`/group/${tournament.group.id}`}>{tournament.group.name}</Link></td>
                            </tr>
                        }
                        {(tournament.group || null) &&
                            <tr>
                                <th>{_("Tournament Director")}</th>
                                <td><Player user={tournament.director} /></td>
                            </tr>
                        }

                        <tr>
                            <th >{_("Exclusivity")}</th>
                            <td >
                            {!editing
                                ? tournament_exclusivity
                                : <select className="tournament-dropdown form-control" value={tournament.exclusivity} onChange={this.setTournamentExclusivity}>
                                    <option value="open">{pgettext("Open tournament", "Open")}</option>
                                    <option value="group">{pgettext("Group tournament", "Members only")}</option>
                                    <option value="invite">{pgettext("Group tournament", "Invite only")}</option>
                                  </select>
                            }
                            </td>
                        </tr>


                        <tr>
                            <th >{_("Tournament Type")}</th>
                            <td >
                            {!editing
                                ? tournament_type_name
                                : <select id="tournament-type"
                                        value={this.state.tournament.tournament_type}
                                        onChange={this.setTournamentType}
                                        disabled={this.state.tournament.id > 0}
                                        >
                                    <option value="mcmahon">{_("McMahon")}</option>
                                    <option value="s_mcmahon">{_("Simultaneous McMahon")}</option>
                                    <option value="roundrobin">{_("Round Robin")}</option>
                                    <option value="swiss">{_("Swiss")}</option>
                                    <option value="elimination">{_("Single Elimination")}</option>
                                    <option value="double_elimination">{_("Double Elimination")}</option>
                                 </select>
                            }
                            </td>
                        </tr>

                        {(tournament.tournament_type === "mcmahon" || tournament.tournament_type === "s_mcmahon" || null) &&
                            <tr>
                                <th >{_("McMahon Bars")}</th>
                                <td >
                                {!editing
                                    ? <span>{min_bar} - {max_bar}</span>
                                    : <span>
                                        <select className="rank-selection" value={tournament.settings.lower_bar} onChange={this.setLowerBar}>
                                            {ranks.map((r, idx) => (
                                                <option key={idx} value={rank_long_string(r)}>{rank_long_string(r)}</option>
                                            ))}
                                        </select>
                                        -
                                        <select className="rank-selection" value={tournament.settings.upper_bar} onChange={this.setUpperBar}>
                                            {ranks.map((r, idx) => (
                                                <option key={idx} value={rank_long_string(r)}>{rank_long_string(r)}</option>
                                            ))}
                                        </select>
                                      </span>
                                }
                                </td>
                            </tr>
                        }

                        <tr>
                            <th >{_("Players")}</th>
                            <td>
                                {!editing
                                    ? <span>
                                         {tournament.players_start}
                                         {((tournament.settings.maximum_players && tournament.settings.maximum_players > tournament.players_start)) ? "-" + tournament.settings.maximum_players : "+"}
                                      </span>
                                    : <span>
                                         <input ref="players_start" type="number" value={tournament.players_start} onChange={this.setPlayersStart} />
                                         -
                                         <input ref="max_players" type="number" value={tournament.settings.maximum_players} onChange={this.setMaximumPlayers} />
                                      </span>
                                }
                            </td>
                        </tr>
                        <tr>
                            <th><label htmlFor="autostart">{_("Start when full")}</label></th>
                            <td>
                                {!editing
                                    ? <span>{tournament.auto_start_on_max ? _("Yes") : _("No")}</span>
                                    : <input type="checkbox" id="autostart" checked={tournament.auto_start_on_max} onChange={this.setAutoStartOnMax} />
                                }
                            </td>
                        </tr>
                        {(tournament.tournament_type !== "roundrobin") &&
                            <tr>
                                <th >{_("Initial Pairing Method")}</th>
                                <td >
                                    {!editing
                                        ? <span>{first_pairing_method_text}</span>
                                        : <select
                                            value={tournament.first_pairing_method}
                                            onChange={this.setFirstPairingMethod}
                                            >
                                             <option value="random">{pgettext("Tournament type", "Random")}</option>
                                             <option value="slaughter">{pgettext("Tournament type", "Slaughter")}</option>
                                             <option value="slide">{pgettext("Tournament type", "Slide")}</option>
                                             <option value="strength">{pgettext("Tournament type", "Strength")}</option>
                                          </select>


                                    }
                                </td>
                            </tr>
                        }
                        {(tournament.tournament_type !== "roundrobin") &&
                            <tr>
                                <th >{_("Subsequent Pairing Method")}</th>
                                <td >
                                    {!editing
                                        ? <span>{subsequent_pairing_method_text}</span>
                                        : <select
                                            value={tournament.subsequent_pairing_method}
                                            onChange={this.setSubsequentPairingMethod}
                                            >
                                             <option value="random">{pgettext("Tournament type", "Random")}</option>
                                             <option value="slaughter">{pgettext("Tournament type", "Slaughter")}</option>
                                             <option value="slide">{pgettext("Tournament type", "Slide")}</option>
                                             <option value="strength">{pgettext("Tournament type", "Strength")}</option>
                                          </select>
                                    }
                                </td>
                            </tr>
                        }
                        {(tournament.tournament_type === "mcmahon" || tournament.tournament_type === "s_mcmahon" || null) &&
                            <tr>
                                 <th>{_("Number of Rounds")}</th>
                                 <td>
                                    {!editing
                                        ? num_rounds
                                        : <select value={tournament.settings.num_rounds} onChange={this.setNumberOfRounds}>
                                            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((v) => (
                                                <option key={v} value={v}>{v}</option>
                                            ))}
                                          </select>
                                    }
                                </td>
                            </tr>
                        }
                        {(tournament.tournament_type === "s_mcmahon" || null) &&
                            <tr>
                                <th>{_("Minimum Group Size")}</th>
                                <td>
                                    {!editing
                                        ? group_size
                                        : <select value={tournament.settings.group_size} onChange={this.setGroupSize}>
                                            {[3, 4, 5].map((v) => (
                                                <option key={v} value={v}>{v}</option>
                                            ))}
                                          </select>
                                    }
                                </td>
                            </tr>
                        }
                        <tr>
                            <th>{_("Rules")}</th>
                            <td>
                                {!editing
                                    ? tournament_rules_name
                                    : <select value={tournament.rules} onChange={this.setRules}>
                                        <option value="aga">{_("AGA")}</option>
                                        <option value="japanese">{_("Japanese")}</option>
                                        <option value="chinese">{_("Chinese")}</option>
                                        <option value="korean">{_("Korean")}</option>
                                        <option value="ing">{_("Ing SST")}</option>
                                        <option value="nz">{_("New Zealand")}</option>
                                      </select>
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Board Size")}</th>
                            <td>
                                {!editing
                                    ? `${tournament.board_size}x${tournament.board_size}`
                                    : <select value={tournament.board_size} onChange={this.setBoardSize}>
                                        <option value="19">19x19</option>
                                        <option value="13">13x13</option>
                                        <option value="9">9x9</option>
                                      </select>
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>{_("Handicap")}</th>
                            <td>
                                {!editing
                                    ? handicap_text
                                    : <select value={tournament.handicap} onChange={this.setHandicap}>
                                        <option value="0">{_("None")}</option>
                                        <option value="-1">{_("Automatic")}</option>
                                      </select>
                                }
                            </td>
                        </tr>
                        <tr>
                            <th><label htmlFor="analysis">{_("Conditional Moves & Analysis")}</label></th>
                            <td>
                                {!editing
                                    ? analysis_mode_text
                                    : <input type="checkbox" id="analysis" checked={tournament.analysis_enabled} onChange={this.setAnalysisEnabled} />
                                }
                            </td>

                        </tr>

                        <tr>
                            <th>{_("Rank Restriction")}</th>
                            <td>
                                {!editing
                                    ? <span>{rank_restriction_text}</span>
                                    : <span>
                                        <select className="rank-selection" value={tournament.min_ranking} onChange={this.setMinRank}>
                                            {ranks.map((r, idx) => (
                                                <option key={idx} value={rank_long_string(r)}>{rank_long_string(r)}</option>
                                            ))}
                                        </select>
                                        -
                                        <select className="rank-selection" value={tournament.max_ranking} onChange={this.setMaxRank}>
                                            {ranks.map((r, idx) => (
                                                <option key={idx} value={rank_long_string(r)}>{rank_long_string(r)}</option>
                                            ))}
                                        </select>
                                      </span>
                                }
                            </td>
                        </tr>
                        <tr>
                            <th><label htmlFor="provisional">{_("Provisional Players")}</label></th>
                            <td>
                                {!editing
                                    ? provisional_players_text
                                    : <input type="checkbox" id="provisional" checked={!tournament.exclude_provisional} onChange={this.setExcludeProvisionalPlayers} />
                                }
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

            </div>
            {/* }}} */}

            {editing &&
                <div style={{textAlign: "center", "marginTop": "3rem"}}>
                    <button className="primary" onClick={this.save}>{
                        tournament.id === 0 ? _("Create Tournament") : _("Save Tournament")
                    }</button>
                </div>
            }



            {!loading && !tournament.started && /* {{{ */
                <div className={"bottom-details not-started"}>
                    <EmbeddedChat channel={`tournament-${this.state.tournament_id}`} updateTitle={false} />

                    {(!tournament.start_waiting || null) &&
                        <div className="signup-area" style={{textAlign: "center"}}>
                            {(tournament.time_start || null) &&
                                <h3>{interpolate(_("Tournament starts {{relative_time_from_now}}"),
                                                 {"relative_time_from_now": fromNow(tournament.time_start)})}
                                 </h3>
                            }

                            {this.state.is_joined != null &&
                                <p style={{marginTop: "6em"}}>
                                    {(!this.state.is_joined && can_join || null) &&
                                        <button className="btn raise btn-primary" onClick={this.joinTournament}>{_("Join this tournament!")}</button>
                                    }
                                    {(!this.state.is_joined && !can_join || null) &&
                                        <div>{cant_join_reason}</div>
                                    }
                                    {(this.state.is_joined || null) &&
                                        <button className="btn raise btn-danger" onClick={this.partTournament}>{_("Drop out from tournament")}</button>
                                    }
                                </p>
                            }

                            {(this.state.is_joined && time_per_move < 3600 || null) &&
                                <h4 style={{marginTop: "3em"}}>
                                    {_("You must be on this page when the tournament begins or you will be removed from the tournament")}
                                </h4>
                            }
                        </div>
                    }
                    {(tournament.start_waiting || null) &&
                        <div className="signup-area" style={{textAlign: "center"}}>
                            <p style={{marginTop: "6em"}}>
                                <span>{_("Tournament is starting")}</span>
                            </p>
                        </div>
                    }
                    <div className="player-list">
                        {(tournament.exclusivity !== "invite" || is_tournament_moderator || null) &&
                            <div className="invite-input">
                                <div className="input-group" id="tournament-invite-user-container" >
                                    <PlayerAutocomplete onComplete={this.setUserToInvite} />
                                    <button className="btn primary xs" type="button"
                                        disabled={this.state.user_to_invite == null} onClick={this.inviteUser}>{_("Invite")}</button>
                                </div>
                                <div className="bold">{this.state.invite_result}</div>
                                <div id="tournament-invite-result"></div>
                            </div>
                        }
                        {(this.state.sorted_players.length > 0 || null) &&
                            <Card>
                                {this.state.sorted_players.map((player, idx) => (
                                    <div key={player.id}>
                                        <Player icon user={player} />
                                    </div>
                                ))}
                            </Card>
                        }
                    </div>
                </div>
            }
            {/* }}} */}
            {!loading && tournament.started && /* {{{ */
                <div className="bottom-details">
                    <EmbeddedChat channel={`tournament-${this.state.tournament_id}`} updateTitle={false} />

                    <div className="results">
                    {this.state.use_elimination_trees ? <PersistentElement elt={this.elimination_tree_container[0]}/> :
                        <div>

                            {this.state.rounds.length > 1 &&
                                <Steps
                                    completed={this.state.rounds.length}
                                    total={this.state.rounds.length}
                                    selected={this.state.selected_round}
                                    onChange={this.setSelectedRound}
                                    />
                            }

                            {(!selected_round && tournament.group.hide_details) &&
                                <div className='hide-details-note'>
                                    {_("This tournament is part of a group that hides group activity and details, as such you must be a member of the group to see the tournament results.")}
                                </div>
                            }


                            {/* Round robin / simul style groups */}
                            {(selected_round && selected_round.groupify || null) &&
                                <div>
                                    {selected_round.groups.map((group, idx) => (
                                        <div key={idx} className="round-group">
                                            <table>
                                                <tbody>
                                                    <tr>
                                                        {(tournament.ended || null) && <th className="rank">{_("Rank")}</th>}
                                                        <th>{_("Player")}</th>
                                                        {group.players.map((opponent, idx) => (
                                                            <th key={idx} className="rotated-title">
                                                                {(opponent.player || null) && <span className="rotated"><Player user={opponent.player} icon></Player></span>}
                                                            </th>
                                                        ))}
                                                        <th className="rotated-title"><span className="rotated">{_("Points")}</span></th>
                                                        {(tournament.ended || null) && <th className="rotated-title"><span className="rotated">&Sigma; {_("Opponent Scores")}</span></th>}
                                                        {(tournament.ended || null) && <th className="rotated-title"><span className="rotated">&Sigma; {_("Defeated Scores")}</span></th>}
                                                        <th></th>
                                                    </tr>
                                                    {group.players.map((player, idx) => {
                                                        player = player.player;
                                                        return (
                                                        <tr key={idx} >
                                                            {(tournament.ended || null) && <td className="rank">{player.rank}</td>}

                                                            <th className="player"><Player user={player} icon /></th>
                                                            {group.players.map((opponent, idx) => (
                                                                <td key={idx} className={"result " + selected_round.colors[player.id + "x" + opponent.id]}>
                                                                    <Link to={`/game/${selected_round.game_ids[player.id + "x" + opponent.id]}`}>
                                                                        {selected_round.results[player.id + "x" + opponent.id]}
                                                                    </Link>
                                                                </td>
                                                            ))}
                                                            <td className="points" >{player.points}</td>
                                                            {(tournament.ended || null) && <td className="points" >{player.sos}</td>}
                                                            {(tournament.ended || null) && <td className="points" >{player.sodos}</td>}
                                                            <td className="notes" >{player.notes}</td>
                                                        </tr>
                                                        ); }
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            }


                            {/* Pair matches */}
                            {((selected_round && !selected_round.groupify && tournament.tournament_type !== "s_title") || null) &&
                                <div className="round-group">
                                    <table>
                                        <tbody>
                                        <tr>
                                            {(tournament.ended || null) && <th>{_("Rank")}</th>}
                                            <th>{_("Player")}</th>
                                            <th>{_("Opponent")}</th>
                                            <th>{_("Result")}</th>
                                            <th>{_("Points")}</th>
                                            {(tournament.ended || null) && <th className="rotated-title"><span className="rotated">&Sigma; {_("Opponent Scores")}</span></th>}
                                            {(tournament.ended || null) && <th className="rotated-title"><span className="rotated">&Sigma; {_("Defeated Scores")}</span></th>}
                                            <th></th>
                                        </tr>
                                        {selected_round.matches.map((m, idx) => {
                                            let pxo = (m.player && m.opponent && (`${m.player.id}x${m.opponent.id}`)) || "error-invalid-player-or-opponent";
                                            if (pxo === "error-invalid-player-or-opponent") {
                                                console.error("invalid player or opponent", m, selected_round.matches, selected_round);
                                            }

                                            return (
                                            <tr key={idx} >
                                                {(tournament.ended || null) && <td className="rank">{m.player.rank}</td>}
                                                {(m.player || null) && <td className="player"><Player user={m.player} icon/></td>}
                                                {(m.opponent || null) && <td className="player"><Player user={m.opponent} icon/></td>}

                                                <td className={"result " + selected_round.colors[pxo]}>
                                                    <Link to={`/game/${selected_round.game_ids[pxo]}`}>
                                                        {selected_round.results[pxo]}
                                                    </Link>
                                                </td>

                                                <td className="points">{m.player.points}</td>
                                                {(tournament.ended || null) && <td className="points">{m.player.sos}</td>}
                                                {(tournament.ended || null) && <td className="points">{m.player.sodos}</td>}
                                                <td className="notes">{m.player.notes}</td>
                                            </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            }

                            {/* Case for busted tournaments that have random matches that they shouldn't have but do */}
                            {((selected_round && selected_round.broken_list.length) || null) &&
                                <div className="round-group">
                                    <h2>{_("Other Matches")}</h2>
                                    <table>
                                        <tbody>
                                        <tr>
                                            {(tournament.ended || null) && <th>{_("Rank")}</th>}
                                            <th>{_("Player")}</th>
                                            <th>{_("Opponent")}</th>
                                            <th>{_("Result")}</th>
                                            <th>{_("Points")}</th>
                                            {(tournament.ended || null) && <th className="rotated-title"><span className="rotated">&Sigma; {_("Opponent Scores")}</span></th>}
                                            {(tournament.ended || null) && <th className="rotated-title"><span className="rotated">&Sigma; {_("Defeated Scores")}</span></th>}
                                            <th></th>
                                        </tr>
                                        {selected_round.broken_list.map((m, idx) => {
                                            return (
                                            <tr key={idx} >
                                                {(tournament.ended || null) && <td className="rank">{m.player.rank}</td>}
                                                {(m.player || null) && <td className="player"><Player user={m.player} icon/></td>}
                                                {(m.opponent || null) && <td className="player"><Player user={m.opponent} icon/></td>}

                                                <td className={"result " + selected_round.colors[m.player.id + "x" + m.opponent.id]}>
                                                    <Link to={`/game/${selected_round.game_ids[m.player.id + "x" + m.opponent.id]}`}>
                                                        {selected_round.results[m.player.id + "x" + m.opponent.id]}
                                                    </Link>
                                                </td>

                                                <td className="points">{m.player.points}</td>
                                                {(tournament.ended || null) && <td className="points">{m.player.sos}</td>}
                                                {(tournament.ended || null) && <td className="points">{m.player.sodos}</td>}
                                                <td className="notes">{m.player.notes}</td>
                                            </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            }


                            {/* Byes */}
                            {((selected_round && selected_round.byes.length) || null) &&
                                <div className="round-group">
                                    <h2>{_("Byes") /*translators: Tournament byes */}</h2>
                                    <table>
                                        <tbody>
                                        <tr>
                                            {(tournament.ended || null) && <th>{_("Rank")}</th>}
                                            <th>{_("Player")}</th>
                                            <th>{_("Points")}</th>
                                            {(tournament.ended || null) && <th className="rotated-title"><span className="rotated">&Sigma; {_("Opponent Scores")}</span></th>}
                                            {(tournament.ended || null) && <th className="rotated-title"><span className="rotated">&Sigma; {_("Defeated Scores")}</span></th>}
                                            <th></th>
                                        </tr>
                                        {selected_round.byes.map((player, idx) => {
                                            return (
                                            <tr key={idx} >
                                                {(tournament.ended || null) && <td className="rank">{player.rank}</td>}
                                                {(player || null) && <td className="player"><Player user={player} icon/></td>}
                                                <td className="points">{player.points}</td>
                                                {(tournament.ended || null) && <td className="points">{player.sos}</td>}
                                                {(tournament.ended || null) && <td className="points">{player.sodos}</td>}
                                                <td className="notes">{player.notes}</td>
                                            </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            }


                            {/* Old title tournaments */}
                            {(tournament.tournament_type === "s_title" || null) &&
                                <div style={{textAlign: "center"}}>
                                    <div style={{display: "inline-block"}}>
                                        <h3>
                                            {
                                                (rounds[0].matches[0].player || null) && <Player user={rounds[0].matches[0].player} icon/>
                                            } vs. {
                                                (rounds[0].matches[0].opponent || null) && <Player user={rounds[0].matches[0].opponent} icon/>
                                            }
                                        </h3>

                                        {raw_selected_round.matches.map((m, idx) => (
                                            <MiniGoban key={idx}
                                                id={m.gameid}
                                                width={tournament.board_size}
                                                height={tournament.board_size}
                                                black={players[m.black]}
                                                white={players[m.white]}
                                                />
                                        ))}
                                    </div>
                                </div>
                            }


                        </div>
                    }
                    </div>
                </div>
            }
            {/* }}} */}

        </div>
        );

        } catch (e) {
            setTimeout(() => {throw e; }, 1);
            return null;
        }
    }}}

    kick(player_id: number) {{{
        let user = player_cache.lookup(player_id);

        swal({
            text: interpolate(_("Really kick {{user}} from the tournament?"), {"user": user.username}),
            showCancelButton: true,
            focusCancel: true
        })
        .then((val) => {
            post(`tournaments/${this.state.tournament.id}/players`, {
                "delete": true,
                "player_id": user.id,
            })
            .then(ignore)
            .catch(errorAlerter);
        })
        .catch(ignore);

        close_all_popovers();
    }}}
    adjustPoints(player_id: number) {{{
        let user = player_cache.lookup(player_id);

        swal({
            input: "number",
            text: interpolate(pgettext("How may tournament points to adjust a user by", "Adjustment for %s"), [user.username]),
            showCancelButton: true,
            focusCancel: true
        })
        .then((val) => {
            let v = parseInt(val);
            if (!v) {
                return;
            }

            let adjustments = {};
            adjustments[user.id] = v;

            put(`tournaments/${this.state.tournament.id}/players`, {
                adjust: adjustments
            })
            .then(ignore)
            .catch(errorAlerter);
        })
        .catch(ignore);
        close_all_popovers();
    }}}
    disqualify(player_id: number) {{{
        let user = player_cache.lookup(player_id);

        swal({
            text: interpolate(_("Really disqualify {{user}}?"), {"user": user.username}),
            showCancelButton: true,
            focusCancel: true
        })
        .then((val) => {
            put(`tournaments/${this.state.tournament.id}/players`, {
                disqualify: user.id,
            })
            .then(ignore)
            .catch(errorAlerter);
        })
        .catch(ignore);

        close_all_popovers();
    }}}


    renderExtraPlayerActions = (player_id: number, user: any) => {{{
        let user = data.get("user");
        if (!(user.is.tournament_moderator || (this.state.tournament.director && this.state.tournament.director.id === user.id))) {
            return null;
        }

        if (!this.state.tournament.started) {
            return (
                <div className="actions">
                    <button className="reject xs" onClick={() => this.kick(player_id)}>{_("Kick")}</button>
                </div>
            );
        }
        else if (!this.state.tournament.ended) {
            return (
                <div className="actions">
                    <button className="primary xs" onClick={() => this.adjustPoints(player_id)}>{_("Adjust Points")}</button>
                    <button className="reject xs" onClick={() => this.disqualify(player_id)}>{_("Disqualify")}</button>
                </div>
            );
        }
    }}}

}



export function rankRestrictionText(min_ranking, max_ranking) {{{
    if (min_ranking <= 0) {
        if (max_ranking >= 36) {
            return _("None");
        } else {
            return interpolate(pgettext("ranks restriction: '<rank> and below'", "%s and below"), [find_rank_long_string(max_ranking)]);
        }
    } else {
        if (max_ranking >= 36) {
            return interpolate(pgettext("ranks restriction: '<rank> and above'", "%s and above"), [find_rank_long_string(min_ranking)]);
        } else {
            return interpolate(pgettext("ranks restriction: '<rank> - <rank>'", "%s - %s"), [find_rank_long_string(min_ranking), find_rank_long_string(max_ranking)]);
        }
    }
}}}
export function shortRankRestrictionText(min_ranking, max_ranking) {{{
    if (min_ranking <= 0) {
        if (max_ranking >= 36) {
            return _("All");
        } else {
            return interpolate(pgettext("ranks restriction: '<rank> and below'", "%s"), [find_rank_short_string(max_ranking)]);
        }
    } else {
        if (max_ranking >= 36) {
            return interpolate(pgettext("ranks restriction: '<rank> and above'", "%s+"), [find_rank_short_string(min_ranking)]);
        } else {
            return interpolate(pgettext("ranks restriction: '<rank> - <rank>'", "%s-%s"), [find_rank_short_string(min_ranking), find_rank_short_string(max_ranking)]);
        }
    }
}}}
export const TOURNAMENT_TYPE_NAMES = { /* {{{ */
    "s_mcmahon": _("Simultaneous McMahon"),
    "mcmahon": _("McMahon"),
    "roundrobin": _("Round Robin"),
    "s_elimination": _("Simultaneous Eliminination"),
    "s_title": _("Title Tournament"),
    "swiss": _("Swiss"),
    "elimination": _("Single Eliminination"),
    "double_elimination": _("Double Eliminination"),
}; /* }}} */
export const  TOURNAMENT_PAIRING_METHODS = { /* {{{ */
    "random": pgettext("Tournament type", "Random"),
    "slaughter": pgettext("Tournament type", "Slaughter"),
    "strength": pgettext("Tournament type", "Strength"),
    "slide": pgettext("Tournament type", "Slide"),
}; /* }}} */

function fromNow(t) {
    let d = new Date(t).getTime();
    if (d - (Date.now()) < 0) {
        return pgettext("Tournament begins very shortly", "very shortly");
    }
    return moment(d).fromNow();
}
