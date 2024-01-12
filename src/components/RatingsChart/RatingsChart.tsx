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

/* This code was derived from https://github.com/billneff79/d3-stock which
 * is a d3.js v4 port of https://github.com/arnauddri/d3-stock */

import * as d3 from "d3";
import * as moment from "moment";
import * as React from "react";
import { OgsResizeDetector } from "OgsResizeDetector";
import { _, pgettext, interpolate } from "translate";
import { PersistentElement } from "PersistentElement";
import { RatingEntry, makeRatingEntry } from "./RatingEntry";
import { errorLogger } from "misc";

import {
    rating_to_rank,
    rankString,
    is_rank_bounded,
    humble_rating,
    bounded_rank,
} from "rank_utils";

type speed_t = "overall" | "blitz" | "live" | "correspondence";

interface RatingsChartProperties {
    playerId: number;
    speed: speed_t;
    size: 0 | 9 | 13 | 19;
    updateChartSize: (height: number, width: number) => void; // callback with actual chart size on resize
}

interface RatingsChartState {
    loading: boolean;
    nodata: boolean;
    hovered_date?: Date;
    hovered_month?: Date;
    date_extents: Date[];
}

const date_bisector = d3.bisector((d: RatingEntry) => {
    return d.ended;
}).left;
const format_date = (d: Date) => moment(d).format("ll");
const format_month = (d: Date) => moment(d).format("MMM YYYY");
const margin = { top: 30, right: 20, bottom: 100, left: 20 }; // Margins around the rating chart - but win/loss bars are inside this at the bottom!
const margin2 = { top: 210, right: 20, bottom: 20, left: 20 }; // Margins around the 'timeline' chart with respect to the whole space
const chart_min_width = 64;
const chart_height = 283;
const date_legend_width = 70;
const win_loss_bars_start_y = 155;
const win_loss_bars_height = 65;
const height = chart_height - margin.top - margin.bottom;
const secondary_charts_height = chart_height - margin2.top - margin2.bottom;

export class RatingsChart extends React.Component<RatingsChartProperties, RatingsChartState> {
    container = React.createRef<HTMLDivElement>();
    chart_div!: HTMLDivElement;
    svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    clip!: d3.Selection<SVGRectElement, unknown, null, undefined>;
    resize_debounce: ReturnType<typeof setTimeout> | undefined;
    rating_graph!: d3.Selection<SVGGElement, unknown, null, undefined>; // The main timeline graph
    timeline_graph!: d3.Selection<SVGGElement, unknown, null, undefined>; // The secondary graph, where a slice of timeline can be selected to display on the main graph
    legend!: d3.Selection<SVGGElement, unknown, null, undefined>;
    dateLegend!: d3.Selection<SVGGElement, unknown, null, undefined>;
    dateLegendBackground!: d3.Selection<SVGRectElement, unknown, null, undefined>;
    dateLegendText!: d3.Selection<SVGTextElement, unknown, null, undefined>;
    range_label!: d3.Selection<SVGTextElement, unknown, null, undefined>;
    legend_label!: d3.Selection<SVGTextElement, unknown, null, undefined>;
    date_extents!: Date[];
    win_loss_aggregate?: {
        weak_wins: number;
        strong_wins: number;
        weak_losses: number;
        strong_losses: number;
    };
    win_loss_graphs: Array<any> = [];
    win_loss_bars: Array<any> = [];
    game_entries!: Array<RatingEntry>;
    games_by_month!: Array<RatingEntry>;
    games_by_day!: Array<RatingEntry>;
    max_games_played_in_a_month!: number;
    destroyed = false;

    show_pie: boolean = true;
    win_loss_pie!: d3.Selection<SVGGElement, unknown, null, undefined>;

    ratings_x = d3.scaleTime();
    timeline_x = d3.scaleTime();

    ratings_y = d3.scaleLinear();
    timeline_y = d3.scaleLinear();
    win_loss_y = d3.scaleLinear();

    selected_axis = d3.axisBottom(this.ratings_x);
    timeline_axis = d3.axisBottom(this.timeline_x);
    rating_axis = d3.axisLeft(this.ratings_y);
    rank_axis = d3.axisRight(this.ratings_y);

    rating_line = d3
        .line<RatingEntry>()
        .curve(d3.curveMonotoneX)
        .x((d: RatingEntry) => this.ratings_x(d.ended))
        .y((d: RatingEntry) => this.ratings_y(humble_rating(d.rating, d.deviation)));

    deviation_area = d3
        .area<RatingEntry>()
        .curve(d3.curveBasis)
        .x0((d: RatingEntry) => this.ratings_x(d.ended))
        .x1((d: RatingEntry) => this.ratings_x(d.ended))
        .y0((d: RatingEntry) => this.ratings_y(Math.min(d.starting_rating, d.rating) - d.deviation))
        .y1((d: RatingEntry) =>
            this.ratings_y(Math.max(d.starting_rating, d.rating) + d.deviation),
        );

    timeline_area = d3
        .area<RatingEntry>()
        .curve(d3.curveMonotoneX)
        .x((d: RatingEntry) => this.timeline_x(d.ended))
        .y0(secondary_charts_height)
        .y1((d: RatingEntry) => this.timeline_y(humble_rating(d.rating, d.deviation)));

    deviation_chart!: d3.Selection<SVGPathElement, unknown, null, undefined>;
    rating_chart!: d3.Selection<SVGPathElement, unknown, null, undefined>;
    x_axis_date_labels!: d3.Selection<SVGGElement, unknown, null, undefined>;
    y_axis_rank_labels!: d3.Selection<SVGGElement, unknown, null, undefined>;
    y_axis_rating_labels!: d3.Selection<SVGGElement, unknown, null, undefined>;
    helper!: d3.Selection<SVGGElement, unknown, null, undefined>;
    helperText!: d3.Selection<SVGTextElement, unknown, null, undefined>;
    ratingTooltip!: d3.Selection<SVGCircleElement, unknown, null, undefined>;
    mouseArea!: d3.Selection<SVGRectElement, unknown, null, undefined>;
    //verticalCrosshairLine;
    horizontalCrosshairLine!: d3.Selection<SVGLineElement, unknown, null, undefined>;
    timeline_chart!: d3.Selection<SVGPathElement, unknown, null, undefined>;
    timeline_axis_labels!: d3.Selection<SVGGElement, unknown, null, undefined>;
    brush!: d3.BrushBehavior<unknown>;
    width: number = 0; // whole width of this element
    graph_width: number = 0; // width of the part where the graph is drawn
    pie_width: number = 0; // width of the area for the pie chart
    height: number = 0;

    constructor(props: RatingsChartProperties) {
        super(props);
        this.state = {
            loading: true,
            nodata: false,
            hovered_date: undefined,
            hovered_month: undefined,
            date_extents: [],
        };
        this.chart_div = $("<div>")[0] as HTMLDivElement;
    }
    componentDidMount() {
        this.initialize();
        if (this.shouldDisplayRankInformation()) {
            this.y_axis_rank_labels?.style("display", null);
        } else {
            this.y_axis_rank_labels?.style("display", "none");
        }
    }
    componentDidUpdate(prevProps: RatingsChartProperties) {
        if (
            this.props.playerId !== prevProps.playerId ||
            this.props.speed !== prevProps.speed ||
            this.props.size !== prevProps.size
        ) {
            const size_text = this.props.size ? `${this.props.size}x${this.props.size}` : "";
            this.legend_label?.text(`${speed_translation(this.props.speed)} ${size_text}`);

            this.refreshData();
        }
        if (this.shouldDisplayRankInformation()) {
            this.y_axis_rank_labels?.style("display", null);
        } else {
            this.y_axis_rank_labels?.style("display", "none");
        }
    }
    componentWillUnmount() {
        this.deinitialize();
    }

    shouldComponentUpdate(nextProps: RatingsChartProperties, nextState: RatingsChartState) {
        if (
            this.props.playerId !== nextProps.playerId ||
            this.props.speed !== nextProps.speed ||
            this.props.size !== nextProps.size
        ) {
            return true;
        }

        if (this.state.loading !== nextState.loading || this.state.nodata !== nextState.nodata) {
            return true;
        }

        /* Otherwise, we only need to update if our win/loss stats needs updating */
        if (this.state.hovered_date !== undefined && nextState.hovered_date !== undefined) {
            if (this.state.hovered_date?.getTime() !== nextState.hovered_date.getTime()) {
                return true;
            }
        } else if (this.state.hovered_date !== nextState.hovered_date) {
            return true;
        } else if (this.state.hovered_month && nextState.hovered_month !== undefined) {
            if (is_same_month(this.state.hovered_month, nextState.hovered_month)) {
                return true;
            }
        } else if (this.state.hovered_month !== nextState.hovered_month) {
            return true;
        } else {
            if (this.state.date_extents.length !== nextState.date_extents.length) {
                return true;
            }
            if (this.state.date_extents.length === 2) {
                if (
                    this.state.date_extents[0].getTime() !== nextState.date_extents[0].getTime() ||
                    this.state.date_extents[1].getTime() !== nextState.date_extents[1].getTime()
                ) {
                    return true;
                }
            }
        }

        return false;
    }
    shouldDisplayRankInformation(): boolean {
        return this.props.size === 0 && this.props.speed === "overall";
    }

    setRanges = () => {
        const sizes = this.chart_sizes();

        this.width = sizes.width;
        this.graph_width = (2.0 * sizes.width) / 3.0;

        if (this.width > 768) {
            /* it gets too bunched up to show the pie */
            if (!this.show_pie) {
                this.show_pie = true;
                this.plotWinLossPie();
            }
        } else {
            this.show_pie = false;
            this.graph_width = this.width;
            this.hideWinLossPie();
        }

        this.pie_width = sizes.width / 3.0;

        this.height = height;

        this.ratings_x.range([0, this.graph_width]);
        this.timeline_x.range([0, this.graph_width]);
        this.ratings_y.range([height, 0]);
        this.timeline_y.range([secondary_charts_height, 0]);
        this.win_loss_y.range([win_loss_bars_height, 0]);
    };

    initialize() {
        const self = this;
        this.destroyed = false;

        this.setRanges();

        const width = this.graph_width;
        const height = this.height;

        this.rank_axis.tickFormat((rating: d3.NumberValue) => {
            const rank = Math.round(rating_to_rank(rating as number));
            if (!is_rank_bounded(rank)) {
                return rankString(rank);
            }
            return "";
        });

        const boundDataLegendX = (x: number) => {
            return Math.min(width - date_legend_width / 2, Math.max(date_legend_width / 2, x));
        };

        this.svg = d3
            .select(this.chart_div)
            .append("svg")
            .attr("class", "chart")
            .attr("width", this.width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom + win_loss_bars_height);

        this.clip = this.svg
            .append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height + margin.top + margin.bottom + win_loss_bars_height);

        this.rating_graph = this.svg
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        /* Win-loss pie chart goes to the right of the rating graph */
        const graph_right_side = this.graph_width + margin.left + margin.right;

        /* The pie chart element is positioned at the centre of the circle of the pie.
           We need to create this even if show_pie is false, because it might become true from resizing */
        this.win_loss_pie = this.svg
            .append("g")
            .attr(
                "transform",
                "translate(" +
                    (graph_right_side + this.pie_width / 2.0) +
                    "," +
                    (margin.top + this.height / 2.0 + 20) +
                    ")",
            );

        /* Win-loss bar graphs */
        for (let i = 0; i < 5; ++i) {
            this.win_loss_graphs.push(
                this.svg
                    .append("g")
                    .attr("clip-path", "url(#clip)")
                    .attr(
                        "transform",
                        "translate(" +
                            margin.left +
                            "," +
                            (margin.top + win_loss_bars_height + 20) +
                            ")",
                    )
                    .on("mouseover", () => {
                        this.helper!.style("display", null);
                        this.dateLegend!.style("display", null);
                    })
                    .on("mouseout", () => {
                        this.helper!.style("display", "none");
                        this.dateLegend!.style("display", "none");
                        this.setState({ hovered_month: undefined });
                    })
                    .on("mousemove", function (event) {
                        const x0 = self.ratings_x.invert(
                            // eslint-disable-next-line @typescript-eslint/no-invalid-this
                            d3.pointer(event, this as d3.ContainerElement)[0],
                        );

                        let d: Date | null = null;

                        for (const entry of self.games_by_month) {
                            if (is_same_month(x0, entry.ended)) {
                                d = new Date(entry.ended);
                                break;
                            }
                        }

                        if (!d) {
                            return;
                        }

                        const startOfMonth = new Date(d);
                        const endOfMonth = new Date(d);
                        startOfMonth.setDate(1);
                        startOfMonth.setHours(0, 0, 0, 0);
                        endOfMonth.setDate(1);
                        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
                        endOfMonth.setDate(-1);
                        endOfMonth.setHours(23, 59, 59, 0);
                        const midDate = new Date(
                            startOfMonth.getTime() +
                                (endOfMonth.getTime() - startOfMonth.getTime()) / 2,
                        );

                        self.helperText!.text(format_month(new Date(d)));
                        self.dateLegendText?.text(format_month(new Date(d)));
                        self.dateLegend?.attr(
                            "transform",
                            "translate(" +
                                (boundDataLegendX(self.ratings_x(midDate)) + margin.left) +
                                "," +
                                (margin.top + win_loss_bars_start_y + win_loss_bars_height + 23) +
                                ")",
                        );

                        self.setState({ hovered_month: d });
                    }),
            );
        }

        this.timeline_graph = this.svg
            .append("g")
            .attr("class", "timeline")
            .attr(
                "transform",
                "translate(" + margin2.left + "," + (margin2.top + win_loss_bars_height) + ")",
            );

        this.legend = this.svg
            .append("g")
            .attr("transform", "translate(" + margin2.left + ", 10)")
            .attr("width", width)
            .attr("height", 30);

        this.dateLegend = this.svg
            .append("g")
            .style("text-anchor", "middle")
            .style("display", "none")
            .attr("width", width)
            .attr("height", 30);

        this.dateLegendBackground = this.dateLegend
            .append("rect")
            .attr("class", "date-legend-background")
            .attr("width", date_legend_width)
            .attr("height", 20)
            .attr("x", -(date_legend_width / 2))
            .attr("y", -10)
            .attr("rx", 10);

        this.dateLegendText = this.dateLegend
            .append("text")
            .attr("class", "date-legend-text")
            .attr("y", 3);

        const size_text = this.props.size ? `${this.props.size}x${this.props.size}` : "";
        this.legend_label = this.legend
            .append("text")
            .text(`${speed_translation(this.props.speed)} ${size_text}`);

        this.range_label = this.legend
            .append("text")
            .style("text-anchor", "end")
            .attr("transform", "translate(" + width + ", 0)");

        this.deviation_chart = this.rating_graph
            .append("path")
            .attr("clip-path", "url(#clip)")
            .attr("class", "deviation-area");

        this.rating_chart = this.rating_graph.append("path").attr("class", "rating line");

        this.x_axis_date_labels = this.rating_graph
            .append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0 ," + height + ")");

        this.y_axis_rating_labels = this.rating_graph
            .append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0, 0)");

        this.y_axis_rank_labels = this.rating_graph.append("g").attr("class", "y axis");

        this.helper = this.rating_graph
            .append("g")
            .attr("class", "chart__helper")
            .style("text-anchor", "end")
            .attr("transform", "translate(" + width + ", 0)");

        this.helperText = this.helper.append("text");

        /*
        this.verticalCrosshairLine = this.rating_graph.append('g')
            .attr('class', 'crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('x1', 0)
            .attr('y1', height);
        */

        this.horizontalCrosshairLine = this.rating_graph
            .append("g")
            .attr("class", "crosshairs")
            .append("line")
            .style("display", "none")
            .attr("x0", 0)
            .attr("y0", 0)
            .attr("y1", 0)
            .attr("x1", width);

        this.ratingTooltip = this.rating_graph
            .append("g")
            .attr("class", "data-point-circle")
            .append("circle")
            .style("display", "none")
            .attr("r", 2.5);

        this.mouseArea = this.svg
            .append("g")
            .append("rect")
            .attr("class", "overlay")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", () => {
                this.helper.style("display", null);
                this.dateLegend.style("display", null);
                this.ratingTooltip.style("display", null);
                //deviationTooltip.style('display', null);
                //this.verticalCrosshairLine.style('display', null);
                this.horizontalCrosshairLine.style("display", null);
            })
            .on("mouseout", () => {
                this.helper.style("display", "none");
                this.dateLegend.style("display", "none");
                this.ratingTooltip.style("display", "none");
                //deviationTooltip.style('display', 'none');
                //this.verticalCrosshairLine.style('display', 'none');
                this.horizontalCrosshairLine.style("display", "none");
                this.setState({ hovered_date: undefined });
            })
            .on("mousemove", function (event) {
                // eslint-disable-next-line @typescript-eslint/no-invalid-this
                const x0 = self.ratings_x.invert(d3.pointer(event, this as d3.ContainerElement)[0]);

                const i = date_bisector(self.games_by_day, x0, 1);
                const d0 = self.games_by_day[i - 1];
                const d1 = self.games_by_day[i];

                if (!d0 || !d1) {
                    return;
                }

                const d =
                    x0.getTime() - d0.ended.getTime() > d1.ended.getTime() - x0.getTime() ? d1 : d0;
                self.helperText.text(
                    format_date(new Date(d.ended)) +
                        "  " +
                        interpolate(
                            self.shouldDisplayRankInformation()
                                ? pgettext(
                                      "Glicko-2 rating +- rating deviation text on the ratings chart",
                                      "rating: {{rating}} ± {{deviation}} rank: {{rank}} ± {{rank_deviation}}",
                                  )
                                : pgettext(
                                      "Glicko-2 rating +- rating deviation text on the ratings chart",
                                      "rating: {{rating}} ± {{deviation}}",
                                  ),
                            {
                                //rating: Math.floor(d.rating),
                                rating: Math.floor(humble_rating(d.rating, d.deviation)),
                                deviation: Math.round(d.deviation),
                                rank: rankString(
                                    bounded_rank(
                                        rating_to_rank(humble_rating(d.rating, d.deviation)),
                                    ),
                                    true,
                                ),
                                rank_deviation: (
                                    rating_to_rank(d.rating + d.deviation) -
                                    rating_to_rank(d.rating)
                                ).toFixed(1),
                            },
                        ),
                );
                self.dateLegendText.text(format_date(new Date(d.ended)));
                self.dateLegend.attr(
                    "transform",
                    "translate(" +
                        (boundDataLegendX(self.ratings_x(d.ended)) + margin.left) +
                        "," +
                        (margin.top + height + 10) +
                        ")",
                );
                self.ratingTooltip.attr(
                    "transform",
                    "translate(" +
                        self.ratings_x(d.ended) +
                        "," +
                        self.ratings_y(humble_rating(d.rating, d.deviation)) +
                        ")",
                );
                //deviationTooltip.attr('transform', 'translate(' + self.ratings_x(d.ended) + ',' + self.ratings_y(d.rating) + ')');
                //self.verticalCrosshairLine.attr('transform', 'translate(' + self.ratings_x(d.ended) + ', 0)');
                self.horizontalCrosshairLine.attr(
                    "transform",
                    "translate(0, " + self.ratings_y(humble_rating(d.rating, d.deviation)) + ")",
                );

                self.setState({ hovered_date: new Date(d.ended) });
            });

        this.timeline_chart = this.timeline_graph.append("path").attr("class", "area");

        this.timeline_axis_labels = this.timeline_graph
            .append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (secondary_charts_height - 22) + ")")
            .attr("y", 0);

        this.brush = d3
            .brushX()
            .extent([
                [0, 0],
                [width, secondary_charts_height],
            ])
            .on("brush", this.onTimelineBrush)
            .on("end", this.onTimelineBrush);

        this.timeline_graph.append("g").attr("class", "x brush").call(this.brush);

        this.refreshData();
    }
    deinitialize() {
        this.destroyed = true;
        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = undefined;
        }
        this.svg.remove();
    }
    refreshData() {
        this.setState({ loading: true });
        //d3.tsv(`/termination-api/player/${this.props.playerId}/rating-history?speed=${this.props.speed}&size=${this.props.size}`,
        //d3.tsv(`/termination-api/player/${this.props.playerId}/glicko2-history?speed=${this.props.speed}&size=${this.props.size}`,
        d3.tsv(
            `/termination-api/player/${this.props.playerId}/v5-rating-history?speed=${this.props.speed}&size=${this.props.size}`,
            makeRatingEntry,
        )
            .then(this.loadDataAndPlot)
            .catch(errorLogger);
    }

    /* The area we can draw all of our charting in */
    chart_sizes(): { width: number; height: number } {
        const width = Math.max(
            chart_min_width,
            $(this.container.current as any).width() - margin.left - margin.right,
        );
        return {
            width: width,
            height: height,
        };
    }

    onResize = (no_debounce: boolean = false) => {
        if (this.destroyed) {
            return;
        }

        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = undefined;
        }

        if (!no_debounce) {
            this.resize_debounce = setTimeout(() => this.onResize(true), 10);
            return;
        }

        this.setRanges();
        const width = this.graph_width;

        this.props.updateChartSize(chart_height, width);

        this.svg.attr("width", this.width + margin.left + margin.right);
        this.svg.attr("height", height + margin.top + margin.bottom + win_loss_bars_height);
        this.clip.attr("width", width);
        //this.clip.attr('height', height);

        this.legend.attr("width", width);
        this.legend.attr("height", 30);

        this.dateLegend.attr("width", width);
        this.dateLegend.attr("height", 30);

        this.range_label.attr("transform", "translate(" + width + ", 0)");
        this.x_axis_date_labels.attr("transform", "translate(0 ," + height + ")");
        this.y_axis_rating_labels.attr("transform", "translate(0, 0)");
        this.y_axis_rank_labels.attr("transform", "translate(" + (width - 10) + ", 0)");

        //this.verticalCrosshairLine.attr('y1', height);
        this.helper.attr("transform", "translate(" + width + ", 0)");
        this.horizontalCrosshairLine.attr("x1", width);
        this.mouseArea.attr("width", width);
        this.mouseArea.attr("height", height);
        this.timeline_axis_labels.attr(
            "transform",
            "translate(0," + (secondary_charts_height - 22) + ")",
        );
        this.timeline_axis_labels.call(this.timeline_axis);
        this.brush.extent([
            [0, 0],
            [width, secondary_charts_height],
        ]);

        const graph_right_side = this.graph_width + margin.left + margin.right;
        this.win_loss_pie.attr(
            "transform",
            "translate(" +
                (graph_right_side + this.pie_width / 2.0) +
                "," +
                (margin.top + this.height / 2.0 + 20) +
                ")",
        );

        if (this.games_by_day) {
            this.timeline_chart.datum(this.games_by_day).attr("d", this.timeline_area as any);

            this.onTimelineBrush(null);
        }
    };

    hideWinLossPie = () => {
        if (this.win_loss_pie) {
            this.win_loss_pie.selectAll("path").remove();
            this.win_loss_pie.selectAll("rect").remove();
            this.win_loss_pie.selectAll("text").remove();
        }
    };

    plotWinLossPie = () => {
        if (!this.win_loss_pie) {
            return;
        }

        const agg = this.win_loss_aggregate;

        if (!agg) {
            return;
        }

        /* with well spread data, the order here places wins on top, and stronger opponent on right of pie */
        const pie_data = [
            {
                label: interpolate(
                    pgettext(
                        "Number of wins against stronger opponents",
                        "{{strong_wins}} wins vs. stronger opponents",
                    ),
                    { strong_wins: agg.strong_wins },
                ),
                count: agg.strong_wins,
            },
            {
                label: interpolate(
                    pgettext(
                        "Number of losses against stronger opponents",
                        "{{strong_losses}} losses vs. stronger opponents",
                    ),
                    { strong_losses: agg.strong_losses },
                ),
                count: agg.strong_losses,
            },
            {
                label: interpolate(
                    pgettext(
                        "Number of losses against weaker opponents",
                        "{{weak_losses}} losses vs. weaker opponents",
                    ),
                    { weak_losses: agg.weak_losses },
                ),
                count: agg.weak_losses,
            },
            {
                label: interpolate(
                    pgettext(
                        "Number of wins against weaker opponents",
                        "{{weak_wins}} wins vs. weaker opponents",
                    ),
                    { weak_wins: agg.weak_wins },
                ),
                count: agg.weak_wins,
            },
        ];

        const pie_color_class = ["strong-wins", "strong-losses", "weak-losses", "weak-wins"];

        const pie_radius = Math.min(this.pie_width, this.height) / 2.0 - 15; // just looks about right.

        /* Pie plotting as per example at http://zeroviscosity.com/d3-js-step-by-step/step-1-a-basic-pie-chart */

        const arc: any = d3.arc().innerRadius(0).outerRadius(pie_radius);

        const pie_values = d3
            .pie()
            .value((d: any): number => d.count)
            .sort(null);

        this.win_loss_pie.selectAll("path").remove();

        this.win_loss_pie
            .selectAll("path")
            .data(pie_values(pie_data as any))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("class", (d, i) => "pie " + pie_color_class[i]);

        /* The legend with values */

        this.win_loss_pie.selectAll("rect").remove();
        this.win_loss_pie.selectAll("text").remove();

        /* placement relative to centre of pie */

        const legend_xoffset = -1.0 * pie_radius - 20; // just looks about right
        const legend_yoffset = pie_radius + 30;

        const total_games = agg.strong_wins + agg.strong_losses + agg.weak_wins + agg.weak_losses;

        this.win_loss_pie
            .append("text")
            .text(
                interpolate(
                    pgettext("Total Ranked Games", "Total of: {{total_games}} ranked games"),
                    {
                        total_games: total_games,
                    },
                ),
            )
            .attr("x", -60)
            .attr("y", -1.0 * pie_radius - 20)
            .attr("class", "pie-title");

        /* It's nice to have the legend in a different order, just makes more sense */

        const legend_order = [0, 1, 3, 2]; // index into pie_data[]

        legend_order.forEach((legend_item, i) => {
            this.win_loss_pie
                .append("rect")
                .attr("class", pie_color_class[legend_item])
                .attr("x", legend_xoffset)
                .attr("y", legend_yoffset + i * 20)
                .attr("width", 15)
                .attr("height", 15);
            this.win_loss_pie
                .append("text")
                .text(pie_data[legend_item].label)
                .attr("x", legend_xoffset + 15 + 10)
                .attr("y", legend_yoffset + i * 20 + 12);
        });
    };

    /* Callback function for data retrieval, which plots the retrieved data */
    //loadDataAndPlot = (err, data) => {
    loadDataAndPlot = (data: RatingEntry[]) => {
        /* There's always a starting 1500 rating entry at least, so if that's all there
         * is let's just zero out the array and show a "No data" text */
        if (!data || data.length === 1) {
            this.setState({
                loading: false,
                nodata: true,
            });
        } else {
            this.setState({
                loading: false,
                nodata: false,
            });
        }

        this.game_entries = data || [];
        this.game_entries.reverse();

        /* Group into days and process information like starting/ended rating/rank, increase/decrease, etc */
        this.games_by_day = new Array<RatingEntry>();
        this.games_by_month = new Array<RatingEntry>();
        const day_key_formatter = (d: Date) =>
            `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        const month_key_formatter = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        this.max_games_played_in_a_month = 0;

        if (this.game_entries.length > 0) {
            let last_month_key = "";
            let last_day_key = "";
            let cur_day: RatingEntry | null = null;
            let cur_month: RatingEntry | null = null;
            for (const d of this.game_entries) {
                const day_key = day_key_formatter(d.ended);
                if (last_day_key !== day_key) {
                    last_day_key = day_key;
                    cur_day = d.copy();
                    cur_day.starting_rating = cur_day.rating;
                    cur_day.starting_deviation = cur_day.deviation;
                    cur_day.count = 1;
                    cur_day.increase = false;
                    this.games_by_day.push(cur_day);
                } else if (cur_day) {
                    cur_day.merge(d);
                }

                if (this.games_by_day.length >= 2 && cur_day) {
                    cur_day.increase =
                        this.games_by_day[this.games_by_day.length - 2].rating < cur_day.rating;
                }

                const month_key = month_key_formatter(d.ended);
                if (last_month_key !== month_key) {
                    last_month_key = month_key;
                    cur_month = d.copy();
                    this.games_by_month.push(cur_month);
                } else if (cur_month) {
                    cur_month.merge(d);
                }
                if (this.games_by_month.length >= 2 && cur_month) {
                    cur_month.increase =
                        this.games_by_month[this.games_by_month.length - 2].rating <
                        cur_month.rating;
                } else if (cur_month) {
                    cur_month.increase = false;
                }

                this.max_games_played_in_a_month = Math.max(
                    this.max_games_played_in_a_month,
                    cur_month?.count || 0,
                );
            }
        }

        /* Plot graph */
        const date_range: any = d3.extent(
            this.game_entries.map((d: RatingEntry) => {
                return d.ended;
            }),
        );
        date_range[0] = new Date(date_range[0].getUTCFullYear(), date_range[0].getUTCMonth());
        date_range[1] = new Date(date_range[1].getUTCFullYear(), date_range[1].getUTCMonth());
        date_range[1].setMonth(date_range[1].getMonth() + 1);

        this.ratings_x.domain(date_range);
        const lower = Math.min.apply(
            null,
            this.game_entries.map(
                (d: RatingEntry) => Math.min(d.starting_rating, d.rating) - d.deviation,
            ),
        );
        const upper = Math.max.apply(
            null,
            this.game_entries.map(
                (d: RatingEntry) => Math.max(d.starting_rating, d.rating) + d.deviation,
            ),
        );
        this.ratings_y.domain([lower * 0.95, upper * 1.05]);
        const game_count_extent = d3.extent(
            this.games_by_month.map((d: RatingEntry) => {
                return d.count;
            }),
        );
        game_count_extent[0] = 0;
        this.win_loss_y.domain(d3.extent(game_count_extent as any) as any);
        this.timeline_x.domain(this.ratings_x.domain());
        this.timeline_y.domain(
            d3.extent(
                this.game_entries.map((d: RatingEntry) => {
                    return humble_rating(d.rating, d.deviation);
                }),
            ) as any,
        );

        // Reset extents to full width...
        this.date_extents = this.timeline_x.range().map(this.timeline_x.invert, this.timeline_x);
        this.setState({ date_extents: this.date_extents.slice() });

        this.range_label.text(
            format_date(new Date(date_range[0])) + " - " + format_date(new Date(date_range[1])),
        );
        this.deviation_chart.datum(this.games_by_day).attr("d", this.deviation_area as any);
        this.rating_chart.datum(this.games_by_day).attr("d", this.rating_line as any);
        if (this.width < 768) {
            this.selected_axis.tickArguments([4]); // avoid crammed up tick labels
            this.timeline_axis.tickArguments([4]);
        }
        this.x_axis_date_labels.call(this.selected_axis);
        this.y_axis_rating_labels.call(this.rating_axis);
        this.y_axis_rank_labels.call(this.rank_axis);

        this.timeline_chart.datum(this.games_by_day).attr("d", this.timeline_area as any);
        this.timeline_axis_labels.call(this.timeline_axis);

        this.computeWinLossNumbers();

        if (this.show_pie) {
            this.plotWinLossPie();
        }

        this.plotWinLossBars();
    };

    plotWinLossBars = () => {
        const W = (d: RatingEntry, alpha: number) => {
            const w = this.getUTCMonthWidth(d.ended) * alpha;
            return isFinite(w) ? w : 0;
        };
        const X = (d: RatingEntry, alpha: number) => {
            const start = new Date(d.ended.getUTCFullYear(), d.ended.getUTCMonth());
            const end = new Date(d.ended.getUTCFullYear(), d.ended.getUTCMonth());
            end.setMonth(end.getMonth() + 1);
            const s = start.getTime();
            const e = end.getTime();
            const x = this.ratings_x(s * (1 - alpha) + e * alpha);
            return isFinite(x) ? x : 0;
        };
        const H = (count: number) => {
            return Math.max(0, win_loss_bars_height - this.win_loss_y(count));
        };
        const Y = (count: number) => {
            return (
                win_loss_bars_start_y - Math.max(0, win_loss_bars_height - this.win_loss_y(count))
            );
        };

        for (const bars of this.win_loss_bars) {
            bars.remove();
        }
        this.win_loss_bars.length = 0;

        this.win_loss_bars.push(
            this.win_loss_graphs[0]
                .selectAll("rect")
                .data(this.games_by_month)
                .enter()
                .append("rect")
                .attr("class", "win-loss-bar weak-wins")
                .attr("x", (d: RatingEntry) => X(d, 0))
                .attr("y", (d: RatingEntry) => Y(d.count) + H(d.strong_losses + d.strong_wins))
                .attr("width", (d: RatingEntry) =>
                    W(d, d.weak_wins / (d.weak_losses + d.weak_wins || 1)),
                )
                .attr("height", (d: RatingEntry) => H(d.weak_losses + d.weak_wins)),
        );
        this.win_loss_bars.push(
            this.win_loss_graphs[1]
                .selectAll("rect")
                .data(this.games_by_month)
                .enter()
                .append("rect")
                .attr("class", "win-loss-bar weak-losses")
                .attr("x", (d: RatingEntry) =>
                    X(d, d.weak_wins / (d.weak_losses + d.weak_wins || 1)),
                )
                .attr("y", (d: RatingEntry) => Y(d.count) + H(d.strong_losses + d.strong_wins))
                .attr("width", (d: RatingEntry) =>
                    W(d, d.weak_losses / (d.weak_losses + d.weak_wins || 1)),
                )
                .attr("height", (d: RatingEntry) => H(d.weak_losses + d.weak_wins)),
        );
        this.win_loss_bars.push(
            this.win_loss_graphs[2]
                .selectAll("rect")
                .data(this.games_by_month)
                .enter()
                .append("rect")
                .attr("class", "win-loss-bar strong-losses")
                .attr("x", (d: RatingEntry) => X(d, 0))
                .attr("y", (d: RatingEntry) => Y(d.count))
                .attr("width", (d: RatingEntry) =>
                    W(d, d.strong_losses / (d.strong_losses + d.strong_wins || 1)),
                )
                .attr("height", (d: RatingEntry) => H(d.strong_losses + d.strong_wins)),
        );
        this.win_loss_bars.push(
            this.win_loss_graphs[3]
                .selectAll("rect")
                .data(this.games_by_month)
                .enter()
                .append("rect")
                .attr("class", "win-loss-bar strong-wins")
                .attr("x", (d: RatingEntry) =>
                    X(d, d.strong_losses / (d.strong_losses + d.strong_wins || 1)),
                )
                .attr("y", (d: RatingEntry) => Y(d.count))
                .attr("width", (d: RatingEntry) =>
                    W(d, d.strong_wins / (d.strong_losses + d.strong_wins || 1)),
                )
                .attr("height", (d: RatingEntry) => H(d.strong_losses + d.strong_wins)),
        );
        this.win_loss_bars.push(
            this.win_loss_graphs[4]
                .selectAll("rect")
                .data(this.games_by_month)
                .enter()
                .append("rect")
                .attr("class", "win-loss-bar transparent")
                .attr("x", (d: RatingEntry) => X(d, 0))
                .attr("y", () => Y(this.max_games_played_in_a_month))
                .attr("width", (d: RatingEntry) => W(d, 0.999))
                .attr("height", (d: RatingEntry) => H(this.max_games_played_in_a_month - d.count)),
        );
    };

    getUTCMonthWidth(d: Date): number {
        const days_in_month =
            (new Date(d.getUTCFullYear(), d.getUTCMonth() + 1).getTime() -
                new Date(d.getUTCFullYear(), d.getUTCMonth()).getTime()) /
            86400;

        let s = this.date_extents[0];
        let e = this.date_extents[1];
        s = new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
        e = new Date(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());

        const days_in_range = (e.getTime() - s.getTime()) / 86400;

        return this.graph_width * (days_in_month / days_in_range);
    }

    onTimelineBrush = (event: d3.D3BrushEvent<any> | null) => {
        const tmp = (event && event.selection) || this.timeline_x.range();
        this.date_extents = tmp.map(this.timeline_x.invert as any, this.timeline_x);
        this.date_extents[0].setHours(0, 0, 0, 0); /* start of day */
        this.date_extents[1].setHours(23, 59, 59, 0); /* end of day   */
        this.setState({ date_extents: this.date_extents.slice() });

        this.ratings_x.domain(this.date_extents);

        const lower = Math.min.apply(
            null,
            this.game_entries.map(
                (d: RatingEntry) => Math.min(d.starting_rating, d.rating) - d.deviation,
            ),
        );
        const upper = Math.max.apply(
            null,
            this.game_entries.map(
                (d: RatingEntry) => Math.max(d.starting_rating, d.rating) + d.deviation,
            ),
        );

        const l = Math.min.apply(
            null,
            this.game_entries.map((d: RatingEntry) =>
                d.ended.getTime() >= this.date_extents[0].getTime() &&
                d.ended.getTime() <= this.date_extents[1].getTime()
                    ? Math.min(d.starting_rating, d.rating) - d.deviation
                    : upper,
            ),
        );
        const u = Math.max.apply(
            null,
            this.game_entries.map((d: RatingEntry) =>
                d.ended.getTime() >= this.date_extents[0].getTime() &&
                d.ended.getTime() <= this.date_extents[1].getTime()
                    ? Math.max(d.starting_rating, d.rating) + d.deviation
                    : lower,
            ),
        );
        this.ratings_y.domain([l * 0.95, u * 1.05]);

        this.range_label.text(
            format_date(new Date(this.date_extents[0])) +
                " - " +
                format_date(new Date(this.date_extents[1])),
        );

        const W = (d: RatingEntry, alpha: number) => {
            const w = this.getUTCMonthWidth(d.ended) * alpha;
            return isFinite(w) ? w : 0;
        };
        const X = (d: RatingEntry, alpha: number) => {
            const start = new Date(d.ended.getUTCFullYear(), d.ended.getUTCMonth());
            const end = new Date(d.ended.getUTCFullYear(), d.ended.getUTCMonth());
            end.setMonth(end.getMonth() + 1);

            /*
            let today = new Date();
            if (is_same_month(d.ended, today)) {
                end = today;
                end.setHours(23, 59, 59);
            }
            */

            const s = start.getTime();
            const e = end.getTime();
            const x = this.ratings_x(s * (1 - alpha) + e * alpha);
            return isFinite(x) ? x : 0;
        };

        this.win_loss_bars[0]
            .attr("x", (d: RatingEntry) => X(d, 0))
            .attr("width", (d: RatingEntry) =>
                W(d, d.weak_wins / (d.weak_losses + d.weak_wins || 1)),
            );
        this.win_loss_bars[1]
            .attr("x", (d: RatingEntry) => X(d, d.weak_wins / (d.weak_losses + d.weak_wins || 1)))
            .attr("width", (d: RatingEntry) =>
                W(d, d.weak_losses / (d.weak_losses + d.weak_wins || 1)),
            );
        this.win_loss_bars[2]
            .attr("x", (d: RatingEntry) => X(d, 0))
            .attr("width", (d: RatingEntry) =>
                W(d, d.strong_losses / (d.strong_losses + d.strong_wins || 1)),
            );
        this.win_loss_bars[3]
            .attr("x", (d: RatingEntry) =>
                X(d, d.strong_losses / (d.strong_losses + d.strong_wins || 1)),
            )
            .attr("width", (d: RatingEntry) =>
                W(d, d.strong_wins / (d.strong_losses + d.strong_wins || 1)),
            );

        this.rating_chart.attr("d", this.rating_line as any);
        this.deviation_chart.attr("d", this.deviation_area as any);
        this.rating_graph.select(".x.axis").call(this.selected_axis as any);
        this.y_axis_rating_labels.call(this.rating_axis);
        this.y_axis_rank_labels.call(this.rank_axis);
    };

    render() {
        this.computeWinLossNumbers();
        if (!this.state.loading && this.show_pie) {
            this.plotWinLossPie();
        }
        return (
            <div ref={this.container} className="RatingsChart">
                {this.state.loading ? (
                    <div className="loading">{_("Loading")}</div>
                ) : this.state.nodata ? (
                    <div className="nodata">{_("No rated games played yet")}</div>
                ) : (
                    <div className="ratings-graph">
                        <OgsResizeDetector
                            onResize={() => this.onResize()}
                            targetRef={this.container}
                        />
                        <PersistentElement elt={this.chart_div as any} />
                    </div>
                )}
                {this.show_pie ? null : this.renderWinLossNumbersAsText()}
            </div>
        );
    }

    computeWinLossNumbers() {
        let date_extents: any[] = [];

        if (this.state.hovered_date) {
            date_extents[0] = new Date(this.state.hovered_date);
            date_extents[1] = new Date(this.state.hovered_date);
            date_extents[0].setHours(0, 0, 0, 0);
            date_extents[1].setHours(23, 59, 59, 0);
        } else if (this.state.hovered_month) {
            date_extents[0] = new Date(this.state.hovered_month);
            date_extents[1] = new Date(this.state.hovered_month);

            date_extents[0].setDate(1);
            date_extents[0].setHours(0, 0, 0, 0);

            date_extents[1].setDate(1);
            date_extents[1].setMonth(date_extents[1].getMonth() + 1);
            date_extents[1].setDate(-1);
            date_extents[1].setHours(23, 59, 59, 0);
        } else {
            if (this.state.date_extents && this.state.date_extents.length === 2) {
                date_extents = this.state.date_extents;
            } else {
                date_extents[0] = new Date(0);
                date_extents[1] = new Date();
            }
        }

        let agg: RatingEntry | null = null;
        const start_time = date_extents[0].getTime();
        const end_time = date_extents[1].getTime();

        if (!this.state.loading && !this.state.nodata && this.game_entries) {
            for (const entry of this.game_entries) {
                const time = entry.ended.getTime();
                if (time >= start_time && time <= end_time) {
                    if (!agg) {
                        agg = new RatingEntry(entry);
                    } else {
                        agg.merge(entry);
                    }
                }
            }
        }

        if (agg === null) {
            this.win_loss_aggregate = {
                weak_wins: 0,
                strong_wins: 0,
                weak_losses: 0,
                strong_losses: 0,
            };
        } else {
            this.win_loss_aggregate = agg;
        }
    }

    renderWinLossNumbersAsText() {
        if (
            this.state.loading ||
            this.state.nodata ||
            !this.game_entries ||
            !this.win_loss_aggregate
        ) {
            return <div className="win-loss-stats" />;
        }

        const agg = this.win_loss_aggregate;

        return (
            <div className="rating-chart">
                <div className="win-loss-stats">
                    <div>
                        <span className="win-loss-legend-block weak-wins" />
                        {interpolate(
                            pgettext(
                                "Number of wins against weaker opponents",
                                "{{weak_wins}} wins vs. weaker opponents",
                            ),
                            { weak_wins: agg.weak_wins },
                        )}
                    </div>
                    <div>
                        <span className="win-loss-legend-block strong-wins" />
                        {interpolate(
                            pgettext(
                                "Number of wins against stronger opponents",
                                "{{strong_wins}} wins vs. stronger opponents",
                            ),
                            { strong_wins: agg.strong_wins },
                        )}
                    </div>
                    <div>
                        <span className="win-loss-legend-block weak-losses" />
                        {interpolate(
                            pgettext(
                                "Number of losses against weaker opponents",
                                "{{weak_losses}} losses vs. weaker opponents",
                            ),
                            { weak_losses: agg.weak_losses },
                        )}
                    </div>
                    <div>
                        <span className="win-loss-legend-block strong-losses" />
                        {interpolate(
                            pgettext(
                                "Number of losses against stronger opponents",
                                "{{strong_losses}} losses vs. stronger opponents",
                            ),
                            { strong_losses: agg.strong_losses },
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

function speed_translation(speed: speed_t) {
    switch (speed) {
        case "overall":
            return _("Overall");
        case "blitz":
            return _("Blitz");
        case "live":
            return _("Live");
        case "correspondence":
            return _("Correspondence");
    }
}
function is_same_month(d1: Date, d2: Date): boolean {
    return d1.getUTCFullYear() === d2.getUTCFullYear() && d1.getUTCMonth() === d2.getUTCMonth();
}
