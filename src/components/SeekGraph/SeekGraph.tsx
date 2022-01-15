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
import * as ReactDOM from "react-dom";
import { browserHistory } from "ogsHistory";
import { _, pgettext, interpolate } from "translate";
import { post, del } from "requests";
import { comm_socket } from "sockets";
import { TypedEventEmitter } from "TypedEventEmitter";
import * as data from "data";
import { openGameAcceptModal } from "GameAcceptModal";
import { shortDurationString, shortShortTimeControl, timeControlSystemText } from "TimeControl";
import { computeAverageMoveTime } from "goban";
import { getRelativeEventPosition, errorAlerter } from "misc";
import { rankString, bounded_rank } from "rank_utils";
import { kb_bind, kb_unbind } from "KBShortcut";
import { Player } from "Player";
import * as player_cache from "player_cache";
import swal from "sweetalert2";
import { nominateForRengoChallenge } from "Play";

type Challenge = socket_api.seekgraph_global.Challenge;

interface Events {
    challenges: Challenge[];
}

const MAX_RATIO = 0.99;

interface SeekGraphConfig {
    canvas: any;
    show_live_games?: boolean;
}

function dist(C, pos) {
    const dx = C.cx - pos.x;
    const dy = C.cy - pos.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function lerp(v1, v2, alpha) {
    return (1.0 - alpha) * v1 + alpha * v2;
}
function list_hit_sorter(A, B) {
    if (A.eligible && !B.eligible) {
        return -1;
    }
    if (!A.eligible && B.eligible) {
        return 1;
    }

    if (A.user_challenge && !B.user_challenge) {
        return -1;
    }
    if (!A.user_challenge && B.user_challenge) {
        return 1;
    }

    if (A.ranked && !B.ranked) {
        return -1;
    }
    if (!A.ranked && B.ranked) {
        return 1;
    }

    return A.challenge_id - B.challenge_id;
}
function lists_are_equal(A, B) {
    if (A.length !== B.length) {
        return false;
    }
    for (let i = 0; i < A.length; ++i) {
        if (A[i].challenge_id !== B[i].challenge_id) {
            return false;
        }
    }
    return true;
}

export class SeekGraph extends TypedEventEmitter<Events> {
    static blitz_line_ratio = 0.1;
    static live_line_ratio = 0.6;
    static time_columns = [
        { ratio: 0.97, time_per_move: 0 },
        { ratio: 0.000001, time_per_move: 1 },

        /* blitz */
        { ratio: 0.04, time_per_move: 5 },
        { ratio: 0.08, time_per_move: 10 },

        /* live */
        { ratio: 0.2, time_per_move: 15 },
        { ratio: 0.25, time_per_move: 20 },
        { ratio: 0.3, time_per_move: 30 },
        { ratio: 0.35, time_per_move: 60 },
        { ratio: 0.4, time_per_move: 120 },
        { ratio: 0.5, time_per_move: 300 },

        /* long */
        { ratio: 0.65, time_per_move: 10800 },
        { ratio: 0.7, time_per_move: 21600 },
        { ratio: 0.75, time_per_move: 43200 },
        { ratio: 0.8, time_per_move: 86400 },
        { ratio: 0.85, time_per_move: 172800 },
        { ratio: 0.9, time_per_move: 259200 },
        { ratio: 0.95, time_per_move: 604800 },
    ];

    canvas: any;
    show_live_games: boolean;
    socket: any;
    connected: boolean = false;
    // This is treated as an array later because that is what TypedEventEmitter expects.
    // Perhaps this should be changed to an array as well.
    challenges: { [id: number]: Challenge } = {};
    live_games: any = {};
    list_hits: Array<any> = [];
    challenge_points: any = {};
    square_size = 8;
    text_size = 10;
    padding = 14;
    list_locked: boolean = false;
    modal: any = null;
    list;
    list_open: boolean = false;
    width;
    height;

    constructor(config: SeekGraphConfig) {
        super();

        this.canvas = $(config.canvas);
        this.show_live_games = config.show_live_games;
        this.socket = comm_socket;
        this.list_hits = [];
        this.redraw();

        if (this.socket.connected) {
            this.onConnect();
        }

        this.socket.on("connect", this.onConnect);
        this.socket.on("disconnect", this.onDisconnect);
        this.socket.on("seekgraph/global", this.onSeekgraphGlobal);
        this.canvas.on("mousemove", this.onPointerMove);
        this.canvas.on("mouseout", this.onPointerOut);
        this.canvas.on("click", this.onPointerDown);

        $(document).on("touchend", this.onTouchEnd);
        $(document).on("touchstart touchmove", this.onTouchStartMove);
    }

    userRank() {
        const user = data.get("user");
        if (!user || user.anonymous) {
            return 18;
        }
        return bounded_rank(user);
    }
    onDisconnect = () => {};
    onConnect = () => {
        this.connected = true;
        this.socket.send("seek_graph/connect", { channel: "global" });
        if (this.show_live_games) {
            this.connectToLiveGameList();
        }
    };

    onSeekgraphGlobal = (lst) => {
        const this_userid = data.get("user").id;
        for (let i = 0; i < lst.length; ++i) {
            const e = lst[i];
            if ("game_started" in e) {
                // rengo "other players" on this page need to be sent to the game when it starts
                // the creator already gets sent, by the normal challenge modal mechanism
                if (e.rengo && e.creator !== this_userid) {
                    if (e.rengo_black_team.concat(e.rengo_white_team).includes(this_userid)) {
                        browserHistory.push(`/game/${e.game_id}`);
                    }
                }
            } else if ("delete" in e) {
                if (e.challenge_id in this.challenges) {
                    const uid = this.challenges[e.challenge_id].system_message_id;
                    delete this.challenges[e.challenge_id];
                    if (uid) {
                        //console.log("#line-" + (uid.replace(".", "\\.")));
                        $("#line-" + uid.replace(".", "\\."))
                            .find("button")
                            .remove();
                    }
                }
            } else {
                e.user_challenge = false;
                e.joined_rengo = e.rengo && e.rengo_participants.includes(this_userid);

                if (data.get("user").anonymous) {
                    e.eligible = false;
                    e.ineligible_reason = _("Not logged in");
                } else if (e.user_id === data.get("user").id) {
                    e.eligible = false;
                    e.user_challenge = true;
                    e.ineligible_reason = _("This is your challenge");
                } else if (e.ranked && Math.abs(this.userRank() - e.rank) > 9) {
                    e.eligible = false;
                    e.ineligible_reason = _(
                        "This is a ranked game and the rank difference is more than 9",
                    );
                } else if (e.min_rank <= this.userRank() && e.max_rank >= this.userRank()) {
                    e.eligible = true;
                } else {
                    e.eligible = false;

                    if (e.min_rank > this.userRank()) {
                        e.ineligible_reason = interpolate(_("min. rank: %s"), [
                            rankString(e.min_rank),
                        ]);
                    } else if (e.max_rank < this.userRank()) {
                        e.ineligible_reason = interpolate(_("max. rank: %s"), [
                            rankString(e.max_rank),
                        ]);
                    }
                }

                this.challenges[e.challenge_id] = e;

                try {
                    const move_time = computeAverageMoveTime(e.time_control_parameters);
                } catch (err) {
                    console.log(err.stack);
                }
            }
        }
        this.redraw();
        this.emit("challenges", this.challenges as Challenge[]);
    };

    onTouchEnd = (ev) => {
        if (ev.target === this.canvas[0]) {
            this.onPointerDown(ev);
        }
    };
    onTouchStartMove = (ev) => {
        if (ev.target === this.canvas[0]) {
            this.onPointerMove(ev);
            ev.preventDefault();
            return false;
        }
    };
    onPointerMove = (ev) => {
        const new_list = this.getHits(ev);
        new_list.sort(list_hit_sorter);
        if (!lists_are_equal(new_list, this.list_hits)) {
            this.closeChallengeList();
        }
        this.list_hits = new_list;
        if (this.list_hits.length) {
            this.moveChallengeList(ev);
        } else {
            this.closeChallengeList(ev);
        }
    };
    onPointerDown = (ev) => {
        const new_list = this.getHits(ev);
        new_list.sort(list_hit_sorter);
        if (!lists_are_equal(new_list, this.list_hits)) {
            this.list_locked = false;
            this.closeChallengeList();
        }
        this.list_hits = new_list;
        if (this.list_hits.length) {
            this.list_locked = false;
            this.closeChallengeList();
            this.moveChallengeList(ev);
            this.list_locked = true;
            this.modal = createModal(() => {
                //console.log("Closing modal");
                this.modal = null;
                this.list_locked = false;
                this.closeChallengeList();
            }, 49);
            //console.log("modal: ",this.modal);
        } else {
            this.list_locked = false;
            this.closeChallengeList();
        }
    };
    onPointerOut = (ev) => {
        if (!this.list_locked) {
            this.closeChallengeList();
        }
    };

    connectToLiveGameList() {
        this.socket.send("gamelist/subscribe", { gamelist: "gamelist/global" });
    }
    setShowLiveGames(tf) {
        const changed = tf !== this.show_live_games;
        this.show_live_games = tf;
        if (changed) {
            if (tf) {
                this.connectToLiveGameList();
            } else {
                this.socket.send("gamelist/unsubscribe", {});
            }
            this.redraw();
        }
    }
    destroy() {
        this.list_locked = false;
        this.closeChallengeList();
        this.setShowLiveGames(false);
        if (this.connected) {
            this.socket.send("seek_graph/disconnect", { channel: "global" });
        }

        this.socket.off("connect", this.onConnect);
        this.socket.off("disconnect", this.onDisconnect);
        this.socket.off("seekgraph/global", this.onSeekgraphGlobal);

        $(document).off("touchend", this.onTouchEnd);
        $(document).off("touchstart touchmove", this.onTouchStartMove);
    }

    getHits(ev) {
        const pos = getRelativeEventPosition(ev);
        const ret = [];

        if (!pos) {
            return ret;
        }

        for (const id in this.challenges) {
            const C = this.challenges[id];
            if (dist(C, pos) < this.square_size * 2) {
                ret.push(C);
            }
        }

        if (this.show_live_games) {
            for (const id in this.live_games) {
                const C = this.live_games[id];
                if (dist(C, pos) < this.square_size * 2) {
                    ret.push(C);
                }
            }
        }

        return ret;
    }
    redraw() {
        const ctx = this.canvas[0].getContext("2d");
        const w = this.canvas.width();
        const h = this.canvas.height();
        const padding = this.padding;
        const blitz_line = Math.round(SeekGraph.blitz_line_ratio * (w - padding) + padding);
        const live_line = Math.round(SeekGraph.live_line_ratio * (w - padding) + padding);

        ctx.clearRect(0, 0, w, h);
        this.drawAxes();

        const plot_ct = {};
        this.challenge_points = {};

        const sorted = [];
        for (const id in this.challenges) {
            sorted.push(this.challenges[id]);
        }
        sorted.sort((A, B) => {
            if (A.eligible && !B.eligible) {
                return 1;
            }
            if (!A.eligible && B.eligible) {
                return -1;
            }

            if (A.user_challenge && !B.user_challenge) {
                return 1;
            }
            if (!A.user_challenge && B.user_challenge) {
                return -1;
            }

            if (A.ranked && !B.ranked) {
                return 1;
            }
            if (!A.ranked && B.ranked) {
                return -1;
            }

            return B.challenge_id - A.challenge_id;
        });
        if (this.show_live_games) {
            for (const id in this.live_games) {
                sorted.push(this.live_games[id]);
            }
        }

        /* Plot our challenges */
        for (let j = 0; j < sorted.length; ++j) {
            const C = sorted[j];

            const rank_ratio = Math.min(MAX_RATIO, (C.rank + 1) / 40);

            let time_ratio = 0;
            let last_tpm = 0;
            for (let i = 0; i < SeekGraph.time_columns.length; ++i) {
                const col = SeekGraph.time_columns[i];
                if (C.time_per_move <= col.time_per_move) {
                    if (C.time_per_move === 0) {
                        time_ratio = col.ratio;
                        break;
                    }

                    const alpha = (C.time_per_move - last_tpm) / (-last_tpm + col.time_per_move);
                    time_ratio = lerp(time_ratio, col.ratio, alpha);
                    break;
                }
                last_tpm = col.time_per_move;
                time_ratio = col.ratio;
            }

            const cx = Math.round(padding + (w - padding) * time_ratio);
            const cy = Math.round(h - (padding + (h - padding) * rank_ratio));

            C.cx = cx;
            C.cy = cy;

            const plot_ct_pos = time_ratio + "," + rank_ratio;
            if (!(plot_ct_pos in plot_ct)) {
                plot_ct[plot_ct_pos] = 0;
            }
            const ct = ++plot_ct[plot_ct_pos];

            /* Draw */
            let d = this.square_size;
            let sx = cx - d / 2 + 0.5;
            let sy = cy - d / 2 + 0.5;
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = "#000";
            if (C.live_game) {
                ctx.fillStyle = "#4140FF";
                ctx.strokeStyle = "#58E0FF";
            } else if (C.eligible) {
                if (C.ranked) {
                    if (C.width === 19) {
                        ctx.fillStyle = "#00aa30";
                        ctx.strokeStyle = "#00ff00";
                    } else if (C.width === 13) {
                        ctx.fillStyle = "#f000d0";
                        ctx.strokeStyle = "#ff60dd";
                    } else {
                        ctx.fillStyle = "#009090";
                        ctx.strokeStyle = "#00ffff";
                    }
                } else {
                    ctx.fillStyle = "#d06000";
                    ctx.strokeStyle = "#ff9000";
                }
                ctx.fillRect(sx, sy, d, d);
            } else if (ct === 1) {
                if (C.user_challenge) {
                    ctx.fillStyle = "#E25551";
                    ctx.strokeStyle = "#bbb";
                } else {
                    ctx.fillStyle = "#bbbbbb";
                    ctx.strokeStyle = "#bbb";
                }
                ctx.fillRect(sx, sy, d, d);
            }
            if (ct > 1) {
                const cc = Math.min(this.width < 200 ? 2 : 4, ct - 1);
                sx -= cc;
                sy -= cc;
                d += cc * 2;
            }
            if (!C.eligible) {
                ctx.strokeStyle = "#bbb";
            }
            if (C.eligible || C.live_game) {
                ctx.strokeRect(sx, sy, d, d);
            }
            ctx.restore();
        }

        //console.log("Redrawing seekgraph");
    }
    resize(w, h) {
        this.width = w;
        this.height = h;

        if (w < 200 || h < 100) {
            this.text_size = 7;
            this.padding = this.text_size + 2;
        } else {
            this.text_size = 10;
            this.padding = this.text_size + 4;
        }

        this.square_size = Math.max(Math.round(Math.min(w, h) / 100) * 2, 4);
        this.canvas.attr("width", w).attr("height", h);

        this.redraw();
    }
    drawAxes() {
        const ctx = this.canvas[0].getContext("2d");
        const w = this.canvas.width();
        const h = this.canvas.height();
        if (w < 30 || h < 30) {
            return;
        }

        ctx.font = "bold " + this.text_size + "px Verdana,Courier,Arial,serif";
        const padding = this.padding;
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;

        // assumes "accessible" is similar to "dark"
        const axis_color = $(document.body).hasClass("light") ? "#000000" : "#dddddd";

        /* Rank */
        ctx.save();

        ctx.fillStyle = axis_color;
        const word = _("Rank");
        const metrics = ctx.measureText(word);
        const yy = h / 2 + metrics.width / 2;

        ctx.translate(padding - 4 + 0.5, yy + 0.5);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(word, 0, 0);

        ctx.restore();

        /* base rank line */
        ctx.beginPath();
        ctx.moveTo(padding + 0.5, h - padding + 0.5);
        ctx.lineTo(padding + 0.5, 0);
        ctx.stroke();

        /* player rank line */
        if (!data.get("user").anonymous) {
            const rank_ratio = Math.min(MAX_RATIO, (this.userRank() + 1) / 40);
            const cy = Math.round(h - (padding + (h - padding) * rank_ratio));
            ctx.beginPath();
            ctx.strokeStyle = "#ccccff";
            ctx.moveTo(padding + 0.5, cy + 0.5);
            ctx.lineTo(w, cy + 0.5);
            ctx.stroke();
        }

        /* Time */
        const blitz_line = Math.round(SeekGraph.blitz_line_ratio * (w - padding) + padding);
        const live_line = Math.round(SeekGraph.live_line_ratio * (w - padding) + padding);

        /* primary line */
        ctx.beginPath();
        ctx.moveTo(padding + 0.5, h - padding + 0.5);
        ctx.lineTo(w, h - padding + 0.5);
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.stroke();

        /* blitz and live lines */
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(padding + 0.5 + blitz_line, h - padding + 0.5);
        ctx.lineTo(padding + 0.5 + blitz_line, 0);
        ctx.moveTo(padding + 0.5 + live_line, h - padding + 0.5);
        ctx.lineTo(padding + 0.5 + live_line, 0);
        ctx.strokeStyle = "#aaaaaa";
        try {
            ctx.setLineDash([2, 3]);
        } catch (e) {
            // ignore error
        }
        ctx.stroke();
        ctx.restore();

        ctx.save();
        try {
            ctx.fillStyle = axis_color;
            let word = _("Blitz");
            let metrics = ctx.measureText(word);
            ctx.fillText(word, padding + (blitz_line - metrics.width) / 2, h - 2);

            word = _("Normal");
            metrics = ctx.measureText(word);
            ctx.fillText(
                word,
                padding + blitz_line + (live_line - blitz_line - metrics.width) / 2,
                h - 2,
            );

            word = _("Long");
            metrics = ctx.measureText(word);
            ctx.fillText(
                word,
                padding + live_line + (w - live_line - padding - metrics.width) / 2,
                h - 2,
            );
        } catch (e) {
            // ignore error
        }
        ctx.restore();
    }

    moveChallengeList(ev) {
        this.popupChallengeList(ev);
        if (this.list_locked) {
            return;
        }

        const pos = getRelativeEventPosition(ev);
        const offset = $(ev.target).offset();
        pos.x += offset.left + 10;
        pos.y += offset.top + 5;

        const win_top = window.pageYOffset || document.documentElement.scrollTop;
        const win_left = window.pageXOffset || document.documentElement.scrollLeft;
        const win_right = $(window).width() + win_left;
        const win_bottom = $(window).height() + win_top - 5;

        const list_width = this.list.width();
        const list_height = this.list.height();

        if (pos.x + list_width > win_right) {
            pos.x -= list_width + 10;
        }

        if (pos.y + list_height > win_bottom) {
            pos.y = win_bottom - list_height;
        }

        pos.x = Math.max(0, pos.x);
        pos.y = Math.min(pos.y, win_bottom + list_height);

        this.list.css({ left: pos.x, top: pos.y });
    }
    popupChallengeList(ev) {
        if (this.list_open) {
            return;
        }
        this.list_open = true;

        if (this.list_hits.length === 0) {
            return;
        }

        const list = (this.list = $("<div>").addClass("SeekGraph-challenge-list"));

        const first_hit = this.list_hits[0];
        const header = $("<div>").addClass("header");
        header.append(
            $("<span>").html(rankString({ ranking: first_hit.rank, pro: first_hit.pro })),
        );
        header.append(
            $("<i>")
                .addClass("fa fa-times pull-right")
                .click(() => {
                    this.list_locked = false;
                    this.closeChallengeList();
                }),
        );
        if (first_hit.time_per_move) {
            header.append(
                $("<span>")
                    .addClass("pull-right")
                    .html(
                        "~" +
                            shortDurationString(first_hit.time_per_move).replace(/ /g, "") +
                            "/move",
                    ),
            );
        } else {
            header.append($("<span>").addClass("pull-right").html(_("No time limit")));
        }
        list.append(header);

        for (let i = 0; i < this.list_hits.length; ++i) {
            const C = this.list_hits[i];
            if (i >= 5 && !C.user_challenge) {
                continue;
            }

            /* process hit */
            const e = $("<div>").addClass("challenge");
            if (C.eligible) {
                e.addClass("eligible");
            }
            if (!C.eligible && !C.live_game) {
                e.addClass("ineligible");
            }
            if (C.live_game) {
                e.addClass("live-game");
            }
            if (!C.user_challenge) {
                e.addClass("user-challenge");
            }

            if (C.live_game) {
                const anchor = $("<span>")
                    .addClass("fakelink")
                    .click((ev) => {
                        console.log("Should be closing challenge list");
                        this.list_locked = false;
                        this.closeChallengeList();
                        browserHistory.push("/game/" + C.game_id);
                    })
                    .append($("<i>").addClass("fa fa-eye").attr("title", _("View Game")));
                e.append(anchor);
            } else if (C.eligible && !C.rengo) {
                e.append(
                    $("<i>")
                        .addClass("fa fa-check-circle")
                        .attr("title", _("Accept game"))
                        .click((ev) => {
                            openGameAcceptModal(C)
                                .then((ev) => {
                                    this.list_locked = false;
                                    this.closeChallengeList();
                                    browserHistory.push("/game/" + C.game_id);

                                    /*
                        let anchor = $("<span>").addClass("fakelink").click((ev) => {
                            browserHistory.push("/game/" + C.game_id);
                        }).text(_("Game started, click to continue"));
                        e.empty().append(anchor);
                        */
                                })
                                .catch(errorAlerter);
                        }),
                );
            } else if (C.eligible && C.rengo && !C.joined_rengo) {
                e.append(
                    $("<i>")
                        .addClass("fa fa-check-circle")
                        .attr("title", _("Join rengo game"))
                        .click((ev) => {
                            nominateForRengoChallenge(C);
                            this.list_locked = false;
                            this.closeChallengeList();
                        }),
                );
            } else if (C.user_challenge) {
                e.append(
                    $("<i>")
                        .addClass("fa fa-trash-o")
                        .attr("title", _("Remove challenge"))
                        .click((ev) => {
                            //console.log("Remove");
                            del("challenges/%%", C.challenge_id)
                                .then((ev) => e.html(_("Challenge removed")))
                                .catch((response) => swal(_("Error removing challenge")));
                        }),
                );
            } else {
                e.append($("<i>").addClass("fa fa-circle"));
            }

            if (C.live_game) {
                let f = $("<span>");
                e.append(f);
                ReactDOM.render(
                    <Player
                        user={{ user_id: 0, ranking: C.black_rank, username: C.black_username }}
                        rank
                        nolink
                    />,
                    f[0],
                );
                e.append($("<span>").text(" " + _("vs.") + " "));
                f = $("<span>");
                e.append(f);
                ReactDOM.render(
                    <Player
                        user={{ user_id: 0, ranking: C.white_rank, username: C.white_username }}
                        rank
                        nolink
                    />,
                    f[0],
                );
            } else {
                const f = $("<span>");
                e.append(f);
                const U = player_cache.lookup(C.user_id) || {
                    user_id: C.user_id,
                    ranking: C.rank,
                    username: C.username,
                };
                ReactDOM.render(<Player user={U} rank disableCacheUpdate />, f[0]);

                let details_html =
                    ", " +
                    (C.ranked ? _("Ranked") : _("Unranked")) +
                    ", " +
                    C.width +
                    "x" +
                    C.height +
                    (C.handicap === 0
                        ? ", " + _("no handicap")
                        : C.handicap < 0
                        ? ""
                        : interpolate(_(", %s handicap"), [C.handicap])) +
                    (C.disable_analysis ? ", " + _("analysis disabled") : "");
                if (C.challenger_color !== "automatic") {
                    let yourcolor = "";
                    if (C.challenger_color === "black") {
                        yourcolor = _("white");
                    } else if (C.challenger_color === "white") {
                        yourcolor = _("black");
                    } else {
                        yourcolor = _(C.challenger_color);
                    }

                    details_html +=
                        ", " + interpolate(pgettext("color", "you play as %s"), [yourcolor]);
                }

                if (C.time_control !== "none") {
                    try {
                        details_html +=
                            ", " +
                            interpolate(pgettext("time control", "%s %s timing"), [
                                shortShortTimeControl(C.time_control_parameters),
                                timeControlSystemText(C.time_control),
                            ]);
                    } catch (err) {
                        // ignore error
                    }
                }

                if (C.time_control_parameters.pause_on_weekends) {
                    details_html += ", " + _("pause on weekends");
                }

                if (C.name.length > 3) {
                    details_html += ', "' + $("<div>").text(C.name).html() + '"';
                }

                if (!data.get("user").anonymous) {
                    if (C.min_rank > this.userRank()) {
                        details_html +=
                            ", <span class='cause'>" +
                            interpolate(_("min. rank: %s"), [rankString(C.min_rank)]) +
                            "</span>";
                    } else if (C.max_rank < this.userRank()) {
                        details_html +=
                            ", <span class='cause'>" +
                            interpolate(_("max. rank: %s"), [rankString(C.max_rank)]) +
                            "</span>";
                    } else if (C.ranked && Math.abs(this.userRank() - C.rank) > 9) {
                        details_html +=
                            ", <span class='cause'>" + _("rank difference more than 9") + "</span>";
                    }
                }

                //console.log(C.ranked, Math.abs(this.userRank() - C.rank));
                e.append($("<span>").addClass("details").html(details_html));
            }

            list.append(e);
        }

        $(document.body).append(list);
        this.moveChallengeList(ev);
    }
    closeChallengeList(ev?) {
        if (this.modal) {
            removeModal(this.modal);
        }

        if (!this.list_open) {
            return;
        }
        if (this.list_locked) {
            return;
        }

        this.list_open = false;
        this.list.remove();
    }
}

/* Modal stuff  */
function createModal(close_callback, priority) {
    let modal = null;
    function onClose() {
        close_callback();
        removeModal(modal);
    }

    if (!priority) {
        priority = 900; /* matches default modal z-index */
    }

    const elt = $("<div>").addClass("ogs-modal");
    elt.click(onClose);
    const binding = kb_bind("escape", onClose, priority);
    modal = { modal: elt, binding: binding };
    elt.css("zIndex", priority);
    $(document.body).append(elt);
    return modal;
}

function removeModal(modal) {
    kb_unbind(modal.binding);
    modal.modal.remove();
}

/*
$(document).on('keydown', function(event) {
    if (event.keyCode === 27) {
        var arr = [];
        $(".ogs-modal").each(function(_, e) {
            e = $(e);
            arr.push([e.zIndex(), e]);
        });
        if (arr.length > 0) {
            arr.sort(function(a,b) { return a[0] - b[0]; });
            var last = arr[arr.length-1];
            var cb = last[1].data('modal-close-callback');
            if (!cb) throw new Error("Modal was missing close callback");
            cb();

            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (event.preventDefault) {
                event.preventDefault();
            }
            return false;
        }
    }
    return true;
});
*/
