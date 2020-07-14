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
import {post, get} from "requests";
import * as preferences from "preferences";
import {GameList} from "GameList";
import {ActiveAnnouncements} from "Announcements";
import {comm_socket} from "sockets";

interface ObserveGamesComponentProperties {
    announcements: boolean;
    updateTitle: boolean;
    miniGobanProps?: any;
    channel?: string;
    namesByGobans?: boolean;
}

export class ObserveGamesComponent extends React.PureComponent<ObserveGamesComponentProperties, any> {
    private last_refresh: number;
    private next_refresh: any;
    private auto_refresh: number;
    private channel?: string;
    private show_announcements: boolean;

    constructor(props) {
        super(props);
        this.state = {
            page: 1,
            num_pages: 1,
            page_size: preferences.get("observed-games-page-size"),
            page_size_text_input: preferences.get("observed-games-page-size"),
            viewing: preferences.get("observed-games-viewing"), /* live / correspondence */
            game_list: [],
            live_game_count: 0,
            corr_game_count: 0,
        };
        this.channel = props.channel;
        this.show_announcements = props.show_announcements;
    }

    doSubscribe = () => {
        comm_socket.send("gamelist/count/subscribe", this.channel);
    }

    componentDidUpdate(prevProps:ObserveGamesComponentProperties, prevState:any) {
        console.log(this.props.channel, prevProps.channel);
        if (this.props.channel !== prevProps.channel) {
            console.log("Should be reconnecting");
            this.destroy();
            this.channel = this.props.channel;
            this.init();
        }
    }

    init() {
        if (this.props.updateTitle) {
            window.document.title = _("Games");
        }
        console.log("Channel: ", this.channel);
        if (this.channel) {
            comm_socket.on(`gamelist-count-${this.channel}`, this.updateCounts);
        } else {
            comm_socket.on("gamelist-count", this.updateCounts);
        }
        comm_socket.on("connect", this.doSubscribe);
        if (comm_socket.connected) {
            this.doSubscribe();
        }
        this.refresh();
        //this.auto_refresh = setInterval(this.refresh, 500);
    }
    destroy() {
        if (this.channel) {
            comm_socket.off(`gamelist-count-${this.channel}`, this.updateCounts);
        }
        else {
            comm_socket.off("gamelist-count", this.updateCounts);
        }
        comm_socket.off("connect", this.doSubscribe);
        if (comm_socket.connected) {
            comm_socket.send("gamelist/count/unsubscribe", this.channel);
        }
        if (this.auto_refresh) {
            clearInterval(this.auto_refresh);
        }
    }

    componentDidMount() {
        this.init();
    }
    componentWillUnmount() {
        this.destroy();
    }
    updateCounts = (counts) => {
        console.log(counts);
        this.setState({
            live_game_count: counts.live,
            corr_game_count: counts.correspondence,
        });
    }
    setPageSize = (ev) => {
        if (ev.target.value && parseInt(ev.target.value) >= 3 && parseInt(ev.target.value) <= 100) {
            let ct: number = parseInt(ev.target.value);
            preferences.set("observed-games-page-size", ct);
            this.setState({
                page_size: ct,
                page_size_text_input: ct
            });
            this.setPage(1);
            setTimeout(this.refresh, 1);
        } else {
            this.setState({page_size_text_input: ev.target.value});
        }
    }
    refresh = () => {
        let now = Date.now();
        if (this.last_refresh != null && (now - this.last_refresh < 1.0)) {
            console.warn("Slow down");
            if (!this.next_refresh) {
                this.next_refresh = setTimeout(() => {
                    this.next_refresh = null;
                    this.refresh();
                }, 1000);
            }
            return;
        }
        this.last_refresh = now;

        comm_socket.send("gamelist/query", {
            list: this.state.viewing,
            sort_by: "rank",
            from: (this.state.page - 1) * this.state.page_size,
            limit: this.state.page_size,
            channel: this.channel,
        },
            (res) => {
                this.setState({
                    num_pages: Math.ceil(res.size / this.state.page_size),
                    game_list: res.results,
                    page: Math.max(1, Math.min(this.state.page, this.state.num_pages)),
                });
            }
        );
    }
    prevPage = () => {
        this.setPage(this.state.page - 1);
    }
    nextPage = () => {
        if (typeof(this.state.page) === "number") {
            this.setPage(this.state.page + 1);
        } else {
            this.setPage(1);
        }
    }
    setPage = (ev_or_page) => {
        let page = parseInt(typeof(ev_or_page) === "number" ? ev_or_page : (ev_or_page.target as any).value);
        if (isNaN(page)) {
            this.setState({page: ""});
            return;
        }
        page = Math.max(1, Math.min(Math.ceil(
            (this.state.viewing === "live" ? this.state.live_game_count : this.state.corr_game_count)
                / this.state.page_size), page));
        this.setState({page: page});
        setTimeout(this.refresh, 1);
    }

    viewLive = () => {
        this.setState({viewing: "live", page: 0});
        preferences.set("observed-games-viewing", "live");
        setTimeout(this.refresh, 1);
    }
    viewCorrespondence = () => {
        this.setState({viewing: "corr", page: 0});
        preferences.set("observed-games-viewing", "corr");
        setTimeout(this.refresh, 1);
    }

    render() {
        return (
        <div className="ObserveGamesComponent">
            <div className="container">
                <div className="games">
                    <div className="header">
                        <div className="btn-group">
                            <button className={this.state.viewing === "live" ? "active" : ""} onClick={this.viewLive}>{interpolate(_("{{count}} live games"), {count: this.state.live_game_count})}</button>
                            <button className={this.state.viewing === "corr" ? "active" : ""} onClick={this.viewCorrespondence}>{interpolate(_("{{count}} correspondence games"), {count: this.state.corr_game_count})}</button>
                        </div>

                        <button className="btn xs primary" onClick={this.refresh}>
                            <i className="fa fa-refresh"></i> {_("Refresh")}
                        </button>

                        <div className="page-controls">
                            <div className="left">
                                {this.state.page > 1 ? <i className="fa fa-step-backward" onClick={this.prevPage}/> : <i className="fa"/>}
                                <input onChange={this.setPage} value={this.state.page}/>
                                <span className="of"> / </span>
                                <span className="total">{this.state.num_pages.toString()}</span>
                                {this.state.page < this.state.num_pages ? <i className="fa fa-step-forward" onClick={this.nextPage}/> : <i className="fa"/>}
                            </div>
                            <div className="right">
                                <label className="labelshow">{_("Show") + ":"}</label>
                                <input className="show" onChange={this.setPageSize} value={this.state.page_size_text_input} type="number" min="3" max="100" step="1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ActiveAnnouncements  />

            <GameList list={this.state.game_list} disableSort={true} emptyMessage={_("No games being played")} miniGobanProps={this.props.miniGobanProps} namesByGobans={this.props.namesByGobans} />
        </div>
        );
    }
}
