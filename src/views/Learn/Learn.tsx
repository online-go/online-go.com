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

import * as React from "react";
import {_, pgettext, interpolate} from "translate";
import {get} from "requests";
import {errorAlerter} from "misc";
import data from "data";
import {Card} from "components";
import {Player, setExtraActionCallback} from "Player";
import {PaginatedTable} from "PaginatedTable";
import {Markdown} from "Markdown";
import {UIPush} from "UIPush";
import {close_all_popovers} from "popover";
import player_cache from "player_cache";
import * as moment from "moment";
import {EmbeddedChat} from "Chat";
import online_status from "online_status";


/* The "OGS teachers" group we use to drive the learning hub. */
const OGS_TEACHERS = 14;

function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function scramble(...args) {
    return shuffleArray(args);
}

function sortByOnlineStatus(lst) {{{
    let ret = [].concat(lst);
    ret.sort((a, b) => {
        let a_online = online_status.is_player_online(a.id);
        let b_online = online_status.is_player_online(b.id);
        if (a_online && !b_online) {
            return -1;
        }
        if (b_online && !a_online) {
            return 1;
        }
        return a.username.localeCompare(b.username);
    });
    return ret;
}}}


interface LearnProperties {
    params: any;
}

export class Learn extends React.PureComponent<LearnProperties, any> {
    refs: {
        members;
        news;
    };

    constructor(props) {
        super(props);
        this.state = {
            group: {
                id: OGS_TEACHERS,
            },
            group_loaded: false,
            news: [],
            members: [],
            group_id: OGS_TEACHERS,
        };
    }

    componentWillMount() {{{
        setExtraActionCallback(null);
    }}}

    componentDidMount() {{{
        this.resolve(OGS_TEACHERS);
    }}}

    componentWillUnmount() {{{
        setExtraActionCallback(null);
    }}}

    resolve(group_id: number) {{{
        let user = data.get("user");

        get(`groups/${group_id}`).then((group) => {
            this.setState({
                group: group,
                group_loaded: true,
            });
        }).catch(errorAlerter);
        get(`groups/${group_id}/news/`).then((news) => {
            this.setState({news: news.results});
        }).catch(errorAlerter);
    }}}

    refreshGroup = () => {{{
        this.resolve(this.state.group_id);
    }}}

    refreshPlayerList = () => {{{
        this.refs.members.update();
    }}}

    render() {{{
        let user = data.get("user");
        let group = this.state.group;
        let news = this.state.news;


        return (
        <div className="Learn container">
            <UIPush event="players-updated" channel={`group-${group.id}`} action={this.refreshPlayerList} />
            <UIPush event="reload-group" channel={`group-${group.id}`} action={this.refreshGroup}/>

            <div className="row">
                <div className="col-sm-9">
                    <Card style={{minHeight: "3rem", position: "relative"}}>
                        <div className="row">
                            <div className="col-sm-10">
                                <h2>Learning Hub</h2>
                            </div>
                        </div>
                    </Card>
                    <EmbeddedChat channel={`group-${group.id}`} />
                    {(this.state.news.length > 0 || null) &&
                        <Card style={{minHeight: "12rem"}}>
                            <PaginatedTable
                                ref="news"
                                className="news"
                                name="news"
                                source={`groups/${group.id}/news`}
                                pageSize={1}
                                columns={[
                                    {header: _("News"), className: "none", render: (entry) => (
                                        <div>
                                        <h2>{entry.title}</h2>
                                        <i>{moment(entry.posted).format("llll")} - <Player icon user={entry.author} /></i>
                                        <Markdown source={entry.content} />
                                        </div>

                                    )},
                                ]}
                            />
                        </Card>
                    }
                </div>
                <div className="col-sm-3">{/* Right column {{{ */}
                    <Card style={{minHeight: "12rem"}}>
                        <PaginatedTable
                            ref="members"
                            className="members"
                            name="members"
                            source={`groups/${group.id}/members`}
                            groom={(u_arr) => sortByOnlineStatus(u_arr.map((u) => player_cache.update(u.user)))}
                            columns={[
                                {header: _("Teachers"), className: "", render: (X) => <Player user={X} online rank/>},
                            ]}
                        />
                    </Card>
                    <Card style={{minHeight: "12rem"}}>
                        <h4>Resources</h4>
                        <div>
                          {scramble(
                          <span><a href="http://www.playgo.to/iwtg/">The Interactive Way To Go</a></span>,
                          <span><a href="http://www.josekipedia.com/">Josekipedia</a></span>,
                          <span><a href="http://eidogo.com/#search">Eidogo's Pattern Search</a></span>,
                          <span><a href="http://ps.waltheri.net/">Waltheri's Pattern Search</a></span>
                          ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                          }
                        </div>
                    </Card>
                </div>
                {/* }}} */}
            </div>
        </div>
        );
    }}}
}
