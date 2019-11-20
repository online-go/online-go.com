
/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import ReactResizeDetector from 'react-resize-detector';
import * as data from "data";
import {UIPush} from "UIPush";
import {openBecomeASiteSupporterModal} from "Supporter";
import {deepCompare, dup} from 'misc';
import {get, post} from 'requests';
import {_, pgettext, interpolate} from "translate";
import {PersistentElement} from 'PersistentElement';
import {Game} from './Game';
import {
    GoMath,
    MoveTree,
    JGOFAIReview,
    JGOFAIReviewMove,
    JGOFIntersection,
    ColoredCircle,
} from 'goban';
import Select from 'react-select';
import {close_all_popovers, popover} from "popover";

declare var swal;

export interface AIReviewEntry {
    move_number: number;
    win_rate: number;
    num_variations: number;
}

interface AIReviewChartProperties {
    entries     : Array<AIReviewEntry>;
    ai_review   : JGOFAIReview;
    updatecount : number;
    move        : number;
    setmove     : (move_number:number) => void;
}

const bisector = d3.bisector((d:AIReviewEntry) => { return d.move_number; }).left;
//let margin = { top: 15, right: 20, bottom: 30, left: 20 };
const MARGIN = { top: 15, right: 5, bottom: 30, left: 5 };
const INITIAL_WIDTH = 600 - MARGIN.left - MARGIN.right;
const INITIAL_HEIGHT = 100 - MARGIN.top - MARGIN.bottom;

export class AIReviewChart extends React.Component<AIReviewChartProperties, any> {
    container?:HTMLElement;
    chart_div:HTMLElement;
    svg?:d3.Selection<SVGSVGElement, unknown, null, undefined>;
    //svg?:number;
    destroyed = false;
    chart?:number;
    graph?:number;
    resize_debounce?:any; // timeout
    prediction_graph?:d3.Selection<SVGGElement, unknown, null, undefined>;
    width?:number;
    height?:number;
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

    //circles_path?:d3.Selection<SVGPathElement, unknown, null, undefined>;
    //circles?: d3.Symbol<any, AIReviewEntry>;


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
        this.move_crosshair?.attr('transform', 'translate(' + this.x(this.props.move) + ', 0)');
        this.onResize();
    }
    componentWillUnmount() {
        this.deinitialize();
    }
    shouldComponentUpdate(nextProps:AIReviewChartProperties, nextState:any) {
        return !deepCompare(nextProps.entries, this.props.entries) || this.props.move !== nextProps.move;
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

        this.svg.append("linearGradient")
            .attr("id", "win-rate-area-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", 0).attr("y2", this.height)
            .selectAll("stop")
            .data([
                {offset: "0%", color: "#222222"},
                {offset: "49%", color: "#444444"},
                {offset: "50%", color: "#888888"},
                {offset: "51%", color: "#cccccc"},
                {offset: "100%", color: "#eeeeee"}
            ])
            .enter()
            .append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color)
            ;


        this.win_rate_area = d3.area<AIReviewEntry>()
            .curve(d3.curveMonotoneX)
            .x1(d => this.x(d.move_number))
            .y1(d => this.y(d.win_rate * 100.0))
            .x0(d => this.x(d.move_number))
            .y0(d => this.y(50))
            ;

        this.win_rate_line = d3.line<AIReviewEntry>()
            .curve(d3.curveMonotoneX)
            .x(d => this.x(d.move_number))
            .y(d => this.y(d.win_rate * 100.0));

        this.y.domain(d3.extent([0.0, 100.0]) as [number, number]);

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

        this.move_crosshair.attr('transform', 'translate(' + this.x(this.props.move) + ', 0)');

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
                self.full_crosshair?.attr('transform', 'translate(0, ' + self.y(d.win_rate * 100.0) + ')');

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
        if (this.props.entries.length <= 0) {
            this.setState({
                nodata: true,
            });
            return;
        } else {
            this.setState({
                nodata: false,
            });
        }

        this.x.domain(d3.extent([0, this.props.entries[this.props.entries.length - 1].move_number]) as [number, number]);
        this.y.domain(d3.extent([0.0, 100.0]) as [number, number]);

        let entries = this.props.entries.map(x => x);
        entries.unshift({win_rate: 0.5, move_number: 0, num_variations: 0});
        entries.push({win_rate: 0.5, move_number: this.props.entries[this.props.entries.length - 1].move_number, num_variations: 0});

        this.win_rate_area_container
            ?.datum(entries)
            .attr('d', this.win_rate_area as any);

        this.win_rate_line_container
            ?.datum(entries)
            .attr('d', this.win_rate_line as any);

        let show_all = Object.keys(this.props.ai_review.moves).length <= 3;
        let circle_coords = this.props.entries.filter((x) => {
            if (this.props.ai_review.moves[x.move_number]
                && (show_all || !this.props.ai_review.moves[x.move_number + 1])
            ) {
                return true;
            }

            return false;
        });

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
            .attr('cy', d => this.y(d.win_rate * 100))
            .attr('r', d => 3)
            .attr('fill', d => '#ff0000');
    }
    deinitialize() {
        this.destroyed = true;
        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            delete this.resize_debounce;
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
        entries.unshift({win_rate: 0.5, move_number: 0, num_variations: 0});
        entries.push({win_rate: 0.5, move_number: this.props.entries[this.props.entries.length - 1].move_number, num_variations: 0});

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

interface AIReviewProperties {
    game: Game;
    move: MoveTree;
    hidden: boolean;
}

interface AIReviewState {
    loading: boolean;
    reviewing: boolean;
    ai_reviews: Array<JGOFAIReview>;
    selected_ai_review?: JGOFAIReview;
    updatecount: number;
    top_moves: Array<JGOFAIReviewMove>;
}

export class AIReview extends React.Component<AIReviewProperties, AIReviewState> {
    ai_review?:JGOFAIReview;

    constructor(props:AIReviewProperties) {
        super(props);
        let state:AIReviewState = {
            loading: true,
            reviewing: false,
            ai_reviews: [],
            updatecount: 0,
            top_moves: [],
        };
        this.state = state;
    }

    componentDidMount() {
        this.getAIReviewList();
    }

    componentDidUpdate(prevProps:AIReviewProperties, prevState:any) {
        if (this.getGameId() !== this.getGameId(prevProps)) {
            this.getAIReviewList();
        }
    }

    componentWillUnmount() {
    }

    getGameId(props?:AIReviewProperties) {
        if (!props) {
            props = this.props;
        }

        if (props.game) {
            if (props.game.game_id) {
                return props.game.game_id;
            }
        }
        return null;
    }

    getAIReviewList() {
        let game_id = this.getGameId();
        if (!game_id) {
            return;
        }

        get(`games/${game_id}/ai_reviews`)
        .then((lst:Array<JGOFAIReview>) => {
            this.setState({
                loading: false,
                ai_reviews: lst,
            });

            if (lst.length) {
                /* Select the best AI review */
                lst = lst.sort((a, b) => {
                    if (a.type !== b.type) {
                        return a.type === 'full' ? -1 : 1;
                    }

                    if (a.network_size < b.network_size) {
                        return 1;
                    }
                    if (b.network_size < a.network_size) {
                        return -1;
                    }

                    if (a.strength - b.strength !== 0) {
                        return b.strength - a.strength;
                    }

                    return a.date - b.date;
                });
                //console.log("List: ", lst);
                this.setSelectedAIReview(lst[0]);
            } else {
                post(`games/${game_id}/ai_reviews`, {
                    'engine': 'leela_zero',
                    'type': 'auto',
                })
                .then(res => {
                    if (res.id) {
                        this.setState({reviewing: true});
                    }
                })
                .catch(err => console.error(err));
            }
        })
        .catch(err => console.error(err));
    }

    getAIReview(ai_review_id:string) {
        let game_id = this.getGameId();
        if (!game_id) {
            return;
        }

        delete this.ai_review;
        this.syncAIReview();

        get(`/termination-api/game/${game_id}/ai_review/${ai_review_id}`)
        .then((ai_review:JGOFAIReview) => {
            console.log("AI Review", ai_review);
            this.ai_review = ai_review;
            this.syncAIReview();
        })
        .catch(err => console.error(err));
    }

    moveNumOffset = this.handicapOffset() > 0 ? 1 : 0;

    handicapOffset():number {
        if (this.props.game
            && this.props.game.goban
            && this.props.game.goban.engine
            && this.props.game.goban.engine.free_handicap_placement
            && this.props.game.goban.engine.handicap > 0
        ) {
            return this.props.game.goban.engine.handicap;
        }
        return 0;
    }

    syncAIReview() {
        if (!this.ai_review || !this.state.selected_ai_review) {
            this.setState({
                updatecount: this.state.updatecount + 1,
            });
            return;
        }

        let ai_review:JGOFAIReview = this.ai_review;

        if (!ai_review.win_rates) {
            ai_review.win_rates = [];
        }

        for (let k in ai_review.moves) {
            let move = ai_review.moves[k];
            ai_review.win_rates[move.move_number] = move.pre_move_win_rate;

            let next_move = ai_review.moves[parseInt(k) + 1];
            if (next_move) {
                move.post_move_win_rate = next_move.pre_move_win_rate;
            }
        }

        /* TODO: Blunder count & top3 move array */

        this.setState({
            loading: false,
            //top3: null,
            //blunders: blunders,
            //queue_position: this.state.selected_ai_review.queue.position,
            //queue_pending: this.state.selected_ai_review.queue.pending,
            updatecount: this.state.updatecount + 1,
        });
    }

    clearAIReview() {
        this.props.game.goban.setMode("play");
        this.setState({
            //full: null,
            //fast: null,
            updatecount: this.state.updatecount + 1,
        });
    }

    setSelectedAIReview = (ai_review:JGOFAIReview) => {
        close_all_popovers();
        this.setState({
            selected_ai_review: ai_review,
        });
        if (ai_review) {
            this.getAIReview(ai_review.id);
        } else {
            this.clearAIReview();
        }
    }

    normalizeHeatmap(heatmap:Array<Array<number>>):Array<Array<number>> {
        let m = 0;
        let ret:Array<Array<number>> = [];
        for (let row of heatmap) {
            let r = [];
            for (let v of row) {
                m = Math.max(m, v);
                r.push(v);
            }
            ret.push(r);
        }

        for (let row of ret) {
            for (let i = 0; i < row.length; ++i) {
                row[i] /= m;
            }
        }

        return ret;
    }

    ai_review_update = (data:any) => {
        if ('ai_review_id' in data) {
            this.getAIReview(data.ai_review_id);
        }
        if ('refresh' in data) {
            this.getAIReviewList();
        }
    }
    ai_review_update_key = (data:any) => {
        if (this.ai_review) {
            if (data.key === 'metadata') {
                console.log("TODO: Need to update metadata");
            }
            if (/move-[0-9]+/.test(data.key)) {
                let m = data.key.match(/move-([0-9]+)/);
                let move_number = parseInt(m[1]);

                this.ai_review.moves[move_number] = data.body;
            }
            this.setState({
                updatecount: this.state.updatecount + 1,
            });
            this.syncAIReview();
        }
    }

    openAIReviewList = (ev:React.MouseEvent<HTMLElement>) => {
        close_all_popovers();
        popover({
            elt: (<div className='ai-review-list' >
                    {this.state.ai_reviews.map((ai_review, idx) => {
                        let params = {
                            strength: ai_review.strength,
                            network_size: ai_review.network_size,
                            num_moves: Object.keys(ai_review.moves).length,
                        };
                        return (
                            <div className={'ai-review-item ' +
                                    (ai_review.id === this.state.selected_ai_review?.id ? 'selected' : '')}
                                key={idx}
                                title={moment(ai_review.date).format('LL')}
                                onClick={() => this.setSelectedAIReview(ai_review)}>
                                { ai_review.type === 'full'
                                    ? interpolate(_("Full {{network_size}} review by Leela Zero"), params)
                                    : interpolate(_("Top {{num_moves}} moves according to Leela Zero"), params)
                                }
                            </div>
                       );
                    })}
                  </div>
                 ),
            below: ev.target as HTMLElement,
            minWidth: 240,
            minHeight: 250,
        });
    }

    showMoreInfo = (ev:React.MouseEvent<HTMLElement>) => {
        close_all_popovers();
        console.log(this.state.selected_ai_review);
        popover({
            elt: (
                <div className='ai-review-more-info' >
                    <table>
                        <tbody>
                            <tr>
                                <th>{_("Date")}</th>
                                <td>{moment(this.state.selected_ai_review?.date).format('LL')}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI Review Engine", "Engine")}</th>
                                <td>{"Leela Zero"}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI Review engine version", "Version")}</th>
                                <td>{this.state.selected_ai_review?.engine_version}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI Review engine network used", "Network")}</th>
                                <td title={this.state.selected_ai_review?.network}>{this.state.selected_ai_review?.network.substr(0, 8)}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("Size of neural network", "Network Size")}</th>
                                <td>{this.state.selected_ai_review?.network_size}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI review engine playouts strength", "Strength")}</th>
                                <td>{this.state.selected_ai_review?.strength}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ),
            below: ev.target as HTMLElement,
            minWidth: 300,
            minHeight: 250,
        });
    }

    public render() {
        if (this.state.loading) {
            return null;
        }

        if (!this.props.game || !this.props.game.goban || !this.props.game.goban.engine) {
            return null;
        }

        if (!this.props.move) {
            return null;
        }

        if (!this.ai_review || this.props.hidden) {
            return (
                <div className='AIReview'>
                    <UIPush event="ai-review" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update} />
                    <UIPush event="ai-review-key" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update_key} />
                    { ((!this.props.hidden && ((this.state.ai_reviews.length === 0 && this.state.reviewing))) || null) &&
                        <div className='reviewing'>
                            {_("Queing AI review")}
                            <i className='fa fa-desktop slowstrobe'></i>
                        </div>
                    }
                </div>
            );
        }

        let move_ai_review:JGOFAIReviewMove | null = null;
        let next_move_ai_review:JGOFAIReviewMove | null = null;
        let win_rate = 0.0;
        let next_win_rate = -1.0;
        let next_move = null;
        let move_relative_delta = null;
        let cur_move = this.props.move;
        let trunk_move = cur_move.getBranchPoint();
        let move_number = trunk_move.move_number;
        let show_full_ai_review_button = null;
        let user = data.get('user');
        let next_move_pretty_coords:string = '';

        /*
        if (next_move) {
            next_move_ai_review = this.props.game.goban.engine.prettyCoords(next_move.x, next_move.y);
        }
        */

        try {
            if (
                user.id === this.props.game.goban.engine.players.black.id ||
                user.id === this.props.game.goban.engine.players.white.id ||
                user.id === this.props.game.creator_id
            ) {
                show_full_ai_review_button = true;
            }
            if (user.is_moderator) {
                show_full_ai_review_button = true;
            }
        } catch {
            // no problem, just a loaded sgf or something
        }

        if (this.ai_review.moves[move_number]) {
            /* TODO: do we need handicap offset here still? */
            /*
            if ( `full-${move_number - this.handicapOffset()}` in this.ai_review) {
                move_ai_review = this.ai_review[`full-${move_number - this.handicapOffset()}`];
            }
            */
            move_ai_review = this.ai_review.moves[move_number];
        }

        if (move_ai_review) {
            win_rate = move_ai_review.pre_move_win_rate;

            /* TODO: Do we need handicap offset here still? */
            next_move_ai_review = this.ai_review.moves[move_ai_review.move_number + 1];
            if (next_move_ai_review) {
                next_win_rate = next_move_ai_review.post_move_win_rate || -1;
                next_win_rate *= 100.0;
            }
            /*
            if (`full-${move_number + 1 - this.handicapOffset()}` in this.ai_review) {
                next_move_ai_review = this.ai_review[`full-${move_number + 1 - this.handicapOffset()}`];
                next_win_rate = next_move_ai_review.win_rate;
            }
            else {
                next_move = cur_move.trunk_next;
                if (next_move) {
                    next_move_pretty_coords = this.props.game.goban.engine.prettyCoords(next_move.x, next_move.y);
                    for (let v of move_ai_review.variations) {
                        if (v.move === next_move_pretty_coords) {
                            next_win_rate = v['win_rate'];
                        }
                    }
                }
            }
            */
        }


        let marks:any = {};
        let colored_circles = [];
        let heatmap:Array<Array<number>> | null = null;
        try {
            if (cur_move.trunk) {
                next_move = cur_move.trunk_next;

                if (move_ai_review) {
                    //let variations = move_ai_review.variations.slice(0, 6);
                    let variations = move_ai_review.variations;

                    let found_next_move = false;
                    for (let v of variations) {
                        if (next_move && isEqualMoveIntersection(v.move, next_move)) {
                            found_next_move = true;
                            break;
                        }
                    }
                    if (!found_next_move && next_move) {
                        variations.push({
                            move: next_move,
                            post_move_win_rate: next_win_rate,
                            followup_moves: [],
                            visits: 0,
                        });
                    }

                    let strength = this.ai_review.strength;

                    heatmap = [];
                    for (let y = 0; y < this.props.game.goban.engine.height; y++) {
                        let r = [];
                        for (let x = 0; x < this.props.game.goban.engine.width; x++) {
                            r.push(0);
                        }
                        heatmap.push(r);
                    }

                    for (let i = 0 ; i < variations.length; ++i) {

                        let mv = variations[i].move;
                        heatmap[mv.y][mv.x] = variations[i].visits / strength;

                        //if (variations[i].followup_moves.length > 2 || variations[i].move === next_move_pretty_coords) {
                        console.log(variations[i]);
                        if (variations[i].followup_moves?.length || (next_move && isEqualMoveIntersection(variations[i].move, next_move))) {
                            let delta = 0;

                            //if (move_ai_review.player_to_move === 'white') {
                            //    delta = -1.0 * ((1.0 - variations[i].win_rate) - (move_ai_review.win_rate));
                            //} else {
                            //    delta = (variations[i].win_rate) - (move_ai_review.win_rate);
                            //}

/*
                            if (move_ai_review.player_to_move === 'white') {
                                delta = -1 * ((1.0 - (variations[i].win_rate)) - (move_ai_review.win_rate));
                            } else {
                                delta = (variations[i].win_rate) - (move_ai_review.win_rate);
                            }
*/

                            delta = (variations[i].post_move_win_rate) - (move_ai_review.pre_move_win_rate);


                            if (next_move && isEqualMoveIntersection(variations[i].move, next_move) && next_win_rate >= 0) {
                                delta = ((move_ai_review.pre_move_win_rate) - next_win_rate);
                                /*
                                if (move_ai_review.player_to_move === 'black') {
                                    delta *= -1.0;
                                }
                                */
                            }

                            delta *= 100.0;

                            let key = delta.toFixed(1);
                            if (key === "0.0" || key === "-0.0") {
                                key = "0";
                            }
                            // only show numbers for well explored moves
                            // show number for AI choice and played move as well
                            if (mv && ((i === 0) ||
                                       (next_move && isEqualMoveIntersection(variations[i].move, next_move)) ||
                                       (variations[i].visits >= Math.min(50, 0.1 * strength)))) {
                                if (parseFloat(key).toPrecision(2).length < key.length) {
                                    key = parseFloat(key).toPrecision(2);
                                }
                                this.props.game.goban.setMark(mv.x, mv.y, key, true);
                            }

                            let circle:ColoredCircle = {
                                move: variations[i].move,
                                color: 'rgba(0,0,0,0)',
                            };

                            if (next_move && isEqualMoveIntersection(variations[i].move, next_move)) {
                                this.props.game.goban.setMark(mv.x, mv.y, "sub_triangle", true);

                                circle.border_width = 0.1;
                                circle.border_color = 'rgb(0, 0, 0)';
                                if (i === 0) {
                                    circle.color = 'rgba(0, 130, 255, 0.7)';
                                } else {
                                    circle.color = 'rgba(255, 255, 255, 0.3)';
                                }
                                colored_circles.push(circle);
                            }
                            else if (i === 0) { //
                                circle.border_width = 0.2;
                                circle.border_color = 'rgb(0, 130, 255)';
                                circle.color = 'rgba(0, 130, 255, 0.7)';
                                colored_circles.push(circle);
                            }
                        }

                    }

                    /*
                    if (next_move) {
                        marks["sub_triangle"] = GoMath.encodeMove(next_move.x, next_move.y);
                    }
                    */
                }
            }
            else { // !cur_move.trunk
                if (move_ai_review) {
                    let trunk_move_string = trunk_move.getMoveStringToThisPoint();
                    let cur_move_string = cur_move.getMoveStringToThisPoint();
                    let next_moves = null;

                    for (let v of move_ai_review.variations) {
                        let move_str:string = trunk_move_string + GoMath.encodeMoves(v.followup_moves);
                        if (move_str.startsWith(cur_move_string)) {
                            next_moves = move_str.slice(cur_move_string.length, Infinity);
                            break;
                        }
                    }

                    if (next_moves) {
                        let decoded_moves = this.props.game.goban.engine.decodeMoves(next_moves);
                        let black = "";
                        let white = "";

                        for (let i = 0; i < decoded_moves.length; ++i) {
                            let mv = decoded_moves[i];
                            let encoded_mv = GoMath.encodeMove(mv.x, mv.y);
                            marks[i + cur_move.getDistance(trunk_move) + 1] = encoded_mv;
                            if (((this.props.game.goban.engine.player - 1) + i) % 2 === 1) {
                                white += encoded_mv;
                            } else {
                                black += encoded_mv;
                            }
                        }
                        if (black) {
                            marks["black"] = black;
                        }
                        if (white) {
                            marks["white"] = white;
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        try {
            this.props.game.goban.setMarks(marks, true);
            if (heatmap) {
                this.props.game.goban.setHeatmap(heatmap, true);
            }
            this.props.game.goban.setColoredCircles(colored_circles, false);
        } catch (e) {
            // ignore
        }

        if (next_win_rate >= 0) {
            move_relative_delta = next_win_rate - win_rate;
            //console.log(move_ai_review.move, this.props.game.goban.engine.colorToMove(), move_ai_review.player_to_move, win_rate, next_win_rate);
            if (this.props.game.goban.engine.colorToMove() === "white") {
                move_relative_delta = -move_relative_delta;
            }
            move_relative_delta *= 100.0;
        }

        let have_prediction = true;
        if (move_ai_review) {
            have_prediction = true;
            win_rate = move_ai_review.pre_move_win_rate;
        }

        //let have_prediction = true;
        //win_rate = this.ai_review.win_rate;

        win_rate *= 100.0;

        let ai_review_chart_entries:Array<AIReviewEntry> = this.ai_review.win_rates?.map((x, idx) => {
            return {
                move_number: idx,
                win_rate: x,
                num_variations: this.ai_review?.moves[idx]?.variations.length || 0,
            };
        }) || [];

        return (
            <div className='AIReview'>
                <UIPush event="ai-review" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update} />
                <UIPush event="ai-review-key" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update_key} />

                { false && (this.state.ai_reviews.length > 1 || null) &&
                    <Select
                        value={this.state.selected_ai_review}
                        options={this.state.ai_reviews}
                        onChange={this.setSelectedAIReview as any}
                        clearable={true}
                        autoBlur={true}
                        placeholder={_("Select AI AIReview")}
                        noResultsText={_("No results found")}
                        optionRenderer={(A) => <span className='ai_review-option'>{A.engine} {A.engine_version}</span>}
                        valueRenderer={(A) => <span className='ai_review-option'>{A.engine} {A.engine_version}</span>}
                        />
                }

                { true && (this.state.ai_reviews.length >= 1 || null) &&
                    <Select
                        value={this.state.selected_ai_review}
                        options={this.state.ai_reviews}
                        onChange={this.setSelectedAIReview as any}
                        clearable={false}
                        autoBlur={true}
                        placeholder={_("Select AI AIReview")}
                        noResultsText={_("No results found")}
                        optionRenderer={(A) =>
                            <span className='ai-review-option-container'>
                                {A.engine} {A.engine_version}
                            </span>
                        }
                        valueRenderer={(A) =>
                            <span className='ai-review-win-rate-container'>
                                <i className='fa fa-crown'/>
                                <div className={"progress " + (!have_prediction ? "invisible" : "")}>
                                    <div className="progress-bar black-background" style={{width: win_rate + "%"}}>{win_rate.toFixed(1)}%</div>
                                    <div className="progress-bar white-background" style={{width: (100.0 - win_rate) + "%"}}>{(100 - win_rate).toFixed(1)}%</div>
                                </div>

                            </span>
                        }
                        />
                }

                { false &&

                    <div className='prediction'>
                        <div className='ai-review-list-container'>
                            <span className='btn xs' onClick={this.openAIReviewList}>
                                <i className='fa fa-list-ul' />
                            </span>
                        </div>
                        {(this.state.selected_ai_review || null) &&
                            <div className='ai-review-more-info-container'>
                                <span className='btn xs' onClick={this.showMoreInfo}>
                                    <i className='fa fa-info' />
                                </span>
                            </div>
                        }
                        <div className={"progress " + (!have_prediction ? "invisible" : "")}>
                            <div className="progress-bar black-background" style={{width: win_rate + "%"}}>{win_rate.toFixed(1)}%</div>
                            <div className="progress-bar white-background" style={{width: (100.0 - win_rate) + "%"}}>{(100 - win_rate).toFixed(1)}%</div>
                        </div>
                        {(this.ai_review || null) &&
                            <div className='ai-review-network-size-container'>
                                <span >
                                    {this.ai_review.network_size}
                                </span>
                            </div>
                        }
                    </div>
                }

                {((this.ai_review && this.ai_review.win_rates) || null) &&
                    <AIReviewChart
                        ai_review={this.ai_review}
                        entries={ai_review_chart_entries}
                        updatecount={this.state.updatecount}
                        move={this.props.move.move_number}
                        setmove={this.props.game.nav_goto_move} />
                }

                {((this.ai_review?.type === 'fast') || null) &&
                    <div className='key-moves'>
                    TODO: Top moves
                        {/*
                        {this.state.blunders &&
                            <div>
                                {interpolate(_("10+% moves: {{black_blunders}} by black, {{white_blunders}} by white"),
                                    { black_blunders: this.state.blunders.black, white_blunders: this.state.blunders.white, })}
                            </div>
                        }

                        <div>
                            <b>{_("Top game changing moves")}</b>
                        </div>

                        {this.state.fast.map((move, idx) =>
                            <span key={move.move} className='key-move clickable' onClick={(ev) => this.props.game.nav_goto_move(move.move + this.handicapOffset())}>
                                {move.move + 1 + this.handicapOffset()}
                            </span>
                        )}

                    */}
                        {show_full_ai_review_button &&
                            <div>
                                <button
                                    className='primary'
                                    onClick={this.performFullAIReview}>
                                    {_("Full AI Review")}
                                </button>
                            </div>
                        }
                    </div>
                }

                {(this.state.top_moves.length > 0 || null) &&
                    <div>TODO: TOP moves
                    {/*

                    <div className='key-moves'>
                        {this.state.blunders &&
                            <div>
                                {interpolate(_("10+% moves: {{black_blunders}} by black, {{white_blunders}} by white"),
                                    { black_blunders: this.state.blunders.black, white_blunders: this.state.blunders.white, })}
                            </div>
                        }
                        <div>
                            <b>{_("Top game changing moves")}</b>
                        </div>

                        {this.state.top3.map((move, idx) =>
                            <span key={idx} className='key-move clickable' onClick={(ev) => this.props.game.nav_goto_move(move + this.handicapOffset() + this.moveNumOffset)}>
                                {move + 1 + this.handicapOffset() + this.moveNumOffset}
                            </span>
                        )}
                    </div>

                    */}
                    </div>
                }

                {(!this.ai_review || null) &&
                    <div className='pending'>
                        {_("AI review has been queued for processing.")}
                        <i className='fa fa-desktop slowstrobe'></i>
                    </div>
                }


                {move_ai_review && next_move && move_relative_delta !== null &&
                    <div className='next-move-delta-container'>
                        <span className={"next-move-coordinates " +
                            (this.props.game.goban.engine.colorToMove() === "white" ? "white-background" : "black-background")}>
                            <i className="ogs-label-triangle"></i> {next_move_pretty_coords}
                        </span>

                        {/*
                        <span className={"next-move-coordinates "
                            + (move_relative_delta <= -2 ? 'negative' : (move_relative_delta < 0 ? 'neutral' : 'positive')) }>
                            {next_move_pretty_coords}
                        </span>
                        */}
                        <span className={"next-move-delta " +
                            (move_relative_delta <= -0.1 ? 'negative' : (move_relative_delta >= 0.1 ? 'positive' : ''))}>
                            {move_relative_delta <= -0.1 ? <span>&minus;</span> :
                                (move_relative_delta >= 0.1 ? <span>&#43;</span> : <span>&nbsp;&nbsp;</span>)
                            } {Math.abs(move_relative_delta).toFixed(1)}pp
                        </span>
                    </div>
                }


            </div>
        );
    }

    orig_move: any;
    orig_marks: any;
    stashed_pen_marks: any;
    stashed_heatmap: any;

    /*
    leaveVariation() {
        let game = this.props.game;
        let goban = this.props.game.goban;

        if (game.in_pushed_analysis) {
            game.in_pushed_analysis = false;
            delete game.leave_pushed_analysis;
            goban.engine.jumpTo(this.orig_move);
            this.orig_move.marks = this.orig_marks;
            goban.pen_marks = this.stashed_pen_marks;
            if (goban.pen_marks.length === 0) {
                goban.disablePen();
            }
            goban.setHeatmap(this.stashed_heatmap);
            this.stashed_heatmap = null;
        }
    }
    enterVariation(move_number:number, v) {
        let game = this.props.game;
        let goban = this.props.game.goban;

        game.in_pushed_analysis = true;
        game.leave_pushed_analysis = () => this.leaveVariation();

        this.orig_move = goban.engine.cur_move;
        if (this.orig_move) {
            this.orig_marks = this.orig_move.marks;
            this.orig_move.clearMarks();
        } else {
            this.orig_marks = null;
        }
        goban.engine.followPath(move_number, v.moves);

        this.stashed_pen_marks = goban.pen_marks;
        goban.pen_marks = [];

        this.stashed_heatmap = goban.setHeatmap(null);
    }
    */
    performFullAIReview = () => {
        let user = data.get('user');

        if (user.anonymous) {
            swal(_("Please login first"));
        } else {
            if (user.supporter || user.professional || user.is_moderator) {
                this.props.game.force_ai_review("full");
            } else {
                openBecomeASiteSupporterModal();
            }
        }
    }
}

/*
function winRateDelta(start_or_delta, end?) {
    let delta = end ? end - start_or_delta : start_or_delta;
    if (delta > 0) {
        return <span className='increased-win-rate'>+{Math.round(delta * 100)}</span>;
    } else {
        return <span className='decreased-win-rate'>{Math.round(delta * 100)}</span>;
    }
}
*/

function isEqualMoveIntersection(a:JGOFIntersection, b:JGOFIntersection):boolean {
    return a.x === b.x && a.y === b.y;
}
