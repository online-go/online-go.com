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

import * as React from "react";
import { browserHistory } from "ogsHistory";
import { _, pgettext, interpolate } from "translate";
import { Modal, openModal } from "Modal";
import {
    challenge,
    challengeComputer,
    createCorrespondence,
    createBlitz,
    createLive,
    blitz_config,
    live_config,
    correspondence_config,
} from "ChallengeModal";
import { shortShortTimeControl } from "TimeControl";
import { errorAlerter, ignore } from "misc";
import * as preferences from "preferences";
import * as data from "data";
import { bot_count } from "bots";
import swal from "sweetalert2";

interface Events {}

interface NewGameModalProperties {}

export class NewGameModal extends Modal<Events, NewGameModalProperties, any> {
    size9;
    size13;
    size19;

    constructor(props) {
        super(props);
        this.state = {
            board_size: preferences.get("new-game-board-size"),
        };
        this.size9 = this.updateBoardSize.bind(this, 9);
        this.size13 = this.updateBoardSize.bind(this, 13);
        this.size19 = this.updateBoardSize.bind(this, 19);
    }

    updateBoardSize(num) {
        this.setState({ board_size: num });
        preferences.set("new-game-board-size", num);
    }

    newBlitz = () => {
        createBlitz();
        this.close();
    };
    newLive = () => {
        createLive();
        this.close();
    };
    newCorrespondence = () => {
        createCorrespondence();
        this.close();
    };
    newCustom = () => {
        challenge(null);
        this.close();
    };
    newComputer = () => {
        if (bot_count() === 0) {
            swal(_("Sorry, all bots seem to be offline, please try again later.")).catch(swal.noop);
            return;
        }
        challengeComputer();
        this.close();
    };

    render() {
        return (
            <div className="Modal NewGameModal" ref="modal">
                <div className="header">
                    <h2>{_("What kind of game would you like to play?")}</h2>
                </div>
                <div className="body">
                    <div className="board-size-selection input-group">
                        <button
                            className={this.state.board_size === 9 ? "active" : ""}
                            onClick={this.size9}
                        >
                            9x9
                        </button>
                        <button
                            className={this.state.board_size === 13 ? "active" : ""}
                            onClick={this.size13}
                        >
                            13x13
                        </button>
                        <button
                            className={this.state.board_size === 19 ? "active" : ""}
                            onClick={this.size19}
                        >
                            19x19
                        </button>
                    </div>

                    <div className="new-game-button" onClick={this.newBlitz}>
                        <i className="fa fa-bolt" />
                        <h2>{_("Blitz")}</h2>
                        <div>{shortShortTimeControl(blitz_config.time_control)}</div>
                        {(this.state.board_size === 9 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a blitz game take?",
                                    "Around 3 to 7 minutes",
                                )}
                            </i>
                        )}
                        {(this.state.board_size === 13 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a blitz game take?",
                                    "Around 5 to 11 minutes",
                                )}
                            </i>
                        )}
                        {(this.state.board_size === 19 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a blitz game take?",
                                    "Around 7 to 16 minutes",
                                )}
                            </i>
                        )}
                    </div>
                    <div className="new-game-button" onClick={this.newLive}>
                        <i className="fa fa-clock-o" />
                        <h2>{_("Live")}</h2>
                        <div>{shortShortTimeControl(live_config.time_control)}</div>
                        {(this.state.board_size === 9 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a live game take?",
                                    "Around 5 to 15 minutes",
                                )}
                            </i>
                        )}
                        {(this.state.board_size === 13 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a live game take?",
                                    "Around 8 to 20 minutes",
                                )}
                            </i>
                        )}
                        {(this.state.board_size === 19 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a live game take?",
                                    "Around 15 to 30 minutes",
                                )}
                            </i>
                        )}
                    </div>
                    <div className="new-game-button" onClick={this.newCorrespondence}>
                        <i className="ogs-turtle" />
                        <h2>{_("Correspondence")}</h2>
                        <div>{shortShortTimeControl(correspondence_config.time_control)}</div>
                        {(this.state.board_size === 9 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a correspondence game take?",
                                    "Around 10 to 20 days",
                                )}
                            </i>
                        )}
                        {(this.state.board_size === 13 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a correspondence game take?",
                                    "Around 13 to 30 days",
                                )}
                            </i>
                        )}
                        {(this.state.board_size === 19 || null) && (
                            <i>
                                {pgettext(
                                    "How long does a correspondence game take?",
                                    "Around 30 to 70 days",
                                )}
                            </i>
                        )}
                    </div>

                    <div className="new-game-button" onClick={this.newCustom}>
                        <i className="fa fa-cog" />
                        <h2>{_("Custom")}</h2>
                        <i>{_("Create a custom game")}</i>
                    </div>

                    <div
                        className={"new-game-button " + (bot_count() === 0 ? "disabled" : "")}
                        onClick={this.newComputer}
                    >
                        <i className="fa fa-laptop" />
                        <h2>{_("Computer")}</h2>
                        <i>{_("Play against the computer")}</i>
                    </div>
                </div>

                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                </div>
            </div>
        );
    }
}

export function openNewGameModal() {
    return openModal(<NewGameModal fastDismiss={true} />);
}
