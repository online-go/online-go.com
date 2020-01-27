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

import * as moment from "moment";
import * as React from "react";
import * as data from "data";
import Select, { components } from 'react-select';
import { UIPush } from "UIPush";
import { openBecomeASiteSupporterModal } from "Supporter";
import { deepCompare, errorAlerter, dup, errorLogger } from 'misc';
import { get, post } from 'requests';
import { _, pgettext, interpolate } from "translate";
import { Game } from './Game';
import { close_all_popovers, popover } from "popover";
import { Errcode } from 'Errcode';
import { AIReviewChart } from './AIReviewChart';
import {
    GoMath,
    MoveTree,
    JGOFAIReview,
    JGOFAIReviewMove,
    JGOFIntersection,
    JGOFNumericPlayerColor,
    ColoredCircle,
    computeWorstMoves,
    AIReviewWorstMoveEntry,
} from 'goban';

declare var swal;

export interface AIReviewEntry {
    move_number: number;
    win_rate: number;
    num_variations: number;
}

interface AIReviewProperties {
    game: Game;
    move: MoveTree;
    hidden: boolean;
    onAIReviewSelected: (ai_review:JGOFAIReview) => void;
}

interface AIReviewState {
    loading: boolean;
    reviewing: boolean;
    ai_reviews: Array<JGOFAIReview>;
    selected_ai_review?: JGOFAIReview;
    updatecount: number;
    top_moves: Array<JGOFAIReviewMove>;
    worst_move_delta_filter: number;
}

export class AIReview extends React.Component<AIReviewProperties, AIReviewState> {
    // this will be the full ai review we are working with, as opposed to
    // selected_ai_review which will just contain some metadata from the
    // postgres database
    ai_review?:JGOFAIReview;

    constructor(props:AIReviewProperties) {
        super(props);
        let state:AIReviewState = {
            loading: true,
            reviewing: false,
            ai_reviews: [],
            updatecount: 0,
            top_moves: [],
            worst_move_delta_filter: 0.1,
        };
        this.state = state;
        window['aireview'] = this;
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
                    'engine': 'katago',
                    'type': 'auto',
                })
                .then(res => {
                    sanityCheck(res);
                    if (res.id) {
                        this.setState({reviewing: true});
                    }
                })
                .catch(errorLogger);
            }
        })
        .catch(errorLogger);
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
            sanityCheck(ai_review);
            this.ai_review = ai_review;
            this.props.onAIReviewSelected(ai_review);
            this.syncAIReview();
        })
        .catch(errorLogger);
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
            ai_review.win_rates[move.move_number] = move.win_rate;
        }

        /* For old reviews, we might not have all win rates, so fill in the missing entries */
        let last_win_rate = 0.5;
        for (let move_number = 0; move_number < ai_review.win_rates.length; ++move_number) {
            if (ai_review.win_rates[move_number] === undefined) {
                ai_review.win_rates[move_number] = last_win_rate;
            }
            last_win_rate = ai_review.win_rates[move_number];
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
        this.props.onAIReviewSelected(ai_review);
    }
    startNewAIReview(analysis_type:"fast" | "full", engine:"leela_zero" | "katago") {
        let user = data.get('user');

        if (user.anonymous) {
            swal(_("Please login first"));
        } else {

            if (user.supporter || user.professional || user.is_moderator) {
                post(`games/${this.getGameId()}/ai_reviews`, {
                    "type": analysis_type,
                    "engine": engine,
                })
                .then((res) => {
                    sanityCheck(res);
                    swal("Analysis started");
                })
                .catch(errorAlerter);
            } else {
                openBecomeASiteSupporterModal();
            }
        }
    }

    ai_review_update_metadata = (data:any) => {
        this.ai_review = data.body as JGOFAIReview;
        sanityCheck(this.ai_review);
        this.setState({
            updatecount: this.state.updatecount + 1,
        });
        this.syncAIReview();
    }
    ai_review_update_error = (data:any) => {
        if (this.ai_review) {
            this.ai_review.error = data.body;
        } else {
            console.error("Crap no ai review");
        }
        this.setState({
            updatecount: this.state.updatecount + 1,
        });
        this.syncAIReview();
    }
    ai_review_update_move = (data:any) => {
        if (!this.ai_review) {
            console.warn("AI Review move received but ai review not initialized yet");
            return;
        }

        if (/move-[0-9]+/.test(data.key)) {
            let m = data.key.match(/move-([0-9]+)/);
            let move_number = parseInt(m[1]);

            this.ai_review.moves[move_number] = data.body;
            sanityCheck(this.ai_review);
            this.setState({
                updatecount: this.state.updatecount + 1,
            });
            this.syncAIReview();
        } else {
            console.error(`Unexpected review update key: ${data.key}`, data);
        }
    }
    ai_review_update = (data:any) => {
        if ('ai_review_id' in data) {
            this.getAIReview(data.ai_review_id);
        }
        if ('refresh' in data) {
            this.getAIReviewList();
        }
    }

    public updateHighlightsMarksAndHeatmaps() {
        let ai_review_move:JGOFAIReviewMove;
        let next_ai_review_move:JGOFAIReviewMove;
        let win_rate:number = this.ai_review.win_rate;
        let next_win_rate:number;
        let next_move = null;
        let next_move_delta = null;
        let cur_move = this.props.move;
        let trunk_move = cur_move.getBranchPoint();
        let move_number = trunk_move.move_number;
        let next_move_pretty_coords:string = '';

        if (this.ai_review.moves[move_number]) {
            ai_review_move = this.ai_review.moves[move_number];
        }
        if (this.ai_review.moves[move_number + 1]) {
            next_ai_review_move = this.ai_review.moves[move_number + 1];
        }

        let win_rates = this.ai_review?.win_rates || [];

        if (ai_review_move) {
            win_rate = ai_review_move.win_rate;
        } else {
            win_rate = win_rates[move_number] || this.ai_review.win_rate;
        }

        if (next_ai_review_move) {
            next_win_rate = next_ai_review_move.win_rate;
        } else {
            next_win_rate = win_rates[move_number + 1] || win_rate;
        }

        let marks:any = {};
        let colored_circles = [];
        let heatmap:Array<Array<number>> | null = null;
        try {
            if (cur_move.trunk) {
                next_move = cur_move.trunk_next;

                if (ai_review_move) {
                    let branches = ai_review_move.branches.slice(0, 6);
                    //let branches = ai_review_move.branches;

                    // Ensure we have an entry in branches for our next move,
                    // as we always want to show what move was made and how
                    // that affected the game. Also, if we do have an entry,
                    // make sure it's win rate aligns with what we determined
                    // it was upon further analysis (use next move's win rate)
                    let found_next_move = false;
                    for (let branch of branches) {
                        if (next_move && isEqualMoveIntersection(branch.moves[0], next_move)) {
                            found_next_move = true;
                            branch.win_rate = next_win_rate;
                            break;
                        }
                    }
                    if (!found_next_move && next_move) {
                        branches.push({
                            moves: [next_move],
                            win_rate: next_win_rate,
                            visits: 0,
                        });
                    }

                    /* Generate the heatmap, blue move, and triangle move */
                    let strength = this.ai_review.strength;
                    heatmap = [];
                    for (let y = 0; y < this.props.game.goban.engine.height; y++) {
                        let r = [];
                        for (let x = 0; x < this.props.game.goban.engine.width; x++) {
                            r.push(0);
                        }
                        heatmap.push(r);
                    }

                    for (let i = 0 ; i < branches.length; ++i) {
                        let branch = branches[i];
                        let mv = branch.moves[0];

                        if (mv.x === -1) {
                            continue;
                        }

                        if (this.props.game.goban.engine.board[mv.y][mv.x]) {
                            console.error("ERROR: AI is suggesting moves on intersections that have already been played, this is likely a move indexing error.");
                            console.info("AIReview: ", this.ai_review);
                        }

                        heatmap[mv.y][mv.x] = branch.visits / strength;


                        let next_player:JGOFNumericPlayerColor;

                        if (next_move) {
                            next_player = next_move.player;
                        } else {
                            // we don't always use this because when we are looking at handicap stones, it doesn't flip.
                            next_player = cur_move.player === JGOFNumericPlayerColor.BLACK
                                ? JGOFNumericPlayerColor.WHITE
                                : JGOFNumericPlayerColor.BLACK;
                        }

                        let delta:number = next_player === JGOFNumericPlayerColor.WHITE
                            ? (ai_review_move.win_rate) - (branch.win_rate)
                            : (branch.win_rate) - (ai_review_move.win_rate);

                        let key = (delta * 100).toFixed(1);
                        if (key === "0.0" || key === "-0.0") {
                            key = "0";
                        }
                        // only show numbers for well explored moves
                        // show number for AI choice and played moves[0] as well
                        if (mv && ((i === 0) ||
                                   //true || // debugging
                                   (next_move && isEqualMoveIntersection(branch.moves[0], next_move)) ||
                                   (branch.visits >= Math.min(50, 0.1 * strength)))) {
                            if (parseFloat(key).toPrecision(2).length < key.length) {
                                key = parseFloat(key).toPrecision(2);
                            }
                            this.props.game.goban.setMark(mv.x, mv.y, key, true);
                        }

                        let circle:ColoredCircle = {
                            move: branch.moves[0],
                            color: 'rgba(0,0,0,0)',
                        };

                        if (next_move && isEqualMoveIntersection(branch.moves[0], next_move)) {
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
            }
            else { // !cur_move.trunk
                /* If we're not on the trunk, but rather exploring a branch, we want to provide
                 * ghost stones for the moves that the AI was thinking would be played */
                if (ai_review_move) {
                    let trunk_move_string = trunk_move.getMoveStringToThisPoint();
                    let cur_move_string = cur_move.getMoveStringToThisPoint();
                    let next_moves = null;

                    for (let branch of ai_review_move.branches) {
                        let move_str:string = trunk_move_string + GoMath.encodeMoves(branch.moves);
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
            errorLogger(e);
        }

        try {
            this.props.game.goban.setMarks(marks, true);
            this.props.game.goban.setHeatmap(heatmap, true);
            this.props.game.goban.setColoredCircles(colored_circles, false);
        } catch (e) {
            errorLogger(e);
        }

        if (next_win_rate >= 0) {
            next_move_delta = next_win_rate - win_rate;
            if (this.props.game.goban.engine.colorToMove() === "white") {
                next_move_delta = -next_move_delta;
            }
        }

        if (next_move) {
            next_move_pretty_coords = this.props.game.goban.engine.prettyCoords(next_move.x, next_move.y);
        }

        return [
            win_rate,
            next_move_delta,
            next_move_pretty_coords,
        ];
    }
    public render():JSX.Element {
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
                    <UIPush event="ai-review-metadata" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update_metadata} />
                    <UIPush event="ai-review-move" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update_move} />
                    { ((!this.props.hidden && ((this.state.ai_reviews.length === 0 && this.state.reviewing))) || null) &&
                        <div className='reviewing'>
                            <span>{_("Queing AI review")}</span>
                            <i className='fa fa-desktop slowstrobe'></i>
                        </div>
                    }
                </div>
            );
        }

        let show_full_ai_review_button: null | true = null;

        try {
            let user = data.get('user');
            if (
                user.id === this.props.game.creator_id ||
                user.id === this.props.game.goban.engine.players.black.id ||
                user.id === this.props.game.goban.engine.players.white.id
            ) {
                show_full_ai_review_button = true;
            }
            else if (user.is_moderator) {
                show_full_ai_review_button = true;
            } else {
                show_full_ai_review_button = null;
            }
        } catch {
            // no problem, just someone else's sgf or something
            show_full_ai_review_button = null;
        }


        let [
            win_rate,
            next_move_delta,
            next_move_pretty_coords,
        ] = this.updateHighlightsMarksAndHeatmaps();

        let win_rate_p = win_rate * 100.0;
        let next_move_delta_p = next_move_delta * 100.0;

        let ai_review_chart_entries:Array<AIReviewEntry> = this.ai_review.win_rates?.map((x, idx) => {
            return {
                move_number: idx,
                win_rate: x,
                num_variations: this.ai_review?.moves[idx]?.branches.length || 0,
            };
        }) || [];

        return (
            <div className='AIReview'>
                <UIPush event="ai-review" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update} />
                <UIPush event="ai-review-metadata" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update_metadata} />
                <UIPush event="ai-review-move" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update_move} />
                <UIPush event="ai-review-error" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update_error} />

                { (this.state.ai_reviews.length >= 1 || null) &&
                    <Select
                        classNamePrefix='ogs-react-select'
                        value={this.state.selected_ai_review}
                        options={this.state.ai_reviews}
                        onChange={this.setSelectedAIReview as any}
                        isClearable={false}
                        autoBlur={true}
                        isSearchable={false}
                        components = {{
                            Option: ({innerRef, innerProps, isFocused, data, getValue}) => {
                                let value = getValue();
                                let isSelected = value && value[0].id === data.id;

                                return (
                                    <div ref={innerRef} {...innerProps}
                                        className={'ai-review-option-container '
                                            + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}
                                    >
                                        <ReviewStrengthIcon review={data} />
                                        <div className='ai-review-information'>
                                            <div>
                                                {interpolate(
                                                    pgettext("AI Review technical information",
                                                        "{{engine}} {{engine_version}} using the {{network_size}} network {{network}}."), {
                                                            engine: engineName(data.engine),
                                                            engine_version: data.engine_version,
                                                            network_size: data.network_size,
                                                            network: extractShortNetworkVersion(data.network),
                                                        }
                                                    )
                                                }
                                            </div>
                                            <div className='date'>
                                                {moment(new Date(data.date)).format('lll')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            },
                            SingleValue: ({data}) => (
                                <React.Fragment>
                                    <ReviewStrengthIcon review={data} />
                                    {(win_rate >= 0 && win_rate <= 1.0)
                                        ? <div className="progress">
                                              <div className="progress-bar black-background" style={{width: win_rate_p + "%"}}>{win_rate_p.toFixed(1)}%</div>
                                              <div className="progress-bar white-background" style={{width: (100.0 - win_rate_p) + "%"}}>{(100 - win_rate_p).toFixed(1)}%</div>
                                          </div>
                                        : <div className="pending">
                                              <i className='fa fa-desktop slowstrobe'></i>
                                              {_("Processing")}
                                          </div>
                                    }

                                </React.Fragment>
                            ),
                            ValueContainer: ({children}) => (
                                <div className='ai-review-win-rate-container'>
                                    {children}
                                </div>
                            ),
                            MenuList: (props) => {
                                let goban = this.props.game.goban;

                                return (
                                    <components.MenuList {...props}>
                                        {props.children}
                                        <div className='ai-review-new-review'>
                                            <button onClick={() => this.startNewAIReview("full", "katago")}>
                                                <i className='fa fa-plus' /> KataGo
                                            </button>
                                            {((goban.width === 19 && goban.height === 19) || null) &&
                                                <button onClick={() => this.startNewAIReview("full", "leela_zero")}>
                                                    <i className='fa fa-plus' /> Leela Zero
                                                </button>
                                            }
                                        </div>
                                    </components.MenuList>
                                );
                            },
                        }}
                        />
                }

                {this.ai_review.error
                    ?
                    <React.Fragment>
                        <h3>{_("Error")}</h3>
                        <Errcode message={this.ai_review.error} />
                    </React.Fragment>
                    :
                    <React.Fragment>
                        {((this.ai_review && this.ai_review.win_rates) || null) &&
                            <React.Fragment>
                                <AIReviewChart
                                    ai_review={this.ai_review}
                                    entries={ai_review_chart_entries}
                                    updatecount={this.state.updatecount}
                                    move_number={this.props.move.move_number}
                                    setmove={this.props.game.nav_goto_move} />
                                {this.renderWorstMoveList()}
                            </React.Fragment>
                        }

                        {((this.ai_review?.type === 'fast') || null) &&
                            <div className='key-moves'>
                                {show_full_ai_review_button &&
                                    <div>
                                        <button
                                            className='primary'
                                            onClick={() => this.startNewAIReview("full", "katago")}>
                                            {_("Full AI Review")}
                                        </button>
                                    </div>
                                }
                            </div>
                        }
                    </React.Fragment>
                }

                {(!this.ai_review || null) &&
                    <div className='pending'>
                        {_("AI review has been queued for processing.")}
                        <i className='fa fa-desktop slowstrobe'></i>
                    </div>
                }

                {null && next_move_pretty_coords && next_move_delta !== null &&
                    <div className='next-move-delta-container'>
                        <span className={"next-move-coordinates " +
                            (this.props.game.goban.engine.colorToMove() === "white" ? "white-background" : "black-background")}>
                            <i className="ogs-label-triangle"></i> {next_move_pretty_coords}
                        </span>

                        <span className={"next-move-delta " +
                            (next_move_delta_p <= -0.1 ? 'negative' : (next_move_delta_p >= 0.1 ? 'positive' : ''))}>
                            {next_move_delta_p <= -0.1 ? <span>&minus;</span> :
                                (next_move_delta_p >= 0.1 ? <span>&#43;</span> : <span>&nbsp;&nbsp;</span>)
                            } {Math.abs(next_move_delta_p).toFixed(1)}pp
                        </span>
                    </div>
                }
            </div>
        );
    }
    public renderWorstMoveList():JSX.Element {
        if (!this.props.game.goban?.engine?.move_tree || !this.ai_review) {
            return null;
        }

        let lst = computeWorstMoves(this.props.game.goban.engine.move_tree, this.ai_review);
        let more_ct = Math.max(0, lst.filter(de => de.delta <= -0.2).length - 3);

        return (
            <div className='worst-move-list-container'>
                <div className='move-list'>
                    {pgettext("Moves that were the biggest mistakes, according to the AI", "Key moves")}:
                    {lst.slice(0, 3).map((de, idx) => {
                        let pretty_coords = this.props.game.goban.engine.prettyCoords(de.move.x, de.move.y);
                        return (
                            <span
                                key={`${idx}-${de.move_number}`}
                                className={de.player === JGOFNumericPlayerColor.BLACK ? 'move black-background' : 'move white-background'}
                                onClick={() => this.props.game.nav_goto_move(de.move_number - 1)}
                            >
                                {pretty_coords}
                            </span>
                        );
                    })}
                    {(more_ct > 0 || null) &&
                        <span>
                            {interpolate(pgettext("Number of big mistake moves not listed", "+ {{more_ct}} more"), {more_ct})}
                        </span>
                    }
                </div>

                {/*
                <span className='filter'>
                    <select
                        value={this.state.worst_move_delta_filter}
                        onChange={this.setWorstMoveDeltaFilter}
                        >
                        <option value={0.1}>10</option>
                        <option value={0.4}>40</option>
                        <option value={0.5}>50</option>
                    </select>
                </span>
                */}

            </div>
        );
    }

    setWorstMoveDeltaFilter = (ev) => {
        this.setState({worst_move_delta_filter: parseFloat(ev.target.value)});
    }
}

function sanityCheck(ai_review:JGOFAIReview) {
    if (ai_review.moves['0']) {
        if (ai_review.moves['0'].move.x !== -1) {
            console.error("AI Review move '0' is not a pass move, was ", ai_review.moves['0'].move);
        }
    }
    if ((typeof(ai_review.moves) !== "object")) {
        console.error("AI Review moves was not an object", JSON.stringify(ai_review.moves));
    }
}

function isEqualMoveIntersection(a:JGOFIntersection, b:JGOFIntersection):boolean {
    return a.x === b.x && a.y === b.y;
}
function ReviewStrengthIcon({review}:{review:JGOFAIReview}):JSX.Element {
    let strength:string;
    let content:string = '';
    if (review.type === 'fast') {
        strength = 'ai-review-fast';
        content = '';
    } else {
        if (review.strength >= 1600) {
            strength = 'ai-review-strength-3';
            content = 'III';
        }
        else if (review.strength >= 800) {
            strength = 'ai-review-strength-2';
            content = 'II';
        }
        else if (review.strength >= 300) {
            strength = 'ai-review-strength-1';
            content = 'I';
        } else {
            strength = 'ai-review-strength-0';
            content = '';
        }
    }

    return <span className={'ai-review-strength-icon ' + strength}>{content}</span>;
}
function engineName(engine:string) {
    switch (engine) {
        case 'leela_zero':
            return "Leela Zero";
        case 'katago':
            return "KataGo";
    }
    return "AI";
}
function extractShortNetworkVersion(network:string):string {
    // the first part of the katago version describes the network size,
    // second/third is hash I think
    if (network.indexOf('-') > 0) {
        network = network.match(/[^-]*[-]([^-]*)/)[1];
    }
    return network.substr(0, 6);
}
