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

/* This component was derived from RatingsChart, with games-by-date carved out */
/* (Which is why it's structure is the same) */

import * as d3 from "d3";
import * as moment from "moment";
import * as React from "react";
import { OgsResizeDetector } from "OgsResizeDetector";
import { _, pgettext, interpolate } from "translate";
import { PersistentElement } from "PersistentElement";
import { RatingEntry, makeRatingEntry } from "./RatingEntry";
import { errorLogger } from "misc";
import { MiniGoban } from "MiniGoban";

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
    updateChartSize: (height: number, width: number) => void; // callback with the size of the actual chart within this component (for client to position stuff relative to that)
}

// This is similar to RatingsChartState (from RatingsChart)
// TODO (bpj): investigate sharing the interface
interface RatingsChartState {
    loading: boolean;
    nodata: boolean;
    subselect_extents: number[];
    hovered_game_id?: number;
    show_pie?: boolean;
}

const margin = { top: 30, right: 20, bottom: 110, left: 20 }; // Margins around the rating chart with respect to the whole space
const margin2 = { top: 320, right: 20, bottom: 30, left: 20 }; // Margins around the subselect chart with respect to the whole space

const chart_min_width = 64;
const chart_height = 380;

const date_legend_width = 70;

const height = chart_height - margin.top - margin.bottom;
const secondary_charts_height = chart_height - margin2.top - margin2.bottom;

const show_hovered_game_delay = 250; // milliseconds till game info of hovered data point is updated
// fast enough to not feel like a wait, while limiting rate

const pie_restore_delay = 1500; // long enough to go click on the minigoban if you want to, not so long as to come as a surprise later.

const format_date = (d: Date) => moment(d).format("ll");

export class RatingsChartByGame extends React.Component<RatingsChartProperties, RatingsChartState> {
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

    win_loss_aggregate?: {
        weak_wins: number;
        strong_wins: number;
        weak_losses: number;
        strong_losses: number;
    };

    subselect_graph!: d3.Selection<SVGGElement, unknown, null, undefined>; // The secondary graph, where a slice of the data can be selected to display on the main graph
    subselect_extents!: number[];

    game_entries!: Array<RatingEntry>;

    destroyed = false;

    show_pie: boolean = true;
    win_loss_pie!: d3.Selection<SVGGElement, unknown, null, undefined>;

    ratings_x = d3.scaleLinear();
    ratings_y = d3.scaleLinear();

    subselect_x = d3.scaleLinear();
    subselect_y = d3.scaleLinear();

    selected_axis = d3.axisBottom(this.ratings_x);
    rating_axis = d3.axisLeft(this.ratings_y);
    rank_axis = d3.axisRight(this.ratings_y);

    subselect_axis = d3.axisBottom(this.subselect_x);

    rating_line = d3
        .line<RatingEntry>()
        //.curve(d3.curveLinear)
        .curve(d3.curveMonotoneX)
        .x((d: RatingEntry) => this.ratings_x(d.index))
        .y((d: RatingEntry) => this.ratings_y(humble_rating(d.rating, d.deviation)));

    deviation_area = d3
        .area<RatingEntry>()
        .curve(d3.curveBasis)
        .x0((d: RatingEntry) => this.ratings_x(d.index))
        .x1((d: RatingEntry) => this.ratings_x(d.index))
        .y0((d: RatingEntry) => this.ratings_y(Math.min(d.starting_rating, d.rating) - d.deviation))
        .y1((d: RatingEntry) =>
            this.ratings_y(Math.max(d.starting_rating, d.rating) + d.deviation),
        );

    subselect_area = d3
        .area<RatingEntry>()
        .curve(d3.curveMonotoneX)
        .x((d: RatingEntry) => this.subselect_x(d.index))
        .y0(secondary_charts_height)
        .y1((d: RatingEntry) => this.subselect_y(humble_rating(d.rating, d.deviation)));

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

    subselect_chart!: d3.Selection<SVGPathElement, unknown, null, undefined>;
    subselect_axis_labels!: d3.Selection<SVGGElement, unknown, null, undefined>;

    hover_timer?: ReturnType<typeof setTimeout>; // Timer for hovering over data points to see their game.

    constructor(props: RatingsChartProperties) {
        super(props);
        this.state = {
            loading: true,
            nodata: false,
            subselect_extents: [],
            hovered_game_id: undefined,
        };
        this.chart_div = $("<div>")[0] as HTMLDivElement;
    }
    componentDidMount() {
        this.initialize();
        if (this.shouldDisplayRankInformation()) {
            this.y_axis_rank_labels.style("display", null);
        } else {
            this.y_axis_rank_labels.style("display", "none");
        }
    }
    componentDidUpdate(prevProps: RatingsChartProperties) {
        if (
            this.props.playerId !== prevProps.playerId ||
            this.props.speed !== prevProps.speed ||
            this.props.size !== prevProps.size
        ) {
            const size_text = this.props.size ? `${this.props.size}x${this.props.size}` : "";
            this.legend_label.text(`${speed_translation(this.props.speed)} ${size_text}`);
            this.refreshData();
        }
        if (this.shouldDisplayRankInformation()) {
            this.y_axis_rank_labels.style("display", null);
        } else {
            this.y_axis_rank_labels.style("display", "none");
        }
    }
    componentWillUnmount() {
        this.deinitialize();
        window.clearTimeout(this.hover_timer);
    }
    shouldComponentUpdate(nextProps: RatingsChartProperties, nextState: RatingsChartState) {
        if (
            this.props.playerId !== nextProps.playerId ||
            this.props.speed !== nextProps.speed ||
            this.props.size !== nextProps.size ||
            this.state.hovered_game_id !== nextState.hovered_game_id
        ) {
            return true;
        }

        if (this.state.loading !== nextState.loading || this.state.nodata !== nextState.nodata) {
            return true;
        }

        /* Otherwise, we only need to update if our win/loss pie needs updating */
        if (this.state.subselect_extents.length !== nextState.subselect_extents.length) {
            return true;
        }

        if (this.state.subselect_extents.length === 2) {
            if (
                this.state.subselect_extents[0] !== nextState.subselect_extents[0] ||
                this.state.subselect_extents[1] !== nextState.subselect_extents[1]
            ) {
                return true;
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
            if (this.show_pie) {
                this.hideWinLossPie();
            }
            this.show_pie = false;
            this.graph_width = this.width;
        }

        this.pie_width = sizes.width / 3.0;

        this.height = height;

        this.ratings_x.range([0, this.graph_width]);
        this.ratings_y.range([height, 0]);

        this.subselect_x.range([0, this.graph_width]);
        this.subselect_y.range([secondary_charts_height, 0]);
    };

    initialize() {
        const self = this;
        this.hover_timer = undefined;

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
            .attr("height", height + margin.top + margin.bottom);

        this.clip = this.svg
            .append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height + margin.top + margin.bottom);

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
                    (margin.top + this.height / 3.0) +
                    ")",
            );

        this.subselect_graph = this.svg
            .append("g")
            .attr("class", "subselect")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

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
                this.horizontalCrosshairLine.style("display", null);
            })
            .on("mouseout", () => {
                this.helper.style("display", "none");
                this.dateLegend.style("display", "none");
                this.ratingTooltip.style("display", "none");
                this.horizontalCrosshairLine.style("display", "none");

                // get rid of mouse-hover effects
                window.clearTimeout(this.hover_timer);
                self.hover_timer = setTimeout(this.restorePie.bind(self), pie_restore_delay);
            })
            .on("mousemove", function (event) {
                // 'this' is the mouse area, in this context
                // eslint-disable-next-line @typescript-eslint/no-invalid-this
                const x0 = self.ratings_x.invert(d3.pointer(event, this as d3.ContainerElement)[0]);

                const n = Math.round(x0);
                const d = self.game_entries[n];

                if (!d) {
                    return;
                }

                self.helperText.text(
                    interpolate(
                        self.shouldDisplayRankInformation()
                            ? pgettext(
                                  "Glicko-2 rating +- rating deviation text on the ratings chart",
                                  "After {{n}} games, rating: {{rating}} ± {{deviation}} rank: {{rank}} ± {{rank_deviation}}",
                              )
                            : pgettext(
                                  "Glicko-2 rating +- rating deviation text on the ratings chart",
                                  "After {{n}} games, rating: {{rating}} ± {{deviation}}",
                              ),
                        {
                            n: n,
                            rating: Math.floor(humble_rating(d.rating, d.deviation)),
                            deviation: Math.round(d.deviation),
                            rank: rankString(
                                bounded_rank(rating_to_rank(humble_rating(d.rating, d.deviation))),
                                true,
                            ),
                            rank_deviation: (
                                rating_to_rank(d.rating + d.deviation) - rating_to_rank(d.rating)
                            ).toFixed(1),
                        },
                    ),
                );
                self.dateLegendText.text(format_date(new Date(d.ended)));
                self.dateLegend.attr(
                    "transform",
                    "translate(" +
                        (boundDataLegendX(self.ratings_x(n)) + margin.left) +
                        "," +
                        (margin.top + height + 10) +
                        ")",
                );
                self.ratingTooltip.attr(
                    "transform",
                    "translate(" +
                        self.ratings_x(n) +
                        "," +
                        self.ratings_y(humble_rating(d.rating, d.deviation)) +
                        ")",
                );
                self.horizontalCrosshairLine.attr(
                    "transform",
                    "translate(0, " + self.ratings_y(humble_rating(d.rating, d.deviation)) + ")",
                );

                if (self.hover_timer) {
                    clearTimeout(self.hover_timer);
                }

                self.hover_timer = setTimeout(
                    self.updateHoveredGame,
                    show_hovered_game_delay,
                    d.game_id,
                );
            });

        this.subselect_chart = this.subselect_graph.append("path").attr("class", "area");

        this.subselect_axis_labels = this.subselect_graph
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
            .on("brush", this.onSubselectBrush)
            .on("end", this.onSubselectBrush);

        this.subselect_graph.append("g").attr("class", "x brush").call(this.brush);

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
        d3.tsv(
            `/termination-api/player/${this.props.playerId}/v5-rating-history?speed=${this.props.speed}&size=${this.props.size}`,
            makeRatingEntry,
        )
            .then(this.loadDataAndPlot)
            .catch(errorLogger);
    }

    restorePie() {
        this.setState({ hovered_game_id: undefined });
        if (this.show_pie) {
            this.plotWinLossPie();
        }
    }

    /* The area we can draw all of our charting in */
    chart_sizes() {
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
        this.svg.attr("height", height + margin.top + margin.bottom);
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

        this.helper.attr("transform", "translate(" + width + ", 0)");
        this.horizontalCrosshairLine.attr("x1", width);
        this.mouseArea.attr("width", width);
        this.mouseArea.attr("height", height);

        this.subselect_axis_labels.attr(
            "transform",
            "translate(0," + (secondary_charts_height - 22) + ")",
        );
        this.subselect_axis_labels.call(this.subselect_axis);
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
                (margin.top + this.height / 3.0) +
                ")",
        );

        if (!this.state.nodata && this.game_entries) {
            this.subselect_chart.datum(this.game_entries).attr("d", this.subselect_area as any);

            this.onSubselectBrush(null);
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

        const pie_radius = Math.min(this.pie_width, this.height) / 3.0 - 15; // just looks about right.

        /* Pie plotting as per example at http://zeroviscosity.com/d3-js-step-by-step/step-1-a-basic-pie-chart */

        const arc = d3.arc().innerRadius(0).outerRadius(pie_radius);

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
            .attr("d", arc as any)
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
            // Note that the following causes a render, before the subsequent "Plot Graph" code.
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

        this.game_entries.forEach((entry, index) => {
            entry.index = index;
        });

        /* Plot graph */
        const x_range: any = [0, this.game_entries.length - 1];

        this.ratings_x.domain(x_range);
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

        this.subselect_x.domain(this.ratings_x.domain());
        this.subselect_y.domain(
            d3.extent(
                this.game_entries.map((d: RatingEntry) => {
                    return humble_rating(d.rating, d.deviation);
                }),
            ) as any,
        );

        // Reset the sub selection to full width
        this.subselect_extents = this.subselect_x
            .range()
            .map(this.subselect_x.invert, this.subselect_x);
        this.setState({ subselect_extents: this.subselect_extents.slice() });

        this.deviation_chart.datum(this.game_entries).attr("d", this.deviation_area as any);
        this.rating_chart.datum(this.game_entries).attr("d", this.rating_line as any);

        // avoid crammed up tick labels, and avoid fractional ticks
        if (this.width < 768 && this.game_entries.length > 4) {
            this.selected_axis.tickArguments([4]);
            this.subselect_axis.tickArguments([4]);
        } else if (this.game_entries.length < 20) {
            this.selected_axis.tickArguments([this.game_entries.length]);
            this.subselect_axis.tickArguments([this.game_entries.length]);
        } else {
            this.selected_axis.tickArguments([20]);
            this.subselect_axis.tickArguments([20]);
        }

        this.x_axis_date_labels.call(this.selected_axis);
        this.y_axis_rating_labels.call(this.rating_axis);
        this.y_axis_rank_labels.call(this.rank_axis);

        this.subselect_chart.datum(this.game_entries).attr("d", this.subselect_area as any);

        this.subselect_axis_labels.call(this.subselect_axis);

        this.computeWinLossNumbers();

        if (this.show_pie) {
            this.plotWinLossPie();
        }
    };

    onSubselectBrush = (event: d3.D3BrushEvent<any> | null) => {
        const tmp = (event && event.selection) || this.subselect_x.range();
        this.subselect_extents = tmp.map(this.subselect_x.invert as any, this.subselect_x);
        const range = this.subselect_extents[1] - this.subselect_extents[0];

        this.setState({ subselect_extents: this.subselect_extents.slice() });

        this.ratings_x.domain(this.subselect_extents);

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
                d.index >= this.subselect_extents[0] && d.index <= this.subselect_extents[1]
                    ? Math.min(d.starting_rating, d.rating) - d.deviation
                    : upper,
            ),
        );
        const u = Math.max.apply(
            null,
            this.game_entries.map((d: RatingEntry) =>
                d.index >= this.subselect_extents[0] && d.index <= this.subselect_extents[1]
                    ? Math.max(d.starting_rating, d.rating) + d.deviation
                    : lower,
            ),
        );
        this.ratings_y.domain([l * 0.95, u * 1.05]);

        this.range_label.text(
            `Games ${Math.ceil(this.subselect_extents[0])} - ${Math.floor(
                this.subselect_extents[1],
            )}`,
        );

        this.rating_chart.attr("d", this.rating_line as any);
        this.deviation_chart.attr("d", this.deviation_area as any);
        this.rating_graph.select(".x.axis").call(this.selected_axis as any);
        this.y_axis_rating_labels.call(this.rating_axis);
        this.y_axis_rank_labels.call(this.rank_axis);

        // avoid crammed up tick labels, and avoid fractional ticks
        if (this.width < 768 && range > 4) {
            this.selected_axis.tickArguments([4]);
        } else if (range < 20) {
            this.selected_axis.tickArguments([range]);
        } else {
            this.selected_axis.tickArguments([20]);
        }

        this.computeWinLossNumbers();

        if (!this.state.loading && this.show_pie) {
            this.setState({ hovered_game_id: undefined }); // make sure hovered game is not lingering while the are doing subselect
            this.plotWinLossPie();
        }
    };

    updateHoveredGame = (game_id: number) => {
        this.setState({
            hovered_game_id: game_id,
            show_pie: false, // we're putting the hovered game in that position
        });
        this.hideWinLossPie();
    };

    render() {
        // NOTE: we have a shouldComponentUpdate controlling this render (in case you wonder why it doesn't run ;) )
        return (
            <div ref={this.container} className="RatingsChartByGame">
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
                        <PersistentElement elt={this.chart_div} />
                    </div>
                )}

                {this.state.hovered_game_id && (
                    <MiniGoban
                        id={this.state.hovered_game_id}
                        displayWidth={200}
                        width={19}
                        height={19}
                        title={true}
                    />
                )}
            </div>
        );
    }

    computeWinLossNumbers() {
        let subselect_extents: number[] = [];

        if (this.state.subselect_extents && this.state.subselect_extents.length === 2) {
            subselect_extents = this.state.subselect_extents;
        } else {
            subselect_extents[0] = 0;
            subselect_extents[1] = this.game_entries.length;
        }

        let agg: RatingEntry | null = null;
        const start_game = subselect_extents[0];
        const end_game = subselect_extents[1];

        if (!this.state.loading && !this.state.nodata && this.game_entries) {
            for (const entry of this.game_entries) {
                const game = entry.index;
                if (game >= start_game && game <= end_game) {
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
