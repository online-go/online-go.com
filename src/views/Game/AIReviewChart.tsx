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

import * as d3 from "d3";
import * as moment from "moment";
import * as React from "react";
import * as JSNoise from 'js-noise';
import * as data from "data";
import ReactResizeDetector from 'react-resize-detector';
import { AIReviewEntry } from './AIReview';
import { PersistentElement } from 'PersistentElement';
import { deepCompare, errorAlerter, dup, errorLogger } from 'misc';
import { JGOFAIReview, } from 'goban';

interface AIReviewChartProperties {
    entries     : Array<AIReviewEntry>;
    ai_review   : JGOFAIReview;
    updatecount : number;
    move_number : number;
    setmove     : (move_number:number) => void;
    use_score   : boolean;
}

const bisector = d3.bisector((d:AIReviewEntry) => { return d.move_number; }).left;
//let margin = { top: 15, right: 20, bottom: 30, left: 20 };
const MARGIN = { top: 15, right: 5, bottom: 30, left: 5 };
const INITIAL_WIDTH = 600 - MARGIN.left - MARGIN.right;
const INITIAL_HEIGHT = 100 - MARGIN.top - MARGIN.bottom;
const simplex = new JSNoise.Module.Simplex();

export class AIReviewChart extends React.Component<AIReviewChartProperties, any> {
    container?:HTMLElement;
    chart_div:HTMLElement;
    svg?:d3.Selection<SVGSVGElement, unknown, null, undefined>;
    destroyed = false;
    chart?:number;
    graph?:number;
    resize_debounce?:any; // timeout
    replot_timeout?:any; // timeout
    prediction_graph?:d3.Selection<SVGGElement, unknown, null, undefined>;
    width?:number;
    height?:number;
    max_score?:number;
    min_score?:number;
    win_rate_line_container?:d3.Selection<SVGPathElement, unknown, null, undefined>;
    win_rate_area_container?:d3.Selection<SVGPathElement, unknown, null, undefined>;
    win_rate_line?: d3.Line<AIReviewEntry>;
    win_rate_area?: d3.Area<AIReviewEntry>;
    x_axis?:d3.Selection<SVGGElement, unknown, null, undefined>;
    mouse?:number;
    mouse_rect?:d3.Selection<SVGRectElement, unknown, null, undefined>;
    move_crosshair?:d3.Selection<SVGLineElement, unknown, null, undefined>;
    cursor_crosshair?:d3.Selection<SVGLineElement, unknown, null, undefined>;
    full_crosshair?:d3.Selection<SVGLineElement, unknown, null, undefined>;
    x:d3.ScaleLinear<number, number> = d3.scaleLinear().rangeRound([0, 0]);
    y:d3.ScaleLinear<number, number> = d3.scaleLinear().rangeRound([0, 0]);
    highlighted_move_circle_container:d3.Selection<SVGElement, unknown, null, undefined>;
    highlighted_move_circles:d3.Selection<SVGCircleElement, AIReviewEntry, SVGSVGElement, unknown>;

    constructor(props:AIReviewChartProperties) {
        super(props);
        this.state = {
            loading: false,
            nodata: false,
            hovered_date: null,
            hovered_month: null,
            date_extents: [],
        };
        this.chart_div = document.createElement('div');
    }
    componentDidMount() {
        this.initialize();
    }
    componentDidUpdate(prevProps:AIReviewChartProperties, prevState:any) {
        this.move_crosshair?.attr('transform', 'translate(' + this.x(this.props.move_number) + ', 0)');
        this.onResize();
    }
    componentWillUnmount() {
        this.deinitialize();
    }
    shouldComponentUpdate(nextProps:AIReviewChartProperties, nextState:any) {
        return !deepCompare(nextProps.entries, this.props.entries) ||
            this.props.move_number !== nextProps.move_number ||
            this.props.use_score !== nextProps.use_score;
    }

    initialize() {
        let self = this;

        this.width = INITIAL_WIDTH;
        this.height = INITIAL_HEIGHT;
        this.svg = d3.select(this.chart_div)
            .append('svg')
            .attr('class', 'chart')
            .attr('width', this.width + MARGIN.left + MARGIN.right)
            .attr('height', this.height + MARGIN.top + MARGIN.bottom + 0);

        if (!this.svg) {
            throw new Error(`AI SVG creation failed`);
        }

        this.prediction_graph = this.svg.append('g')
            .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')');

        if (!this.prediction_graph) {
            throw new Error(`AI Review graph creation failed`);
        }


        this.win_rate_area_container = this.prediction_graph.append('path')
            .attr('class', 'win-rate-area');

/*
        this.win_rate_line_container = this.prediction_graph.append('path')
            .attr('class', 'win-rate-line');
            */

        this.x = d3.scaleLinear().rangeRound([0, this.width]);
        this.y = d3.scaleLinear().rangeRound([this.height, 0]);


        this.win_rate_area = d3.area<AIReviewEntry>()
            .curve(d3.curveMonotoneX)
            .x1(d => this.x(d.move_number))
            .y1(d => this.y(this.props.use_score ? d.score * 1.0 : d.win_rate * 100.0))
            .x0(d => this.x(d.move_number))
            .y0(d => this.y(this.props.use_score ? 0 : 50))
            ;

        this.win_rate_line = d3.line<AIReviewEntry>()
            .curve(d3.curveMonotoneX)
            .x(d => this.x(d.move_number))
            .y(d => this.y(this.props.use_score ? d.score : d.win_rate * 100.0));

        let entries:Array<AIReviewEntry>;
        entries = this.props.entries.map(x => x);
        entries.unshift({win_rate: 0.5, score: 0.0, move_number: 0, num_variations: 0});
        entries.push({
            win_rate: 0.5,
            score: 0.0,
            move_number: entries[entries.length - 1].move_number,
            num_variations: 0
        });
        let max_score = Math.max(0, Math.max(... entries.map(e => e.score)));
        let min_score = Math.min(0, Math.min(... entries.map(e => e.score)));
        this.max_score = max_score;
        this.min_score = min_score;

        if (this.props.use_score) {
            this.y.domain(d3.extent([min_score, max_score]) as [number, number]);
        } else {
            this.y.domain(d3.extent([0.0, 100.0]) as [number, number]);
        }


        this.x_axis = this.prediction_graph.append("g");

        this.x_axis
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.x))
            .select(".domain")
            .remove();


        this.highlighted_move_circle_container = this.prediction_graph.append("g");

        this.move_crosshair = this.prediction_graph.append('g')
            .attr('class', 'move crosshairs')
            .append('line')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('x1', 0)
            .attr('y1', this.height);

        this.move_crosshair.attr('transform', 'translate(' + this.x(this.props.move_number) + ', 0)');

        this.cursor_crosshair = this.prediction_graph.append('g')
            .attr('class', 'cursor crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('x1', 0)
            .attr('y1', this.height);

        this.full_crosshair = this.prediction_graph.append('g')
            .attr('class', 'full crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('y1', 0)
            .attr('x1', this.width);

        let mouse_down = false;
        let last_move = -1;
        this.mouse_rect = this.svg.append('g').append('rect');
        this.mouse_rect
            .attr('class', 'overlay')
            .attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')')
            .attr('width', this.width)
            .attr('height', this.height)
            .on('mouseover', () => {
                this.cursor_crosshair?.style('display', null);
                this.full_crosshair?.style('display', null);
            })
            .on('mouseout', () => {
                mouse_down = false;
                this.cursor_crosshair?.style('display', 'none');
                this.full_crosshair?.style('display', 'none');
            })
            .on('mousemove', function() {
                /* tslint:disable */
                let x0 = self.x.invert(d3.mouse(this as d3.ContainerElement)[0]);
                /* tslint:enable */

                let i = bisector(self.props.entries, x0, 1);
                let d0 = self.props.entries[i - 1];
                let d1 = self.props.entries[i];

                if (!d0 || !d1) {
                    return;
                }

                let d = x0 - d0.move_number > d1.move_number - x0 ? d1 : d0;
                self.cursor_crosshair?.attr('transform', 'translate(' + self.x(d.move_number) + ', 0)');
                self.full_crosshair?.attr('transform', 'translate(0, ' + self.y(self.props.use_score ? d.score : d.win_rate * 100.0) + ')');

                if (mouse_down) {
                    if (d.move_number !== last_move) {
                        last_move = d.move_number;
                        self.props.setmove(d.move_number);
                    }
                }
            })
            .on('mousedown', function() {
                mouse_down = true;
                last_move = -1;

                /* tslint:disable */
                let x0 = self.x.invert(d3.mouse(this as d3.ContainerElement)[0]);
                /* tslint:enable */

                let i = bisector(self.props.entries, x0, 1);
                let d0 = self.props.entries[i - 1];
                let d1 = self.props.entries[i];

                if (!d0 || !d1) {
                    return;
                }

                let d = x0 - d0.move_number > d1.move_number - x0 ? d1 : d0;
                last_move = d.move_number;
                self.props.setmove(d.move_number);
            })
            .on('mouseup', () => {
                mouse_down = false;
            })
        ;

        this.plot();

        this.onResize();
    }
    plot() {
        let entries:Array<AIReviewEntry>;

        if (this.props.entries.length > 0) {
            entries = this.props.entries.map(x => x);
            entries.unshift({win_rate: 0.5, score: 0.0, move_number: 0, num_variations: 0});
            entries.push({
                win_rate: 0.5,
                score: 0.0,
                move_number: entries[entries.length - 1].move_number,
                num_variations: 0
            });
        } else {
            // no entries? draw a traveling sine wave while processing
            entries = [];
            const n_moves_to_render = 100;
            const sine_step = (Math.PI / n_moves_to_render) * 4;
            for (let i = 0; i < n_moves_to_render; ++i) {
                entries.push({
                    //win_rate: Math.sin((Date.now() * 0.005 + i) * sine_step) * 0.4 + 0.5,
                    win_rate: simplex.getValue(Date.now() * 0.001, i * sine_step, 0.5) * 0.4 + 0.5,
                    score: simplex.getValue(Date.now() * 0.001, i * sine_step, 0.5) * 0.4 + 0.5,
                    move_number: i,
                    num_variations: 0
                });
            }
            this.replot_timeout = setTimeout(() => this.plot(), 50);
        }

        this.x.domain(d3.extent([0, entries[entries.length - 1].move_number]) as [number, number]);
        if (this.props.use_score) {
            this.y.domain(d3.extent([this.min_score, this.max_score]) as [number, number]);
        } else {
            this.y.domain(d3.extent([0.0, 100.0]) as [number, number]);
        }

        this.win_rate_area_container
            ?.datum(entries)
            .attr('d', this.win_rate_area as any);

        this.win_rate_line_container
            ?.datum(entries)
            .attr('d', this.win_rate_line as any);

        let show_all = Object.keys(this.props.ai_review.moves).length <= 3;
        let circle_coords = entries.filter((x) => {
            if (this.props.ai_review.moves[x.move_number]
                && (show_all || (
                        !this.props.ai_review.moves[x.move_number + 1]
                        && x.move_number !== this.props.ai_review.win_rates.length - 1)
                   )
            ) {
                return true;
            }

            return false;
        });


        let gradient_transition_point = 50;
        if (this.props.use_score) {
            let yRange = this.max_score - this.min_score;
            gradient_transition_point = (this.max_score / yRange) * 100;
        }
        this.svg.select("linearGradient").remove();
        this.svg.append("linearGradient")
            .attr("id", "win-rate-area-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", 0).attr("y2", this.height)
            .selectAll("stop")
            .data(
                data.get('theme') === 'dark'
                    ? [
                        {offset: "0%", color: "#000000"},
                        {offset: (gradient_transition_point - 1).toFixed(0) + "%", color: "#333333"},
                        {offset: gradient_transition_point.toFixed(0) + "%", color: "#888888"},
                        {offset: (gradient_transition_point + 1).toFixed(0) + "%", color: "#909090"},
                        {offset: "100%", color: "#999999"}
                      ]
                    : [
                        {offset: "0%", color: "#222222"},
                        {offset: (gradient_transition_point - 1).toFixed(0) + "%", color: "#444444"},
                        {offset: gradient_transition_point.toFixed(0) + "%", color: "#888888"},
                        {offset: (gradient_transition_point + 1).toFixed(0) + "%", color: "#cccccc"},
                        {offset: "100%", color: "#eeeeee"}
                      ]
            )
            .enter()
            .append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color)
            ;

        this.highlighted_move_circles =
            this.highlighted_move_circle_container
                .selectAll('circle')
                .data(circle_coords) as d3.Selection<SVGCircleElement, AIReviewEntry, SVGSVGElement, unknown>;
        // remove any data points that were removed
        this.highlighted_move_circles.exit().remove();
        // add circles that were added
        this.highlighted_move_circles .enter() .append('circle');
        // update positions for our circles
        this.highlighted_move_circles
            .transition()
            .duration(200)
            .attr('cx', d => this.x(d.move_number))
            .attr('cy', d => this.y(this.props.use_score ? d.score : d.win_rate * 100))
            .attr('r', d => 3)
            .attr('fill', d => '#FF0000');
    }
    deinitialize() {
        this.destroyed = true;
        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            delete this.resize_debounce;
        }
        if (this.replot_timeout) {
            clearTimeout(this.replot_timeout);
            delete this.replot_timeout;
        }
        this.svg?.remove();
        delete this.container;
    }
    onResize = (no_debounce:boolean = false) => {
        if (this.destroyed) {
            return;
        }

        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            delete this.resize_debounce;
        }

        if (!no_debounce) {
            this.resize_debounce = setTimeout(() => this.onResize(true), 10);
            return;
        }

        this.width = Math.max(100, (this.container?.clientWidth || 0)  - MARGIN.left - MARGIN.right);

        this.svg?.attr('width', this.width + MARGIN.left + MARGIN.right);

        this.x.range([0, this.width]);

        let entries = this.props.entries.map(x => x);
        entries.unshift({win_rate: 0.5, score: 0.0, move_number: 0, num_variations: 0});
        entries.push({
            win_rate: 0.5,
            score: 0.0,
            move_number: this.props.entries?.length >= 1 ? this.props.entries[this.props.entries.length - 1].move_number : 0,
            num_variations: 0
        });

        this.win_rate_area_container
            ?.datum(entries)
            .attr('d', this.win_rate_area as any);

        this.win_rate_line_container
            ?.datum(entries)
            .attr('d', this.win_rate_line as any);

        this.x_axis
            ?.attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.x))
            .select(".domain")
            .remove();

        this.mouse_rect
            ?.attr('transform', 'translate(' + MARGIN.left + ',' + MARGIN.top + ')')
            .attr('width', this.width);

        this.full_crosshair?.attr('x1', this.width);

        this.plot();
    }
    setContainer = (e:HTMLElement | null) => {
        let need_resize = !this.container;

        if (e) {
            this.container = e;
        } else {
            delete this.container;
        }

        if (need_resize) {
            this.onResize();
        }
    }
    render() {
        return (
            <div ref={this.setContainer} className="AIReviewChart">
                <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
                <PersistentElement elt={this.chart_div}/>
            </div>
        );
    }
}

