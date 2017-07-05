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
import {_, pgettext, interpolate} from "translate";
import {Link} from "react-router";
import {post, get, put, patch} from "requests";
import config from "config";
import data from "data";
import * as moment from "moment";
import {Resolver} from "Resolver";
import {errorAlerter} from "misc";
import * as player_cache from "player_cache";
import {getPrivateChat} from "PrivateChat";
import {find_rank_short_string} from "compatibility/Rank";


interface UserProperties {
    params: any;
    // id?: any,
    // user?: any,
    // callback?: ()=>any,
}

export class RatingHistory extends Resolver<UserProperties, any> {
    user_id: number;

    constructor(props) {
        super(props);
        this.state = {
            user: null,
        };

    }

    resolve(props) {
        this.setState({"user": null});
        this.user_id = parseInt(props.params.user_id || data.get("config.user").id);
        return get(`players/${this.user_id}/full`).then((state) => {
            try {
                //console.log(state);
                player_cache.update(state);
                this.update(state);
            } catch (err) {
                console.error(err.stack);
            }
        }).catch((err) => {
            console.error(err);
            this.setState({"user": null});
        });
    }

    update(state) {
        let user = state.user;

        this.on("unmount", () => $("#rating-history-tooltip").remove());

        this.setState(state);
    }

    pm() { /* {{{ */
        getPrivateChat(this.user_id).open();
    } /* }}} */

    resolvedRender() {
        let user = this.state.user;
        if (!user) { return this.renderInvalidUser(); }

        /* any dom binding stuff needs to happen after the template has been
         * processed and added to the dom, this can be done with a 0ms timer */
        let domWorkScaleback = 1;
        let doDomWork = () => { /* {{{ */
             if ($("#rating-history").length === 0) {
                 console.log("Dom wasn't ready, retrying shortly");
                 if (this.mounted) {
                     setTimeout(doDomWork, (domWorkScaleback = domWorkScaleback * 1.2 + 10));
                 }
                 return;
             }

            let overall = [];
            let d = {
                "overall": [],
                "blitz": [],
                "live": [],
                "correspondence": [],
            };
            let d2 = [];
            let rating_history = this.state.rating_history;
            let min_time = Date.now();
            let max_time = 0;

            let total_points = 0;
            let times = [];
            for (let k in d) {
                for (let i = 0; i < rating_history[k].length; ++i) {
                    min_time = Math.min(min_time, rating_history[k][i].t * 1000);
                    max_time = Math.max(max_time, rating_history[k][i].t * 1000);
                    d[k].push([rating_history[k][i].t, rating_history[k][i].e]);
                    ++total_points;
                    times.push(rating_history[k][i].t);
                }
            }

            times = times.sort();
            let times_hash = {};
            for (let i = 0; i < times.length; ++i) {
                times_hash[times[i]] = i;
            }

            function lookupIndexFromTime(t) {
                return times_hash[t];
            }
            for (let k in d) {
                for (let i = 0; i < d[k].length; ++i) {
                    d[k][i][0] = lookupIndexFromTime(d[k][i][0]);
                }
            }

            function showTooltip(x, y, contents) {
                let w = $(window).width();
                let h = $(window).height();
                let l;
                let r;
                let t;
                let b;
                if (x > (w / 2)) {
                    l = "auto";
                    r = w - x + 5;
                } else {
                    l = x - 5;
                    r = "auto";
                }
                if (y > (h / 2)) {
                    t = "auto";
                    b = h - y + 5;
                } else {
                    t = y - 5;
                    b = "auto";
                }
                $("<div id='rating-history-tooltip'>" + contents + "</div>").css({
                    position: "absolute",
                    display: "none",
                    left: l,
                    right: r,
                    top: t,
                    bottom: b,
                    border: "1px solid #000",
                    color: "#fff",
                    padding: "2px",
                    "background-color": "#000",
                    opacity: 0.80
                }).appendTo("body").fadeIn(200);
            }
            let previousPoint = null;
            let series_array_src = [rating_history["overall"], rating_history["blitz"], rating_history["live"], rating_history["correspondence"]];
            let series_array = [d["overall"], d["blitz"], d["live"], d["correspondence"]];
            try {
                $.plot($("#rating-history"), series_array, {
                    series: {
                        lines: { show: true },
                        points: { show: false },
                        shadowSize: 3
                    },
                    colors: [
                        "#086C9C",
                        "#F74D00",
                        "#F7A100",
                        "#5D0CA6"
                        //"#05A658",
                        //"#EE4207",
                        //"#EEAA07",
                        //"#1831A2"
                    ],
                    labelFormatter: (label, series) => {
                        // series is the series object for the label
                        return '<a href="#' + label + '">' + label + "</a>";
                    },
                    grid: {
                        hoverable: true,
                        clickable: true,
                        borderWidth: 1,
                    },
                    //xaxis: { zoomRange: [0.1, 10], panRange: [-10, 10] },
                    //xaxis: { zoomRange: [0.1, 10], panRange: [-10, 10] },
                    //yaxis: { zoomRange: [0.1, 10], panRange: [-10, 10] },
                    xaxis: {
                        //zoomRange: [0, rating_history.length-1],
                        //panRange: [min_time, max_time],
                        panRange: [0, times.length + 5],
                        //min: d['overall'] ? d['overall'][Math.max(0,d['overall'].length-50)][0] : 0,
                        show: false,
                        //mode: "time"
                    },
                    yaxis: { zoomRange: [30, 5000], panRange: [-1500, 3300] },
                    zoom: { interactive: true },
                    pan: { interactive: true },
                });
            } catch (e) {
                console.error(e);
            }

            previousPoint = null;
            let lock_view = false;
            $("#rating-history").on("plothover", (event, pos, item) => {
                if (item) {
                    if (previousPoint !== item.dataIndex && !lock_view) {
                        previousPoint = item.dataIndex;

                        let series_class =  "fa fa-circle-o";
                        switch (item.seriesIndex) {
                            case 1: series_class = "fa fa-bolt"; break;
                            case 2: series_class = "fa fa-clock-o"; break;
                            case 3: series_class = "ogs-turtle"; break;
                        }

                        $("#rating-history-tooltip").remove();
                        let x = item.datapoint[0].toFixed(2);
                        let y = item.datapoint[1].toFixed(2);
                        let obj = series_array_src[item.seriesIndex][item.dataIndex];

                        let how = _("Manually changed");

                        let extra = "";
                        if (obj.moderator) {
                            how = _("Changed by moderator");
                            extra += obj.moderator.username + "<br/>";
                        }

                        if (obj.note) {
                            if (obj.note === "mass system adjustment") {
                                how = _("Mass system adjustment");
                            } else {
                                how = _(obj.note);
                            }
                        }

                        let body = "" +
                            "<div style='text-align: center;'>" +
                            '<span class="pull-left">' + parseFloat(obj.e).toFixed(1) + "</span><i class='" + series_class + "'></i><span class='pull-right'>" + find_rank_short_string(obj.r) + "</span>" + "</div>" +
                            (obj.g ? "<a href='/game/" + obj.g + "'>" + _("Game") + " " + obj.g + "</a>" : how) + "<br/>" +
                            extra +
                            "<i>" + (new Date(obj.t * 1000).toLocaleString()) + "</i>";

                        showTooltip(item.pageX, item.pageY, body);
                    }
                } else {
                    if (!lock_view) {
                        $("#rating-history-tooltip").remove();
                        previousPoint = null;
                    }
                }
            });

            $("#rating-history").on("plotclick", (event, pos, item) => {
                lock_view = !lock_view;
                if (!lock_view) {
                    $("#rating-history-tooltip").remove();
                    previousPoint = null;
                }
            });

        }; /* }}} */
        setTimeout(doDomWork, 0); /* }}} */

        return (
          <div className="RatingHistory container">
              <h1>{interpolate(_("Rating History for {{username}}"), {"username": user.username})}</h1>
              <div className="RatingHistory" id="rating-history"></div>
          </div>
        );
    }
    renderInvalidUser() {
        if (this.resolved) {
            return (
            <div className="RatingHistory flex stetch">
                <div className="container flex fill center-both">
                <h3>{_("User not found")}</h3>
                </div>
            </div>
            );
        }
        return (
        <div className="RatingHistory flex stetch">
            <div className="container flex fill center-both">
            </div>
        </div>
        );
    }
}
