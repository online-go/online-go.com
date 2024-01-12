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

/* cspell: words gameid tourn */

import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { LoadingPage } from "Loading";
import { Link, useParams } from "react-router-dom";
import { browserHistory } from "ogsHistory";
import { _, pgettext, interpolate } from "translate";
import { abort_requests_in_flight, del, put, post, get } from "requests";
import { ignore, errorAlerter, rulesText, dup } from "misc";
import { bounded_rank, longRankString, rankString, amateurRanks } from "rank_utils";
import { handicapText } from "GameAcceptModal";
import { TimeControl, timeControlDescription } from "TimeControl";
import { Markdown } from "Markdown";
import { Player, setExtraActionCallback } from "Player";
import * as moment from "moment";
import Datetime from "react-datetime";
import { UIPush } from "UIPush";
import { Card } from "material";
import { EmbeddedChatCard } from "Chat";
import * as data from "data";
import { PersistentElement } from "PersistentElement";
import { PlayerAutocomplete } from "PlayerAutocomplete";
import { MiniGoban } from "MiniGoban";
import * as player_cache from "player_cache";
import { Steps } from "Steps";
import { TimeControlPicker } from "TimeControl";
import { close_all_popovers } from "popover";
import { computeAverageMoveTime, GoEngineRules } from "goban";
import { openMergeReportModal } from "MergeReportModal";
import * as d3 from "d3";
import Dropzone from "react-dropzone";
import { alert } from "swal_config";
import { useUser } from "hooks";
import { PlayerCacheEntry } from "player_cache";

let log_spam_debounce: any;

const ranks = amateurRanks();

interface TournamentPlayer extends PlayerCacheEntry {
    rank: number;
    username: string;
    points: number;
    sos: number;
    sodos: number;
    net_points: number;
    notes: string;
    disqualified: boolean;
    resigned: boolean;
    eliminated: boolean;
}

interface TournamentMatch {
    [k: string]: any;
}

interface TournamentRecord {
    player_id: number;
    match: TournamentMatch;
}

interface TournamentRound {
    [k: string]: any;
}

interface TournamentGroup {
    [k: string]: any;
}

interface TournamentPlayers {
    [k: string]: TournamentPlayer;
}

interface TournamentInterface {
    id: number;
    name: string;
    director: player_cache.PlayerCacheEntry;
    time_start: string;

    board_size: number;
    rules: GoEngineRules;
    description: string;
    handicap: string;
    time_control_parameters: TimeControl;
    tournament_type: string;
    min_ranking: number | string;
    max_ranking: number | string;
    analysis_enabled: boolean;
    exclude_provisional: boolean;
    auto_start_on_max: boolean;
    exclusivity: string;
    first_pairing_method: string;
    subsequent_pairing_method: string;
    players_start: number;
    settings: {
        lower_bar: string;
        upper_bar: string;
        num_rounds: string;
        group_size: string;
        maximum_players: number | string;
    };
    lead_time_seconds: number;
    base_points: number;
    started?: string;
    ended?: string;
    player_is_member_of_group?: boolean;
    is_open?: boolean;
    can_administer?: boolean;
    start_waiting?: boolean;
    group?: any;
    opengotha_standings?: boolean;
}

//class _Tournament extends React.PureComponent<TournamentProperties, TournamentState> {
export function Tournament(): JSX.Element {
    const user = useUser();
    const params = useParams<{ tournament_id: string; group_id: string }>();
    const tournament_id = parseInt(params.tournament_id ?? "0");
    const new_tournament_group_id = parseInt(params.group_id ?? "0");

    const ref_tournament_name = React.useRef<HTMLInputElement>(null);
    const ref_description = React.useRef<HTMLTextAreaElement>(null);
    const ref_max_players = React.useRef<HTMLInputElement>(null);

    const elimination_tree_container = React.useRef<HTMLDivElement>(document.createElement("div"));

    const elimination_tree = React.useRef(
        document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    );

    const [, _refresh] = React.useState(0);
    const refresh = () => _refresh(Math.random());
    const [loading, setLoading] = React.useState(true);
    const [info_loaded, setInfoLoaded] = React.useState(false);
    const tournament_ref = React.useRef<TournamentInterface>({
        id: tournament_id,
        name: "",
        // TODO: replace {} with something that makes type sense. -bpj
        director: tournament_id === 0 ? user : ({} as any),
        time_start: moment(new Date()).add(1, "hour").startOf("hour").format(),

        board_size: 19,
        rules: "japanese",
        description: "",
        handicap: "0",
        time_control_parameters: {
            system: "fischer",
            speed: "correspondence",
            initial_time: 3 * 86400,
            max_time: 7 * 86400,
            time_increment: 86400,
        } as TimeControl,
        tournament_type: "mcmahon",
        min_ranking: "5",
        max_ranking: "38",
        analysis_enabled: true,
        exclude_provisional: true,
        auto_start_on_max: false,
        //scheduled_rounds: true,
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
    });
    const [rounds, setRounds] = React.useState<any[]>([]);
    const [editing, setEditing] = React.useState(tournament_id === 0);
    const [raw_rounds, setRawRounds] = React.useState<any[]>([]);
    const [selected_round_idx, setSelectedRoundIdx] = React.useState<
        number | "standings" | "roster"
    >(0);
    const [sorted_players, setSortedPlayers] = React.useState<any[]>([]);
    const [players, setPlayers] = React.useState<{ [id: string]: TournamentPlayer }>({});
    const [is_joined, setIsJoined] = React.useState(false);
    const [invite_result, setInviteResult] = React.useState<string | null>(null);
    const [use_elimination_trees, setUseEliminationTrees] = React.useState(false);
    const [user_to_invite, setUserToInvite] = React.useState<PlayerCacheEntry | null>(null);

    //const tournament = tournament_ref.current;

    // This sets up our manual elimination tree containers, this is a pretty
    // legacy way of doing things
    React.useEffect(() => {
        elimination_tree_container.current.className = "tournament-elimination-container";
        elimination_tree_container.current.append(elimination_tree.current);
    }, []);

    // this is so anoek (user id 1) can quickly test tournaments
    React.useEffect(() => {
        if (user.id === 1 && tournament_id === 0) {
            tournament_ref.current.name = "Culture: join 4";
            tournament_ref.current.time_start = moment(new Date()).add(1, "minute").format();
            tournament_ref.current.rules = "japanese";
            tournament_ref.current.description =
                /* cspell: disable-next-line */
                "Aliquam dolor blanditiis voluptatem et harum officiis atque. Eum eos aut consequatur quis sunt. Minima nisi aut ratione. Consequatur deleniti vitae minima exercitationem illum debitis debitis sunt. Culpa officia voluptates quos sit. Reprehenderit fuga ad quo ipsam assumenda nihil quos qui.";
            tournament_ref.current.tournament_type = "elimination";
            tournament_ref.current.first_pairing_method = "slide";
            tournament_ref.current.subsequent_pairing_method = "slaughter";
            // tournament_ref.current.tournament_type = "opengotha";
            // tournament_ref.current.first_pairing_method = "opengotha";
            // tournament_ref.current.subsequent_pairing_method = "opengotha";
            refresh();
        }
    }, [tournament_id]);

    React.useEffect(() => {
        setExtraActionCallback(renderExtraPlayerActions);
        window.document.title = _("Tournament");
        if (tournament_id) {
            resolve();
        }
        if (new_tournament_group_id) {
            get(`groups/${new_tournament_group_id}`)
                .then((group) => {
                    tournament_ref.current.group = group;
                    refresh();
                })
                .catch(errorAlerter);
        }

        return () => {
            abort_requests();
            setExtraActionCallback(null);
        };
    }, [tournament_id]);

    const abort_requests = () => {
        abort_requests_in_flight(`tournaments/${tournament_id}`);
        abort_requests_in_flight(`tournaments/${tournament_id}/rounds`);
        abort_requests_in_flight(`tournaments/${tournament_id}/players/all`);
    };
    const resolve = () => {
        abort_requests();

        const tournament_info_promise = get(`tournaments/${tournament_id}`).then((t) => {
            tournament_ref.current = t;
            setInfoLoaded(true);
            refresh();
            return t;
        });

        Promise.all([
            tournament_info_promise,
            get(`tournaments/${tournament_id}/rounds`),
            refreshPlayerList(),
        ])
            .then((res) => {
                const tournament = res[0];
                tournament_ref.current = tournament;
                let rounds = res[1];
                const raw_rounds = res[1];
                const players = res[2];

                window.document.title = tournament.name;

                if (tournament.tournament_type !== "opengotha") {
                    while (rounds.length && rounds[rounds.length - 1].matches.length === 0) {
                        rounds.pop(); /* account for server bugs that can create empty last rounds */
                    }
                }

                let use_elimination_trees = false;
                if (
                    tournament.tournament_type === "elimination" ||
                    tournament.tournament_type === "double_elimination"
                ) {
                    use_elimination_trees = true;
                    setTimeout(() => updateEliminationTrees(), 1);
                } else {
                    rounds = rounds.map((r: any) => groupify(r, players));
                    linkPlayersToRoundMatches(rounds, players);
                }

                setLoading(false);
                tournament_ref.current = { ...tournament_ref.current, ...tournament };
                setRawRounds(raw_rounds);
                setRounds(rounds);
                setSelectedRound(
                    tournament.ended &&
                        tournament.tournament_type === "opengotha" &&
                        tournament.opengotha_standings
                        ? "standings"
                        : (tournament.settings.active_round || 1) - 1,
                );
                setUseEliminationTrees(use_elimination_trees);
            })
            .catch(errorAlerter);
    };
    const reloadTournament = () => {
        resolve();
    };
    const refreshPlayerList = () => {
        const ret = get(`tournaments/${tournament_id}/players/all`);

        ret.then((players) => {
            for (const id in players) {
                const p = players[id];
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

            const sorted = Object.keys(players)
                .map((id) => players[id])
                .sort(compareUserRank);

            setSortedPlayers(sorted);
            setPlayers(players);
            setIsJoined(
                user.id in players &&
                    !players[user.id].disqualified &&
                    !players[user.id].resigned &&
                    !players[user.id].eliminated,
            );
            if (rounds.length) {
                setRounds(rounds.map((r) => groupify(r, players)));
            }

            //linkPlayersToRoundMatches(rounds, players);
            setTimeout(() => updateEliminationTrees(), 1);
        }).catch(errorAlerter);
        return ret;
    };
    const linkPlayersToRoundMatches = (rounds: any, players: PlayerCacheEntry[]) => {
        for (const round of rounds) {
            if (!round.groupify) {
                for (const match of round.matches) {
                    if (match?.player?.id) {
                        match.player = players[match.player.id];
                    }
                }
            }
        }
    };
    const compareUserRank = (a: TournamentPlayer, b: TournamentPlayer) => {
        if (!a && !b) {
            return 0;
        }
        if (!a) {
            return -1;
        }
        if (!b) {
            return 1;
        }

        const pa = players[a.id];
        const pb = players[b.id];
        if (!pa && !pb) {
            return 0;
        }
        if (!pa) {
            console.log(
                "Tournament game listed user " +
                    a.id +
                    " but player was not in TournamentPlayer list for this tournament",
            );
            return -1;
        }
        if (!pb) {
            console.log(
                "Tournament game listed user " +
                    b.id +
                    " but player was not in TournamentPlayer list for this tournament",
            );
            return 1;
        }
        if (pa.rank !== pb.rank) {
            return pa.rank - pb.rank;
        }
        if (pa.points !== pb.points) {
            return Number(pb.points) - Number(pa.points);
        }
        if (pa.sos !== pb.sos) {
            return Number(pb.sos) - Number(pa.sos);
        }
        if (pa.sodos !== pb.sodos) {
            return Number(pb.sodos) - Number(pa.sodos);
        }
        //if (pa.net_points !== pb.net_points) return parseFloat(pb.net_points) - parseFloat(pa.net_points);
        if (pa.ranking !== pb.ranking) {
            return (pb.ranking ?? 0) - (pa.ranking ?? 0);
        }
        if (pa.username < pb.username) {
            return 1;
        }
        if (pa.username > pb.username) {
            return -1;
        }
        return 0;
    };

    const startTournament = () => {
        void alert
            .fire({
                text: _("Start this tournament now?"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    post(`tournaments/${tournament_ref.current.id}/start`, {})
                        .then(ignore)
                        .catch(errorAlerter);
                }
            });
    };
    const deleteTournament = () => {
        void alert
            .fire({
                text: _("Delete this tournament?"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    del(`tournaments/${tournament_ref.current.id}`)
                        .then(() => {
                            browserHistory.push("/");
                        })
                        .catch(errorAlerter);
                }
            });
    };
    const endTournament = () => {
        void alert
            .fire({
                text: _("End this tournament?"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    post(`tournaments/${tournament_ref.current.id}/end`, {})
                        .then(() => {
                            reloadTournament();
                        })
                        .catch(errorAlerter);
                }
            });
    };
    const inviteUser = () => {
        if (!user_to_invite) {
            return;
        }

        const username = user_to_invite.username;
        post(`tournaments/${tournament_id}/players`, { username })
            .then((res) => {
                console.log(res);
                setInviteResult(interpolate(_("Invited {{username}}"), { username }));
            })
            .catch((res) => {
                try {
                    _("Player already has an outstanding invite"); /* for translations */
                    _("Player is already participating in this tournament"); /* for translations */
                    setInviteResult(_(JSON.parse(res.responseText).error));
                } catch (e) {
                    console.error(res);
                    console.error(e);
                }
            });
    };
    const joinTournament = () => {
        post(`tournaments/${tournament_id}/players`, {})
            .then(() => {
                setIsJoined(true);
            })
            .catch(errorAlerter);
    };
    const partTournament = () => {
        post(`tournaments/${tournament_id}/players`, { delete: true })
            .then(() => {
                setIsJoined(false);
            })
            .catch(errorAlerter);
    };
    const resign = () => {
        alert
            .fire({
                text: _(
                    "Are you sure you want to resign from the tournament? This will also resign you from all games you are playing in this tournament.",
                ),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    partTournament();
                }
            })
            .catch(errorAlerter);
    };
    const updateEliminationTrees = () => {
        if (
            tournament_ref.current.tournament_type === "elimination" ||
            tournament_ref.current.tournament_type === "double_elimination"
        ) {
            if (Object.keys(players).length === 0 || rounds.length === 0) {
                return;
            }

            const container = elimination_tree_container.current;
            const last_bucket: any = {};
            let last_cur_bucket: any = {};
            let cur_bucket: any = {};
            const em_4 = ($("#em10").width() * 0.4) / 10.0;
            const em_6 = ($("#em10").width() * 0.6) / 10.0;
            const em2_5 = ($("#em10").width() * 2.5) / 10.0;
            const name_width = ($("#em10").width() * 12.0) / 10.0;
            const min_space = ($("#em10").width() * 0.5) / 10.0;
            const h = em2_5 + min_space;
            const w = name_width + ($("#em10").width() * 4.0) / 10.0;

            const bindHovers = (div: JQuery, id: number | object) => {
                if (typeof id !== "number") {
                    try {
                        console.warn("ID = ", id);
                        for (const k in id) {
                            console.warn("ID.", k, "=", (id as any)[k]);
                        }
                    } catch (e) {
                        // ignore error
                    }
                    console.error("Tournament bind hover called with non numeric id");
                }

                div.mouseover(() => {
                    $(".elimination-player-hover").removeClass("elimination-player-hover");
                    $(".elimination-player-" + id).addClass("elimination-player-hover");
                });
                div.mouseout(() => {
                    $(".elimination-player-hover").removeClass("elimination-player-hover");
                });
            };

            const all_objects: any[] = [];
            for (let round_num = 0; round_num < rounds.length; ++round_num) {
                const round = rounds[round_num];

                for (let match_num = 0; match_num < round.matches.length; ++match_num) {
                    const match = round.matches[match_num];
                    const match_div = $("<div>").addClass("match-div");
                    const black = $("<div>")
                        .addClass("black")
                        .addClass("elimination-player-" + match.black);
                    const white = $("<div>")
                        .addClass("white")
                        .addClass("elimination-player-" + match.white);
                    const black_root = ReactDOM.createRoot(black[0]);
                    black_root.render(
                        <React.StrictMode>
                            <a className="elimination-game" href={`/game/view/${match.gameid}`}>
                                <i className="ogs-goban"></i>
                            </a>
                            <Player user={players[match.black]} icon rank />
                        </React.StrictMode>,
                    );
                    const white_root = ReactDOM.createRoot(white[0]);
                    white_root.render(
                        <React.StrictMode>
                            <a className="elimination-game" href={`/game/view/${match.gameid}`}>
                                <i className="ogs-goban"></i>
                            </a>
                            <Player user={players[match.white]} icon rank />
                        </React.StrictMode>,
                    );

                    bindHovers(black, match.black);
                    bindHovers(white, match.white);

                    const result = match.result && match.result.length > 0 ? match.result[0] : "";
                    if (result === "B") {
                        black.addClass("win");
                    }
                    if (result === "W") {
                        white.addClass("win");
                    }

                    match_div.append(black);
                    match_div.append(white);

                    const obj = {
                        div: match_div,
                        black_src: round_num > 0 ? last_bucket[match.black] : null,
                        white_src: round_num > 0 ? last_bucket[match.white] : null,
                        black_won: result === "B",
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

                    cur_bucket[match.black] = obj;
                    cur_bucket[match.white] = obj;

                    container.appendChild(match_div[0]);
                }
                for (let bye_num = 0; bye_num < round.byes.length; ++bye_num) {
                    const bye = round.byes[bye_num];
                    const bye_div = $("<div>").addClass("bye-div");
                    const bye_entry = $("<div>")
                        .addClass("bye")
                        .addClass("elimination-player-" + bye);
                    const root = ReactDOM.createRoot(bye_entry[0]);
                    root.render(
                        <React.StrictMode>
                            <Player user={players[bye]} icon rank />
                        </React.StrictMode>,
                    );
                    bindHovers(bye_entry, bye);
                    bye_div.append(bye_entry);
                    const obj = {
                        div: bye_div,
                        bye_src: round_num > 0 ? last_bucket[bye] : null,
                        black_won: true,
                        second_bracket: false,
                        round: round_num,
                        player_id: bye,
                    };
                    if (obj.bye_src) {
                        obj.bye_src.parent = obj;
                    }
                    cur_bucket[bye] = obj;
                    all_objects.push(obj);

                    container.appendChild(bye_div[0]);
                }

                for (const k in cur_bucket) {
                    last_bucket[k] = cur_bucket[k];
                }
                last_cur_bucket = cur_bucket;
                cur_bucket = {};
            }

            const last_cur_bucket_arr: any[] = [];
            for (const k in last_cur_bucket) {
                last_cur_bucket_arr.push(last_cur_bucket[k]);
            }

            const playerWon = (obj: { match: TournamentMatch }, player_id: number) => {
                if (!obj.match) {
                    return true;
                }
                if (!obj.match.result) {
                    return false;
                }
                if (obj.match.result[0] === "B" && obj.match.black === player_id) {
                    return true;
                }
                if (obj.match.result[0] === "W" && obj.match.white === player_id) {
                    return true;
                }
                return false;
            };

            for (let i = 0; i < all_objects.length; ++i) {
                const obj = all_objects[i];
                if (obj.round === 0) {
                    continue;
                }
                if (obj.bye_src) {
                    obj.second_bracket =
                        obj.bye_src.second_bracket || !playerWon(obj.bye_src, obj.player_id);
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

                if (obj.round === rounds.length - 1 && last_cur_bucket_arr.length <= 2) {
                    obj.second_bracket = false;
                }

                if (obj.second_bracket) {
                    //obj.div.css({"background-color": "red", "opacity": 0.5});
                }
            }

            const svg_extents = { x: 0, y: 0 };

            let last_visit_order = 0;
            const layout = (collection: any) => {
                const computeVisitOrder = (obj: any) => {
                    if (obj.visit_order) {
                        return;
                    }

                    if (!obj.second_bracket && obj.black_src && obj.black_src.second_bracket) {
                        if (obj.white_src) {
                            computeVisitOrder(obj.white_src);
                        }
                    }
                    if (!obj.second_bracket && obj.white_src && obj.white_src.second_bracket) {
                        if (obj.black_src) {
                            computeVisitOrder(obj.black_src);
                        }
                    }

                    if (obj.bye_src) {
                        computeVisitOrder(obj.bye_src);
                    }
                    if (obj.black_src) {
                        computeVisitOrder(obj.black_src);
                    }
                    if (obj.white_src) {
                        computeVisitOrder(obj.white_src);
                    }

                    obj.visit_order = ++last_visit_order;
                };

                const arr: any[] = [];
                for (const k in collection) {
                    arr.push(collection[k]);
                }
                arr.sort((a, b) => {
                    const d = a.second_bracket - b.second_bracket;
                    if (d !== 0) {
                        return d;
                    }

                    const compute_rank = (e: TournamentRecord) => {
                        if (e.player_id && e.player_id in players) {
                            return (players as any)[e.player_id].ranking * 2;
                        }
                        if (
                            e.match &&
                            e.match.black &&
                            e.match.white &&
                            e.match.black in players &&
                            e.match.white in players
                        ) {
                            return (
                                (players as any)[e.match.black].ranking +
                                (players as any)[e.match.white].ranking
                            );
                        }
                        return -1000;
                    };

                    return -(compute_rank(a) - compute_rank(b));
                });

                /* If we have the leader in the top bracket drop out before the second bracket completes so we get
                 * to our final match, the final match players both come from the second bracket. To account for this
                 * we look for the most recently finished game in the top bracket, make sure it's not the end game (that's
                 * the black/white_src.second_bracket check), and run our layout first starting from that node. */
                let max_se_round = 0;
                for (let i = 0; i < all_objects.length; ++i) {
                    if (!all_objects[i].second_bracket) {
                        if (
                            all_objects[i].black_src &&
                            all_objects[i].black_src.second_bracket &&
                            all_objects[i].white_src &&
                            all_objects[i].white_src.second_bracket
                        ) {
                            continue;
                        }
                        max_se_round = Math.max(max_se_round, all_objects[i].round);
                    }
                }

                for (let i = 0; i < all_objects.length; ++i) {
                    if (!all_objects[i].second_bracket && max_se_round === all_objects[i].round) {
                        if (
                            all_objects[i].black_src &&
                            all_objects[i].black_src.second_bracket &&
                            all_objects[i].white_src &&
                            all_objects[i].white_src.second_bracket
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
                all_objects.sort((a, b) => {
                    if (!a.visit_order) {
                        a.visit_order = ++last_visit_order;
                    }
                    if (!b.visit_order) {
                        b.visit_order = ++last_visit_order;
                    }

                    if (a.second_bracket !== b.second_bracket) {
                        return a.second_bracket - b.second_bracket;
                    }
                    if (a.round !== b.round) {
                        return a.round - b.round;
                    }
                    return a.visit_order - b.visit_order;
                });

                const y: any = { 0: 0 };
                let base_y = 0;
                const bracket_spacing = 75;
                for (let i = 0; i < all_objects.length; ++i) {
                    const obj = all_objects[i];
                    obj.laid_out = true;

                    if (
                        obj.round === 0 &&
                        i + 1 < all_objects.length &&
                        all_objects[i + 1].round === 1
                    ) {
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
                                obj.black_src &&
                                obj.black_src.second_bracket === obj.second_bracket &&
                                obj.white_src &&
                                obj.white_src.second_bracket === obj.second_bracket
                                //|| obj.round === rounds.length-1
                            ) {
                                obj.top = (obj.black_src.top + obj.white_src.top) / 2.0;
                            } else if (
                                obj.black_src &&
                                obj.black_src.second_bracket === obj.second_bracket
                            ) {
                                obj.top = obj.black_src.top;
                            } else if (
                                obj.white_src &&
                                obj.white_src.second_bracket === obj.second_bracket
                            ) {
                                obj.top = obj.white_src.top;
                            } else {
                                obj.top = y[obj.round];
                                y[obj.round] += h;
                            }
                        }
                    } else {
                        obj.top = y[obj.round];
                        y[obj.round] += h;
                    }

                    obj.left = w * obj.round;
                    obj.right = obj.left + name_width;
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
            };

            layout(last_cur_bucket);

            let not_laid_out = 0;
            for (let i = 0; i < all_objects.length; ++i) {
                if (!all_objects[i].laid_out) {
                    ++not_laid_out;
                }
            }
            if (not_laid_out) {
                void alert.fire("Warning: " + not_laid_out + " matches not laid out");
            }

            const svg = d3.select(elimination_tree.current);
            svg.attr("width", svg_extents.x);
            svg.attr("height", svg_extents.y);

            //let line_style = "basis";
            //let line_style = "linear";
            //let line_style = "step-before";

            const drawLine = (path: any) => {
                const line_function = d3
                    .line()
                    .curve(d3.curveMonotoneX)
                    .x((xy: any) => xy.x)
                    .y((xy: any) => xy.y);
                svg.append("path")
                    .attr("d", line_function(path))
                    .attr("stroke", "#888")
                    .attr("stroke-width", 1.0)
                    .attr("fill", "none");
            };

            const bottom_padding = 3.0;
            const left_padding = 5.0;

            const getWinnerBottom = (obj: any) => {
                if (obj.black_won) {
                    return Math.round((obj.top + obj.bottom) / 2.0);
                }
                return Math.round(obj.bottom + bottom_padding);
            };

            const drawLines = (obj: any) => {
                if (obj.black_src) {
                    drawLines(obj.black_src);
                    if (
                        !obj.second_bracket ||
                        obj.second_bracket === obj.black_src.second_bracket
                    ) {
                        drawLine([
                            { x: obj.black_src.left, y: getWinnerBottom(obj.black_src) },
                            { x: obj.black_src.right, y: getWinnerBottom(obj.black_src) },
                            {
                                x: obj.left - left_padding,
                                y: Math.round(
                                    obj.black_won ? (obj.top + obj.bottom) / 2.0 : obj.top + em_6,
                                ),
                            },
                            {
                                x: obj.left,
                                y: Math.round(
                                    obj.black_won ? (obj.top + obj.bottom) / 2.0 : obj.top + em_6,
                                ),
                            },
                        ]);
                    }
                }
                if (obj.white_src) {
                    drawLines(obj.white_src);
                    if (
                        !obj.second_bracket ||
                        obj.second_bracket === obj.white_src.second_bracket
                    ) {
                        drawLine([
                            { x: obj.white_src.left, y: getWinnerBottom(obj.white_src) },
                            { x: obj.white_src.right, y: getWinnerBottom(obj.white_src) },
                            {
                                x: obj.left - left_padding,
                                y: Math.round(
                                    obj.black_won ? obj.bottom - em_4 : obj.bottom + bottom_padding,
                                ),
                            },
                            {
                                x: obj.left,
                                y: Math.round(
                                    obj.black_won ? obj.bottom - em_4 : obj.bottom + bottom_padding,
                                ),
                            },
                        ]);
                    }
                }
                if (obj.bye_src) {
                    drawLines(obj.bye_src);
                    if (!obj.second_bracket || obj.second_bracket === obj.bye_src.second_bracket) {
                        drawLine([
                            { x: obj.bye_src.left, y: getWinnerBottom(obj.bye_src) },
                            { x: obj.bye_src.right, y: getWinnerBottom(obj.bye_src) },
                            { x: obj.left, y: Math.round((obj.top + obj.bottom) / 2.0) },
                        ]);
                    }
                }
            };

            for (const k in last_cur_bucket) {
                drawLines(last_cur_bucket[k]);
            }
        }
    };
    const groupify = (round: TournamentRound, players: TournamentPlayers): any => {
        try {
            const match_map: any = {};
            const result_map: any = {};
            const color_map: any = {};
            const game_id_map: any = {};
            let matches: any[] = [];
            let byes: any[] = [];

            for (let i = 0; i < round.matches.length; ++i) {
                const m = round.matches[i];
                //console.log(m.result, m);
                matches.push({ player: players[m.black], opponent: players[m.white] });
                matches.push({ player: players[m.white], opponent: players[m.black] });
                if (!(m.black in match_map)) {
                    match_map[m.black] = { matches: {}, id: m.black, player: players[m.black] };
                }
                if (!(m.white in match_map)) {
                    match_map[m.white] = { matches: {}, id: m.white, player: players[m.white] };
                }
                match_map[m.black].matches[m.white] = m;
                match_map[m.white].matches[m.black] = m;
                game_id_map[m.black + "x" + m.white] = m.gameid;
                game_id_map[m.white + "x" + m.black] = m.gameid;
                result_map[m.black + "x" + m.white] = m.result
                    ? m.result[0] === "B"
                        ? "win"
                        : m.result[0] === "W"
                          ? "loss"
                          : "?"
                    : "?";
                result_map[m.white + "x" + m.black] = m.result
                    ? m.result[0] === "W"
                        ? "win"
                        : m.result[0] === "B"
                          ? "loss"
                          : "?"
                    : "?";
                color_map[m.black + "x" + m.white] = m.result
                    ? m.result[0] === "B"
                        ? "win"
                        : m.result[0] === "W"
                          ? "loss"
                          : "no-result"
                    : "?";
                color_map[m.white + "x" + m.black] = m.result
                    ? m.result[0] === "W"
                        ? "win"
                        : m.result[0] === "B"
                          ? "loss"
                          : "no-result"
                    : "?";
            }

            for (let i = 0; i < round.byes.length; ++i) {
                byes.push(players[round.byes[i]]);
            }

            let last_group = 0;
            for (const player_id in match_map) {
                let group = -1;
                if ("group" in match_map[player_id]) {
                    group = match_map[player_id].group;
                } else {
                    group = match_map[player_id].group = last_group++;
                }

                for (const opponent_id in match_map[player_id].matches) {
                    const ogr = match_map[opponent_id].group;
                    if (ogr && ogr !== group) {
                        console.log(
                            "Group collision detected between player ",
                            match_map[player_id],
                            "and",
                            match_map[opponent_id],
                        );

                        for (const id in match_map) {
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

            let groups: TournamentGroup[] = new Array(last_group);
            let broken_list: any[] = [];
            for (let i = 0; i < groups.length; ++i) {
                groups[i] = { players: [] };
            }
            for (const player_id in match_map) {
                const m = match_map[player_id];
                if (m.group === -1) {
                    broken_list.push(match_map[player_id]);
                } else {
                    groups[m.group].players.push(match_map[player_id]);
                }
            }

            let max_len = 0;
            for (let i = 0; i < groups.length; ++i) {
                groups[i].players = groups[i].players.sort(compareUserRank);
                max_len = Math.max(max_len, groups[i].players.length);
            }
            groups = groups.sort((a, b) => {
                return compareUserRank(a.players[0], b.players[0]);
            });
            matches = matches.sort((a, b) => {
                return compareUserRank(a.player, b.player);
            });
            byes = byes.sort(compareUserRank);

            //console.log("Byes: ", byes);

            for (let i = groups.length - 1; i >= 0; --i) {
                if (groups[i].players.length === 0) {
                    console.log("Removing  group", i);
                    groups.splice(i, 1);
                }
            }

            broken_list = broken_list.sort(compareUserRank);
            const broken_players: any = {};
            for (let i = 0; i < broken_list.length; ++i) {
                broken_players[broken_list[i].player.id] = broken_list[i].player;
            }
            for (let i = 0; i < broken_list.length; ++i) {
                const opponents: any[] = [];
                for (const opponent_id in broken_list[i].matches) {
                    //let opponent_id = broken_list[i].matches[j].black === broken_list[i].id ? broken_list[i].matches[j].white : broken_list[i].matches[j].black;
                    opponents.push({
                        game_id: broken_list[i].matches[opponent_id].gameid,
                        player: broken_players[opponent_id],
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
                colors: color_map,
                match_map: match_map,
            };
        } catch (e) {
            setTimeout(() => {
                throw e;
            }, 1);
        }
    };
    const setSelectedRound = (idx: number | "standings" | "roster") => {
        setSelectedRoundIdx(idx);
    };

    const startEditing = () => setEditing(true);
    const save = () => {
        const tournament: any = dup(tournament_ref.current);
        const group = tournament.group;

        tournament.name = tournament.name.trim();
        tournament.description = tournament.description.trim();

        if (tournament.name.length < 5) {
            ref_tournament_name.current?.focus();
            void alert.fire(_("Please provide a name for the tournament"));
            return;
        }

        if (tournament.description.length < 5) {
            ref_description.current?.focus();
            void alert.fire(_("Please provide a description for the tournament"));
            return;
        }

        const max_players = parseInt(tournament.settings.maximum_players);
        if (max_players > 10 && tournament.tournament_type === "roundrobin") {
            ref_max_players.current?.focus();
            void alert.fire(_("Round Robin tournaments are limited to a maximum of 10 players"));
            return;
        }
        if (max_players < 2) {
            ref_max_players.current?.focus();
            void alert.fire(_("You need at least two players in a tournament"));
            return;
        }

        tournament.time_start = moment(new Date(tournament.time_start)).utc().format();
        tournament.group = new_tournament_group_id || (group && group.id);
        if (!tournament.group) {
            delete tournament.group;
        }
        tournament.time_control_parameters.time_control = tournament.time_control_parameters.system;

        delete tournament.settings.active_round;
        //tournament.round_start_times = round_start_times;

        const onError = (err: any) => {
            setEditing(true);
            errorAlerter(err);
        };

        if (tournament.id) {
            put(`tournaments/${tournament.id}`, tournament)
                .then(() => resolve())
                .catch(onError);
        } else {
            post("tournaments/", tournament)
                .then((res) => browserHistory.push(`/tournament/${res.id}`))
                .catch(onError);
        }

        setEditing(false);
    };
    const setTournamentName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        tournament_ref.current.name = ev.target.value;
        refresh();
    };
    const setStartTime = (t: any) => {
        if (t && t.format) {
            tournament_ref.current.time_start = t.format();
            refresh();
        }
    };

    const setTournamentType = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const update: any = {
            tournament_type: ev.target.value,
        };
        if (ev.target.value === "opengotha") {
            update.first_pairing_method = "opengotha";
            update.subsequent_pairing_method = "opengotha";
            update.rules = "aga";
        } else {
            if (
                tournament_ref.current.first_pairing_method === "opengotha" ||
                tournament_ref.current.subsequent_pairing_method === "opengotha"
            ) {
                update.first_pairing_method = "slide";
                update.subsequent_pairing_method = "slaughter";
            }
        }
        tournament_ref.current = Object.assign(tournament_ref.current, update);
        refresh();
    };
    const setLowerBar = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const newSettings = Object.assign({}, tournament_ref.current.settings, {
            lower_bar: ev.target.value,
        });
        tournament_ref.current.settings = newSettings;
        refresh();
    };
    const setUpperBar = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const newSettings = Object.assign({}, tournament_ref.current.settings, {
            upper_bar: ev.target.value,
        });
        tournament_ref.current.settings = newSettings;
        refresh();
    };
    const setPlayersStart = (ev: React.ChangeEvent<HTMLInputElement>) => {
        tournament_ref.current.players_start = Number(ev.target.value);
        refresh();
    };
    const setMaximumPlayers = (ev: React.ChangeEvent<HTMLInputElement>) => {
        tournament_ref.current.settings.maximum_players = ev.target.value;
        refresh();
    };
    const setAutoStartOnMax = (ev: React.ChangeEvent<HTMLInputElement>) => {
        tournament_ref.current.auto_start_on_max = ev.target.checked;
        refresh();
    };
    const setFirstPairingMethod = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const update: any = {
            first_pairing_method: ev.target.value,
        };
        if (
            ev.target.value === "opengotha" ||
            tournament_ref.current.subsequent_pairing_method === "opengotha"
        ) {
            update.subsequent_pairing_method = ev.target.value;
        }
        tournament_ref.current = Object.assign(tournament_ref.current, update);
        refresh();
    };

    const setSubsequentPairingMethod = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        const update: any = {
            subsequent_pairing_method: ev.target.value,
        };
        if (
            ev.target.value === "opengotha" ||
            tournament_ref.current.first_pairing_method === "opengotha"
        ) {
            update.first_pairing_method = ev.target.value;
        }
        tournament_ref.current = Object.assign(tournament_ref.current, update);
        refresh();
    };
    const setTournamentExclusivity = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        tournament_ref.current.exclusivity = ev.target.value;
        refresh();
    };

    const setNumberOfRounds = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        tournament_ref.current.settings.num_rounds = ev.target.value;
        refresh();
    };
    const setGroupSize = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        tournament_ref.current.settings.group_size = ev.target.value;
        refresh();
    };
    const setRules = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        tournament_ref.current.rules = ev.target.value as any;
        refresh();
    };
    const setHandicap = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        tournament_ref.current.handicap = ev.target.value;
        refresh();
    };
    const setBoardSize = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        tournament_ref.current.board_size = parseInt(ev.target.value);
        refresh();
    };
    const setAnalysisEnabled = (ev: React.ChangeEvent<HTMLInputElement>) => {
        tournament_ref.current.analysis_enabled = ev.target.checked;
        refresh();
    };
    const setMinRank = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        tournament_ref.current.min_ranking = ev.target.value;
        refresh();
    };
    const setMaxRank = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        tournament_ref.current.max_ranking = ev.target.value;
        refresh();
    };
    const setExcludeProvisionalPlayers = (ev: React.ChangeEvent<HTMLInputElement>) => {
        tournament_ref.current.exclude_provisional = !ev.target.checked;
        refresh();
    };
    const setDescription = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        tournament_ref.current.description = ev.target.value;
        refresh();
    };
    const setTimeControl = (tc: TimeControl) => {
        tournament_ref.current.time_control_parameters = tc;
        refresh();
    };
    const updateNotes = (data: { [k: string]: any }) => {
        const newSettings = Object.assign({}, tournament_ref.current.settings, data);
        tournament_ref.current.settings = newSettings;
        refresh();
    };

    const kick = (player_id: number) => {
        const user = player_cache.lookup(player_id);
        if (!user) {
            return;
        }

        void alert
            .fire({
                text: interpolate(_("Really kick {{user}} from the tournament?"), {
                    user: user.username,
                }),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    post(`tournaments/${tournament_ref.current.id}/players`, {
                        delete: true,
                        player_id: user.id,
                    })
                        .then(ignore)
                        .catch(errorAlerter);
                }
            });

        close_all_popovers();
    };
    const adjustPoints = (player_id: number) => {
        const user = player_cache.lookup(player_id);
        if (!user) {
            return;
        }

        alert
            .fire({
                input: "number",
                text: interpolate(
                    pgettext("How may tournament points to adjust a user by", "Adjustment for %s"),
                    [user.username],
                ),
                showCancelButton: true,
                focusCancel: true,
                inputValidator: (value): string | undefined => {
                    const f = parseFloat(value);
                    if (isNaN(f)) {
                        return "Enter the number of points for the adjustment";
                    }

                    const frac = f - Math.floor(f);

                    if (frac < 0.0001) {
                        return undefined;
                    }
                    if (frac < 0.5001 && frac > 0.4999) {
                        return undefined;
                    }
                    return "Enter a whole or half number of points for the adjustment";
                },
            })
            .then(({ value }) => {
                const v = parseFloat(value);
                if (!v) {
                    return;
                }

                const adjustments: any = {};
                adjustments[user.id] = v;

                put(`tournaments/${tournament_ref.current.id}/players`, {
                    adjust: adjustments,
                })
                    .then(ignore)
                    .catch(errorAlerter);
            })
            .catch(ignore);
        close_all_popovers();
    };
    const disqualify = (player_id: number) => {
        const user = player_cache.lookup(player_id);
        if (!user) {
            return;
        }

        void alert
            .fire({
                text: interpolate(_("Really disqualify {{user}}?"), { user: user.username }),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    put(`tournaments/${tournament_ref.current.id}/players`, {
                        disqualify: user.id,
                    })
                        .then(ignore)
                        .catch(errorAlerter);
                }
            });

        close_all_popovers();
    };

    const renderExtraPlayerActions = (player_id: number): any => {
        const tournament = tournament_ref.current;
        if (
            !(
                user.is_tournament_moderator ||
                (tournament.director && tournament.director.id === user.id)
            )
        ) {
            return null;
        }

        if (!tournament.started) {
            return (
                <div className="actions">
                    <button className="reject xs" onClick={() => kick(player_id)}>
                        {_("Kick")}
                    </button>
                </div>
            );
        } else if (!tournament.ended) {
            return (
                <div className="actions">
                    <button className="primary xs" onClick={() => adjustPoints(player_id)}>
                        {_("Adjust Points")}
                    </button>
                    <button className="reject xs" onClick={() => disqualify(player_id)}>
                        {_("Disqualify")}
                    </button>
                </div>
            );
        }
    };

    const tournament = tournament_ref.current;
    const selected_round =
        typeof selected_round_idx === "number" && rounds && rounds.length > selected_round_idx
            ? rounds[selected_round_idx]
            : null;
    const raw_selected_round =
        rounds && rounds.length > selected_round ? raw_rounds[selected_round] : null;
    (window as any)["tournament"] = tournament;

    let tournament_time_start_text = "";
    if (tournament.time_start) {
        tournament_time_start_text = moment(new Date(tournament.time_start)).format("LLLL");
        if (tournament.auto_start_on_max) {
            tournament_time_start_text = interpolate(
                _(
                    "Start time: {{time}} or when tournament is full",
                ) /* translators: Tournament starts at the designated time or when full */,
                { time: tournament_time_start_text },
            );
        } else {
            tournament_time_start_text = interpolate(
                _(
                    "Start time: {{time}}",
                ) /* translators: Tournament starts at the designated time */,
                { time: tournament_time_start_text },
            );
        }
    }

    let date_text = "";
    if (tournament.started) {
        if (tournament.ended) {
            const started = new Date(tournament.started).toLocaleDateString();
            const ended = new Date(tournament.ended).toLocaleDateString();
            if (started !== ended) {
                date_text = started + " - " + ended;
            } else {
                date_text =
                    new Date(tournament.started).toLocaleString() +
                    " - " +
                    new Date(tournament.ended).toLocaleTimeString();
            }
        } else {
            date_text += new Date(tournament.started).toLocaleString();
        }
    }

    const time_control_text = timeControlDescription(tournament.time_control_parameters);

    const tournament_type_name =
        (TOURNAMENT_TYPE_NAMES as any)[tournament.tournament_type] || "(Unknown)";
    const tournament_rules_name = rulesText(tournament.rules);
    const first_pairing_method_text =
        (TOURNAMENT_PAIRING_METHODS as any)[tournament.first_pairing_method] || "(Unknown)";
    const subsequent_pairing_method_text =
        (TOURNAMENT_PAIRING_METHODS as any)[tournament.subsequent_pairing_method] || "(Unknown)";
    const handicap_text = handicapText(Number(tournament.handicap));
    const rank_restriction_text = rankRestrictionText(
        Number(tournament.min_ranking),
        Number(tournament.max_ranking),
    );
    const provisional_players_text = tournament.exclude_provisional
        ? _("Not allowed")
        : _("Allowed");
    const analysis_mode_text = tournament.analysis_enabled ? _("Allowed") : _("Not allowed");
    const cdn_release = data.get("config.cdn_release");
    //let scheduled_rounds_text = tournament.scheduled_rounds ? pgettext("In a tournament, rounds will be scheduled to start at specific times", "Rounds are scheduled") : pgettext("In a tournament, the next round will start when the last finishes", "Rounds will automatically start when the last round finishes");

    let min_bar = "";
    let max_bar = "";
    let num_rounds = 0;
    let group_size = 0;
    try {
        min_bar = rankString(parseInt(tournament.settings.lower_bar));
        max_bar = rankString(parseInt(tournament.settings.upper_bar));
    } catch (e) {
        // ignore error
    }
    try {
        num_rounds = parseInt(tournament.settings.num_rounds);
    } catch (e) {
        // ignore error
    }
    try {
        group_size = parseInt(tournament.settings.group_size);
    } catch (e) {
        // ignore error
    }

    let tournament_exclusivity = "";
    switch (tournament.exclusivity) {
        case "open":
            tournament_exclusivity = pgettext("Open tournament", "Open");
            break;
        case "group":
            tournament_exclusivity = pgettext("Group tournament", "Members only");
            break;
        case "invite":
            tournament_exclusivity = pgettext("Group tournament", "Invite only");
            break;
    }

    /* TODO */
    //let is_joined = user && (user.id in players) && !players[global_user.id].disqualified && !players[global_user.id].resigned && !players[global_user.id].eliminated;
    //let is_joined = false;
    let can_join = true;
    let cant_join_reason = "";

    if (user.anonymous) {
        can_join = false;
        cant_join_reason = _("You must sign in to join this tournament.");
    } else if (tournament.exclusivity === "group" && !tournament.player_is_member_of_group) {
        can_join = false;
        cant_join_reason = _("You must be a member of the group to join this tournament");
    } else if (!tournament.is_open || tournament.exclusivity === "invite") {
        can_join = false;
        cant_join_reason = _("This is a closed tournament, you must be invited to join.");
    } else if (tournament.exclude_provisional && user.provisional > 0) {
        can_join = false;
        cant_join_reason = _(
            "This tournament is closed to provisional players. You need to establish your rank by playing ranked games before you can join this tournament.",
        );
    } else if (bounded_rank(user) < parseInt(tournament.min_ranking as string)) {
        can_join = false;
        cant_join_reason = _("Your rank is too low to join this tournament.");
    } else if (bounded_rank(user) > parseInt(tournament.max_ranking as string)) {
        can_join = false;
        cant_join_reason = _("Your rank is too high to join this tournament");
    }

    const time_per_move = computeAverageMoveTime(
        tournament.time_control_parameters,
        tournament.board_size,
        tournament.board_size,
    );

    if (
        tournament.tournament_type === "elimination" ||
        tournament.tournament_type === "double_elimination"
    ) {
        setTimeout(() => updateEliminationTrees(), 1);
    }

    const opengotha = tournament.tournament_type === "opengotha";
    const has_fixed_number_of_rounds =
        tournament.tournament_type === "mcmahon" ||
        tournament.tournament_type === "s_mcmahon" ||
        tournament.tournament_type === "opengotha" ||
        null;

    if (!info_loaded && !editing) {
        return <LoadingPage />;
    }

    return (
        <div className="Tournament page-width">
            <UIPush
                event="players-updated"
                channel={`tournament-${tournament_id}`}
                action={reloadTournament}
            />
            <UIPush
                event="reload-tournament"
                channel={`tournament-${tournament_id}`}
                action={reloadTournament}
            />
            <UIPush
                event="update-round-notes"
                channel={`tournament-${tournament_id}`}
                action={updateNotes}
            />

            <div className="top-details">
                <div>
                    {!editing ? (
                        <h2>
                            <i className="fa fa-trophy"></i> {tournament.name}
                        </h2>
                    ) : (
                        <input
                            ref={ref_tournament_name}
                            className="fill big"
                            value={tournament.name}
                            placeholder={_("Tournament Name")}
                            onChange={setTournamentName}
                        />
                    )}

                    {editing && tournament.tournament_type === "opengotha" && (
                        <h3>
                            Please note, the OpenGotha tournament is a manually managed tournament.
                            Please read the{" "}
                            <a
                                href="https://github.com/online-go/online-go.com/wiki/OpenGotha-Tournaments"
                                target="_blank"
                            >
                                documentation
                            </a>{" "}
                            before creating this type of tournament.{" "}
                            <i>
                                This is a new tournament type, please report any issues experience.
                            </i>
                        </h3>
                    )}

                    {tournament.tournament_type === "opengotha" &&
                        tournament.can_administer &&
                        tournament.started &&
                        !tournament.ended && (
                            <button className="reject xs" onClick={endTournament}>
                                {_("End Tournament")}
                            </button>
                        )}

                    {tournament.tournament_type === "opengotha" && (
                        <OpenGothaTournamentUploadDownload
                            tournament={tournament}
                            reloadCallback={reloadTournament}
                        />
                    )}

                    {!editing && info_loaded && (
                        <div>
                            {(((user.is_tournament_moderator ||
                                user.id === tournament.director.id) &&
                                !tournament.started &&
                                !tournament.start_waiting) ||
                                null) && (
                                <button className="xs" onClick={startEditing}>
                                    {_("Edit Tournament")}
                                </button>
                            )}

                            {((tournament.started == null && tournament.can_administer) ||
                                null) && (
                                <button className="danger xs" onClick={startTournament}>
                                    {tournament.tournament_type === "opengotha"
                                        ? pgettext(
                                              "Close tournament registration",
                                              "Close registration",
                                          )
                                        : _("Start Tournament Now")}
                                </button>
                            )}
                            {((tournament.started == null && tournament.can_administer) ||
                                null) && (
                                <button className="reject xs" onClick={deleteTournament}>
                                    {_("End Tournament")}
                                </button>
                            )}

                            {((tournament.started && !tournament.ended && is_joined) || null) && (
                                <button className="reject xs" onClick={resign}>
                                    {_("Resign from Tournament")}
                                </button>
                            )}
                        </div>
                    )}

                    {info_loaded && (!tournament.started || null) && (
                        <h4>{tournament_time_start_text}</h4>
                    )}
                    {!editing && info_loaded && <h4>{date_text}</h4>}
                    {editing && (
                        <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="control-label" htmlFor="start-time">
                                <span>
                                    {_("Start time") /* translators: When the tournament starts */}:{" "}
                                </span>
                            </label>
                            <div className="controls">
                                <div className="checkbox">
                                    <Datetime
                                        onChange={setStartTime}
                                        value={new Date(tournament.time_start)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {!editing && info_loaded && (
                        <p>
                            <b>{_("Clock:")}</b> {time_control_text}
                        </p>
                    )}
                    {editing && (
                        <TimeControlPicker
                            timeControl={tournament.time_control_parameters}
                            onChange={setTimeControl}
                            boardWidth={tournament.board_size}
                            boardHeight={tournament.board_size}
                            forceSystem={false}
                        />
                    )}
                    {!editing ? (
                        <Markdown source={tournament.description} />
                    ) : (
                        <textarea
                            ref={ref_description}
                            rows={7}
                            className="fill"
                            value={tournament.description}
                            placeholder={_("Description")}
                            onChange={setDescription}
                        />
                    )}
                </div>
                <div className="top-right-details">
                    <table>
                        <tbody>
                            {(tournament.group || null) && (
                                <tr>
                                    <th>{_("Group")}</th>
                                    <td>
                                        <Link to={`/group/${tournament.group.id}`}>
                                            {tournament.group.name}
                                        </Link>
                                    </td>
                                </tr>
                            )}
                            {(tournament.group || null) && (
                                <tr>
                                    <th>{_("Tournament Director")}</th>
                                    <td>
                                        <Player user={tournament.director} />
                                    </td>
                                </tr>
                            )}

                            <tr>
                                <th>{_("Exclusivity")}</th>
                                <td>
                                    {!editing ? (
                                        tournament_exclusivity
                                    ) : (
                                        <select
                                            className="tournament-dropdown form-control"
                                            value={tournament.exclusivity}
                                            onChange={setTournamentExclusivity}
                                        >
                                            <option value="open">
                                                {pgettext("Open tournament", "Open")}
                                            </option>
                                            <option value="group">
                                                {pgettext("Group tournament", "Members only")}
                                            </option>
                                            <option value="invite">
                                                {pgettext("Group tournament", "Invite only")}
                                            </option>
                                        </select>
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>{_("Tournament Type")}</th>
                                <td>
                                    {!editing ? (
                                        tournament_type_name
                                    ) : (
                                        <select
                                            id="tournament-type"
                                            value={tournament.tournament_type}
                                            onChange={setTournamentType}
                                            disabled={tournament.id > 0}
                                        >
                                            <option value="mcmahon">{_("McMahon")}</option>
                                            <option value="s_mcmahon">
                                                {_("Simultaneous McMahon")}
                                            </option>
                                            <option value="roundrobin">{_("Round Robin")}</option>
                                            <option value="swiss">{_("Swiss")}</option>
                                            <option value="elimination">
                                                {_("Single Elimination")}
                                            </option>
                                            <option value="double_elimination">
                                                {_("Double Elimination")}
                                            </option>
                                            <option value="opengotha">
                                                {pgettext(
                                                    "Tournament type where the tournament director does all pairing with the OpenGotha software",
                                                    "OpenGotha",
                                                )}{" "}
                                                (beta)
                                            </option>
                                        </select>
                                    )}
                                </td>
                            </tr>

                            {(tournament.tournament_type === "mcmahon" ||
                                tournament.tournament_type === "s_mcmahon" ||
                                null) && (
                                <tr>
                                    <th>{_("McMahon Bars")}</th>
                                    <td>
                                        {!editing ? (
                                            <span>
                                                {min_bar} - {max_bar}
                                            </span>
                                        ) : (
                                            <span>
                                                <select
                                                    className="rank-selection"
                                                    value={tournament.settings.lower_bar}
                                                    onChange={setLowerBar}
                                                >
                                                    {ranks.map((r, idx) => (
                                                        <option key={idx} value={r.rank}>
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                -
                                                <select
                                                    className="rank-selection"
                                                    value={tournament.settings.upper_bar}
                                                    onChange={setUpperBar}
                                                >
                                                    {ranks.map((r, idx) => (
                                                        <option key={idx} value={r.rank}>
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )}

                            {tournament.tournament_type !== "opengotha" && (
                                <tr>
                                    <th>{_("Players")}</th>
                                    <td>
                                        {editing ? (
                                            <span>
                                                <input
                                                    type="number"
                                                    value={tournament.players_start}
                                                    onChange={setPlayersStart}
                                                />
                                                -
                                                <input
                                                    ref={ref_max_players}
                                                    type="number"
                                                    value={tournament.settings.maximum_players}
                                                    onChange={setMaximumPlayers}
                                                />
                                            </span>
                                        ) : !tournament.started ? (
                                            <span>
                                                {tournament.players_start}
                                                {!tournament.settings.maximum_players
                                                    ? "+"
                                                    : parseInt(
                                                            tournament.settings
                                                                .maximum_players as string,
                                                        ) > tournament.players_start
                                                      ? "-" + tournament.settings.maximum_players
                                                      : ""}
                                            </span>
                                        ) : (
                                            <span>
                                                {sorted_players.length} (was{" "}
                                                {tournament.players_start}
                                                {!tournament.settings.maximum_players
                                                    ? "+"
                                                    : parseInt(
                                                            tournament.settings
                                                                .maximum_players as string,
                                                        ) > tournament.players_start
                                                      ? "-" + tournament.settings.maximum_players
                                                      : ""}
                                                )
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )}
                            {tournament.tournament_type !== "opengotha" && (
                                <tr>
                                    <th>
                                        <label htmlFor="autostart">{_("Start when full")}</label>
                                    </th>
                                    <td>
                                        {!editing ? (
                                            <span>
                                                {tournament.auto_start_on_max ? _("Yes") : _("No")}
                                            </span>
                                        ) : (
                                            <input
                                                type="checkbox"
                                                id="autostart"
                                                checked={tournament.auto_start_on_max}
                                                onChange={setAutoStartOnMax}
                                            />
                                        )}
                                    </td>
                                </tr>
                            )}
                            {tournament.tournament_type !== "roundrobin" &&
                                tournament.tournament_type !== "opengotha" && (
                                    <tr>
                                        <th>{_("Initial Pairing Method")}</th>
                                        <td>
                                            {!editing ? (
                                                <span>{first_pairing_method_text}</span>
                                            ) : (
                                                <select
                                                    value={tournament.first_pairing_method}
                                                    onChange={setFirstPairingMethod}
                                                >
                                                    <option disabled={opengotha} value="random">
                                                        {pgettext("Tournament type", "Random")}
                                                    </option>
                                                    <option disabled={opengotha} value="slaughter">
                                                        {pgettext("Tournament type", "Slaughter")}
                                                    </option>
                                                    <option disabled={opengotha} value="slide">
                                                        {pgettext("Tournament type", "Slide")}
                                                    </option>
                                                    <option disabled={opengotha} value="strength">
                                                        {pgettext("Tournament type", "Strength")}
                                                    </option>
                                                    <option disabled={!opengotha} value="opengotha">
                                                        {pgettext(
                                                            "Tournament director will pair opponents with OpenGotha",
                                                            "OpenGotha",
                                                        )}
                                                    </option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            {tournament.tournament_type !== "roundrobin" &&
                                tournament.tournament_type !== "opengotha" && (
                                    <tr>
                                        <th>{_("Subsequent Pairing Method")}</th>
                                        <td>
                                            {!editing ? (
                                                <span>{subsequent_pairing_method_text}</span>
                                            ) : (
                                                <select
                                                    value={tournament.subsequent_pairing_method}
                                                    onChange={setSubsequentPairingMethod}
                                                >
                                                    <option disabled={opengotha} value="random">
                                                        {pgettext("Tournament type", "Random")}
                                                    </option>
                                                    <option disabled={opengotha} value="slaughter">
                                                        {pgettext("Tournament type", "Slaughter")}
                                                    </option>
                                                    <option disabled={opengotha} value="slide">
                                                        {pgettext("Tournament type", "Slide")}
                                                    </option>
                                                    <option disabled={opengotha} value="strength">
                                                        {pgettext("Tournament type", "Strength")}
                                                    </option>
                                                    <option disabled={!opengotha} value="opengotha">
                                                        {pgettext(
                                                            "Tournament director will pair opponents with OpenGotha",
                                                            "OpenGotha",
                                                        )}
                                                    </option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            {has_fixed_number_of_rounds && (
                                <tr>
                                    <th>{_("Number of Rounds")}</th>
                                    <td>
                                        {!editing ? (
                                            num_rounds
                                        ) : (
                                            <select
                                                value={tournament.settings.num_rounds}
                                                onChange={setNumberOfRounds}
                                            >
                                                {(tournament.tournament_type === "opengotha"
                                                    ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                                                    : [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                                                ).map((v) => (
                                                    <option key={v} value={v}>
                                                        {v}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            )}
                            {(tournament.tournament_type === "s_mcmahon" || null) && (
                                <tr>
                                    <th>{_("Minimum Group Size")}</th>
                                    <td>
                                        {!editing ? (
                                            group_size
                                        ) : (
                                            <select
                                                value={tournament.settings.group_size}
                                                onChange={setGroupSize}
                                            >
                                                {[3, 4, 5].map((v) => (
                                                    <option key={v} value={v}>
                                                        {v}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <th>{_("Rules")}</th>
                                <td>
                                    {!editing ? (
                                        tournament_rules_name
                                    ) : (
                                        <select value={tournament.rules} onChange={setRules}>
                                            <option value="aga">{_("AGA")}</option>
                                            <option value="japanese">{_("Japanese")}</option>
                                            <option value="chinese">{_("Chinese")}</option>
                                            <option value="korean">{_("Korean")}</option>
                                            <option value="ing">{_("Ing SST")}</option>
                                            <option value="nz">{_("New Zealand")}</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>{_("Board Size")}</th>
                                <td>
                                    {!editing ? (
                                        `${tournament.board_size}x${tournament.board_size}`
                                    ) : (
                                        <select
                                            value={tournament.board_size}
                                            onChange={setBoardSize}
                                        >
                                            <option value="19">19x19</option>
                                            <option value="13">13x13</option>
                                            <option value="9">9x9</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                            {(tournament.tournament_type !== "opengotha" || null) && (
                                <tr>
                                    <th>{_("Handicap")}</th>
                                    <td>
                                        {!editing ? (
                                            handicap_text
                                        ) : (
                                            <select
                                                value={tournament.handicap}
                                                onChange={setHandicap}
                                            >
                                                <option value="0">{_("None")}</option>
                                                <option value="-1">{_("Automatic")}</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <th>
                                    <label htmlFor="analysis">
                                        {_("Conditional Moves & Analysis")}
                                    </label>
                                </th>
                                <td>
                                    {!editing ? (
                                        analysis_mode_text
                                    ) : (
                                        <input
                                            type="checkbox"
                                            id="analysis"
                                            checked={tournament.analysis_enabled}
                                            onChange={setAnalysisEnabled}
                                        />
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>{_("Rank Restriction")}</th>
                                <td>
                                    {!editing ? (
                                        <span>{rank_restriction_text}</span>
                                    ) : (
                                        <span>
                                            <select
                                                className="rank-selection"
                                                value={tournament.min_ranking}
                                                onChange={setMinRank}
                                            >
                                                {ranks.map((r, idx) => (
                                                    <option key={idx} value={r.rank}>
                                                        {r.label}
                                                    </option>
                                                ))}
                                            </select>
                                            -
                                            <select
                                                className="rank-selection"
                                                value={tournament.max_ranking}
                                                onChange={setMaxRank}
                                            >
                                                {ranks.map((r, idx) => (
                                                    <option key={idx} value={r.rank}>
                                                        {r.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>
                                    <label htmlFor="provisional">{_("Provisional Players")}</label>
                                </th>
                                <td>
                                    {!editing ? (
                                        provisional_players_text
                                    ) : (
                                        <input
                                            type="checkbox"
                                            id="provisional"
                                            checked={!tournament.exclude_provisional}
                                            onChange={setExcludeProvisionalPlayers}
                                        />
                                    )}
                                </td>
                            </tr>
                            {/*
                        {has_fixed_number_of_rounds &&
                            <React.Fragment>
                                <tr>

                                    <th>
                                        <label
                                            htmlFor="scheduled_rounds"
                                            title={_("When selected, rounds will have a set start time. Otherwise rounds will automatically start when the last round ends.")}>
                                                {pgettext("When selected, rounds will have a set start time. Otherwise rounds will automatically start when the last round ends.", "Scheduled rounds")}
                                        </label>
                                    </th>
                                    <td>
                                        {!editing
                                            ? scheduled_rounds_text
                                            : <input type="checkbox" id="scheduled_rounds" checked={tournament.scheduled_rounds} onChange={setScheduledRounds} />
                                        }
                                    </td>
                                </tr>
                            </React.Fragment>
                        }
                        {has_fixed_number_of_rounds && tournament.scheduled_rounds &&
                            <React.Fragment>
                                {(new Array(parseInt(tournament.settings.num_rounds))).fill(0).map((elt:any, idx:number) => (
                                    <tr key={idx}>
                                        <th>
                                            {interpolate(pgettext("Tournament round number. The {{num}} is placeholder text, please leave it as {{num}}", "Round {{num}}"), {num: idx + 1})}
                                        </th>
                                        <td>
                                            <Datetime
                                                inputProps={{
                                                    placeholder: pgettext("Time a tournament round starts", "Round start time")
                                                }}
                                                onChange={(d) => setRoundStartTime(idx, d)} value={getRoundStartTime(idx)}/>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        }
                        */}
                        </tbody>
                    </table>
                </div>
            </div>

            {editing && (
                <div style={{ textAlign: "center", marginTop: "3rem" }}>
                    <button className="primary" onClick={save}>
                        {tournament.id === 0 ? _("Create Tournament") : _("Save Tournament")}
                    </button>
                </div>
            )}

            {!loading && tournament.tournament_type !== "opengotha" && tournament.ended && (
                <div className="final-results">
                    <h2>{_("Final results")}:</h2>
                    {Object.keys(players)
                        .map((id) => players[id])
                        .filter((p) => p.rank > 0 && p.rank <= 3)
                        .sort((a, b) => (a.rank > b.rank ? 1 : -1))
                        .map((player) => (
                            <div key={player.id}>
                                <span className="final-results-place">
                                    <img
                                        className="trophy"
                                        src={`${cdn_release}/img/trophies/${trophyFilename(
                                            tournament,
                                            player.rank,
                                        )}`}
                                        title=""
                                    />
                                    {nthPlace(player.rank)}
                                </span>
                                <Player icon user={player} />
                            </div>
                        ))}
                </div>
            )}

            {info_loaded && (
                <EmbeddedChatCard channel={`tournament-${tournament_id}`} updateTitle={false} />
            )}

            {info_loaded && loading && <LoadingPage />}

            {!loading && !tournament.started && (
                <div className={"bottom-details not-started"}>
                    {(!tournament.start_waiting || null) && (
                        <div className="sign-up-area" style={{ textAlign: "center" }}>
                            {(tournament.time_start || null) && (
                                <h3>
                                    {interpolate(
                                        _("Tournament starts {{relative_time_from_now}}"),
                                        {
                                            relative_time_from_now: fromNow(tournament.time_start),
                                        },
                                    )}
                                </h3>
                            )}

                            {is_joined != null && (
                                <p style={{ marginTop: "6em" }}>
                                    {((!is_joined && can_join) || null) && (
                                        <button
                                            className="btn raise btn-primary"
                                            onClick={joinTournament}
                                        >
                                            {_("Join this tournament!")}
                                        </button>
                                    )}
                                    {((!is_joined && !can_join) || null) && (
                                        <span>{cant_join_reason}</span>
                                    )}
                                    {(is_joined || null) && (
                                        <button
                                            className="btn raise btn-danger"
                                            onClick={partTournament}
                                        >
                                            {_("Drop out from tournament")}
                                        </button>
                                    )}
                                </p>
                            )}

                            {((is_joined && time_per_move < 3600) || null) && (
                                <h4 style={{ marginTop: "3em" }}>
                                    {_(
                                        "You must be on this page when the tournament begins or you will be removed from the tournament",
                                    )}
                                </h4>
                            )}
                        </div>
                    )}
                    {(tournament.start_waiting || null) && (
                        <div className="sign-up-area" style={{ textAlign: "center" }}>
                            <p style={{ marginTop: "6em" }}>
                                <span>{_("Tournament is starting")}</span>
                            </p>
                        </div>
                    )}
                    <div className="player-list">
                        {(tournament.exclusivity !== "invite" ||
                            user.is_tournament_moderator ||
                            tournament.director.id === user.id ||
                            null) && (
                            <div className="invite-input">
                                <div className="input-group" id="tournament-invite-user-container">
                                    <PlayerAutocomplete
                                        onComplete={setUserToInvite}
                                        disabled={user.anonymous}
                                    />
                                    <button
                                        className="btn primary xs"
                                        type="button"
                                        disabled={user_to_invite == null || user.anonymous}
                                        onClick={inviteUser}
                                    >
                                        {_("Invite")}
                                    </button>
                                </div>
                                <div className="bold">{invite_result}</div>
                                <div id="tournament-invite-result"></div>
                            </div>
                        )}
                        {(sorted_players.length > 0 || null) && (
                            <Card>
                                {sorted_players.map((player) => (
                                    <div key={player.id}>
                                        <Player icon user={player} />
                                    </div>
                                ))}
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {!loading && tournament.started && tournament.tournament_type === "opengotha" && (
                <div className="bottom-details">
                    <div className="results">
                        <div>
                            <div className="roster-rounds-line">
                                {tournament.opengotha_standings ? (
                                    <button
                                        className={
                                            selected_round_idx === "standings"
                                                ? "primary"
                                                : "default"
                                        }
                                        onClick={() => setSelectedRound("standings")}
                                    >
                                        {pgettext("Tournament standings", "Standings")}
                                    </button>
                                ) : (
                                    <button
                                        className={
                                            selected_round_idx === "roster" ? "primary" : "default"
                                        }
                                        onClick={() => setSelectedRound("roster")}
                                    >
                                        {pgettext("Tournament participant roster", "Roster")}
                                    </button>
                                )}
                                <Steps
                                    completed={rounds.length}
                                    total={rounds.length}
                                    selected={selected_round_idx as number}
                                    onChange={setSelectedRound}
                                />
                            </div>
                            {selected_round_idx === "roster" ? (
                                <OpenGothaRoster tournament={tournament} players={sorted_players} />
                            ) : selected_round_idx === "standings" ? (
                                <OpenGothaStandings tournament={tournament} />
                            ) : (
                                <OpenGothaTournamentRound
                                    tournament={tournament}
                                    roundNotes={
                                        (tournament.settings as any)[
                                            "notes-round-" + ((selected_round_idx as number) + 1)
                                        ] || ""
                                    }
                                    selectedRound={(selected_round_idx as number) + 1}
                                    players={sorted_players}
                                    rounds={rounds}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!loading && tournament.started && tournament.tournament_type !== "opengotha" && (
                <div className="bottom-details">
                    <div className="results">
                        {use_elimination_trees ? (
                            <PersistentElement elt={elimination_tree_container.current} />
                        ) : (
                            <div>
                                {rounds.length > 1 && (
                                    <Steps
                                        completed={rounds.length}
                                        total={rounds.length}
                                        selected={selected_round_idx as number}
                                        onChange={setSelectedRound}
                                    />
                                )}

                                {!selected_round &&
                                    tournament.group &&
                                    tournament.group.hide_details && (
                                        <div className="hide-details-note">
                                            {_(
                                                "This tournament is part of a group that hides group activity and details, as such you must be a member of the group to see the tournament results.",
                                            )}
                                        </div>
                                    )}

                                {/* Round robin / simultaneous style groups */}
                                {((selected_round && selected_round.groupify) || null) && (
                                    <div>
                                        {selected_round.groups.map(
                                            (group: TournamentGroup, idx: number) => {
                                                // (if we had ramda library, we'd use that non-mutating sort instead of this funky spread-copy...)

                                                const sorted_players = [...group.players]
                                                    .filter((p) => p.player)
                                                    .sort(sortDropoutsToBottom);

                                                return (
                                                    <div key={idx} className="round-group">
                                                        <table>
                                                            <tbody>
                                                                <tr>
                                                                    {(tournament.ended || null) && (
                                                                        <th className="rank">
                                                                            {_("Rank")}
                                                                        </th>
                                                                    )}
                                                                    <th>{_("Player")}</th>
                                                                    {sorted_players.map(
                                                                        (opponent, idx) => (
                                                                            <th
                                                                                key={idx}
                                                                                className="rotated-title"
                                                                            >
                                                                                {(opponent.player ||
                                                                                    null) && (
                                                                                    <span className="rotated">
                                                                                        <Player
                                                                                            user={
                                                                                                opponent.player
                                                                                            }
                                                                                            icon
                                                                                        ></Player>
                                                                                    </span>
                                                                                )}
                                                                            </th>
                                                                        ),
                                                                    )}
                                                                    <th className="rotated-title">
                                                                        <span className="rotated">
                                                                            {_("Points")}
                                                                        </span>
                                                                    </th>
                                                                    {(tournament.ended || null) && (
                                                                        <th className="rotated-title">
                                                                            <span className="rotated">
                                                                                &Sigma;{" "}
                                                                                {_(
                                                                                    "Opponent Scores",
                                                                                )}
                                                                            </span>
                                                                        </th>
                                                                    )}
                                                                    {(tournament.ended || null) && (
                                                                        <th className="rotated-title">
                                                                            <span className="rotated">
                                                                                &Sigma;{" "}
                                                                                {_(
                                                                                    "Defeated Scores",
                                                                                )}
                                                                            </span>
                                                                        </th>
                                                                    )}
                                                                    <th></th>
                                                                </tr>
                                                                {sorted_players.map(
                                                                    (player, idx) => {
                                                                        player = player.player;
                                                                        return (
                                                                            <tr key={idx}>
                                                                                {(tournament.ended ||
                                                                                    null) && (
                                                                                    <td className="rank">
                                                                                        {
                                                                                            player.rank
                                                                                        }
                                                                                    </td>
                                                                                )}

                                                                                <th className="player">
                                                                                    <Player
                                                                                        user={
                                                                                            player
                                                                                        }
                                                                                        icon
                                                                                    />
                                                                                </th>
                                                                                {sorted_players.map(
                                                                                    (
                                                                                        opponent,
                                                                                        idx,
                                                                                    ) => (
                                                                                        <td
                                                                                            key={
                                                                                                idx
                                                                                            }
                                                                                            className={
                                                                                                "result " +
                                                                                                selected_round
                                                                                                    .colors[
                                                                                                    player.id +
                                                                                                        "x" +
                                                                                                        opponent?.id
                                                                                                ]
                                                                                            }
                                                                                        >
                                                                                            <Link
                                                                                                to={`/game/${
                                                                                                    selected_round
                                                                                                        .game_ids[
                                                                                                        player.id +
                                                                                                            "x" +
                                                                                                            opponent?.id
                                                                                                    ]
                                                                                                }`}
                                                                                            >
                                                                                                {
                                                                                                    selected_round
                                                                                                        .results[
                                                                                                        player.id +
                                                                                                            "x" +
                                                                                                            opponent?.id
                                                                                                    ]
                                                                                                }
                                                                                            </Link>
                                                                                        </td>
                                                                                    ),
                                                                                )}
                                                                                <td className="points">
                                                                                    {player.points}
                                                                                </td>
                                                                                {(tournament.ended ||
                                                                                    null) && (
                                                                                    <td className="points">
                                                                                        {player.sos}
                                                                                    </td>
                                                                                )}
                                                                                {(tournament.ended ||
                                                                                    null) && (
                                                                                    <td className="points">
                                                                                        {
                                                                                            player.sodos
                                                                                        }
                                                                                    </td>
                                                                                )}
                                                                                <td className="notes">
                                                                                    {player.notes}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    },
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}

                                {/* Pair matches */}
                                {((selected_round &&
                                    !selected_round.groupify &&
                                    tournament.tournament_type !== "s_title") ||
                                    null) && (
                                    <div className="round-group">
                                        <table>
                                            <tbody>
                                                <tr>
                                                    {(tournament.ended || null) && (
                                                        <th>{_("Rank")}</th>
                                                    )}
                                                    <th>{_("Player")}</th>
                                                    <th>{_("Opponent")}</th>
                                                    <th>{_("Result")}</th>
                                                    <th>{_("Points")}</th>
                                                    {(tournament.ended || null) && (
                                                        <th className="rotated-title">
                                                            <span className="rotated">
                                                                &Sigma; {_("Opponent Scores")}
                                                            </span>
                                                        </th>
                                                    )}
                                                    {(tournament.ended || null) && (
                                                        <th className="rotated-title">
                                                            <span className="rotated">
                                                                &Sigma; {_("Defeated Scores")}
                                                            </span>
                                                        </th>
                                                    )}
                                                    <th></th>
                                                </tr>
                                                {selected_round.matches.map(
                                                    (m: TournamentMatch, idx: number) => {
                                                        const pxo =
                                                            (m.player &&
                                                                m.opponent &&
                                                                `${m.player.id}x${m.opponent.id}`) ||
                                                            "error-invalid-player-or-opponent";
                                                        if (
                                                            pxo ===
                                                            "error-invalid-player-or-opponent"
                                                        ) {
                                                            if (!log_spam_debounce) {
                                                                log_spam_debounce = setTimeout(
                                                                    () => {
                                                                        console.error(
                                                                            "invalid player or opponent",
                                                                            m,
                                                                            selected_round.matches,
                                                                            selected_round,
                                                                        );
                                                                        log_spam_debounce =
                                                                            undefined;
                                                                    },
                                                                    10,
                                                                );
                                                            }
                                                        }

                                                        return (
                                                            <tr key={idx}>
                                                                {(tournament.ended || null) && (
                                                                    <td className="rank">
                                                                        {m.player?.rank}
                                                                    </td>
                                                                )}
                                                                {(m.player || null) && (
                                                                    <td className="player">
                                                                        <Player
                                                                            user={m.player}
                                                                            icon
                                                                        />
                                                                    </td>
                                                                )}
                                                                {(m.opponent || null) && (
                                                                    <td className="player">
                                                                        <Player
                                                                            user={m.opponent}
                                                                            icon
                                                                        />
                                                                    </td>
                                                                )}

                                                                <td
                                                                    className={
                                                                        "result " +
                                                                        selected_round.colors[pxo]
                                                                    }
                                                                >
                                                                    <Link
                                                                        to={`/game/${selected_round.game_ids[pxo]}`}
                                                                    >
                                                                        {
                                                                            selected_round.results[
                                                                                pxo
                                                                            ]
                                                                        }
                                                                    </Link>
                                                                </td>

                                                                <td className="points">
                                                                    {m.player && m.player.points}
                                                                </td>
                                                                {(tournament.ended || null) && (
                                                                    <td className="points">
                                                                        {m.player && m.player.sos}
                                                                    </td>
                                                                )}
                                                                {(tournament.ended || null) && (
                                                                    <td className="points">
                                                                        {m.player && m.player.sodos}
                                                                    </td>
                                                                )}
                                                                <td className="notes">
                                                                    {m.player && m.player.notes}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Case for busted tournaments that have random matches that they shouldn't have but do */}
                                {((selected_round && selected_round.broken_list.length) ||
                                    null) && (
                                    <div className="round-group">
                                        <h2>{_("Other Matches")}</h2>
                                        <table>
                                            <tbody>
                                                <tr>
                                                    {(tournament.ended || null) && (
                                                        <th>{_("Rank")}</th>
                                                    )}
                                                    <th>{_("Player")}</th>
                                                    <th>{_("Opponent")}</th>
                                                    <th>{_("Result")}</th>
                                                    <th>{_("Points")}</th>
                                                    {(tournament.ended || null) && (
                                                        <th className="rotated-title">
                                                            <span className="rotated">
                                                                &Sigma; {_("Opponent Scores")}
                                                            </span>
                                                        </th>
                                                    )}
                                                    {(tournament.ended || null) && (
                                                        <th className="rotated-title">
                                                            <span className="rotated">
                                                                &Sigma; {_("Defeated Scores")}
                                                            </span>
                                                        </th>
                                                    )}
                                                    <th></th>
                                                </tr>
                                                {selected_round.broken_list.map(
                                                    (m: any, idx: number) => {
                                                        return (
                                                            <tr key={idx}>
                                                                {(tournament.ended || null) && (
                                                                    <td className="rank">
                                                                        {m.player.rank}
                                                                    </td>
                                                                )}
                                                                {(m.player || null) && (
                                                                    <td className="player">
                                                                        <Player
                                                                            user={m.player}
                                                                            icon
                                                                        />
                                                                    </td>
                                                                )}
                                                                {(m.opponent || null) && (
                                                                    <td className="player">
                                                                        <Player
                                                                            user={m.opponent}
                                                                            icon
                                                                        />
                                                                    </td>
                                                                )}

                                                                <td
                                                                    className={
                                                                        "result " +
                                                                        selected_round.colors[
                                                                            m.player?.id +
                                                                                "x" +
                                                                                m.opponent?.id
                                                                        ]
                                                                    }
                                                                >
                                                                    <Link
                                                                        to={`/game/${
                                                                            selected_round.game_ids[
                                                                                m.player?.id +
                                                                                    "x" +
                                                                                    m.opponent?.id
                                                                            ]
                                                                        }`}
                                                                    >
                                                                        {
                                                                            selected_round.results[
                                                                                m.player?.id +
                                                                                    "x" +
                                                                                    m.opponent?.id
                                                                            ]
                                                                        }
                                                                    </Link>
                                                                </td>

                                                                <td className="points">
                                                                    {m.player.points}
                                                                </td>
                                                                {(tournament.ended || null) && (
                                                                    <td className="points">
                                                                        {m.player.sos}
                                                                    </td>
                                                                )}
                                                                {(tournament.ended || null) && (
                                                                    <td className="points">
                                                                        {m.player.sodos}
                                                                    </td>
                                                                )}
                                                                <td className="notes">
                                                                    {m.player.notes}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Byes */}
                                {((selected_round && selected_round.byes.length) || null) && (
                                    <div className="round-group">
                                        <h2>{_("Byes") /*translators: Tournament byes */}</h2>
                                        <table>
                                            <tbody>
                                                <tr>
                                                    {(tournament.ended || null) && (
                                                        <th>{_("Rank")}</th>
                                                    )}
                                                    <th>{_("Player")}</th>
                                                    <th>{_("Points")}</th>
                                                    {(tournament.ended || null) && (
                                                        <th className="rotated-title">
                                                            <span className="rotated">
                                                                &Sigma; {_("Opponent Scores")}
                                                            </span>
                                                        </th>
                                                    )}
                                                    {(tournament.ended || null) && (
                                                        <th className="rotated-title">
                                                            <span className="rotated">
                                                                &Sigma; {_("Defeated Scores")}
                                                            </span>
                                                        </th>
                                                    )}
                                                    <th></th>
                                                </tr>
                                                {selected_round.byes.map(
                                                    (player: TournamentPlayer, idx: number) => {
                                                        if (!player) {
                                                            return <tr key={idx} />;
                                                        }
                                                        return (
                                                            <tr key={idx}>
                                                                {(tournament.ended || null) && (
                                                                    <td className="rank">
                                                                        {player.rank}
                                                                    </td>
                                                                )}
                                                                <td className="player">
                                                                    <Player user={player} icon />
                                                                </td>
                                                                <td className="points">
                                                                    {player.points}
                                                                </td>
                                                                {((player && tournament.ended) ||
                                                                    null) && (
                                                                    <td className="points">
                                                                        {player.sos}
                                                                    </td>
                                                                )}
                                                                {(tournament.ended || null) && (
                                                                    <td className="points">
                                                                        {player.sodos}
                                                                    </td>
                                                                )}
                                                                <td className="notes">
                                                                    {player.notes}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Old title tournaments */}
                                {(tournament.tournament_type === "s_title" || null) && (
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ display: "inline-block" }}>
                                            <h3>
                                                {(rounds[0].matches[0].player || null) && (
                                                    <Player
                                                        user={rounds[0].matches[0].player}
                                                        icon
                                                    />
                                                )}{" "}
                                                vs.{" "}
                                                {(rounds[0].matches[0].opponent || null) && (
                                                    <Player
                                                        user={rounds[0].matches[0].opponent}
                                                        icon
                                                    />
                                                )}
                                            </h3>

                                            {raw_selected_round.matches.map(
                                                (m: TournamentMatch, idx: number) => (
                                                    <MiniGoban
                                                        key={idx}
                                                        id={m.gameid}
                                                        width={tournament.board_size}
                                                        height={tournament.board_size}
                                                        black={players[m.black]}
                                                        white={players[m.white]}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function OpenGothaRoster({ players }: { tournament: any; players: Array<any> }): JSX.Element {
    (window as any)["players"] = players;
    players.sort((a, b) => a.username.localeCompare(b.username));
    return (
        <div className="OpenGothaRoster">
            <table>
                <tbody>
                    {players.map((player) => (
                        <tr key={player.id}>
                            <td>
                                <Player user={player} disable-cache-update rank={false} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function OpenGothaStandings({ tournament }: { tournament: any }): JSX.Element {
    return (
        <div className="OpenGothaStandings">
            <Markdown source={tournament.opengotha_standings} />
        </div>
    );
}

function OpenGothaTournamentRound({
    tournament,
    roundNotes,
    selectedRound,
    rounds,
}: {
    tournament: any;
    roundNotes: string;
    selectedRound: number;
    players: Array<any>;
    rounds: Array<any>;
}): JSX.Element {
    //let [notes, _set_notes]:[string, (s) => void] = React.useState(tournament.settings[`notes-round-${selectedRound}`] || "");
    const [notes, _set_notes]: [string, (s: string) => void] = React.useState(roundNotes);
    const [notes_updated, set_notes_updated]: [boolean, (b: boolean) => void] =
        React.useState(false);
    (window as any)["rounds"] = rounds;
    const round_started = !!(
        rounds.length >= selectedRound && (rounds[selectedRound - 1]?.matches.length || 0) > 0
    );

    React.useEffect(() => {
        _set_notes(roundNotes);
    }, [roundNotes]);

    function set_notes(ev: React.ChangeEvent<HTMLTextAreaElement>) {
        _set_notes(ev.target.value);
        set_notes_updated(true);
    }
    function save_notes() {
        set_notes_updated(false);
        put(`tournaments/${tournament.id}/rounds/${selectedRound}`, { notes: notes })
            .then(() => console.log("Notes saved"))
            .catch(errorAlerter);
    }

    function startRound() {
        console.log("ok");
        void alert
            .fire({
                text: interpolate(
                    pgettext(
                        "Start the tournament round now? Leave {{num}} as it is, it is a placeholder for the round number.",
                        "Start round {{num}} now?",
                    ),
                    { num: selectedRound },
                ),
                showCancelButton: true,
                //focusCancel: true
            })
            .then(({ value: accept }) => {
                if (accept) {
                    post(`tournaments/${tournament.id}/rounds/${selectedRound}/start`)
                        .then(ignore)
                        .catch(errorAlerter);
                }
            });
    }

    const selected_round = rounds[selectedRound - 1];

    const round_seen: any = {};
    function dedup(m: any) {
        const pxo =
            (m.player && m.opponent && `${m.player.id}x${m.opponent.id}`) ||
            "error-invalid-player-or-opponent";
        const oxp =
            (m.player && m.opponent && `${m.opponent.id}x${m.player.id}`) ||
            "error-invalid-player-or-opponent";
        const ret = !(pxo in round_seen) && !(oxp in round_seen);
        round_seen[pxo] = true;
        round_seen[oxp] = true;
        return ret;
    }

    if (round_started) {
        return (
            <div className="OpenGothaTournamentRound">
                <div className="round-group">
                    <table>
                        <tbody>
                            <tr>
                                <th colSpan={2}>{_("Game")}</th>
                                <th>{_("Result")}</th>
                            </tr>
                            {selected_round.matches
                                .filter(dedup)
                                .map((m: TournamentMatch, idx: number) => {
                                    const pxo =
                                        (m.player &&
                                            m.opponent &&
                                            `${m.player.id}x${m.opponent.id}`) ||
                                        "error-invalid-player-or-opponent";
                                    if (pxo === "error-invalid-player-or-opponent") {
                                        if (!log_spam_debounce) {
                                            log_spam_debounce = setTimeout(() => {
                                                console.error(
                                                    "invalid player or opponent",
                                                    m,
                                                    selected_round.matches,
                                                    selected_round,
                                                );
                                                log_spam_debounce = undefined;
                                            }, 10);
                                        }
                                    }

                                    let black = null;
                                    let white = null;
                                    let white_won = "";
                                    let black_won = "";

                                    try {
                                        const match =
                                            selected_round.match_map[m.player.id].matches[
                                                m.opponent.id
                                            ];

                                        black = match.black === m.player.id ? m.player : m.opponent;
                                        white = match.black === m.player.id ? m.opponent : m.player;
                                        if (match.result[0] === "W") {
                                            white_won = "win";
                                        }
                                        if (match.result[0] === "B") {
                                            black_won = "win";
                                        }
                                    } catch (e) {
                                        // ignore error
                                    }

                                    return (
                                        <tr key={idx}>
                                            {white && (
                                                <td className={`player ${white_won}`}>
                                                    <Player
                                                        disable-cache-update
                                                        user={white}
                                                        icon
                                                    />
                                                </td>
                                            )}
                                            {black && (
                                                <td className={`player ${black_won}`}>
                                                    <Player
                                                        disable-cache-update
                                                        user={black}
                                                        icon
                                                    />
                                                </td>
                                            )}

                                            {black && white && (
                                                <td className={"result"}>
                                                    <Link
                                                        to={`/game/${selected_round.game_ids[pxo]}`}
                                                    >
                                                        {
                                                            selected_round.match_map[m.player.id]
                                                                .matches[m.opponent.id].result
                                                        }
                                                    </Link>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    } else {
        const roundMatches = tournament.settings?.["opengotha-staged-games"]?.[selectedRound] || {};
        const matches: Array<any> = [];

        for (const k in roundMatches) {
            matches.push(roundMatches[k]);
        }

        /*
        matches.sort((a, b) => {
            return b.white.ranking - a.white.ranking;
        });
        */

        return (
            <div className="OpenGothaTournamentRound">
                <div className="round-notes">
                    {tournament.can_administer || null ? (
                        <div className="round-notes-edit">
                            <textarea
                                value={notes}
                                onChange={set_notes}
                                placeholder={pgettext(
                                    "Notes about a tournament round that are publicly visible",
                                    "Round notes (everyone can see this)",
                                )}
                            />
                            {(notes_updated || null) && (
                                <button className="primary" onClick={save_notes}>
                                    {_("Save")}
                                </button>
                            )}
                        </div>
                    ) : (
                        <Markdown source={notes} />
                    )}
                </div>
                {(tournament.can_administer || null) && (
                    <div className="round-td-controls">
                        <button className="primary" onClick={startRound}>
                            {pgettext("Start a round of games in a tournament", "Start round")}
                        </button>
                    </div>
                )}

                <h3>
                    {pgettext(
                        "Tournament games that are scheduled to take place",
                        "Scheduled matches",
                    )}
                </h3>

                <table className="scheduled-matches">
                    <tbody>
                        {matches.map((match) => (
                            <tr key={`${match.black.id}v${match.white.id}`}>
                                <td className="player1">
                                    <Player user={match.black} disable-cache-update />
                                </td>
                                <td className="player2">
                                    <Player user={match.white} disable-cache-update />
                                </td>
                                <td className="handicap">
                                    {match.handicap !== 0 || null ? (
                                        <span className="handicap">HC {match.handicap}</span>
                                    ) : (
                                        <span className="handicap"></span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

        /*
            <h3>{_("Unpaired players")}</h3>
            <select size={5}>
                {players.map((p, idx) => <option key={p.id}>{p.username}</option>)}
            </select>
        */
    }
}

function OpenGothaTournamentUploadDownload({
    tournament,
    reloadCallback,
}: {
    tournament: any;
    reloadCallback: () => void;
}): JSX.Element | null {
    if (!tournament.can_administer) {
        return null;
    }

    function uploadFile(files: File[]) {
        put(`tournaments/${tournament.id}/opengotha`, files[0])
            .then((res) => {
                console.log("Upload successful", res);
                openMergeReportModal(res.merge_report);
                reloadCallback();
            })
            .catch((res) => {
                console.error(res);
                try {
                    openMergeReportModal(res.responseJSON.merge_report, res.responseJSON.error);
                } catch (e) {
                    console.error(e);
                }
            });
    }

    function download() {
        window.open(`/api/v1/tournaments/${tournament.id}/opengotha`, "_blank");
    }

    return (
        <Card>
            <h3>
                {pgettext("Area to upload and download OpenGotha files to", "OpenGotha File Area")}
                <a
                    className="pull-right"
                    href="https://github.com/online-go/online-go.com/wiki/OpenGotha-Tournaments"
                    target="_blank"
                >
                    {_("Documentation")}
                </a>
            </h3>
            <div className="OpenGothaUploadDownload">
                <Dropzone onDrop={uploadFile} multiple={false}>
                    {({ getRootProps, getInputProps }) => (
                        <section className="Dropzone">
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <i className="fa fa-upload" />
                                {pgettext(
                                    "Upload a file from OpenGotha to update an OpenGotha tournament on online-go.com",
                                    "Upload to Online-Go.com ",
                                )}
                            </div>
                        </section>
                    )}
                </Dropzone>
                <div className="download" onClick={download}>
                    <i className="fa fa-download" />
                    {pgettext(
                        "Download an updated XML file for use with OpenGotha",
                        "Download to OpenGotha",
                    )}
                </div>
            </div>
        </Card>
    );
}

export function rankRestrictionText(min_ranking: number, max_ranking: number) {
    if (min_ranking <= 0) {
        if (max_ranking >= 36) {
            return _("None");
        } else {
            return interpolate(pgettext("ranks restriction: '<rank> and below'", "%s and below"), [
                longRankString(max_ranking),
            ]);
        }
    } else {
        if (max_ranking >= 36) {
            return interpolate(pgettext("ranks restriction: '<rank> and above'", "%s and above"), [
                longRankString(min_ranking),
            ]);
        } else {
            return interpolate(pgettext("ranks restriction: '<rank> - <rank>'", "%s - %s"), [
                longRankString(min_ranking),
                longRankString(max_ranking),
            ]);
        }
    }
}
export function shortRankRestrictionText(min_ranking: number, max_ranking: number) {
    if (min_ranking <= 0) {
        if (max_ranking >= 36) {
            return _("All");
        } else {
            return interpolate(pgettext("ranks restriction: '<rank> and below'", "%s"), [
                rankString(max_ranking),
            ]);
        }
    } else {
        if (max_ranking >= 36) {
            return interpolate(pgettext("ranks restriction: '<rank> and above'", "%s+"), [
                rankString(min_ranking),
            ]);
        } else {
            return interpolate(pgettext("ranks restriction: '<rank> - <rank>'", "%s-%s"), [
                rankString(min_ranking),
                rankString(max_ranking),
            ]);
        }
    }
}
export const TOURNAMENT_TYPE_NAMES = {
    s_mcmahon: _("Simultaneous McMahon"),
    mcmahon: _("McMahon"),
    roundrobin: _("Round Robin"),
    s_elimination: _("Simultaneous Elimination"),
    s_title: _("Title Tournament"),
    swiss: _("Swiss"),
    elimination: _("Single Elimination"),
    double_elimination: _("Double Elimination"),
    opengotha: pgettext(
        "Tournament type where the tournament director does all pairing with the OpenGotha software",
        "OpenGotha",
    ),
};
export const TOURNAMENT_PAIRING_METHODS = {
    random: pgettext("Tournament type", "Random"),
    slaughter: pgettext("Tournament type", "Slaughter"),
    strength: pgettext("Tournament type", "Strength"),
    slide: pgettext("Tournament type", "Slide"),
    opengotha: pgettext("Tournament director will pair opponents with OpenGotha", "OpenGotha"),
};

function fromNow(t: number | string) {
    const d = new Date(t).getTime();
    if (d - Date.now() < 0) {
        return pgettext("Tournament begins very shortly", "very shortly");
    }
    return moment(d).fromNow();
}

function nthPlace(n: number): string | null {
    switch (n) {
        case 1:
            return _("First place");
        case 2:
            return _("Second place");
        case 3:
            return _("Third place");
    }

    return null;
}

function trophyFilename(tournament: any, rank: number): string | null {
    const size = tournament.board_size;
    switch (rank) {
        case 1:
            return `gold_tourn_${size}.png`;
        case 2:
            return `silver_tourn_${size}.png`;
        case 3:
            return `bronze_tourn_${size}.png`;
    }

    return null;
}
function sortDropoutsToBottom(player_a: any, player_b: any) {
    // Sorting the players structure from a group array
    // "bottom" is greater than "top" of the display list.
    const a = player_a.player;
    const b = player_b.player;

    if (
        a.notes !== "Resigned" &&
        a.notes !== "Disqualified" &&
        (b.notes === "Resigned" || b.notes === "Disqualified")
    ) {
        return -1;
    }
    if (
        b.notes !== "Resigned" &&
        b.notes !== "Disqualified" &&
        (a.notes === "Resigned" || a.notes === "Disqualified")
    ) {
        return 1;
    }
    return b.points - a.points;
}
