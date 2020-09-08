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
import {_, pgettext, interpolate} from "translate";
import {Link} from "react-router-dom";
import {post, get} from "requests";
import {termination_socket} from "sockets";
import {ignore, errorAlerter, getPrintableError} from "misc";
import {SupporterGoals} from 'SupporterGoals';

declare var swal;
declare var ogs_release;
declare var ogs_version;
declare var ogs_language_version;

interface AdminProperties {
}

export class Admin extends React.PureComponent<AdminProperties, any> {
    results = [];

    constructor(props) {
        super(props);

        this.results.push(JSON.stringify({
            release: ogs_release,
            version: ogs_version,
            language_version: ogs_language_version,
        }, null, 4));

        this.state = {
            results: this.results,
            notifications_player_id: "",
        };
    }

    componentDidMount() {
        window.document.title = "Admin";

        if (termination_socket.connected) {
            this.pollStats();
        }
        termination_socket.on("connect", this.pollStats);

        get("admin/aiReviewStatus")
        .then((res) => {
            this.appendResult("\n----------------\n");
            this.appendResult("\nAI Review Status\n");
            this.appendResult(res);
            this.appendResult("\n----------------\n");
        }).catch(ignore);
    }

    componentWillUnmount() {
        termination_socket.off("connect", this.pollStats);
    }


    pollStats = () => {
        console.log("Should be polling stats");
        termination_socket.send("stats/cassandra", {}, (obj) => {
            this.appendResult("Cassandra State");
            this.appendResult(obj);
        });
    }


    updating = false;
    appendResult(text) {
        this.results.push(typeof(text) === "string" ? text : JSON.stringify(text, null, 4));
        if (this.updating) {
            return;
        }
        this.updating = true;
        setTimeout(() => {
            this.updating = false;
            this.setState({results: this.results.slice(-50)});
        }, 1);
    }

    promptAndPost(txt, url, data?) {
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
        }

        if (txt) {
            swal({text: txt, showCancelButton: true})
            .then(() => {
                doPost();
            })
            .catch(ignore);
        } else {
            doPost();
        }
    }


    pauseLiveGames     = () => this.promptAndPost("Pause live games?", "admin/pauseLiveGames");
    unpauseLiveGames   = () => this.promptAndPost("Un-Pause live games?", "admin/unpauseLiveGames");
    startWeekend       = () => this.promptAndPost("Start weekend?", "admin/startWeekend");
    stopWeekend        = () => this.promptAndPost("Stop weekend?", "admin/stopWeekend");
    rebuildGameList    = () => this.promptAndPost("Rebuild game list?", "admin/rebuildGameList");
    fetchNotifications = () => this.promptAndPost(null, "admin/notifications/" + this.state.notifications_player_id);


    render() {
        return (
        <div className="Admin container">
            <div className="row">
                <div className="col-sm-6">
                    <h3>Stuff</h3>
                    <div>
                        <Link to='/admin/merchant_log'>Merchant account request/response postback log</Link>
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
                            <input type=text
                                placeholder='Player id'
                                value={this.state.notifications_player_id}
                                onChange={(ev) => this.setState({notifications_player_id: ev.target.value})}
                                />
                            <button onClick={this.fetchNotifications}>Notifications</button>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6">
                    <button className='primary' onClick={() => {this.results = []; this.setState({results: []});}}>Clear log</button>
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
