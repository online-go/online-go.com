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
import * as preferences from "preferences";
import Select, { components } from 'react-select';
import { UIPush } from "UIPush";
import { AIReviewStream, ai_request_variation_analysis } from "AIReviewStream";
import { openBecomeASiteSupporterModal } from "Supporter";
import { errorAlerter, errorLogger, Timeout } from 'misc';
import { get, post } from 'requests';
import { _, pgettext, interpolate } from "translate";
import { Game } from './Game';
import { close_all_popovers } from "popover";
import { Errcode } from 'Errcode';
import { AIReviewChart } from './AIReviewChart';
import { Toggle } from 'Toggle';
import {
    GoMath,
    MoveTree,
    JGOFAIReview,
    JGOFAIReviewMove,
    JGOFIntersection,
    JGOFNumericPlayerColor,
    ColoredCircle,
    getWorstMoves,
    AIReviewWorstMoveEntry,
} from 'goban';
import swal from 'sweetalert2';

export interface AIReviewEntry {
    move_number: number;
    win_rate: number;
    score: number;
    num_variations: number;
}

interface AIReviewProperties {
    game: Game;
    move: MoveTree;
    hidden: boolean;
    onAIReviewSelected: (ai_review: JGOFAIReview) => void;
}

interface AIReviewState {
    loading: boolean;
    reviewing: boolean;
    use_score: boolean;
    ai_reviews: Array<JGOFAIReview>;
    selected_ai_review?: JGOFAIReview;
    updatecount: number;
    worst_moves_shown: number;
    table_set: boolean;
}

export class AIReview extends React.Component<AIReviewProperties, AIReviewState> {
    // this will be the full ai review we are working with, as opposed to
    // selected_ai_review which will just contain some metadata from the
    // postgres database
    ai_review?: JGOFAIReview;
    table_rows: string[][];
    avg_score_loss: number[];

    constructor(props: AIReviewProperties) {
        super(props);
        const state: AIReviewState = {
            loading: true,
            reviewing: false,
            ai_reviews: [],
            updatecount: 0,
            use_score: preferences.get('ai-review-use-score'),
            // TODO: allow users to view more than 3 of these key moves
            // See https://forums.online-go.com/t/top-3-moves-score-a-better-metric/32702/15
            worst_moves_shown: 3,
            table_set: false,
        };
        this.state = state;
        window['aireview'] = this;
    }

    componentDidMount() {
        this.getAIReviewList();
        const ai_table_out = this.AiSummaryTableRowList();
        this.table_rows = ai_table_out.ai_table_rows;
        this.avg_score_loss = ai_table_out.avg_score_loss;
        if (!data.get("user").is_moderator){
            this.setState({
                table_set: true,
            }
            );
        }
    }
    componentDidUpdate(prevProps: AIReviewProperties, prevState: any) {
        if (this.getGameId() !== this.getGameId(prevProps)) {
            this.getAIReviewList();
        }
        if (!this.state.table_set) {
            const ai_table_out = this.AiSummaryTableRowList();
            this.table_rows = ai_table_out.ai_table_rows;
            this.avg_score_loss = ai_table_out.avg_score_loss;
        }
    }
    componentWillUnmount() {
    }

    getGameId(props?: AIReviewProperties) {
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
        const game_id = this.getGameId();
        if (!game_id) {
            return;
        }

        get(`games/${game_id}/ai_reviews`)
        .then((lst: Array<JGOFAIReview>) => {
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

    handicapOffset(): number {
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

        const ai_review: JGOFAIReview = this.ai_review;

        if (!ai_review.win_rates) {
            ai_review.win_rates = [];
        }

        for (const k in ai_review.moves) {
            const move = ai_review.moves[k];
            ai_review.win_rates[move.move_number] = move.win_rate;
            if (move.score !== undefined && ai_review.scores !== undefined) {
                ai_review.scores[move.move_number] = move.score;
            }
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

    setSelectedAIReview = (ai_review: JGOFAIReview) => {
        close_all_popovers();
        this.updateAIReviewMetadata(ai_review);
        this.setState({
            selected_ai_review: ai_review,
            table_set: false,
        });
        this.props.onAIReviewSelected(ai_review);
        this.syncAIReview();
    };
    startNewAIReview(analysis_type: "fast" | "full", engine: "leela_zero" | "katago") {
        const user = data.get('user');

        if (user.anonymous) {
            swal(_("Please sign in first")).catch(swal.noop);
        } else {

            if (user.supporter || user.professional || user.is_moderator) {
                post(`games/${this.getGameId()}/ai_reviews`, {
                    "type": analysis_type,
                    "engine": engine,
                })
                .then((res) => {
                    sanityCheck(res);
                    swal("Analysis started").catch(swal.noop);
                })
                .catch(errorAlerter);
            } else {
                openBecomeASiteSupporterModal();
            }
        }
    }

    updateAIReviewMetadata(ai_review: JGOFAIReview): void {
        sanityCheck(ai_review);
        if (!this.ai_review || this.ai_review.uuid !== ai_review.uuid) {
            this.ai_review = ai_review;
        } else {
            for (const k in ai_review) {
                //console.log("Updating", k, ai_review[k]);
                if (k !== 'moves' || !this.ai_review['moves']) {
                    this.ai_review[k] = ai_review[k];
                } else {
                    for (const move in ai_review['moves']) {
                        this.ai_review['moves'][move] = ai_review['moves'][move];
                    }
                }
            }
        }
        this.setState({
            updatecount: this.state.updatecount + 1,
        });
    }

    deferred_update_timeout?: Timeout;
    deferred_queue?: {[key: string]: any};

    updateAiReview = (data: any) => {
        if (this.deferred_queue) {
            for (const key in data) {
                this.deferred_queue[key] = data[key];
            }
        } else {
            this.deferred_queue = data;
            this.deferred_update_timeout = setTimeout(() => {
                const data = this.deferred_queue;
                delete this.deferred_update_timeout;
                delete this.deferred_queue;

                for (const key in data) {
                    const value = data[key];
                    if (key === 'metadata') {
                        this.updateAIReviewMetadata(value as JGOFAIReview);
                    } else if (key === 'error') {
                        if (this.ai_review) {
                            this.ai_review.error = value;
                        } else {
                            console.error("AI Review missing, cannot update error", value);
                        }
                    } else if (/move-[0-9]+/.test(key)) {
                        if (!this.ai_review) {
                            console.warn("AI Review move received but ai review not initialized yet");
                            return;
                        }

                        const m = key.match(/move-([0-9]+)/);
                        const move_number = parseInt(m[1]);
                        this.ai_review.moves[move_number] = value;
                    } else if (/variation-([0-9]+)-([a-z.]+)/.test(key)) {
                        if (!this.ai_review.analyzed_variations) {
                            this.ai_review.analyzed_variations = {};
                        }
                        if (!this.ai_review) {
                            console.warn("AI Review move received but ai review not initialized yet");
                            return;
                        }
                        const m = key.match(/variation-([0-9a-z.A-Z-]+)/);
                        const varkey = m[1];
                        this.ai_review.analyzed_variations[varkey] = value;
                    } else {
                        console.warn(`Unrecognized key in updateAiReview data: ${key}`, value);
                    }
                }

                sanityCheck(this.ai_review);
                this.setState({
                    updatecount: this.state.updatecount + 1,
                });
                this.syncAIReview();
            }, 100);
        }
    };

    ai_review_update = (data: any) => {
        if ('refresh' in data) {
            this.getAIReviewList();
        }
    };

    private getVariationReviewEntries(): Array<AIReviewEntry> {
        const ret: Array<AIReviewEntry> = [];
        let cur_move = this.props.move;
        const trunk_move = cur_move.getBranchPoint();
        const trunk_move_string = trunk_move.getMoveStringToThisPoint();

        while (cur_move.id !== trunk_move.id) {
            const cur_move_string = cur_move.getMoveStringToThisPoint();
            const varstring = cur_move_string.slice(trunk_move_string.length);
            const varkey = `${trunk_move.move_number}-${varstring}`;

            // if we have an interactive review move, that's what we're interested in
            if (this.ai_review.analyzed_variations && varkey in this.ai_review.analyzed_variations) {
                const analysis = this.ai_review.analyzed_variations[varkey];
                ret.push({
                    move_number: analysis.move_number,
                    win_rate: analysis.win_rate,
                    score: analysis.score | 0,
                    num_variations: analysis.branches.length,
                });
            }

            cur_move = cur_move.parent;
        }

        ret.reverse();

        return ret;
    }

    public updateHighlightsMarksAndHeatmaps() {
        let ai_review_move: JGOFAIReviewMove;
        let next_ai_review_move: JGOFAIReviewMove;
        let win_rate: number;
        let score: number;
        let next_win_rate: number;
        let next_score: number;
        let next_move = null;
        let next_move_delta_win_rate = null;
        const cur_move = this.props.move;
        const trunk_move = cur_move.getBranchPoint();
        const move_number = trunk_move.move_number;
        let next_move_pretty_coords = '';

        const trunk_move_string = trunk_move.getMoveStringToThisPoint();
        const cur_move_string = cur_move.getMoveStringToThisPoint();
        const varstring = cur_move_string.slice(trunk_move_string.length);
        const varkey = `${trunk_move.move_number}-${varstring}`;
        let have_variation_results = false;

        // if we have an interactive review move, display that.
        // otherwise, look for one that came from the normal review.
        if (this.ai_review.analyzed_variations && varkey in this.ai_review.analyzed_variations) {
            have_variation_results = true;
            ai_review_move = this.ai_review.analyzed_variations[varkey];
        } else {
            if (this.ai_review.moves[move_number]) { /* check if the nearest trunk move was one of the top three moves reviewed by ai */
                ai_review_move = this.ai_review.moves[move_number]; /* ai_review_move now contains data regarding all the branches played out by the AI */
            }

            if (this.ai_review.moves[move_number + 1]) {
                next_ai_review_move = this.ai_review.moves[move_number + 1];
            }
        }

        const win_rates = this.ai_review?.win_rates || [];
        const scores = this.ai_review?.scores || [];

        if (ai_review_move) {
            win_rate = ai_review_move.win_rate;
            score = ai_review_move.score || 0;
        } else {
            win_rate = win_rates[move_number] || this.ai_review.win_rate;
            score = scores[move_number];
            if (!score && score !== 0) {
              this.ai_review.scores ? this.ai_review.scores[-1] : 0;
            }
        }

        if (next_ai_review_move) {
            next_win_rate = next_ai_review_move.win_rate;
            next_score = next_ai_review_move.score;
        } else {
            next_win_rate = win_rates[move_number + 1] || win_rate;
            next_score = scores[move_number + 1] || score;
        }

        const marks: {[mark: string]: string} = {};
        const colored_circles: ColoredCircle[] = [];
        let heatmap: Array<Array<number>> | null = null;
        try {
            if ((cur_move.trunk || have_variation_results) && ai_review_move) { /* if we are on a trunk move that was AI reviewed */
                next_move = cur_move.trunk_next;
                const branches = ai_review_move.branches.slice(0, 6);
                //let branches = ai_review_move.branches;

                // Ensure we have an entry in branches for our next move,
                // as we always want to show what move was made and how
                // that affected the game. Also, if we do have an entry,
                // make sure it's win rate aligns with what we determined
                // it was upon further analysis (use next move's win rate)
                let found_next_move = false;
                for (const branch of branches) {
                    if (branch.moves.length === 0){
                        continue;
                    }
                    if (next_move && isEqualMoveIntersection(branch.moves[0], next_move)) {
                        found_next_move = true;
                        branch.win_rate = next_win_rate;
                        branch.score = next_score;
                        break;
                    }
                }
                if (!found_next_move && next_move) {
                    branches.push({
                        moves: [next_move],
                        win_rate: next_win_rate,
                        score: next_score,
                        visits: 0,
                    });
                }

                /* Generate the heatmap, blue move, and triangle move */
                const strength = this.ai_review.strength;
                heatmap = [];
                for (let y = 0; y < this.props.game.goban.engine.height; y++) {
                    const r = [];
                    for (let x = 0; x < this.props.game.goban.engine.width; x++) {
                        r.push(0);
                    }
                    heatmap.push(r);
                }

                for (let i = 0 ; i < branches.length; ++i) {
                    const branch = branches[i];
                    const mv = branch.moves[0];

                    if (mv === undefined || mv.x === -1 ) {
                        continue;
                    }

                    if (this.props.game.goban.engine.board[mv.y][mv.x]) {
                        console.error("ERROR: AI is suggesting moves on intersections that have already been played, this is likely a move indexing error.");
                        console.info("AIReview: ", this.ai_review);
                    }

                    heatmap[mv.y][mv.x] = branch.visits / strength;


                    let next_player: JGOFNumericPlayerColor;

                    if (next_move) {
                        next_player = next_move.player;
                    } else {
                        // we don't always use this because when we are looking at handicap stones, it doesn't flip.
                        next_player = cur_move.player === JGOFNumericPlayerColor.BLACK
                            ? JGOFNumericPlayerColor.WHITE
                            : JGOFNumericPlayerColor.BLACK;
                    }

                    const delta: number = this.state.use_score && this.ai_review.scores
                        ? (next_player === JGOFNumericPlayerColor.WHITE
                            ? (ai_review_move.score - branch.score)
                            : (branch.score) - (ai_review_move.score))
                        : 100 * (next_player === JGOFNumericPlayerColor.WHITE
                            ? (ai_review_move.win_rate) - (branch.win_rate)
                            : (branch.win_rate) - (ai_review_move.win_rate));

                    let key = (delta).toFixed(1);
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
                        this.props.game.goban.setSubscriptMark(mv.x, mv.y, key, true);
                    }

                    const circle: ColoredCircle = {
                        move: branch.moves[0],
                        color: 'rgba(0,0,0,0)',
                    };

                    if (next_move && isEqualMoveIntersection(branch.moves[0], next_move)) {
                        this.props.game.goban.setMark(mv.x, mv.y, "sub_triangle", true);
                        this.props.game.goban.setMark(mv.x, mv.y, "blue_move", true);

                        circle.border_width = 0.1;
                        circle.border_color = 'rgb(0, 0, 0)';
                        if (i === 0) {
                            circle.color = 'rgba(0, 130, 255, 0.7)';
                        } else {
                            circle.color = 'rgba(255, 255, 255, 0.3)';
                        }
                        colored_circles.push(circle);
                    } else if (i === 0) { // blue move, not what player made
                        this.props.game.goban.setMark(mv.x, mv.y, "blue_move", true);
                        circle.border_width = 0.2;
                        circle.border_color = 'rgb(0, 130, 255)';
                        circle.color = 'rgba(0, 130, 255, 0.7)';
                        colored_circles.push(circle);
                    }
                }
            } else { /* if not on trunk move which was ai reviewed, see if we have some reviewed data */
                if (!cur_move.trunk) {
                    this.requestAnalysisOfVariation(cur_move, trunk_move);
                }
                this.fillAIMarksBacktracking(cur_move, trunk_move, marks); /* fill marks object with AI ghost marks, if we are on a sequence the AI played out */
            }

        } catch (e) {
            errorLogger(e);
        }

        try {
            this.props.game.goban.setMarks(marks, true); /* draw the remaining AI sequence as ghost marks, if any */
            this.props.game.goban.setHeatmap(heatmap, true);
            this.props.game.goban.setColoredCircles(colored_circles, false);
        } catch (e) {
            errorLogger(e);
        }

        if (next_win_rate >= 0) {
            next_move_delta_win_rate = next_win_rate - win_rate;
            if (this.props.game.goban.engine.colorToMove() === "white") {
                next_move_delta_win_rate = -next_move_delta_win_rate;
            }
        }

        if (next_move) {
            next_move_pretty_coords = this.props.game.goban.engine.prettyCoords(next_move.x, next_move.y);
        }

        return [
            win_rate,
            score,
            next_move_delta_win_rate,
            next_move_pretty_coords,
        ];
    }

    private requestAnalysisOfVariation(cur_move: MoveTree, trunk_move: MoveTree): boolean {
        if (!this.props.game) {
            return false;
        }

        const user = data.get('user');
        if (user.anonymous) {
            //console.debug("Anonymous user, not performing analysis of variation");
            return false;
        }
        if (!user.supporter) {
            //console.debug("user is not a supporter");
            return false;
        }

        const black_id = this.props.game.goban?.engine?.config?.black_player_id;
        const white_id = this.props.game.goban?.engine?.config?.white_player_id;
        const creator_id = this.props.game.creator_id;

        if (user.id !== black_id && user.id !== white_id && user.id !== creator_id) {
            //console.debug("Not performing analysis of variation for non player");
            return false;
        }

        if (!this.ai_review) {
            console.warn("ai_review not set");
            return false;
        }

        if (!this.state.selected_ai_review?.id) {
            console.warn("selected_ai_review?.id was not set");
            return false;
        }

        ai_request_variation_analysis(this.ai_review.uuid, this.props.game.game_id, this.state.selected_ai_review?.id, cur_move, trunk_move);
    }

    /** This method attempts to match our cur_move sequence with any of the AI
     * generated sequences starting from the nearest trunk move (iterating
     * through previous trunk moves if necessary) and breaks out as soon as it
     * finds a match. The reason why we iterate through previous trunk moves is
     * to solve the problem when the trunk moves happen to coincide with the AI
     * generated sequence once match is found we fill marks object with the
     * remaining AI sequence.
     * @returns true if we found some data, false otherwise
     */
    private fillAIMarksBacktracking(cur_move: MoveTree, trunk_move: MoveTree, marks: {[mark: string]: string}): boolean {
        for (let j = 0; j <= trunk_move.move_number; j++) { /* for each of the trunk moves starting from the nearest */
            const ai_review_move = this.ai_review.moves[trunk_move.move_number - j];
            if (!ai_review_move) {
                continue;
            }

            let trunk_move_string = trunk_move.getMoveStringToThisPoint();

            trunk_move_string = trunk_move_string.slice(0, trunk_move_string.length - 2 * j);

            const cur_move_string = cur_move.getMoveStringToThisPoint();
            let next_moves = null;

            for (const branch of ai_review_move.branches) {
                const move_str: string = trunk_move_string + GoMath.encodeMoves(branch.moves);
                if (move_str.startsWith(cur_move_string)) {
                    next_moves = move_str.slice(cur_move_string.length, Infinity);
                    break;
                }
            }

            if (next_moves) {
                const decoded_moves = this.props.game.goban.engine.decodeMoves(next_moves);
                let black = "";
                let white = "";

                for (let i = 0; i < decoded_moves.length; ++i) {
                    const mv = decoded_moves[i];
                    const encoded_mv = GoMath.encodeMove(mv.x, mv.y);
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
                return true; /* match found, no need to check previous trunk moves anymore, return */
            }
        }

        return false;
    }

    private getPlayerColorsMoveList(){
        const init_move = this.props.game.goban.engine.move_tree;
        const move_list = [];
        let cur_move = init_move.trunk_next;

        while (cur_move !== undefined){
            move_list.push(cur_move.player);
            cur_move = cur_move.trunk_next;
        }
        return move_list;

    }

    private AiSummaryTableRowList(){
        const summary_moves_list = [ ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""] ];
        const ai_table_rows = [[_("Excellent")], [_("Great")], [_("Good")], [_("Inaccuracy")], [_("Mistake")], [_("Blunder")]];
        const default_table_rows = [["", "", "", "", ""]];
        const avg_score_loss = [0, 0];
        if (!this.ai_review ) {
            return {"ai_table_rows" : default_table_rows, avg_score_loss};
        }

        if (this.ai_review.engine !== "katago"){
            this.setState({
                table_set: true
            });
            return {"ai_table_rows" : default_table_rows, avg_score_loss};
        }

        const handicap = this.props.game.goban.engine.handicap;
        //only useful when there's free placement, handicap = 1 no offset needed.
        let hoffset = this.handicapOffset();
        hoffset = (hoffset === 1) ? 0 : hoffset;
        const bplayer = (hoffset > 0 || handicap > 1) ? 1 : 0;
        const move_player_list = this.getPlayerColorsMoveList();
        //forked games might have white stones on the board.
        const other_game_type = this.props.game.goban.engine.initial_state.white !== "";

        if (this.ai_review?.type === "fast" ){
            const scores = this.ai_review?.scores;
            const is_uploaded = (this.props.game.goban.config.original_sgf !== undefined);
            //one more ai review point than moves in the game, since initial board gets a score.

            if (scores === undefined){
                return {"ai_table_rows" : default_table_rows, avg_score_loss};
            }
            const check1 = !is_uploaded &&
            (this.props.game.goban.config.moves.length !== (this.ai_review?.scores.length - 1));
            // extra initial ! in all_moves which matches extra empty board score, except in handicap games for some reason.
            // so subtract 1 if black goes second == bplayer
            const check2 = is_uploaded &&
            ((this.props.game.goban.config["all_moves"].split("!").length - bplayer) !== this.ai_review?.scores.length);
            if (check1 || check2){
                return {"ai_table_rows" : default_table_rows, avg_score_loss};
            }

            // we don't need the first two rows, as they're for full reviews.
            ai_table_rows.splice(0, 2);
            summary_moves_list.splice(0, 2);
            const num_rows = ai_table_rows.length;
            const movecounters = Array(2 * num_rows).fill(0);
            const othercounters = Array(2).fill(0);
            let wtotal = 0;
            let btotal = 0;
            for (let j = hoffset; j < scores.length - 1; j++ ){
                let scorediff = scores[j + 1] - scores[j];
                const is_bplayer = move_player_list[j] === JGOFNumericPlayerColor.BLACK;
                const offset = (is_bplayer) ? 0 : num_rows;
                const player_index = (is_bplayer) ? 0 : 1;
                scorediff = (is_bplayer) ? (-1) * scorediff : scorediff;
                avg_score_loss[player_index] += scorediff;

                if (scorediff < 1) {
                    movecounters[offset] += 1;
                    //console.log("good");
                } else if (scorediff < 2) {
                    movecounters[offset + 1] += 1;
                    //console.log("inaccuracy");
                }else if (scorediff < 5) {
                    movecounters[offset + 2] += 1;
                    //console.log("mistake");
                } else if (scorediff >= 5) {
                    movecounters[offset + 3] += 1;
                    //console.log("blunder");
                } else{
                    othercounters[player_index] += 1;
                }
            }

            for (let j = 0; j < num_rows; j++ ){
                btotal += movecounters[j];
                wtotal += movecounters[num_rows + j];
            }

            avg_score_loss[0] = (btotal > 0) ? Math.round(10 * avg_score_loss[0] / btotal) / 10 : 0;
            avg_score_loss[1] = (wtotal > 0) ? Math.round(10 * avg_score_loss[1] / wtotal) / 10 : 0;

            for (let j = 0; j < num_rows; j++ ){
                summary_moves_list[j][0] = movecounters[j].toString();
                summary_moves_list[j][1] = (btotal > 0) ? (Math.round(1000 * movecounters[j] / btotal) / 10).toString() : "";
                summary_moves_list[j][2] = movecounters[num_rows + j].toString();
                summary_moves_list[j][3] = (wtotal > 0) ? (Math.round(1000 * movecounters[num_rows + j] / wtotal) / 10).toString() : "";
            }

            for (let j = 0; j < ai_table_rows.length; j++){
                ai_table_rows[j] = ai_table_rows[j].concat(summary_moves_list[j]);
            }

            this.setState({
                table_set: true
            });
            return {ai_table_rows, avg_score_loss};

        } else if (this.ai_review?.type === "full" ) {
            const num_rows = ai_table_rows.length;
            const movekeys = Object.keys( this.ai_review?.moves);
            const is_uploaded = (this.props.game.goban.config.original_sgf !== undefined);
            // should be one more ai review score and move branches for empty board.
            const check1 = !is_uploaded &&
            (this.props.game.goban.config.moves.length !== (movekeys.length - 1));
            // extra initial ! in all_moves which matches extra empty board score, except in handicap games for some reason.
            // so subtract 1 if black goes second == bplayer
            const check2 = is_uploaded &&
            ((this.props.game.goban.config["all_moves"].split("!").length - bplayer) !== movekeys.length);

            if (this.state.loading || check1 || check2 ){
                for (let j = 0; j < ai_table_rows.length; j++){
                    ai_table_rows[j] = ai_table_rows[j].concat(summary_moves_list[j]);
                }
                return {ai_table_rows, avg_score_loss};
            }

            const movecounters = Array(2 * num_rows).fill(0);
            const othercounters = Array(2).fill(0);
            let wtotal = 0;
            let btotal = 0;

            for (let j = hoffset; j < Object.keys( this.ai_review?.moves ).length - 1; j++ ){
                const playermove = this.ai_review?.moves[j + 1].move;
                //the current ai review shows top six playouts on the board, so matching that.
                const current_branches = this.ai_review?.moves[j].branches.slice(0, 6);
                const bluemove = current_branches[0].moves[0];
                const is_bplayer = move_player_list[j] === JGOFNumericPlayerColor.BLACK;
                const offset = (is_bplayer) ? 0 : num_rows;
                const player_index = (is_bplayer) ? 0 : 1;
                let scorediff = this.ai_review?.moves[j + 1].score - this.ai_review?.moves[j].score;
                scorediff = (is_bplayer) ? (-1) * scorediff : scorediff;
                avg_score_loss[player_index] += scorediff;

                if (bluemove === undefined ){
                    othercounters[player_index] += 1;
                } else if ( playermove.x === -1){
                    othercounters[player_index] += 1;
                    //console.log("pass etc");
                } else {
                    if (isEqualMoveIntersection(bluemove, playermove)){
                        movecounters[offset] += 1;
                        //console.log("blue Excellent");
                    } else if (current_branches.some(
                        (branch, index) => {
                            const check = index > 0 && isEqualMoveIntersection(branch.moves[0], playermove) &&
                            (branch.visits >= Math.min(50, 0.1 * this.ai_review?.strength));
                            return check;
                        })
                    ) {
                        movecounters[offset + 1] += 1;
                        //console.log("green Great");
                    } else if (scorediff < 1) {
                        movecounters[offset + 2] += 1;
                        //console.log("good");
                    } else if (scorediff < 2) {
                        movecounters[offset + 3] += 1;
                        //console.log("inaccuracy");
                    } else if (scorediff < 5) {
                        movecounters[offset + 4] += 1;
                        //console.log("mistake");
                    } else if (scorediff >= 5) {
                        movecounters[offset + 5] += 1;
                        //console.log("blunder");
                    } else{
                        othercounters[player_index] += 1;
                    }
                }
            }

            for (let j = 0; j < num_rows; j++ ){
                btotal += movecounters[j];
                wtotal += movecounters[num_rows + j];
            }

            avg_score_loss[0] = (btotal > 0) ? Math.round(10 * avg_score_loss[0] / btotal) / 10 : 0;
            avg_score_loss[1] = (wtotal > 0) ? Math.round(10 * avg_score_loss[1] / wtotal) / 10 : 0;

            for (let j = 0; j < num_rows; j++ ){
                summary_moves_list[j][0] = movecounters[j].toString();
                summary_moves_list[j][1] = (btotal > 0) ? (Math.round(1000 * movecounters[j] / btotal) / 10).toString() : "";
                summary_moves_list[j][2] = movecounters[num_rows + j].toString();
                summary_moves_list[j][3] = (wtotal > 0) ? (Math.round(1000 * movecounters[num_rows + j] / wtotal) / 10).toString() : "";
            }

            for (let j = 0; j < ai_table_rows.length; j++){
                ai_table_rows[j] = ai_table_rows[j].concat(summary_moves_list[j]);
            }

            this.setState({
                table_set: true
            });

            return {ai_table_rows, avg_score_loss};
        } else {
            return {default_table_rows, avg_score_loss};
        }
    }

    public render(): JSX.Element {
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
                    <AIReviewStream
                        uuid={this.state.selected_ai_review?.uuid}
                        game_id={this.props.game.game_id}
                        ai_review_id={this.state.selected_ai_review?.id}
                        callback={this.updateAiReview}
                    />
                    { ((!this.props.hidden && ((this.state.ai_reviews.length === 0 && this.state.reviewing))) || null) &&
                        <div className='reviewing'>
                            <span>{_("Queuing AI review")}</span>
                            <i className='fa fa-desktop slowstrobe'></i>
                        </div>
                    }
                </div>
            );
        }

        let show_full_ai_review_button: null | true = null;

        try {
            const user = data.get('user');
            if (
                user.id === this.props.game.creator_id ||
                user.id === this.props.game.goban.engine.players.black.id ||
                user.id === this.props.game.goban.engine.players.white.id
            ) {
                show_full_ai_review_button = true;
            } else if (user.is_moderator) {
                show_full_ai_review_button = true;
            } else {
                show_full_ai_review_button = null;
            }
        } catch {
            // no problem, just someone else's sgf or something
            show_full_ai_review_button = null;
        }


        const [
            win_rate,
            score,
            next_move_delta_win_rate,
            next_move_pretty_coords,
        ] = this.updateHighlightsMarksAndHeatmaps();

        const win_rate_p = win_rate * 100.0;
        const next_move_delta_p = next_move_delta_win_rate * 100.0;

        const ai_review_chart_entries: Array<AIReviewEntry> = this.ai_review.win_rates?.map((x, idx) => {
            return {
                move_number: idx,
                win_rate: x,
                score: this.ai_review?.moves[idx]?.score || 0,
                num_variations: this.ai_review?.moves[idx]?.branches.length || 0,
            };
        }) || [];

        const ai_review_chart_variation_entries: Array<AIReviewEntry> = this.getVariationReviewEntries();

        const cur_move = this.props.move;
        const trunk_move = cur_move.getBranchPoint();
        const move_number = trunk_move.move_number;
        const variation_move_number = cur_move.move_number !== trunk_move.move_number ? cur_move.move_number : -1;
        const worst_move_list = getWorstMoves(this.props.game.goban.engine.move_tree, this.ai_review);

        return (
            <div className='AIReview'>
                <UIPush event="ai-review" channel={`game-${this.props.game.game_id}`} action={this.ai_review_update} />
                <AIReviewStream
                    uuid={this.state.selected_ai_review?.uuid}
                    game_id={this.props.game.game_id}
                    ai_review_id={this.state.selected_ai_review?.id}
                    callback={this.updateAiReview}
                />

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
                                const value = getValue();
                                const isSelected = value && value[0].id === data.id;

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
                                        ? (this.state.use_score && this.ai_review.scores
                                            ? <div className="progress">
                                                {(score > 0
                                                  ? <div className="progress-bar black-background" style={{width: "100%"}}>B+{score.toFixed(1)}</div>
                                                  : <div className="progress-bar white-background" style={{width: "100%"}}>W+{(-score).toFixed(1)}</div>
                                                )}
                                            </div>
                                            : <div className="progress">
                                                <div className="progress-bar black-background" style={{width: win_rate_p + "%"}}>{win_rate_p.toFixed(1)}%</div>
                                                <div className="progress-bar white-background" style={{width: (100.0 - win_rate_p) + "%"}}>{(100 - win_rate_p).toFixed(1)}%</div>
                                            </div>)
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
                                const goban = this.props.game.goban;

                                return (
                                    <components.MenuList {...props}>
                                        {props.children}
                                        {show_full_ai_review_button &&
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
                                        }
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
                                    variation_entries={ai_review_chart_variation_entries}
                                    updatecount={this.state.updatecount}
                                    move_number={move_number}
                                    variation_move_number={variation_move_number}
                                    setmove={this.props.game.nav_goto_move}
                                    use_score={this.state.use_score}
                                    highlighted_moves={
                                        worst_move_list
                                            .slice(0, this.state.worst_moves_shown)
                                            .map(m => m.move_number - 1)
                                    }
                                />
                                {this.ai_review.scores &&
                                    <div className='win-score-toggler'>
                                        <span className='win-toggle' onClick={() => {
                                            preferences.set('ai-review-use-score', false);
                                            this.setState({use_score: false});
                                        }}>{pgettext("Display the win % that the AI estimates", "Win %")}</span>

                                        <span >
                                            <Toggle checked={this.state.use_score} onChange={b => {
                                                preferences.set('ai-review-use-score', b);
                                                this.setState({use_score: b});
                                            }} />
                                        </span>

                                        <span className='score-toggle' onClick={() => {
                                            preferences.set('ai-review-use-score', true);
                                            this.setState({use_score: true});
                                        }}>{pgettext("Display the game score that the AI estimates", "Score")}</span>
                                    </div>
                                }
                                {this.renderWorstMoveList(worst_move_list)}
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

                {null && next_move_pretty_coords && next_move_delta_win_rate !== null &&
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
                { (data.get("user").is_moderator && this.ai_review?.engine === "katago") &&
                <div>
                    <AiSummaryTable headinglist = {[_("Type"), _("Black"), "%", _("White"), "%"]} bodylist = {this.table_rows} avg_loss = {this.avg_score_loss} />
                </div>
                }
            </div>
        );
    }

    public renderWorstMoveList(lst: AIReviewWorstMoveEntry[]): JSX.Element {
        if (!this.props.game.goban.engine.move_tree || !this.ai_review) {
            return null;
        }

        const more_ct = Math.max(0, lst.length - 3);

        return (
            <div className='worst-move-list-container'>
                <div className='move-list'>
                    {pgettext("Moves that were the biggest mistakes, according to the AI", "Key moves")}:
                    {lst.slice(0, 3).map((de, idx) => {
                        const pretty_coords = this.props.game.goban.engine.prettyCoords(de.move.x, de.move.y);
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
            </div>
        );
    }
}

function sanityCheck(ai_review: JGOFAIReview) {

    if (ai_review.moves['0']) {
        if (ai_review.moves['0'].move.x !== -1) {
            console.error("AI Review move '0' is not a pass move, was ", ai_review.moves['0'].move);
        }
    }
    if ((typeof(ai_review.moves) !== "object")) {
        console.error("AI Review moves was not an object", JSON.stringify(ai_review.moves));
    }
}

function isEqualMoveIntersection(a: JGOFIntersection, b: JGOFIntersection): boolean {
    return a.x === b.x && a.y === b.y;
}
function ReviewStrengthIcon({review}: {review: JGOFAIReview}): JSX.Element {
    let strength: string;
    let content = '';
    if (review.type === 'fast') {
        strength = 'ai-review-fast';
        content = '';
    } else {
        if (review.strength >= 10000) {
            strength = 'ai-review-strength-4';
            content = 'IV';
        } else if (review.strength >= 1600) {
            strength = 'ai-review-strength-3';
            content = 'III';
        } else if (review.strength >= 800) {
            strength = 'ai-review-strength-2';
            content = 'II';
        } else if (review.strength >= 300) {
            strength = 'ai-review-strength-1';
            content = 'I';
        } else {
            strength = 'ai-review-strength-0';
            content = '';
        }
    }

    return <span className={'ai-review-strength-icon ' + strength}>{content}</span>;
}
function engineName(engine: string) {
    switch (engine) {
        case 'leela_zero':
            return "Leela Zero";
        case 'katago':
            return "KataGo";
    }
    return "AI";
}
function extractShortNetworkVersion(network: string): string {
    // the first part of the katago version describes the network size,
    // second/third is hash I think
    if (network.indexOf('-') > 0) {
        network = network.match(/[^-]*[-]([^-]*)/)[1];
    }
    return network.substr(0, 6);
}

class AiSummaryTable extends React.Component<AiSummaryTableProperties, AiSummaryTableState>{
    constructor(props: AiSummaryTableProperties) {
        super(props);
        const state: AiSummaryTableState = {
            table_hidden : preferences.get('ai-summary-table-show'),
        };
        this.state = state;
    }

    render(): JSX.Element {

        return(
            <div className = "ai-summary-container">
                <div className = 'ai-summary-toggler'>
                    <span>{((this.state.table_hidden) ? "Show" : "Hide") + " summary table " }</span>
                    <span>
                        <Toggle checked={this.state.table_hidden} onChange={b => {
                            preferences.set('ai-summary-table-show', b);
                            this.setState({table_hidden: b});
                            //console.log(this.state.table_hidden);
                        }}/>
                    </span>
                </div>
                <table className = "ai-summary-table" style = {{display: this.state.table_hidden ? "block" : "none"}}>
                    <thead>
                        <tr>
                            {this.props.headinglist.map( (head, index) => {
                                return <th key={index}>{head}</th>;
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.bodylist.map(
                            (body, bindex) => {
                                return <tr key = { bindex }>{
                                    body.map(
                                        (element, eindex) => {
                                            return <td key = { eindex } >{element}</td>;
                                        })
                                }</tr>;
                            }
                        )
                        }
                        <tr><td colSpan={5}>{"Average score loss per move"}</td></tr>
                        <tr><td colSpan={2}>{"Black"}</td><td colSpan={3}>{this.props.avg_loss[0]}</td></tr>
                        <tr><td colSpan={2}>{"White"}</td><td colSpan={3}>{this.props.avg_loss[1]}</td></tr>
                    </tbody>
                </table>
            </div>
        );

    }

}

interface AiSummaryTableState {
    table_hidden: boolean;
}

interface AiSummaryTableProperties {
    /** headings for ai review table */
    headinglist: string[];
    /** the body of the table excluding the average score loss part */
    bodylist: string[][];
    /** values for the average score loss */
    avg_loss: number[];
}
