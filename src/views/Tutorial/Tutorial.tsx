/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { Link, RouteComponentProps } from "react-router-dom";
import { Markdown } from "Markdown";
import { browserHistory } from "ogsHistory";
import { _ } from "translate";
import { InstructionalGoban } from "./InstructionalGoban";
import { openNewGameModal } from "NewGameModal";

type TutorialProperties = RouteComponentProps<{
    step: string;
}>;

const NUM_PAGES = 12;
declare let ogs_current_language;

export class Tutorial extends React.PureComponent<TutorialProperties> {
    constructor(props) {
        super(props);
    }

    render() {
        const page_number = parseInt(this.props.match.params.step) || 0;

        switch (page_number) {
            case 0:
                return <ThisIsAGoban />;
            case 1:
                return <CapturingStones1 />;
            case 2:
                return <CapturingStones2 />;
            case 3:
                return <CapturingStones3 />;
            case 4:
                return <CapturingStones4 />;
            case 5:
                return <StayingAlive1 />;
            case 6:
                return <StayingAlive2 />;
            case 7:
                return <Ko />;
            case 8:
                return <Snapback />;
            case 9:
                return <Scoring1 />;
            case 10:
                return <Scoring2 />;
            case 11:
                return <Done />;
            default:
                return <div>Invalid page</div>;
        }
    }
}

interface TutorialPageState {
    show_reset: boolean;
    show_next: boolean;
}

abstract class TutorialPage extends React.PureComponent<{}, TutorialPageState> {
    refs: {
        igoban;
    };
    _config: any;

    constructor(props) {
        super(props);
        this._config = Object.assign(
            {
                width: 9,
                height: 9,
            },
            this.config(),
        );
        this.state = {
            show_reset: false,
            show_next: false,
        };
    }

    getCurrentStep() {
        if (/[0-9]+/.test(window.location.pathname)) {
            return parseInt(window.location.pathname.match(/([0-9]+)/)[1]);
        }
        return 0;
    }
    next = () => {
        const step = Math.max(0, Math.min(NUM_PAGES - 1, this.getCurrentStep() + 1));
        console.log("Next step: ", this.getCurrentStep(), step);
        browserHistory.push(`/learn-to-play-go/${step}`);
    };
    reset = () => {
        //let step = Math.max(0, Math.min(NUM_PAGES - 1, this.getCurrentStep()));
        window.location.reload();
        //browserHistory.replace(`/learn-to-play-go/${step}?n=` + Date.now());
    };

    componentDidMount() {
        this.setState({ show_next: this.showNext() });
    }
    showReset(): boolean {
        return false;
    }
    showNext(): boolean {
        return true;
    }
    onUpdate = () => {
        this.setState({
            show_reset: this.showReset(),
            show_next: this.showNext(),
        });
    };

    abstract text();
    abstract config();

    render() {
        return (
            <div className="Tutorial page-width">
                <div className="TutorialPage">
                    <div className="tutorial-text">{this.text()}</div>

                    <InstructionalGoban
                        ref="igoban"
                        config={this._config}
                        onUpdate={this.onUpdate}
                    />

                    <div className="buttons">
                        {this.state.show_reset && (
                            <button onClick={this.reset}>{_("Reset")}</button>
                        )}
                        {this.state.show_next && (
                            <button className="primary" onClick={this.next}>
                                {_("Next")}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

class ThisIsAGoban extends TutorialPage {
    constructor(props) {
        super(props);
    }

    text() {
        if (!this.state.show_next) {
            return (
                <div>
                    <p>
                        <Markdown
                            source={
                                _(
                                    "Welcome to Go! We'll be learning on a 9x9 board (or <i>&ldquo;goban&rdquo;</i>) today. As you get better at the game, you'll play on 13x13 and 19x19 boards as well.",
                                ) /* translators: This is part of the tutorial */
                            }
                        />
                    </p>

                    <p>
                        {
                            _(
                                'Go is a two player game. One plays as Black, the other as White. They take turns placing "Stones" on the board. Try placing a stone now.',
                            ) /* translators: This is part of the tutorial */
                        }
                    </p>
                </div>
            );
        } else {
            return (
                <div>
                    {
                        _(
                            "Great! Once a stone is placed, it cannot be moved. Stones can however be captured...",
                        ) /* translators: This is part of the tutorial */
                    }
                </div>
            );
        }
    }
    config() {
        return {
            initial_state: {
                black: "",
                white: "",
            },
        };
    }
    showNext() {
        return !!this.refs.igoban.goban.engine.cur_move.parent;
    }
}
class CapturingStones1 extends TutorialPage {
    constructor(props) {
        super(props);
    }

    text() {
        if (!this.state.show_next) {
            return (
                <p>
                    <Markdown
                        source={
                            _(
                                "Stones are captured by completely surrounding them. Capture the white stone by placing a black stone at <span class='coordinate'>E4</span>.",
                            ) /* translators: This is part of the tutorial */
                        }
                    />
                </p>
            );
        } else {
            return (
                <p>
                    <Markdown
                        source={
                            _(
                                "Excellent! Captured stones are taken as <i>&ldquo;prisoners&rdquo;</i> and are removed from the board.",
                            ) /* translators: This is part of the tutorial */
                        }
                    />
                </p>
            );
        }
    }
    config() {
        return {
            initial_state: {
                black: "d5e6f5",
                white: "e5",
            },
        };
    }
    showNext() {
        return this.refs.igoban.goban.engine.board[4][4] !== 2;
    }
}
class CapturingStones2 extends TutorialPage {
    constructor(props) {
        super(props);
    }

    text() {
        if (!this.state.show_next) {
            return (
                <p>
                    {
                        _(
                            "Groups of stones can be captured all at once if the entire group is surrounded. Capture the white group.",
                        ) /* translators: This is part of the tutorial */
                    }
                </p>
            );
        } else {
            return (
                <p>
                    {
                        _(
                            "Well done!",
                        ) /* translators: This is a congratulation message in the tutorial after the player has succeeded in capturing a group */
                    }
                </p>
            );
        }
    }
    config() {
        return {
            initial_state: {
                black: "c5d4e3f5e6d7c6",
                white: "d5d6e5e4",
            },
        };
    }
    showNext() {
        return this.refs.igoban.goban.engine.board[4][4] !== 2;
    }
}
class CapturingStones3 extends TutorialPage {
    constructor(props) {
        super(props);
    }

    text() {
        if (!this.state.show_next) {
            return (
                <p>
                    {
                        _(
                            "Stones along the edge of the board only need to be surrounded by space on the board. Capture the white group",
                        ) /* translators: This is part of the tutorial */
                    }
                </p>
            );
        } else {
            return (
                <p>
                    {
                        _(
                            "Great!",
                        ) /* translators: This is a congratulation message in the tutorial after the player has succeeded in capturing a group */
                    }
                </p>
            );
        }
    }
    config() {
        return {
            initial_state: {
                black: "a3b4b6a7",
                white: "a4a5a6b5",
            },
        };
    }
    showNext() {
        return this.refs.igoban.goban.engine.board[4][0] !== 2;
    }
}
class CapturingStones4 extends TutorialPage {
    constructor(props) {
        super(props);
    }

    text() {
        if (!this.state.show_next) {
            return (
                <p>
                    <Markdown
                        source={
                            _(
                                "Simply surrounding a group on the outside isn't enough to capture a group, all <i>&ldquo;liberties&rdquo;</i> (empty spaces next to the group) must also be filled in. Capture white by placing a stone at <span class='coordinate'>E5</span>",
                            ) /* translators: This is part of the tutorial */
                        }
                    />
                </p>
            );
        } else {
            return (
                <p>
                    {
                        _(
                            "Very good!",
                        ) /* translators: This is a congratulation message in the tutorial after the player has succeeded in capturing a group */
                    }
                </p>
            );
        }
    }
    config() {
        return {
            initial_state: {
                black: "c4c5c6d7e7f7g6g5g4f3e3d3",
                white: "d4d5d6e6f6f5f4e4",
            },
        };
    }
    showNext() {
        return this.refs.igoban.goban.engine.board[4][3] !== 2;
    }
}

class StayingAlive1 extends TutorialPage {
    constructor(props) {
        super(props);
    }

    text() {
        return (
            <p>
                <Markdown
                    source={
                        _(
                            "A group is only ever truly safe if it has at least two <i>&ldquo;eyes&rdquo;</i>. For example, it is impossible to capture white here (unless white foolishly fills in one of the eyes!)",
                        ) /* translators: This is part of the tutorial */
                    }
                />
            </p>
        );
    }
    config() {
        return {
            initial_state: {
                black: "b6b5b4c3d3e3f3g3h4h5h6c7d7e7f7g7",
                white: "c5e5g5c4d4e4f4g4c6d6e6f6g6",
            },
        };
    }
    showNext() {
        return true;
    }
}
class StayingAlive2 extends TutorialPage {
    constructor(props) {
        super(props);
        this.state = {
            show_next: false,
            show_reset: false,
        };
    }

    text() {
        if (!this.state.show_next && !this.state.show_reset) {
            return (
                <p>
                    {
                        _(
                            "To protect your group from capture, form two eyes for black.",
                        ) /* translators: This is part of the tutorial */
                    }
                </p>
            );
        } else if (this.state.show_next) {
            return (
                <p>
                    {
                        _(
                            "Very good! Now there is nothing that white can do to capture black.",
                        ) /* translators: This is part of the tutorial */
                    }
                </p>
            );
        } else {
            return (
                <p>
                    {
                        _(
                            "Oops! Without forming two eyes, white can capture black!",
                        ) /* translators: This is part of the tutorial */
                    }
                </p>
            );
        }
    }
    config() {
        return {
            mode: "puzzle",
            width: 9,
            height: 9,
            initial_state: {
                black: "dfefffgfddfdgdgeecdedcfc",
                white: "hcgcccdgcgegfggghghdhehffbebdbcbcdcfce",
            },

            initial_player: "black",
            onCorrectAnswer: () => {
                this.setState({ show_next: true });
            },
            onWrongAnswer: () => {
                this.setState({ show_reset: true });
            },
            move_tree: {
                x: -1,
                y: -1,
                branches: [
                    { x: 4, y: 4, correct_answer: true },
                    {
                        x: 5,
                        y: 4,
                        branches: [
                            {
                                x: 4,
                                y: 4,
                                branches: [
                                    { x: 4, y: 3, branches: [{ x: 4, y: 4, wrong_answer: true }] },
                                ],
                            },
                        ],
                    },
                    {
                        x: 4,
                        y: 3,
                        branches: [
                            {
                                x: 4,
                                y: 4,
                                branches: [
                                    { x: 5, y: 4, branches: [{ x: 4, y: 4, wrong_answer: true }] },
                                ],
                            },
                        ],
                    },
                ],
            },
        };
    }
    showNext() {
        return this.state.show_next;
    }
    showReset() {
        return this.state.show_reset;
    }
}
class Ko extends TutorialPage {
    constructor(props) {
        super(props);
        this.state = {
            show_next: false,
            show_reset: false,
        };
    }

    text() {
        if (!this.state.show_next) {
            return (
                <p>
                    <Markdown
                        source={
                            _(
                                "Just a couple more things to know and you'll be ready to start playing.  <br/><br/>  There is a special rule called the <i>Ko</i> rule which prevents endless loops of capturing each others stones. The rule is simple, you can't loop. If black were to take <span class='coordinate'>E4</span> by placing a stone at <span class='coordinate'>E3</span>, white cannot play at <span class='coordinate'>E4</span> right away, instead white must play somewhere else. If black does not fill the hole at <span class='coordinate'>E4</span>, then next turn white may then place at <span class='coordinate'>E4</span> (and then black must play somewhere other than <span class='coordinate'>E3</span>).   <br/><br/>  Try taking <span class='coordinate'>E4</span> then immediately retaking the stone now.",
                            ) /* translators: This is part of the tutorial */
                        }
                    />
                </p>
            );
        } else {
            return (
                <p>
                    <Markdown
                        source={
                            _(
                                "Good.  <br/><br/>  You'll notice you can't endlessly retake stones, the other player must play somewhere else, however the next time it is their turn they may retake the stone if it is still available.  This is commonly known as a <i>Ko threat</i> and clever players can use them to their advantage.",
                            ) /* translators: This is part of the tutorial */
                        }
                    />
                </p>
            );
        }
    }
    config() {
        return {
            initial_state: {
                black: "d4f4e3",
                white: "d3e2f3",
            },
            moves: "eeef",
            onError: () => {
                /* we want the user to hit the 'Illegal Ko Move' error */
                this.setState({ show_next: true });
            },
        };
    }
    showNext() {
        return this.state.show_next;
    }
    showReset() {
        return this.state.show_reset;
    }
}
class Snapback extends TutorialPage {
    constructor(props) {
        super(props);
    }

    text() {
        if (!this.state.show_next) {
            return (
                <p>
                    <Markdown
                        source={
                            _(
                                "Note that the <i>Ko</i> rule only applies to situations where the board would repeat.  In the following setup, if black were to play at <span class='coordinate'>F4</span>, white could immediately capture the stone by playing at  <span class='coordinate'>F3</span>, but then black can immediately recapture the three stones by placing at  <span class='coordinate'>F4</span> again!  (This is known as a <i>snapback</i>). Try this now.",
                            ) /* translators: This is part of the tutorial */
                        }
                    />
                </p>
            );
        } else {
            return (
                <p>
                    {
                        _(
                            "Great, we're almost done! Next we'll learn about finishing the game and scoring.",
                        ) /* translators: This is part of the tutorial */
                    }
                </p>
            );
        }
    }
    config() {
        return {
            initial_state: {
                black: "d4d3e2f2g3e5",
                white: "e4e3f5g4",
            },
        };
    }
    showNext() {
        return (
            this.refs.igoban.goban.engine.board[5][4] === 0 &&
            this.refs.igoban.goban.engine.board[5][5] === 1
        );
    }
}
class Scoring1 extends TutorialPage {
    constructor(props) {
        super(props);
    }

    text() {
        return (
            <p>
                <Markdown
                    source={
                        _(
                            "When a player believes they have no where left to play meaningful moves, they pass. When both players pass consecutively then the game is over and the winner is determined by counting up all of the <i>territory</i> each player has and adding this to the number of prisoners they've captured. The player who played White (who goes second) gets a special bonus called <i>Komi</i>, which is usually 6.5 points. (Note, by using .5 points, there can never be a tie in Go!).",
                        ) /* translators: This is part of the tutorial */
                    }
                />
            </p>
        );
    }
    config() {
        return {
            mode: "play",
            width: 9,
            height: 9,
            initial_state: {
                black: "adcdbcbdccdcdbebeacecfbfbgagcgdhdibhfcgchchdidfa",
                white: "dfdgegeheideeefdedecgdgehfifheie",
            },
        };
    }
}
class Scoring2 extends TutorialPage {
    constructor(props) {
        super(props);
        this.state = {
            show_next: false,
            show_reset: false,
        };

        //this.goban.on("puzzle-wrong-answer", this.onWrongAnswer);
        //this.goban.on("puzzle-correct-answer", this.onCorrectAnswer);
    }

    text() {
        if (!this.state.show_next && !this.state.show_reset) {
            return (
                <p>
                    <Markdown
                        source={
                            _(
                                "When scoring, territory needs to be <i>completely surrounded</i> before it can be scored.  Place the missing stone so that black can claim the territory in the upper right corner.",
                            ) /* translators: This is part of the tutorial */
                        }
                    />
                </p>
            );
        } else if (this.state.show_next) {
            return (
                <p>
                    {
                        _(
                            "Excellent!",
                        ) /* translators: This is a congratulation message in the tutorial after the player has succeeded in sealing territory */
                    }
                </p>
            );
        } else {
            return (
                <p>
                    {
                        _(
                            "Oops! Try again.!",
                        ) /* translators: This is a failure message in the tutorial after the player didn't place a correct stone while trying to seal some territory */
                    }
                </p>
            );
        }
    }
    config() {
        return {
            mode: "puzzle",
            width: 9,
            height: 9,
            initial_state: {
                black: "acadbdcebecfcgbgafchegdgehfieiedfdfcfbfagchdhegeefeegife",
                white: "cdbcccdbdaabddebecffgfhfifiefhfghhhighdeihcbbb",
            },
            initial_player: "black",
            move_tree: {
                x: -1,
                y: -1,
                branches: [
                    {
                        x: 8,
                        y: 3,
                        correct_answer: true,
                    },
                ],
            },
            onCorrectAnswer: () => {
                this.setState({ show_next: true });
            },
            onWrongAnswer: () => {
                this.setState({ show_reset: true });
            },
        };
    }
    showNext() {
        return this.state.show_next;
    }
    showReset() {
        return this.state.show_reset;
    }
}

class Done extends React.PureComponent<{}, any> {
    constructor(props) {
        super(props);
    }

    playComputer = () => {
        openNewGameModal();
    };

    render() {
        let iwtg_link = "http://www.playgo.to/iwtg/";
        const iwtg_links = {
            en: "http://www.playgo.to/iwtg/en/",
            ru: "http://www.playgo.to/iwtg/russian/",
            "zh-cn": "http://www.playgo.to/iwtg/cn_simple",
            de: "http://www.playgo.to/iwtg/german",

            ar: "http://www.playgo.to/iwtg/arabic",
            cs: "http://www.oglop.wz.cz/",
            da: null,
            eo: "http://www.playgo.to/iwtg/esperanto",
            es: "http://www.thinkchile.com/playgo",
            fi: "http://www.playgo.to/iwtg/finnish",
            fr: "http://jeudego.org/_php/_mori/mori.php",
            he: "http://www.playgo.to/iwtg/hebrew",
            it: null,
            ja: "http://www.playgo.to/iwtg/jp",
            ko: null,
            nl: null,
            pl: "http://go.art.pl/Polish",
            pt: "http://go.alamino.net/playgoto/",
            ro: "http://arad.goclub.ro/tutorial/",
            sr: null,
            sv: "http://www.playgo.to/iwtg/swedish",
            uk: "http://ufgo.org/IGoTutor/index-e.html",
        };

        try {
            if (ogs_current_language in iwtg_links && iwtg_links[ogs_current_language]) {
                iwtg_link = iwtg_links[ogs_current_language];
            }
        } catch (e) {
            console.error(e);
        }

        return (
            <div className="Tutorial">
                <div className="TutorialPage Done">
                    <p>
                        {
                            _(
                                "Congratulations, you now know how to play Go! From here, explore, enjoy, and welcome!",
                            ) /* translators: This is the final congratulation message in the tutorial */
                        }
                    </p>

                    <div>
                        <h2>More resources</h2>

                        <div className="row">
                            <div className="col-sm-6">
                                <button className="primary" onClick={this.playComputer}>
                                    <i className="fa fa-laptop"></i> {_("Play a game!")}
                                </button>
                            </div>
                            <div className="col-sm-6">
                                <a className="btn primary" href={iwtg_link} target="_blank">
                                    <i className="fa fa-graduation-cap"></i>{" "}
                                    {
                                        _(
                                            "Basic strategies",
                                        ) /* translators: This is a link to http://www.playgo.to/iwtg/ seen after the tutorial is complete */
                                    }{" "}
                                </a>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-6">
                                <a
                                    className="btn primary"
                                    href="https://forums.online-go.com"
                                    target="_blank"
                                >
                                    <i className="fa fa-th-list"></i> {_("Visit the forums")}
                                </a>
                            </div>
                            <div className="col-sm-6">
                                <Link className="btn primary" to="/chat">
                                    <i className="fa fa-comments"></i> {_("Head over to chat")}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
