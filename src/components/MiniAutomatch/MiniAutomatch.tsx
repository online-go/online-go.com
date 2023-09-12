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

import * as React from "react";
import { Link } from "react-router-dom";

import { _, pgettext } from "translate";
import * as data from "data";

import { bot_count } from "bots";
import { challengeComputer } from "ChallengeModal";
import { automatch_manager, AutomatchPreferences } from "automatch_manager";
import { getAutomatchSettings } from "AutomatchSettings";
import { Size } from "src/lib/types";
import { dup, uuid } from "misc";
import { alert } from "swal_config";

export interface MiniAutomatchState {
    automatch_size_options: Size[];
    showLoadingSpinnerForCorrespondence: boolean;
}

export class MiniAutomatch extends React.Component<{}, MiniAutomatchState> {
    constructor(props) {
        super(props);

        this.state = {
            automatch_size_options: data.get("automatch.size_options", ["9x9", "13x13", "19x19"]),
            showLoadingSpinnerForCorrespondence: false,
        };
    }

    componentDidMount() {
        automatch_manager.on("entry", this.onAutomatchEntry);
        automatch_manager.on("start", this.onAutomatchStart);
        automatch_manager.on("cancel", this.onAutomatchCancel);
    }

    componentWillUnmount() {
        automatch_manager.off("entry", this.onAutomatchEntry);
        automatch_manager.off("start", this.onAutomatchStart);
        automatch_manager.off("cancel", this.onAutomatchCancel);
    }

    user = data.get("user");
    anon = this.user.anonymous;
    warned = this.user.has_active_warning_flag;

    onAutomatchEntry = () => {
        this.forceUpdate();
    };

    onAutomatchStart = () => {
        this.forceUpdate();
    };

    onAutomatchCancel = () => {
        this.forceUpdate();
    };

    toggleSize(size) {
        let size_options = dup(this.state.automatch_size_options);
        if (size_options.indexOf(size) >= 0) {
            size_options = size_options.filter((x) => x !== size);
        } else {
            size_options.push(size);
        }
        if (size_options.length === 0) {
            size_options.push("19x19");
        }
        data.set("automatch.size_options", size_options);
        this.setState({ automatch_size_options: size_options });
    }

    size_enabled = (size) => {
        return this.state.automatch_size_options.indexOf(size) >= 0;
    };

    findMatch = (speed: "blitz" | "live" | "correspondence") => {
        const settings = getAutomatchSettings(speed);
        const preferences: AutomatchPreferences = {
            uuid: uuid(),
            size_speed_options: this.state.automatch_size_options.map((size) => {
                return {
                    size: size,
                    speed: speed,
                };
            }),
            lower_rank_diff: settings.lower_rank_diff,
            upper_rank_diff: settings.upper_rank_diff,
            rules: {
                condition: settings.rules.condition,
                value: settings.rules.value,
            },
            time_control: {
                condition: settings.time_control.condition,
                value: settings.time_control.value,
            },
            handicap: {
                condition: settings.handicap.condition,
                value: settings.handicap.value,
            },
        };
        preferences.uuid = uuid();
        automatch_manager.findMatch(preferences);
        this.onAutomatchEntry();

        if (speed === "correspondence") {
            this.setState({ showLoadingSpinnerForCorrespondence: true });
        }
    };

    dismissCorrespondenceSpinner = () => {
        this.setState({ showLoadingSpinnerForCorrespondence: false });
    };

    cancelActiveAutomatch = () => {
        if (automatch_manager.active_live_automatcher) {
            automatch_manager.cancel(automatch_manager.active_live_automatcher.uuid);
        }
        this.forceUpdate();
    };

    newComputerGame = () => {
        if (bot_count() === 0) {
            void alert.fire(_("Sorry, all bots seem to be offline, please try again later."));
            return;
        }
        challengeComputer();
    };

    render() {
        if (automatch_manager.active_live_automatcher) {
            return (
                <div className="automatch-container">
                    <h2>{_("New Game")}</h2>
                    <div className="automatch-header">{_("Finding you a game...")}</div>
                    <div className="automatch-row-container">
                        <div className="spinner">
                            <div className="double-bounce1"></div>
                            <div className="double-bounce2"></div>
                        </div>
                    </div>
                    <div className="automatch-settings">
                        <button className="danger sm" onClick={this.cancelActiveAutomatch}>
                            {pgettext("Cancel automatch", "Cancel")}
                        </button>
                    </div>
                </div>
            );
        } else if (this.state.showLoadingSpinnerForCorrespondence) {
            return (
                <div className="automatch-container">
                    <h2>{_("New Game")}</h2>
                    <div className="automatch-header">{_("Finding you a game...")}</div>
                    <div className="automatch-settings-corr">
                        {_(
                            'This can take several minutes. You will be notified when your match has been found. To view or cancel your automatch requests, please Play page section labeled "Your Automatch Requests".',
                        )}
                        <Link to="/play" className="btn primary">
                            {_("Play page")}
                        </Link>
                    </div>
                    <div className="automatch-row-container">
                        <button className="primary" onClick={this.dismissCorrespondenceSpinner}>
                            {_(
                                pgettext(
                                    "Dismiss the 'finding correspondence automatch' message",
                                    "Got it",
                                ),
                            )}
                        </button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="automatch-container">
                    <h2>{_("New Game")}</h2>
                    <div className="automatch-header">
                        <div className="btn-group">
                            <button
                                className={this.size_enabled("9x9") ? "primary sm" : "sm"}
                                onClick={() => this.toggleSize("9x9")}
                            >
                                9x9
                            </button>
                            <button
                                className={this.size_enabled("13x13") ? "primary sm" : "sm"}
                                onClick={() => this.toggleSize("13x13")}
                            >
                                13x13
                            </button>
                            <button
                                className={this.size_enabled("19x19") ? "primary sm" : "sm"}
                                onClick={() => this.toggleSize("19x19")}
                            >
                                19x19
                            </button>
                        </div>
                        <div className="more-options">
                            <a href="/play"> More Options</a>
                        </div>
                    </div>
                    <div className="automatch-row-container">
                        <div className="automatch-row">
                            <button
                                className="primary"
                                onClick={() => this.findMatch("blitz")}
                                disabled={this.anon || this.warned}
                            >
                                <div className="play-button-text-root">
                                    <i className="fa fa-bolt" /> {_("Blitz")}
                                    <span className="time-per-move">
                                        {pgettext(
                                            "Automatch average time per move",
                                            "~10s per move",
                                        )}
                                    </span>
                                </div>
                            </button>
                            <button
                                className="primary"
                                onClick={() => this.findMatch("live")}
                                disabled={this.anon || this.warned}
                            >
                                <div className="play-button-text-root">
                                    <i className="fa fa-clock-o" /> {_("Normal")}
                                    <span className="time-per-move">
                                        {pgettext(
                                            "Automatch average time per move",
                                            "~30s per move",
                                        )}
                                    </span>
                                </div>
                            </button>
                            <button
                                className="primary"
                                onClick={() => this.findMatch("correspondence")}
                                disabled={this.anon || this.warned}
                            >
                                <div className="play-button-text-root">
                                    <span>
                                        <i className="ogs-turtle" /> {_("Correspondence")}
                                    </span>
                                    <span className="time-per-move">
                                        {pgettext(
                                            "Automatch average time per move",
                                            "~1 day per move",
                                        )}
                                    </span>
                                </div>
                            </button>
                            <button
                                className="primary"
                                onClick={this.newComputerGame}
                                disabled={this.anon || this.warned}
                            >
                                <div className="play-button-text-root">
                                    <i className="fa fa-desktop" /> {_("Computer")}
                                    <span className="time-per-move"></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }
}
