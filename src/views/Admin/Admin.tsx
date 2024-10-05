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
import { post } from "@/lib/requests";
import { getPrintableError } from "@/lib/misc";
import { alert } from "@/lib/swal_config";

interface AdminState {
    results: any[];
    notifications_player_id: string;
}

export class Admin extends React.PureComponent<{}, AdminState> {
    results: string[] = [];

    constructor(props: {}) {
        super(props);

        this.state = {
            results: this.results,
            notifications_player_id: "",
        };
    }

    componentDidMount() {
        window.document.title = "Admin";
    }

    updating = false;
    appendResult(text: string) {
        this.results.push(typeof text === "string" ? text : JSON.stringify(text, null, 4));
        if (this.updating) {
            return;
        }
        this.updating = true;
        setTimeout(() => {
            this.updating = false;
            this.setState({ results: this.results.slice(-50) });
        }, 1);
    }

    promptAndPost(txt: string | null, url: string, data?: any) {
        const doPost = () => {
            this.appendResult(`POST ${url} ${JSON.stringify(data || {}, null, 4)}`);

            post(url, data || {})
                .then((res) => {
                    this.appendResult(res);
                    this.appendResult("\n----------------\n");
                })
                .catch((err) => {
                    this.appendResult(`ERROR: ${getPrintableError(err)}`);
                    this.appendResult("\n----------------\n");
                });
        };

        if (txt) {
            void alert.fire({ text: txt, showCancelButton: true }).then(({ value: accept }) => {
                if (accept) {
                    doPost();
                }
            });
        } else {
            doPost();
        }
    }

    pauseLiveGames = () => this.promptAndPost("Pause live games?", "admin/pauseLiveGames");
    unpauseLiveGames = () => this.promptAndPost("Un-Pause live games?", "admin/unpauseLiveGames");
    startWeekend = () => this.promptAndPost("Start weekend?", "admin/startWeekend");
    stopWeekend = () => this.promptAndPost("Stop weekend?", "admin/stopWeekend");
    rebuildGameList = () => this.promptAndPost("Rebuild game list?", "admin/rebuildGameList");
    fetchNotifications = () =>
        this.promptAndPost(null, "admin/notifications/" + this.state.notifications_player_id);

    render() {
        return (
            <div className="Admin container">
                <div className="row">
                    <div className="col-sm-6">
                        <h3>Stuff</h3>
                        <div>
                            <Link to="/admin/merchant_log">
                                Merchant account request/response postback log
                            </Link>
                        </div>
                        <div>
                            <Link to="/admin/flagged_games">Flagged Games</Link>
                        </div>
                        <div>
                            <Link to="/admin/online_leagues">Online Leagues</Link>
                        </div>
                        <h3>Pause Controls</h3>
                        <div>
                            <div className="action-buttons">
                                <button onClick={this.pauseLiveGames}>Pause live games</button>
                                <button onClick={this.unpauseLiveGames}>Unpause live games</button>
                            </div>
                            <div className="action-buttons">
                                <button onClick={this.startWeekend}>Start weekend</button>
                                <button onClick={this.stopWeekend}>Stop weekend</button>
                            </div>
                        </div>
                        <h3>Maintenance</h3>
                        <div>
                            <div className="action-buttons">
                                <button onClick={this.rebuildGameList}>Rebuild game list</button>
                            </div>
                        </div>

                        <h3>Debug</h3>
                        <div>
                            <div className="action-buttons">
                                <input
                                    type="text"
                                    placeholder="Player id"
                                    value={this.state.notifications_player_id}
                                    onChange={(ev) =>
                                        this.setState({ notifications_player_id: ev.target.value })
                                    }
                                />
                                <button onClick={this.fetchNotifications}>Notifications</button>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <button
                            className="primary"
                            onClick={() => {
                                this.results = [];
                                this.setState({ results: [] });
                            }}
                        >
                            Clear log
                        </button>
                        <div className="well">
                            {this.state.results.map((res, idx) => (
                                <pre key={idx}>{res}</pre>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
