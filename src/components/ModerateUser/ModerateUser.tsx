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
import {_} from "translate";
import {put, get} from "requests";
import {longRankString, errorAlerter, ignore} from "misc";
import {Modal, openModal} from "Modal";

interface ModerateUserProperties {
    playerId?: number;
}

declare var swal;


let ranks = [];
for (let i = 0; i < 40; ++i) {
    ranks.push({"value": i, "text": longRankString({"ranking": i})});
}
for (let i = 37; i < 46; ++i) {
    ranks.push({"value": i, "text": longRankString({"ranking": i, "pro": 1})});
}

export class ModerateUser extends Modal<ModerateUserProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            username: "...",
        };
    }

    componentWillMount() {
        super.componentWillMount();
        get(`players/${this.props.playerId}/full`)
        .then((dets) => {
            console.log(dets);
            this.setState(Object.assign({loading: false}, dets.user, {bot_owner: dets.user.bot_owner ? dets.user.bot_owner.id : null}));
        })
        .catch(errorAlerter);
    }

    save = () => {
        swal({
            text: "Moderator note",
            input: "text",
            showCancelButton: true,
        })
        .then((reason) => {
            if (!reason) {
                return;
            }

            this.close();

            let fields = [
                "is_bot", "is_banned", "is_shadowbanned",
                "bot_owner", "bot_ai", "username",
                "rating", "rating_blitz", "rating_live", "rating_correspondence",
                "ranking", "ranking_blitz", "ranking_live", "ranking_correspondence",
                "supporter", "username", "password", "email",
            ];

            let settings: any = {};
            for (let f of fields) {
                settings[f] = this.state[f];
            }
            settings.moderation_note = reason;

            put(`players/${this.props.playerId}/moderate`, settings)
            .then(() => {
                this.close();
            })
            .catch(errorAlerter);
        })
        .catch(ignore);
    }
    setLockedUsername = (ev) => this.setState({locked_username: ev.target.checked});
    setSupporter = (ev) => this.setState({supporter: ev.target.checked});
    setProfessional = (ev) => this.setState({professional: ev.target.checked});
    setBanned = (ev) => this.setState({is_banned: ev.target.checked});
    setShadowbanned = (ev) => this.setState({is_shadowbanned: ev.target.checked});
    setBot = (ev) => this.setState({is_bot: ev.target.checked});
    setBotOwner = (ev) => this.setState({bot_owner: parseInt(ev.target.value)});

    setRanking = (ev) => this.syncRankRating({ranking: ev.target.value});
    setRating = (ev) => this.syncRankRating({rating: ev.target.value});
    setRankingBlitz = (ev) => this.syncRankRating({ranking_blitz: ev.target.value});
    setRatingBlitz = (ev) => this.syncRankRating({rating_blitz: ev.target.value});
    setRankingLive = (ev) => this.syncRankRating({ranking_live: ev.target.value});
    setRatingLive = (ev) => this.syncRankRating({rating_live: ev.target.value});
    setRankingCorrespondence = (ev) => this.syncRankRating({ranking_correspondence: ev.target.value});
    setRatingCorrespondence = (ev) => this.syncRankRating({rating_correspondence: ev.target.value});

    setUsername = (ev) => this.setState({username: ev.target.value});
    setEmail = (ev) => this.setState({email: ev.target.value});
    setPassword = (ev) => this.setState({password: ev.target.value});

    syncRankRating(obj) {
        let key = null;
        let value = null;
        for (let k in obj) {
            key = k;
            obj[k] = value = parseInt(obj[k]);
        }

        let ranking = /ranking/.test(key);

        let blitz = /blitz/.test(key);
        let live = /live/.test(key);
        let correspondence = /corr/.test(key);
        let overall = !blitz && !live && !correspondence;

        if (ranking) {
            let target_key = "rating" + (blitz ? "_blitz" : "") + (live ? "_live" : "")  + (correspondence ? "_correspondence" : "");
            let rating = value * 100 + 50 - 900;
            obj[target_key] = rating;
            this.setState(obj);
        } else {
            let target_key = "ranking" + (blitz ? "_blitz" : "") + (live ? "_live" : "")  + (correspondence ? "_correspondence" : "");
            let ranking = Math.floor((value + 900) / 100);
            ranking = Math.max(0, Math.min(45, ranking));
            obj[target_key] = ranking;
            this.setState(obj);
        }

        console.log(obj);
    }

    render() {
        let user = this.state;

        return (
            <div className="Modal ModerateUser" ref="modal">
                <div className="header">
                    <h1>{this.state.username}</h1>
                </div>
                {(this.state.loading === false || null) &&
                    <div className="body">
                        <div className="row">
                            <div className="col-sm-4">
                                <h3>Special Attributes</h3>
                                <dl className="horizontal left">
                                    <dt><label htmlFor="supporter">Supporter</label></dt>
                                    <dd><input id="supporter" type="checkbox" checked={user.supporter} onChange={this.setSupporter} /></dd>

                                    <dt><label htmlFor="banned">Banned</label></dt>
                                    <dd><input id="banned" type="checkbox" checked={user.is_banned} onChange={this.setBanned} /></dd>

                                    <dt><label htmlFor="shadowbanned">Shadowbanned</label></dt>
                                    <dd><input id="shadowbanned" type="checkbox" checked={user.is_shadowbanned} onChange={this.setShadowbanned} /></dd>

                                    <dt><label htmlFor="bot">Bot</label></dt>
                                    <dd>
                                        <input id="bot" type="checkbox" checked={user.is_bot} onChange={this.setBot} />
                                        {(user.is_bot || null) && <input type="number" style={{width: "7rem"}} placeholder="Bot owner" value={this.state.bot_owner || ""} onChange={this.setBotOwner} /> }
                                    </dd>
                                </dl>
                            </div>
                            <div className="col-sm-8">
                                <h3>Account Info</h3>
                                <dl className="horizontal right">
                                    {/* "search" is a hack to get lastpass to not autofill */}
                                    <dt><label htmlFor="user-search-name">Username</label></dt>
                                    <dd>
                                        <input type="text" id="user-search-name" value={user.username} onChange={this.setUsername} autoComplete="off"/>
                                    </dd>

                                    <dt><label htmlFor="email">Email</label></dt>
                                    <dd>
                                        <input type="text" id="email" value={user.email} onChange={this.setEmail} autoComplete="off"/>
                                    </dd>

                                    <dt><label htmlFor="password">Password</label></dt>
                                    <dd>
                                        <input type="text" id="password" value={user.password} onChange={this.setPassword} autoComplete="off"/>
                                    </dd>
                                </dl>
                                <h3>Rank and Rating</h3>
                                <dl className="horizontal right">
                                    <dt><label htmlFor="rank-overall">Overall</label></dt>
                                    <dd>
                                        <select id="rank-overall" value={user.ranking} onChange={this.setRanking}>
                                            {ranks.map((r, idx) => (
                                                <option key={idx} value={r.value}>{r.text}</option>
                                            ))}
                                        </select>
                                        <input type="number" id="rating-overall" value={user.rating} onChange={this.setRating}/>
                                    </dd>

                                    <dt><label htmlFor="rank-blitz">Blitz</label></dt>
                                    <dd>
                                        <select id="rank-blitz" value={user.ranking_blitz} onChange={this.setRankingBlitz}>
                                            {ranks.map((r, idx) => (
                                                <option key={idx} value={r.value}>{r.text}</option>
                                            ))}
                                        </select>
                                        <input type="number" id="rating-blitz" value={user.rating_blitz} onChange={this.setRatingBlitz}/>
                                    </dd>
                                    <dt><label htmlFor="rank-live">Live</label></dt>
                                    <dd>
                                        <select id="rank-live" value={user.ranking_live} onChange={this.setRankingLive}>
                                            {ranks.map((r, idx) => (
                                                <option key={idx} value={r.value}>{r.text}</option>
                                            ))}
                                        </select>
                                        <input type="number" id="rating-live" value={user.rating_live} onChange={this.setRatingLive}/>
                                    </dd>
                                    <dt><label htmlFor="rank-correspondence">Corr.</label></dt>
                                    <dd>
                                        <select id="rank-correspondence" value={user.ranking_correspondence} onChange={this.setRankingCorrespondence}>
                                            {ranks.map((r, idx) => (
                                                <option key={idx} value={r.value}>{r.text}</option>
                                            ))}
                                        </select>
                                        <input type="number" id="rating-correspondence" value={user.rating_correspondence} onChange={this.setRatingCorrespondence}/>
                                    </dd>

                                </dl>
                            </div>
                        </div>
                    </div>
                }
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                    {(this.state.loading === false || null) && <button onClick={this.save}>{_("Save")}</button>}
                </div>
            </div>
        );
    }
}

export function openModerateUserModal(user) { // TODO
    return openModal(<ModerateUser playerId={user.id} />);
}
