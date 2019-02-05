
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

import * as d3 from "d3";
import * as moment from "moment";
import * as React from "react";
import * as data from "data";
import {deepCompare} from 'misc';
import {get} from 'requests';
import {Link} from "react-router-dom";
import {termination_socket} from 'sockets';
import {_, pgettext, interpolate} from "translate";
import {PersistentElement} from 'PersistentElement';
import {Game} from './Game';
import {GoMath} from 'ogs-goban';
import Select from 'react-select';

export class AnalysisEntry {
    move: number;
    fast_prediction: number;
    full_prediction: number;

    constructor(obj) {
        this.move = parseInt(obj.move);
        this.fast_prediction = parseFloat(obj.fast_prediction);
        this.full_prediction = parseFloat(obj.full_prediction);
    }
}

interface AIAnalysisChartProperties {
    entries: Array<AnalysisEntry>;
    setmove: (move_number:number) => void;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const bisector = d3.bisector((d:AnalysisEntry) => { return d.move; }).left;
let svgWidth = 600;
let svgHeight = 180;
let margin = { top: 15, right: 20, bottom: 30, left: 50 };
let width = svgWidth - margin.left - margin.right;
let height = svgHeight - margin.top - margin.bottom;

export class AIAnalysisChart extends React.Component<AIAnalysisChartProperties, any> {
    container = null;
    chart_div;
    svg;
    destroyed = false;
    chart;
    graph;
    resize_debounce;
    prediction_graph;
    fast_chart;
    full_chart;
    width;
    height;
    fast_line;
    full_line;
    x_axis;
    mouse;
    mouse_rect;
    move_crosshair;
    full_crosshair;
    fast_crosshair;
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
        return !deepCompare(prevProps.entries, this.props.entries);
    }
    componentWillUnmount() {
        this.deinitialize();
    }
    componentWillReceiveProps(nextProps) {
    }
    shouldComponentUpdate(nextProps, nextState) {
        return !deepCompare(nextProps.entries, this.props.entries);
    }

    initialize() {
        let self = this;

        this.width = 600;
        this.svg = d3.select(this.chart_div)
            .append('svg')
            .attr('class', 'chart')
            .attr('width', this.width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom + 60);

        this.prediction_graph = this.svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        this.fast_chart = this.prediction_graph.append('path')
            .attr('class', 'fast-prediction line');
        this.full_chart = this.prediction_graph.append('path')
            .attr('class', 'full-prediction line');

        this.x = d3.scaleLinear().rangeRound([0, width]);
        this.y = d3.scaleLinear().rangeRound([height, 0]);

        this.fast_line = d3.line()
             .x(d => this.x((d as any) .move))
             .y(d => this.y((d as any) .fast_prediction * 100.0));
        this.full_line = d3.line()
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
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('x1', 0)
            .attr('y1', height);

        this.fast_crosshair = this.prediction_graph.append('g')
            .attr('class', 'fast crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('y1', 0)
            .attr('x1', width);

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
                this.move_crosshair.style('display', null);
                this.full_crosshair.style('display', null);
                this.fast_crosshair.style('display', null);
            })
            .on('mouseout', () => {
                mouse_down = false;
                this.move_crosshair.style('display', 'none');
                this.full_crosshair.style('display', 'none');
                this.fast_crosshair.style('display', 'none');
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
                self.move_crosshair.attr('transform', 'translate(' + self.x(d.move) + ', 0)');
                self.fast_crosshair.attr('transform', 'translate(0, ' + self.y(d.fast_prediction * 100.0) + ')');
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

        $(window).on("resize", this.resize as () => void);
        this.resize();
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

        this.fast_chart
            .datum(this.props.entries)
            .attr('d', this.fast_line as any);
        this.full_chart
            .datum(this.props.entries)
            .attr('d', this.full_line as any);
    }
    deinitialize() {
        this.destroyed = true;
        $(window).off("resize", this.resize as () => void);
        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = null;
        }
        this.svg.remove();
        this.container = null;
    }
    resize = (no_debounce:boolean = false) => {
        if (this.destroyed) {
            return;
        }

        if (this.resize_debounce) {
            clearTimeout(this.resize_debounce);
            this.resize_debounce = null;
        }

        if (!no_debounce) {
            this.resize_debounce = setTimeout(() => this.resize(true), 10);
            return;
        }

        this.width = Math.max(100, $(this.container).width()  - margin.left - margin.right);

        this.svg.attr('width', this.width + margin.left + margin.right);

        this.x.range([0, this.width]);
        this.fast_chart
            .datum(this.props.entries)
            .attr('d', this.fast_line as any);
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

        this.fast_crosshair.attr('x1', this.width);
        this.full_crosshair.attr('x1', this.width);

    }
    setContainer = (e) => {
        let need_resize = this.container === null;
        this.container = e;
        if (need_resize) {
            this.resize();
        }
    }
    render() {
        return (
            <div ref={this.setContainer} className="AIAnalysisChart">
                {this.state.loading
                    ? <div className='loading'>{_("Loading")}</div>
                    : this.state.nodata
                        ? <div className='nodata'>{_("No rated games played yet")}</div>
                        : <div className='ratings-graph'>
                            <PersistentElement elt={this.chart_div}/>
                        </div>
                }
            </div>
        );
    }
}


interface AIAnalysisProperties {
    game: Game;
    move: number;
}


export class AIAnalysis extends React.Component<AIAnalysisProperties, any> {
    analysis;

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            analyses: [],
            selected_analysis: null,
        };
    }

    componentDidMount() {
        this.getAnalysisList();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.getGameId() !== this.getGameId(prevProps)) {
            this.getAnalysisList();
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

    getAnalysisList() {
        let game_id = this.getGameId();
        if (!game_id) {
            return;
        }

        get(`/termination-api/analysis/${game_id}`)
        .then(lst => {
            this.setState({
                loading: false,
                analyses: lst,
            });
            if (lst.length) {
                this.setSelectedAnalysis(lst[0]);
            }
        })
        .catch(err => console.error(err));
    }

    getAnalysis(analysis_id:string) {
        let game_id = this.getGameId();
        if (!game_id) {
            return;
        }

        get(`/termination-api/analysis/${game_id}/${analysis_id}`)
        .then(analysis => {
            let data:Array<AnalysisEntry> = [];
            this.analysis = analysis;

            if ('full-network-fastmap' in analysis.data) {
                let last_full_prediction = 0.5;
                data = analysis.data['full-network-fastmap'].map(d => {
                    let full_prediction = last_full_prediction;

                    if (`full-${d.move}` in analysis.data) {
                        if (analysis.data[`full-${d.move}`].variations.length) {
                            full_prediction = analysis.data[`full-${d.move}`].prediction;
                        }
                    }

                    last_full_prediction = full_prediction;

                    return new AnalysisEntry({
                        move: d.move,
                        fast_prediction: d.prediction,
                        full_prediction: full_prediction
                    });
                });
            }
            else {
                for (let i = 0; i < this.props.game.goban.engine.last_official_move.move_number; ++i) {
                    data.push(new AnalysisEntry({
                        move_number: i,
                        fast_prediction: 0.5,
                        full_prediction: 0.5,
                    }));
                }
            }

            this.props.game.setState({ai_analysis_chart_data: data});
        })
        .catch(err => console.error(err));
    }

    clearAnalysis() {
        this.props.game.goban.setMode("play");
        this.props.game.setState({ai_analysis_chart_data: null});
    }

    setSelectedAnalysis = (analysis) => {
        this.setState({selected_analysis: analysis});
        if (analysis) {
            this.getAnalysis(analysis.analysis_id);
        } else {
            this.clearAnalysis();
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

    render() {
        if (this.state.loading) {
            return null;
        }

        let full = null;

        if (this.analysis && this.analysis.data) {
            if ( `full-${this.props.move}` in this.analysis.data) {
                full = this.analysis.data[`full-${this.props.move}`];
                console.log(full);
            }
        }

        try {
            let marks = {};
            let variations = full.variations.slice(0, 6);
            for (let i = 0 ; i < variations.length; ++i) {
                let letter = alphabet[i];
                marks[letter] = variations[i].move;
            }
            this.props.game.goban.setMarks(marks, true);
            this.props.game.goban.setHeatmap(this.normalizeHeatmap(full.heatmap));
        } catch (e) {
            console.error(e);
        }



        return (
            <div className='AIAnalysis'>
                <Select
                    value={this.state.selected_analysis}
                    options={this.state.analyses}
                    onChange={this.setSelectedAnalysis}
                    clearable={true}
                    autoBlur={true}
                    placeholder={_("Select AI Analysis")}
                    noResultsText={_("No results found")}
                    optionRenderer={(A) => <span className='analysis-option'>{A.engine} {A.engine_version}</span>}
                    valueRenderer={(A) => <span className='analysis-option'>{A.engine} {A.engine_version}</span>}
                    />

                {full &&
                    <div className='variations'>
                        {full.variations.length === 0
                            ? <div>{_("No variations")}</div>
                            : <div>
                                {full.variations.map((v, idx) =>
                                    <div key={idx} className='variation'
                                        onMouseEnter={(ev) => this.enterVariation(this.props.move, v)}
                                        onMouseLeave={(ev) => this.leaveVariation()}
                                        onClick={(ev) => /*this.setVariation(this.props.move, v)*/ null}
                                        >
                                        {alphabet[idx] + " "}

                                        {winRateDelta(full.win_rate, v.win_rate)}

                                        {GoMath.decodeMoves(v.moves, this.props.game.goban.width, this.props.game.goban.height).map((coord, idx) =>
                                            <span key={idx} className='coordinate'>
                                                {" " + GoMath.prettyCoords(coord.x, coord.y, this.props.game.goban.height)}
                                            </span>
                                        )}
                                    </div>
                                )}
                              </div>
                        }
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
            //goban.redraw();
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
        //goban.redraw();
    }
    /*
    setVariation(move_number, v) {
        let game = this.props.game;
        let goban = this.props.game.goban;
        this.leaveVariation();
        goban.setMode("analyze");
        this.enterVariation(move_number, v);
        game.in_pushed_analysis = false;
        goban.updateTitleAndStonePlacement();
        goban.syncReviewMove();
        goban.redraw();
    }
    */


}

function winRateDelta(start, end) {
    let delta = end - start;
    if (delta > 0) {
        return <span className='increased-win-rate'>+{Math.round(delta * 100)}</span>;
    } else {
        return <span className='decreased-win-rate'>{Math.round(delta * 100)}</span>;
    }
}
