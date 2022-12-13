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
import * as ReactDOM from "react-dom/client";
import { browserHistory } from "ogsHistory";
import { _, pgettext, interpolate } from "translate";
import { del } from "requests";
import { socket } from "sockets";
import { TypedEventEmitter } from "TypedEventEmitter";
import * as data from "data";
import { openGameAcceptModal } from "GameAcceptModal";
import { shortDurationString, shortShortTimeControl, timeControlSystemText } from "TimeControl";
import { getRelativeEventPosition, errorAlerter } from "misc";
import { rankString, bounded_rank, MaxRank } from "rank_utils";
import { kb_bind, kb_unbind, Binding } from "KBShortcut";
import { Player } from "Player";
import { computeAverageMoveTime, validateCanvas } from "goban";
import * as player_cache from "player_cache";

import { nominateForRengoChallenge } from "rengo_utils";
import { alert } from "swal_config";
import { Socket } from "socket.io-client";
import { SeekGraphColorPalette, SeekGraphPalettes } from "./SeekGraphPalettes";
import * as SeekGraphSymbols from "./SeekGraphSymbols";

import { Challenge, ChallengeFilter, shouldDisplayChallenge } from "challenge_utils";

interface AnchoredChallenge extends Challenge {
    x?: number;
    y?: number;
    joined_rengo?: boolean;
}

interface Point {
    x: number;
    y: number;
}

interface SeekGraphModal {
    modal: JQuery;
    binding: Binding;
}

interface Events {
    challenges: Challenge[];
}

interface SeekGraphConfig {
    canvas: HTMLCanvasElement;
    filter: ChallengeFilter;
}

const MAX_RATIO = 0.99;

function rankRatio(rank: number): number {
    return Math.min(MAX_RATIO, (rank + 1) / (MaxRank + 1));
}

function timeRatio(tpm: number): number {
    let time_ratio = 0;
    let last_tpm = 0;
    for (let i = 0; i < SeekGraph.time_columns.length; ++i) {
        const col = SeekGraph.time_columns[i];
        if (tpm <= col.time_per_move) {
            if (tpm === 0) {
                time_ratio = col.ratio;
                break;
            }

            const alpha = (tpm - last_tpm) / (-last_tpm + col.time_per_move);
            time_ratio = lerp(time_ratio, col.ratio, alpha);
            break;
        }
        last_tpm = col.time_per_move;
        time_ratio = col.ratio;
    }
    return time_ratio;
}

function dist(C: AnchoredChallenge, pos: Point) {
    const dx = C.x - pos.x;
    const dy = C.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function lerp(v1: number, v2: number, alpha: number) {
    return (1.0 - alpha) * v1 + alpha * v2;
}

/** Most important/relevant challenges will come first */
function priority_sort(A: Challenge, B: Challenge) {
    if (A.user_challenge && !B.user_challenge) {
        return -1;
    }
    if (!A.user_challenge && B.user_challenge) {
        return 1;
    }

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
function lists_are_equal(A: Challenge[], B: Challenge[]) {
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
    static blitz_line_ratio = 0.125;
    static live_line_ratio = 0.6;
    static time_columns = [
        { ratio: 0.97, time_per_move: 0 },
        { ratio: 0.000001, time_per_move: 1 },

        /* blitz */
        { ratio: 0.125, time_per_move: 10 },

        /* live */
        { ratio: 0.2, time_per_move: 15 },
        { ratio: 0.25, time_per_move: 20 },
        { ratio: 0.3, time_per_move: 30 },
        { ratio: 0.35, time_per_move: 60 },
        { ratio: 0.4, time_per_move: 120 },
        { ratio: 0.5, time_per_move: 300 },
        { ratio: 0.6, time_per_move: 3600 },

        /* long */
        { ratio: 0.65, time_per_move: 10800 },
        { ratio: 0.7, time_per_move: 21600 },
        { ratio: 0.75, time_per_move: 43200 },
        { ratio: 0.8, time_per_move: 86400 },
        { ratio: 0.85, time_per_move: 172800 },
        { ratio: 0.9, time_per_move: 259200 },
        { ratio: 0.95, time_per_move: 604800 },
    ];

    canvas: HTMLCanvasElement;
    $canvas: JQuery;
    // show_live_games: boolean;
    socket: Socket;
    connected: boolean = false;
    // This is treated as an array later because that is what TypedEventEmitter expects.
    // Perhaps this should be changed to an array as well.
    challenges: { [id: number]: AnchoredChallenge } = {};
    challengeFilter: ChallengeFilter;
    // live_games: any = {};
    list_hits: Array<AnchoredChallenge> = [];
    // challenge_points: any = {};
    square_size = 8;
    text_size = 10;
    padding = 14;
    legend_size = 25;
    list_locked: boolean = false;
    modal?: SeekGraphModal = null;
    $list: JQuery;
    list_open: boolean = false;
    width: number;
    height: number;

    constructor(config: SeekGraphConfig) {
        super();

        this.canvas = config.canvas;
        this.$canvas = $(config.canvas);
        // this.show_live_games = config.show_live_games;
        this.socket = socket;
        this.list_hits = [];
        this.challengeFilter = config.filter;
        this.redraw();

        if (this.socket.connected) {
            this.onConnect();
        }

        this.socket.on("connect", this.onConnect);
        this.socket.on("seekgraph/global", this.onSeekgraphGlobal);
        this.$canvas.on("mousemove", this.onPointerMove);
        this.$canvas.on("mouseout", this.onPointerOut);
        this.$canvas.on("click", this.onPointerDown);

        $(document).on("touchend", this.onTouchEnd);
        $(document).on("touchstart touchmove", this.onTouchStartMove);

        data.watch("theme", () => {
            this.redraw();
        });
    }

    userRank() {
        const user = data.get("user");
        if (!user || user.anonymous) {
            return 18;
        }
        return bounded_rank(user);
    }

    onConnect = () => {
        this.connected = true;
        this.socket.send("seek_graph/connect", { channel: "global" });
        // if (this.show_live_games) {
        //     this.connectToLiveGameList();
        // }
    };

    onSeekgraphGlobal = (lst) => {
        const this_userid = data.get("user").id;
        // lst contains entries that tell us what to do with our local challenge list.
        for (let i = 0; i < lst.length; ++i) {
            const entry = lst[i];
            if ("game_started" in entry) {
                // rengo "other players" on this page need to be sent to the game when it starts
                // the creator already gets sent, by the normal challenge modal mechanism
                if (entry.rengo && entry.creator !== this_userid) {
                    if (
                        entry.rengo_black_team.concat(entry.rengo_white_team).includes(this_userid)
                    ) {
                        browserHistory.push(`/game/${entry.game_id}`);
                    }
                }
            } else if ("delete" in entry) {
                if (entry.challenge_id in this.challenges) {
                    const uid = this.challenges[entry.challenge_id].system_message_id;
                    delete this.challenges[entry.challenge_id];
                    if (uid) {
                        //console.log("#line-" + (uid.replace(".", "\\.")));
                        $("#line-" + uid.replace(".", "\\."))
                            .find("button")
                            .remove();
                    }
                }
            } else {
                // the entry has details of a challenge we need to list
                entry.user_challenge = false;
                entry.joined_rengo = entry.rengo && entry.rengo_participants.includes(this_userid);

                if (data.get("user").anonymous) {
                    entry.eligible = false;
                    entry.ineligible_reason = _("Not logged in");
                } else if (entry.user_id === data.get("user").id) {
                    entry.eligible = false;
                    entry.user_challenge = true;
                    entry.ineligible_reason = _("This is your challenge");
                } else if (entry.ranked && Math.abs(this.userRank() - entry.rank) > 9) {
                    entry.eligible = false;
                    entry.ineligible_reason = _(
                        "This is a ranked game and the rank difference is more than 9",
                    );
                } else if (entry.min_rank <= this.userRank() && entry.max_rank >= this.userRank()) {
                    entry.eligible = true;
                } else {
                    entry.eligible = false;

                    if (entry.min_rank > this.userRank()) {
                        entry.ineligible_reason = interpolate(_("min. rank: %s"), [
                            rankString(entry.min_rank),
                        ]);
                    } else if (entry.max_rank < this.userRank()) {
                        entry.ineligible_reason = interpolate(_("max. rank: %s"), [
                            rankString(entry.max_rank),
                        ]);
                    }
                }
                this.challenges[entry.challenge_id] = entry;
            }
        }
        this.redraw();
        this.emit("challenges", this.challenges as Challenge[]);
    };

    onTouchEnd = (ev: JQueryEventObject) => {
        if (ev.target === this.canvas) {
            this.onPointerDown(ev);
        }
    };
    onTouchStartMove = (ev: JQueryEventObject) => {
        if (ev.target === this.canvas) {
            this.onPointerMove(ev);
            ev.preventDefault();
            return false;
        }
    };
    onPointerMove = (ev: JQueryEventObject) => {
        const new_list = this.getHits(ev);
        new_list.sort(priority_sort);
        if (!lists_are_equal(new_list, this.list_hits)) {
            this.closeChallengeList();
        }
        this.list_hits = new_list;
        if (this.list_hits.length) {
            this.moveChallengeList(ev);
        } else if (this.list_open) {
            this.closeChallengeList();
        }
    };
    onPointerDown = (ev: JQueryEventObject) => {
        const new_list = this.getHits(ev);
        new_list.sort(priority_sort);
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
    onPointerOut = () => {
        if (!this.list_locked) {
            this.closeChallengeList();
        }
    };

    // connectToLiveGameList() {
    //     this.socket.send("gamelist/subscribe", { gamelist: "gamelist/global" });
    // }
    // setShowLiveGames(tf) {
    //     const changed = tf !== this.show_live_games;
    //     this.show_live_games = tf;
    //     if (changed) {
    //         if (tf) {
    //             this.connectToLiveGameList();
    //         } else {
    //             this.socket.send("gamelist/unsubscribe", {});
    //         }
    //         this.redraw();
    //     }
    // }
    destroy() {
        this.list_locked = false;
        this.closeChallengeList();
        // this.setShowLiveGames(false);
        if (this.connected) {
            this.socket.send("seek_graph/disconnect", { channel: "global" });
        }

        this.socket.off("connect", this.onConnect);
        this.socket.off("seekgraph/global", this.onSeekgraphGlobal);

        $(document).off("touchend", this.onTouchEnd);
        $(document).off("touchstart touchmove", this.onTouchStartMove);
    }

    getHits(ev: JQueryEventObject) {
        const pos = getRelativeEventPosition(ev);

        if (!pos) {
            return [];
        }

        const hitTolerance = 1.25 * this.square_size;
        return Object.values(this.challenges).filter((c: Challenge) => {
            return dist(c, pos) < hitTolerance && shouldDisplayChallenge(c, this.challengeFilter);
        });
    }

    setFilter(f: ChallengeFilter) {
        this.challengeFilter = f;
        this.redraw();
    }

    redraw() {
        validateCanvas(this.canvas);
        const ctx = this.canvas.getContext("2d");

        ctx.clearRect(0, 0, this.width, this.height);

        const siteTheme = data.get("theme");
        const palette = SeekGraphPalettes.getPalette(siteTheme);
        this.drawAxes(ctx, palette);
        this.drawLegend(ctx, palette);

        // const plot_ct = {};
        const sorted: AnchoredChallenge[] = Object.values(this.challenges)
            .filter((c) => shouldDisplayChallenge(c, this.challengeFilter))
            .sort(priority_sort)
            .reverse();

        /* Plot our challenges */
        for (let j = 0; j < sorted.length; ++j) {
            const C = sorted[j];

            const rank_ratio = rankRatio(C.rank);
            const tpm = computeAverageMoveTime(C.time_control_parameters, C.width, C.height);
            const time_ratio = timeRatio(tpm);

            const cx = this.xCoordinate(time_ratio);
            const cy = this.yCoordinate(rank_ratio);

            C.x = cx;
            C.y = cy;

            // const plot_ct_pos = time_ratio + "," + rank_ratio;
            // if (!(plot_ct_pos in plot_ct)) {
            //     plot_ct[plot_ct_pos] = 0;
            // }
            // const _ct = ++plot_ct[plot_ct_pos];

            const style = SeekGraphPalettes.getStyle(C, palette);
            if (C.ranked) {
                SeekGraphSymbols.drawChallengeSquare(cx, cy, this.square_size, style, ctx);
            } else if (C.rengo) {
                SeekGraphSymbols.drawChallengeCircle(cx, cy, this.square_size / 2, style, ctx);
            } else {
                SeekGraphSymbols.drawChallengeTriangle(cx, cy, this.square_size, style, ctx);
            }
        }

        //console.log("Redrawing seekgraph");
    }

    resize(w, h) {
        this.width = w;
        this.height = h;

        if (w < 295 || h < 100) {
            this.text_size = 7;
        } else {
            this.text_size = 10;
        }

        this.square_size = Math.max(Math.round(Math.min(w, h) / 100) * 2, 4);

        // See https://coderwall.com/p/vmkk6a/how-to-make-the-canvas-not-look-like-crap-on-retina
        // and https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
        // Instead of scaling based on devicePixelRatio, I just scale by 2 always, which seems to
        // improve the quality of rendering even on MDPI devices and prevents needing the half-point
        // adjustment trick used previously (https://stackoverflow.com/questions/39943737/html5-canvas-translate0-5-0-5-not-fixing-line-blurryness)
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        const scale = 2;
        this.canvas.width = w * scale;
        this.canvas.height = h * scale;

        const ctx = this.canvas.getContext("2d");
        ctx.scale(scale, scale);

        this.padding = this.getFontHeight(ctx) + 4;

        this.redraw();
    }

    drawAxes(ctx: CanvasRenderingContext2D, palette: SeekGraphColorPalette) {
        const w = this.width;
        const h = this.height;
        const padding = this.padding;

        if (w < 30 || h < 30) {
            return;
        }

        ctx.font = "bold " + this.text_size + "px Verdana,Courier,Arial,serif";
        ctx.lineWidth = 1;

        /* Rank */
        ctx.save();

        ctx.fillStyle = palette.textColor;
        const word = _("Rank");
        const metrics = ctx.measureText(word);
        const yy = this.yCoordinate(0.5) + metrics.width / 2;

        ctx.translate(padding - 4, yy);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(word, 0, 0);

        ctx.restore();

        /* base rank line */
        ctx.strokeStyle = palette.axisColor;
        ctx.beginPath();
        ctx.moveTo(padding, h - padding);
        ctx.lineTo(padding, this.legend_size);
        ctx.stroke();

        /* primary line */
        ctx.beginPath();
        ctx.moveTo(padding, h - padding);
        ctx.lineTo(w, h - padding);
        ctx.strokeStyle = palette.axisColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        /* blitz and live lines */
        const blitz_line = this.xCoordinate(SeekGraph.blitz_line_ratio);
        const live_line = this.xCoordinate(SeekGraph.live_line_ratio);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(blitz_line, h - padding);
        ctx.lineTo(blitz_line, this.legend_size);
        ctx.moveTo(live_line, h - padding);
        ctx.lineTo(live_line, this.legend_size);
        ctx.strokeStyle = palette.timeLineColor;
        try {
            ctx.setLineDash([2, 3]);
        } catch (e) {
            // ignore error
        }
        ctx.stroke();
        ctx.restore();

        /* player rank line */
        if (!data.get("user").anonymous) {
            ctx.save();
            const rank_ratio = rankRatio(this.userRank());
            const cy = this.yCoordinate(rank_ratio);
            ctx.beginPath();
            ctx.strokeStyle = palette.rankLineColor;
            ctx.moveTo(padding, cy);
            ctx.lineTo(w, cy);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        try {
            ctx.fillStyle = palette.textColor;
            const fontHeight = this.getFontHeight(ctx);
            const baseline = h - padding + fontHeight;

            let word = _("Blitz");
            let metrics = ctx.measureText(word);
            ctx.fillText(word, padding + (blitz_line - padding - metrics.width) / 2, baseline);

            word = _("Live");
            metrics = ctx.measureText(word);
            ctx.fillText(word, blitz_line + (live_line - blitz_line - metrics.width) / 2, baseline);

            word = _("Correspondence");
            metrics = ctx.measureText(word);
            ctx.fillText(word, live_line + (w - live_line - metrics.width) / 2, baseline);
        } catch (e) {
            // ignore error
        }
        ctx.restore();
    }

    drawLegend(ctx: CanvasRenderingContext2D, palette: SeekGraphColorPalette) {
        const iconWidth = 20;
        const iconHeight = this.square_size;
        const iconGap = 5;
        const spacing = 10;
        const legendCenterY = this.legend_size / 2;
        const myRank = _("My rank");
        const myChallenges = _("My challenges");
        const myRankMetrics = ctx.measureText(myRank);
        const myChallengesMetrics = ctx.measureText(myChallenges);
        const legendWidth =
            2 * (iconWidth + iconGap) + myRankMetrics.width + myChallengesMetrics.width + spacing;
        const legendStart = this.padding + (this.width - this.padding) / 2 - legendWidth / 2;

        let x = legendStart;
        ctx.save();
        ctx.strokeStyle = palette.rankLineColor;
        ctx.beginPath();
        ctx.moveTo(x, legendCenterY);
        ctx.lineTo(x + iconWidth, legendCenterY);
        ctx.stroke();

        x += iconWidth + iconGap;
        ctx.fillStyle = palette.textColor;
        ctx.font = this.text_size + "px Verdana,Courier,Arial,serif";
        ctx.fillText(myRank, x, legendCenterY + myRankMetrics.actualBoundingBoxAscent / 2);

        x += myRankMetrics.width + spacing;
        SeekGraphSymbols.drawLegendKey(
            x + iconWidth / 2,
            legendCenterY,
            iconWidth,
            iconHeight,
            iconHeight / 2,
            palette.user,
            ctx,
        );

        x += iconWidth + iconGap;
        ctx.fillText(
            myChallenges,
            x,
            legendCenterY + myChallengesMetrics.actualBoundingBoxAscent / 2,
        );
        ctx.restore();
    }

    xCoordinate(timeRatio: number): number {
        return this.padding + (this.width - this.padding) * timeRatio;
    }

    yCoordinate(rankRatio: number): number {
        const usableHeight = this.height - this.padding - this.legend_size;
        return this.height - (this.padding + usableHeight * rankRatio);
    }

    getFontHeight(ctx: CanvasRenderingContext2D) {
        const metrics = ctx.measureText("ABCgy");
        if (metrics.fontBoundingBoxAscent) {
            return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        }
        // Firefox
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }

    moveChallengeList(ev) {
        this.popupChallengeList(ev);
        if (this.list_locked) {
            return;
        }

        // If the list is randomly not showing when mousing over a certain spot, the following scenario is a likely culprit:
        // 1. The list is positioned somewhere on screen
        // 2. The list position is adjusted so the list doesn't go off the bottom or edge of the graph/window
        // 3. This repositioning causes the list to intersect the current pointer position
        // 4. This causes the "mouseout" event, which triggers closing the list
        // The above was occurring for long lists on the bottom right of the seek graph (and was fixed),
        // but this function should probably be improved further

        const pointerPos: Point = getRelativeEventPosition(ev);
        const listAnchor: Point = Object.assign({}, pointerPos);

        const offset = $(ev.target).offset();
        listAnchor.x += offset.left + 10;
        listAnchor.y += offset.top + 5;

        const win_top = window.scrollY || document.documentElement.scrollTop;
        const win_left = window.scrollX || document.documentElement.scrollLeft;
        const win_right = $(window).width() + win_left;
        const win_bottom = $(window).height() + win_top;

        const list_width = this.$list.width();
        const list_height = this.$list.height();

        if (listAnchor.x + list_width > win_right) {
            listAnchor.x -= list_width + 20;
        }

        if (listAnchor.y + list_height > win_bottom) {
            listAnchor.y = win_bottom - list_height - 5;
        }

        listAnchor.x = Math.max(0, listAnchor.x);
        this.$list.css({ left: listAnchor.x, top: listAnchor.y });
    }
    popupChallengeList(ev) {
        if (this.list_open) {
            return;
        }
        this.list_open = true;

        if (this.list_hits.length === 0) {
            return;
        }

        const list = (this.$list = $("<div>").addClass("SeekGraph-challenge-list"));

        const first_hit = this.list_hits[0];
        const header = $("<div>").addClass("header");
        header.append(
            $("<span>").html(rankString({ ranking: first_hit.rank, pro: Boolean(first_hit.pro) })),
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
            const tpm = computeAverageMoveTime(
                first_hit.time_control_parameters,
                first_hit.width,
                first_hit.height,
            );
            header.append(
                $("<span>")
                    .addClass("pull-right")
                    .html("~" + shortDurationString(tpm).replace(/ /g, "") + "/move"),
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
            if (!C.eligible /* && !C.live_game */) {
                e.addClass("ineligible");
            }
            // if (C.live_game) {
            //     e.addClass("live-game");
            // }
            if (!C.user_challenge) {
                e.addClass("user-challenge");
            }

            // if (C.live_game) {
            //     const anchor = $("<span>")
            //         .addClass("fakelink")
            //         .click(() => {
            //             console.log("Should be closing challenge list");
            //             this.list_locked = false;
            //             this.closeChallengeList();
            //             browserHistory.push("/game/" + C.game_id);
            //         })
            //         .append($("<i>").addClass("fa fa-eye").attr("title", _("View Game")));
            //     e.append(anchor);
            // } else
            if (C.eligible && !C.rengo) {
                e.append(
                    $("<i>")
                        .addClass("fa fa-check-circle")
                        .attr("title", _("Accept game"))
                        .click(() => {
                            openGameAcceptModal(C)
                                .then(() => {
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
                        .click(() => {
                            nominateForRengoChallenge(C).catch(errorAlerter);
                            this.list_locked = false;
                            this.closeChallengeList();
                        }),
                );
            } else if (C.user_challenge) {
                e.append(
                    $("<i>")
                        .addClass("fa fa-trash-o")
                        .attr("title", _("Remove challenge"))
                        .click(() => {
                            //console.log("Remove");
                            del("challenges/%%", C.challenge_id)
                                .then(() => e.html(_("Challenge removed")))
                                .catch(() => alert.fire(_("Error removing challenge")));
                        }),
                );
            } else {
                e.append($("<i>").addClass("fa fa-circle"));
            }

            // if (C.live_game) {
            //     /* I don't think this is used anymore, I think this was for showing ongoing live games */
            //     const container = document.createElement("span");
            //     const root = ReactDOM.createRoot(container);
            //     e.append($(container));
            //     root.render(
            //         <React.StrictMode>
            //             <Player
            //                 user={{ id: 0, ranking: C.black_rank, username: C.black_username }}
            //                 rank
            //                 nolink
            //             />
            //             {" " + _("vs.") + " "}
            //             <Player
            //                 user={{ id: 0, ranking: C.white_rank, username: C.white_username }}
            //                 rank
            //                 nolink
            //             />
            //         </React.StrictMode>,
            //     );
            // } else {
            const container = document.createElement("span");
            const root = ReactDOM.createRoot(container);
            e.append($(container));
            const U = player_cache.lookup(C.user_id) || {
                user_id: C.user_id,
                ranking: C.rank,
                username: C.username,
            };
            root.render(
                <React.StrictMode>
                    <Player user={U} rank disableCacheUpdate />
                </React.StrictMode>,
            );

            let details_html =
                ", " +
                (C.rengo ? _("Rengo") + ", " : "") +
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
                            timeControlSystemText(C.time_control).toLocaleLowerCase(),
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

            list.append(e);
        }

        $(document.body).append(list);
        this.moveChallengeList(ev);
    }
    closeChallengeList() {
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
        this.$list.remove();
    }
}

/* Modal stuff  */
function createModal(close_callback, priority): SeekGraphModal {
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

function removeModal(modal: SeekGraphModal) {
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
