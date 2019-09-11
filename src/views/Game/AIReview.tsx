
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
import {Player} from "Player";
import {UIPush} from "UIPush";
import {openBecomeASiteSupporterModal} from "Supporter";
import {deepCompare, dup} from 'misc';
import {get, post} from 'requests';
import {Link} from "react-router-dom";
import {termination_socket} from 'sockets';
import {_, pgettext, interpolate} from "translate";
import {PersistentElement} from 'PersistentElement';
import {Game} from './Game';
import {GoMath, MoveTree, ColoredCircle} from 'ogs-goban';
import Select from 'react-select';
import {close_all_popovers, popover} from "popover";

declare var swal;

export class AIReviewEntry {
    move: number;
    fast_prediction: number;
    full_prediction: number;

    constructor(obj) {
        this.move = parseInt(obj.move);
        this.fast_prediction = parseFloat(obj.fast_prediction);
        this.full_prediction = parseFloat(obj.full_prediction);
    }
}

interface AIReviewChartProperties {
    entries     : Array<AIReviewEntry>;
    updatecount : number;
    move        : number;
    setmove     : (move_number:number) => void;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const bisector = d3.bisector((d:AIReviewEntry) => { return d.move; }).left;
let svgWidth = 600;
let svgHeight = 100;
let margin = { top: 15, right: 20, bottom: 30, left: 50 };
let width = svgWidth - margin.left - margin.right;
let height = svgHeight - margin.top - margin.bottom;

export class AIReviewChart extends React.Component<AIReviewChartProperties, any> {
    container = null;
    chart_div;
    svg;
    destroyed = false;
    chart;
    graph;
    resize_debounce;
    prediction_graph;
    //fast_chart;
    full_chart;
    width;
    height;
    //fast_line;
    full_line;
    x_axis;
    mouse;
    mouse_rect;
    move_crosshair;
    cursor_crosshair;
    full_crosshair;
    //fast_crosshair;
    x;
    y;


    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            nodata: false,
            hovered_date: null,
            hovered_month: null,
            date_extents: [],
        };
        this.chart_div = $("<div>")[0];
    }
    componentDidMount() {
        this.initialize();
    }
    componentDidUpdate(prevProps, prevState) {
        this.move_crosshair.attr('transform', 'translate(' + this.x(this.props.move) + ', 0)');
        this.onResize();
    }
    componentWillUnmount() {
        this.deinitialize();
    }
    shouldComponentUpdate(nextProps, nextState) {
        return !deepCompare(nextProps.entries, this.props.entries) || this.props.move !== nextProps.move;
    }

    initialize() {
        let self = this;

        this.width = 600;
        this.svg = d3.select(this.chart_div)
            .append('svg')
            .attr('class', 'chart')
            .attr('width', this.width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom + 0);

        this.prediction_graph = this.svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        this.full_chart = this.prediction_graph.append('path')
            .attr('class', 'full-prediction line');

        this.x = d3.scaleLinear().rangeRound([0, width]);
        this.y = d3.scaleLinear().rangeRound([height, 0]);

        this.full_line = d3.line()
            .curve(d3.curveMonotoneX)
             .x(d => this.x((d as any) .move))
             .y(d => this.y((d as any) .full_prediction * 100.0));
        this.y.domain(d3.extent([0.0, 100.0]));

        this.x_axis = this.prediction_graph.append("g");

        this.x_axis
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(this.x))
            .select(".domain")
            .remove();

        let g = this.prediction_graph.append("g");

        g.call(d3.axisLeft(this.y).ticks(3))
           .append("text")
           .attr("fill", "#000")
           .attr("transform", "rotate(-90)")
           .attr("y", 6)
           .attr("dy", "0.71em")
           .attr("text-anchor", "end")
           .text(_("Black")) ;

        g.call(d3.axisLeft(this.y).ticks(3))
           .append("text")
           .attr("fill", "#000")
           .attr("transform", "rotate(-90)")
           .attr("x", - height)
           .attr("y", 6)
           .attr("dy", "0.71em")
           .attr("text-anchor", "start")
           .text(_("White"));

        this.move_crosshair = this.prediction_graph.append('g')
            .attr('class', 'move crosshairs')
            .append('line')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('x1', 0)
            .attr('y1', height);

        this.move_crosshair.attr('transform', 'translate(' + this.x(this.props.move) + ', 0)');

        this.cursor_crosshair = this.prediction_graph.append('g')
            .attr('class', 'cursor crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('x1', 0)
            .attr('y1', height);

        /*
        this.fast_crosshair = this.prediction_graph.append('g')
            .attr('class', 'fast crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('y1', 0)
            .attr('x1', width);
        */

        this.full_crosshair = this.prediction_graph.append('g')
            .attr('class', 'full crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('y1', 0)
            .attr('x1', width);

        let mouse_down = false;
        let last_move = -1;
        this.mouse_rect = this.svg.append('g').append('rect');
        this.mouse_rect
            .attr('class', 'overlay')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', () => {
                this.cursor_crosshair.style('display', null);
                this.full_crosshair.style('display', null);
                //this.fast_crosshair.style('display', null);
            })
            .on('mouseout', () => {
                mouse_down = false;
                this.cursor_crosshair.style('display', 'none');
                this.full_crosshair.style('display', 'none');
                //this.fast_crosshair.style('display', 'none');
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

                let d = x0 - d0.move > d1.move - x0 ? d1 : d0;
                self.cursor_crosshair.attr('transform', 'translate(' + self.x(d.move) + ', 0)');
                //self.fast_crosshair.attr('transform', 'translate(0, ' + self.y(d.fast_prediction * 100.0) + ')');
                self.full_crosshair.attr('transform', 'translate(0, ' + self.y(d.full_prediction * 100.0) + ')');

                if (mouse_down) {
                    if (d.move !== last_move) {
                        last_move = d.move;
                        self.props.setmove(d.move);
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

                let d = x0 - d0.move > d1.move - x0 ? d1 : d0;
                last_move = d.move;
                self.props.setmove(d.move);
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

        this.x.domain(d3.extent([1, this.props.entries[this.props.entries.length - 1].move]));
        this.y.domain(d3.extent([0.0, 100.0]));

        this.full_chart
            .datum(this.props.entries)
            .attr('d', this.full_line as any);
    }
    deinitialize() {
        this.destroyed = true;
        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = null;
        }
        this.svg.remove();
        this.container = null;
    }
    onResize = (no_debounce:boolean = false) => {
        if (this.destroyed) {
            return;
        }

        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = null;
        }

        if (!no_debounce) {
            this.resize_debounce = setTimeout(() => this.onResize(true), 10);
            return;
        }

        this.width = Math.max(100, $(this.container).width()  - margin.left - margin.right);

        this.svg.attr('width', this.width + margin.left + margin.right);

        this.x.range([0, this.width]);
        this.full_chart
            .datum(this.props.entries)
            .attr('d', this.full_line as any);

        this.x_axis
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(this.x))
            .select(".domain")
            .remove();

        this.mouse_rect
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .attr('width', this.width);

        this.full_crosshair.attr('x1', this.width);

    }
    setContainer = (e) => {
        let need_resize = this.container === null;
        this.container = e;
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

export class AIReview extends React.Component<AIReviewProperties, any> {
    ai_review;

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            reviewing: false,
            ai_reviews: [],
            selected_ai_review: null,
            full: null,
            fast: null,
            update_count: 0,
        };
    }

    componentDidMount() {
        this.getAIReviewList();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.getGameId() !== this.getGameId(prevProps)) {
            this.getAIReviewList();
        }
    }

    componentWillUnmount() {
    }

    getGameId(props?) {
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

        //get(`/termination-api/ai_review/${game_id}`)
        get(`games/${game_id}/ai_reviews`)
        .then(lst => {
            this.setState({
                loading: false,
                ai_reviews: lst,
            });

            if (lst.length) {
                /* Select the best AI review */
                lst = lst.sort((a, b) => {
                    if (a.full && !b.full) {
                        return -1;
                    }
                    if (b.full && !a.full) {
                        return 1;
                    }

                    if (a.network_size < b.network_size) {
                        return 1;
                    }
                    if (b.network_size < a.network_size) {
                        return -1;
                    }

                    if (a.playouts - b.playouts !== 0) {
                        return b.playouts - a.playouts;
                    }

                    if (a.visits - b.visits !== 0) {
                        return b.visits - a.visits;
                    }

                    if (a.finished && !b.finished) {
                        return -1;
                    }
                    if (b.finished && !a.finished) {
                        return 1;
                    }

                    if (a.finished && b.finished) {
                        return (new Date(a.finished)).getTime() - (new Date(b.finished)).getTime();
                    }

                    return (new Date(a.created)).getTime() - (new Date(b.created)).getTime();
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

        this.ai_review = null;
        this.syncAIReview();

        get(`/termination-api/game/${game_id}/ai_review/${ai_review_id}`)
        .then(ai_review => {
            this.ai_review = ai_review;
            this.syncAIReview();
        })
        .catch(err => console.error(err));
    }

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
                //loading: true,
                full: null,
                fast: null,
                updatecount: this.state.updatecount + 1,
            });
            return;
        }

        let ai_review = this.ai_review;

        try {
            let last_move = this.props.game.goban.engine.last_official_move;
            if (last_move.x === -1 && last_move.parent.x === -1) {
                // leela doesn't give an analysis for the last move if
                // the game was over from passing, so just use the same
                // results it got from the move before the final two passes.
                if (`full-${last_move.move_number - 2}` in ai_review) {
                    ai_review[`full-${last_move.move_number}`] = dup(ai_review[`full-${last_move.move_number - 2}`]);
                    ai_review[`full-${last_move.move_number}`].move_number = last_move.move_number;
                }

            }
        } catch (e) {
            console.warn(e);
        }

        if ('full-network-fastmap' in ai_review) {
            let data:Array<AIReviewEntry> = [];
            let last_full_prediction = 0.5;
            data = ai_review['full-network-fastmap'].map(d => {
                let full_prediction = last_full_prediction;

                if (`full-${d.move}` in ai_review) {
                    if (ai_review[`full-${d.move}`].variations.length) {
                        full_prediction = ai_review[`full-${d.move}`].win_rate;
                    }
                }

                last_full_prediction = full_prediction;

                return new AIReviewEntry({
                    move: d.move + this.handicapOffset(),
                    fast_prediction: d.prediction,
                    full_prediction: full_prediction
                });
            });

            let top3:Array<number> = [];

            try {
                let last_move = this.props.game.goban.engine.last_official_move;
                //let last_win_rate = `full-${1 - this.handicapOffset()}` in ai_review
                let last_win_rate = null;
                let deltas:Array<number> = [];
                for (let i = 1; i < last_move.move_number; ++i) {
                    let entry = ai_review[`full-${i - this.handicapOffset()}`];
                    if (entry) {
                        if (last_win_rate !== null) {
                            deltas.push(Math.abs(entry.win_rate - last_win_rate));
                        }
                        last_win_rate = entry.win_rate;
                    }
                }
                let top3_win_rates = dup(deltas).sort((a, b) => b - a).slice(0, 3);
                top3 = top3_win_rates.map(p => deltas.indexOf(p) + 1);
            } catch (e) {
                console.error(e);
            }

            this.setState({
                loading: false,
                full: data,
                fast: null,
                top3: top3,
                updatecount: this.state.updatecount + 1,
            });
        }
        else if ('key-moves' in ai_review) {
            for (let mv of ai_review['key-moves']) {
                ai_review[`full-${mv.move}`] = mv;
            }
            this.setState({
                loading: false,
                full: null,
                fast: ai_review['key-moves'],
                top3: null,
                updatecount: this.state.updatecount + 1,
            });
        }
        else {
            this.setState({
                loading: false,
                full: null,
                fast: null,
                top3: null,
                queue_position: this.state.selected_ai_review.queue.position,
                queue_pending: this.state.selected_ai_review.queue.pending,
                updatecount: this.state.updatecount + 1,
            });
        }
    }

    clearAIReview() {
        this.props.game.goban.setMode("play");
        this.setState({
            full: null,
            fast: null,
            updatecount: this.state.updatecount + 1,
        });
    }

    setSelectedAIReview = (ai_review) => {
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

    ai_review_update = (data) => {
        if ('ai_review_id' in data) {
            this.getAIReview(data.ai_review_id);
        }
        if ('refresh' in data) {
            this.getAIReviewList();
        }
    }
    ai_review_update_key = (data) => {
        if (this.ai_review) {
            this.ai_review[data.key] = data.body;
            this.setState({
                updatecount: this.state.updatecount + 1,
            });
            this.syncAIReview();
        }
    }

    openAIReviewList = (ev) => {
        close_all_popovers();
        popover({
            elt: (<div className='ai-review-list' >
                    {this.state.ai_reviews.map((ai_review, idx) => {
                        let params = {
                            strength: ai_review.playouts,
                            network_size: ai_review.network_size,
                            num_moves: ai_review.total_moves_to_analyze,
                        };
                        return (
                            <div className={'ai-review-item ' +
                                    (ai_review.id === this.state.selected_ai_review.id ? 'selected' : '')}
                                key={idx}
                                title={moment(ai_review.created).format('LL')}
                                onClick={() => this.setSelectedAIReview(ai_review)}>
                                { ai_review.full
                                    ? interpolate(_("Full {{network_size}} review by Leela Zero"), params)
                                    : interpolate(_("Top {{num_moves}} moves according to Leela Zero"), params)
                                }
                            </div>
                       );
                    })}
                  </div>
                 ),
            below: ev.target,
            minWidth: 240,
            minHeight: 250,
        });
    }

    showMoreInfo = (ev) => {
        close_all_popovers();
        console.log(this.state.selected_ai_review);
        popover({
            elt: (
                <div className='ai-review-more-info' >
                    <table>
                        <tbody>
                            <tr>
                                <th>{_("Date")}</th>
                                <td>{moment(this.state.selected_ai_review.modified).format('LL')}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI Review Engine", "Engine")}</th>
                                <td>{"Leela Zero"}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI Review engine version", "Version")}</th>
                                <td>{this.state.selected_ai_review.version}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI Review engine network used", "Network")}</th>
                                <td title={this.state.selected_ai_review.network}>{this.state.selected_ai_review.network.substr(0, 8)}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("Size of neural network", "Network Size")}</th>
                                <td>{this.state.selected_ai_review.network_size}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI review engine playouts (strength)", "Playouts")}</th>
                                <td>{this.state.selected_ai_review.playouts}</td>
                            </tr>
                            <tr>
                                <th>{pgettext("AI review engine node visits (strength)", "Visits")}</th>
                                <td>{this.state.selected_ai_review.visits}</td>
                            </tr>
                            {(data.get('user').is_superuser || null) &&
                                <tr>
                                    <th>{_("Creator")}</th>
                                    <td><Player user={this.state.selected_ai_review.player_id}/></td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            ),
            below: ev.target,
            minWidth: 300,
            minHeight: 250,
        });
    }

    render() {
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

        let move_ai_review = null;
        let next_move_ai_review = null;
        let win_rate = 0.0;
        let next_win_rate = -1.0;
        let next_move = null;
        let next_move_pretty_coords = "";
        let move_relative_delta = null;
        let cur_move = this.props.move;
        let trunk_move = cur_move.getBranchPoint();
        let move_number = trunk_move.move_number;
        let show_full_ai_review_button = null;
        let user = data.get('user');
        try {
            if (user.is_moderator) {
                show_full_ai_review_button = true;
            }
            if (
                user.id === this.props.game.goban.engine.players.black.id ||
                user.id === this.props.game.goban.engine.players.white.id ||
                user.id === this.props.game.creator_id
            ) {
                show_full_ai_review_button = true;
            }
        } catch {
            // no problem, just a loaded sgf or something
        }

        if ( `full-${move_number - this.handicapOffset()}` in this.ai_review) {
            move_ai_review = this.ai_review[`full-${move_number - this.handicapOffset()}`];
        }

        if (move_ai_review) {
            //win_rate = move_ai_review.win_rate;
            win_rate = move_ai_review.win_rate;
            //next_win_rate = move_ai_review.win_rate;
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
            //next_win_rate *= 100.0;
        }


        let marks = {};
        let colored_circles = [];
        let heatmap = null;
        try {
            if (cur_move.trunk) {
                next_move = cur_move.trunk_next;
                if (next_move) {
                    next_move_pretty_coords = this.props.game.goban.engine.prettyCoords(next_move.x, next_move.y);
                    if (next_move.x === -1) {
                        next_move_pretty_coords = _("Pass");
                    }
                }

                if (move_ai_review) {
                    //let variations = move_ai_review.variations.slice(0, 6);
                    let variations = move_ai_review.variations;

                    let found_next_move = false;
                    for (let v of variations) {
                        if (v.move === next_move_pretty_coords) {
                            found_next_move = true;
                            break;
                        }
                    }
                    if (!found_next_move && next_move_ai_review) {
                        variations.push({
                            move: next_move_pretty_coords,
                            win_rate: next_win_rate,
                            moves: "",
                        });
                    }

                    let visits = move_ai_review.max_visits[0];

                    heatmap = [];
                    for (let y = 0; y < this.props.game.goban.engine.height; y++) {
                        let r = [];
                        for (let x = 0; x < this.props.game.goban.engine.width; x++) {
                            r.push(0);
                        }
                        heatmap.push(r);
                    }

                    for (let i = 0 ; i < variations.length; ++i) {

                        let mv = this.props.game.goban.engine.decodeMoves(variations[i].move)[0];
                        heatmap[mv.y][mv.x] = variations[i].visits / visits;

                        if (variations[i].moves.length > 2 || variations[i].move === next_move_pretty_coords) {
                            let delta = 0;

                            /*
                            if (move_ai_review.player_to_move === 'white') {
                                delta = -1.0 * ((1.0 - variations[i].win_rate) - (move_ai_review.win_rate));
                            } else {
                                delta = (variations[i].win_rate) - (move_ai_review.win_rate);
                            }
                            */


                            if (move_ai_review.player_to_move === 'white') {
                                delta = -1 * ((1.0 - (variations[i].win_rate)) - (move_ai_review.win_rate));
                            } else {
                                delta = (variations[i].win_rate) - (move_ai_review.win_rate);
                            }

                            if (variations[i].move === next_move_pretty_coords && next_win_rate >= 0) {
                                delta = ((move_ai_review.win_rate) - next_win_rate);
                                if (move_ai_review.player_to_move === 'black') {
                                    delta *= -1.0;
                                }
                            }

                            delta *= 100.0;

                            let key = delta.toFixed(1);
                            if (key === "0.0" || key === "-0.0") {
                                key = "0";
                            }
                            // only show numbers for well explored moves
                            // show number for AI choice and played move as well
                            if (mv && ((i === 0) ||
                                       (variations[i].move === next_move_pretty_coords) ||
                                       (variations[i].visits >= Math.min(50, 0.1 * visits)))) {
                                if (parseFloat(key).toPrecision(2).length < key.length) {
                                    key = parseFloat(key).toPrecision(2);
                                }
                                this.props.game.goban.setMark(mv.x, mv.y, key, true);
                            }

                            let circle:ColoredCircle = {
                                move: variations[i].move,
                                color: 'rgba(0,0,0,0)',
                            };

                            if (variations[i].move === next_move_pretty_coords) {
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
                            else if (i === 0) { /* top move == blue move */
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
                        if ((trunk_move_string + v.moves).startsWith(cur_move_string)) {
                            next_moves = (trunk_move_string + v.moves).slice(cur_move_string.length, Infinity);
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
            this.props.game.goban.setHeatmap(heatmap, true);
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


        let have_prediction = false;
        if (move_ai_review && move_ai_review.variations.length > 0) {
            have_prediction = true;
        } else if (
            'final-move-analysis' in this.ai_review &&
            (this.props.move.move_number - this.handicapOffset()) === this.ai_review['final-move-analysis']['move']
        ) {
            have_prediction = true;
            win_rate = this.ai_review['final-move-analysis'].prediction;
        }

        win_rate *= 100.0;

        let blunders = null;

        if ('blunders' in this.ai_review) {
            blunders = this.ai_review['blunders'];
        }


        return (
            <div className='AIReview'>
                <UIPush event="ai-review" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update} />
                <UIPush event="ai-review-key" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update_key} />

                { false && (this.state.ai_reviews.length > 1 || null) &&
                    <Select
                        value={this.state.selected_ai_review}
                        options={this.state.ai_reviews}
                        onChange={this.setSelectedAIReview}
                        clearable={true}
                        autoBlur={true}
                        placeholder={_("Select AI AIReview")}
                        noResultsText={_("No results found")}
                        optionRenderer={(A) => <span className='ai_review-option'>{A.engine} {A.engine_version}</span>}
                        valueRenderer={(A) => <span className='ai_review-option'>{A.engine} {A.engine_version}</span>}
                        />
                }

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
                    {((this.state.selected_ai_review && this.state.full) || null) &&
                        <div className='ai-review-network-size-container'>
                            <span >
                                {this.state.selected_ai_review.network_size}
                            </span>
                        </div>
                    }
                </div>

                {((this.state.full && this.state.full.length > 0) || null) &&
                    <AIReviewChart
                        entries={this.state.full}
                        updatecount={this.state.updatecount}
                        move={this.props.move.move_number}
                        setmove={this.props.game.nav_goto_move} />
                }

                {((this.state.fast && this.state.fast.length > 0) || null) &&
                    <div className='key-moves'>
                        {blunders &&
                            <div>
                                {interpolate(_("10+% moves: {{black_blunders}} by black, {{white_blunders}} by white"),
                                    { black_blunders: blunders.black, white_blunders: blunders.white, })}
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

                {((this.state.top3 && this.state.top3.length > 0) || null) &&
                    <div className='key-moves'>
                        <div>
                            <b>{_("Top game changing moves")}</b>
                        </div>

                        {this.state.top3.map((move, idx) =>
                            <span key={idx} className='key-move clickable' onClick={(ev) => this.props.game.nav_goto_move(move + this.handicapOffset())}>
                                {move + 1}
                            </span>
                        )}
                    </div>
                }

                {((!this.state.full && !this.state.fast) || null) &&
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

    leaveVariation() {
        let game = this.props.game;
        let goban = this.props.game.goban;

        if (game.in_pushed_analysis) {
            game.in_pushed_analysis = false;
            game.leave_pushed_analysis = null;
            goban.engine.jumpTo(this.orig_move);
            this.orig_move.marks = this.orig_marks;
            goban.pen_marks = this.stashed_pen_marks;
            if (goban.pen_marks.length === 0) {
                goban.detachPenCanvas();
            }
            goban.setHeatmap(this.stashed_heatmap);
            this.stashed_heatmap = null;
        }
    }
    enterVariation(move_number, v) {
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

function winRateDelta(start_or_delta, end?) {
    let delta = end ? end - start_or_delta : start_or_delta;
    if (delta > 0) {
        return <span className='increased-win-rate'>+{Math.round(delta * 100)}</span>;
    } else {
        return <span className='decreased-win-rate'>{Math.round(delta * 100)}</span>;
    }
}
