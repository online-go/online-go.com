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
import {Link, browserHistory} from "react-router";
import {_, pgettext, interpolate} from "translate";
import {post, del, put, get, abort_requests_in_flight} from "requests";
import {errorAlerter, ignore} from "misc";
import * as data from "data";
import {Card} from "material";
import {Player, setExtraActionCallback} from "Player";
import {PaginatedTable} from "PaginatedTable";
import {Markdown} from "Markdown";
import {LadderComponent} from "LadderComponent";
import {UIPush} from "UIPush";
import {TournamentList} from "TournamentList";
import {close_all_popovers} from "popover";
import * as player_cache from "player_cache";
import * as Dropzone from "react-dropzone";
import {image_resizer} from "image_resizer";
import * as moment from "moment";
import {PlayerAutocomplete} from "PlayerAutocomplete";
import {RegisteredPlayer} from "data/Player";


declare var swal;

interface GroupProperties {
    params: any;
}

export class Group extends React.PureComponent<GroupProperties, any> {
    refs: {
        members;
        news;
        new_news_title;
        new_news_body;
    };

    constructor(props) {
        super(props);
        this.state = {
            group: {
                id: parseInt(props.params.group_id),
                admins: [],
                ladder_ids: [],
                name: "",
                has_banner: false,
                website: "",
                location: "",
                is_public: false,
                require_invitation: false,
                hide_details: false,
            },
            group_loaded: false,
            is_admin: false,
            invitation_request_pending: false,
            news: [],
            members: [],
            group_id: parseInt(props.params.group_id),
            editing: false,
            show_new_news_post: false,
            new_icon: null,
            new_banner: null,
            new_news_title: "",
            new_news_body: "",
            invite_result: null,
            editing_news: null,
        };
    }


    componentWillMount() {{{
        setExtraActionCallback(this.renderExtraPlayerActions);
    }}}
    componentDidMount() {{{
        this.resolve(parseInt(this.props.params.group_id));
    }}}
    componentWillUnmount() {{{
        setExtraActionCallback(null);
    }}}
    componentWillReceiveProps(next_props) {{{
        let group_id = parseInt(next_props.params.group_id);
        if (group_id !== this.state.group_id) {
            this.resolve(group_id);
            this.setState({group_id: group_id});
        }
    }}}
    resolve(group_id: number) {{{
        let user = data.get("user");

        get("groups/%%", group_id).then((group) => {
            let is_admin = false;

            for (let admin of group.admins) {
                player_cache.update(admin);
                if (user.id === admin.id) {
                    is_admin = true;
                }
            }

            this.setState({
                group: group,
                is_admin: is_admin,
                group_loaded: true,
            });
        }).catch(errorAlerter);
        get("groups/%%/news/", group_id).then((news) => {
            this.setState({news: news.results});
        }).catch(errorAlerter);
    }}}
    isAdmin(player_id: number): boolean {{{
        if (!this.state.group) {
            return false;
        }

        for (let admin of this.state.group.admins) {
            if (player_id === admin.id) {
                return true;
            }
        }

        return false;
    }}}

    leaveGroup = () => {{{
        post("groups/%%/members", this.state.group_id, {"delete": true})
        .then((res) => { this.resolve(this.state.group_id); })
        .catch(errorAlerter);
    }}}
    joinGroup = () => {{{
        post("groups/%%/members", this.state.group_id, {})
        .then((res) => {
            if (res.success) {
                this.resolve(this.state.group_id);
            } else if (res.pending) {
                this.setState({invitation_request_pending: true});
            }
        })
        .catch(errorAlerter);
    }}}

    refreshGroup = () => {{{
        this.resolve(this.state.group_id);
    }}}
    refreshPlayerList = () => {{{
        this.refs.members.update();
    }}}

    toggleEdit = () => {{{
        if (this.state.editing) {
            this.saveEditChanges();
            this.setState({editing: false});
        } else {
            this.setState({editing: true});
        }
    }}}
    saveEditChanges() {{{
        put(`groups/${this.state.group_id}`, this.state.group)
        .then((res) => {
            console.log(res);
        }).catch(errorAlerter);
    }}}
    updateIcon = (files) => {{{
        this.setState({new_icon: files[0]});
        image_resizer(files[0], 512, 512).then((file: Blob) => {
            put("group/%%/icon", this.state.group_id, file)
            .then((res) => {
                console.log("Upload successful", res);
            })
            .catch(errorAlerter);
        })
        .catch(errorAlerter);
    }}}
    updateBanner = (files) => {{{
        this.setState({new_banner: files[0]});
        image_resizer(files[0], 2560, 512).then((file: Blob) => {
            put("group/%%/banner", this.state.group_id, file)
            .then((res) => {
                console.log("Upload successful", res);
            })
            .catch(errorAlerter);
        })
        .catch(errorAlerter);
    }}}

    createTournament = () => {{{
        browserHistory.push(`/tournament/new/${this.state.group_id}`);
    }}}
    setGroupName = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {name: ev.target.value})});
    }}}
    setShortDescription = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {short_description: ev.target.value})});
    }}}
    setDescription = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {description: ev.target.value})});
    }}}
    setWebsite = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {website: ev.target.value})});
    }}}
    setLocation = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {location: ev.target.value})});
    }}}
    setBulletin = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {bulletin: ev.target.value})});
    }}}
    setOpenToThePublic = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {is_public: ev.target.checked})});
    }}}
    setHideDetails = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {hide_details: ev.target.checked})});
    }}}
    setDisableInvitationRequests = (ev) => {{{
        this.setState({group: Object.assign({}, this.state.group, {require_invitation: ev.target.checked})});
    }}}
    setNewNewsTitle = (ev) => {{{
        this.setState({new_news_title: ev.target.value});
    }}}
    setNewNewsBody = (ev) => {{{
        this.setState({new_news_body: ev.target.value});
    }}}
    postNewNews = (ev) => {{{
        if (this.state.new_news_title.trim().length < 5) {
            swal({"title": _("Please provide a title")})
            .then(() => this.refs.new_news_title.focus())
            .catch(errorAlerter);
            this.refs.new_news_title.focus();
            return;
        }
        if (this.state.new_news_body.trim().length < 16) {
            swal({"title": _("Please provide more content for your news")})
            .then(() => this.refs.new_news_body.focus())
            .catch(errorAlerter);
            this.refs.new_news_body.focus();
            return;
        }
        this.toggleNewNewsPost();
        post("group/%%/news/", this.state.group_id, {
            title: this.state.new_news_title,
            content: this.state.new_news_body,
        })
        .then(() => {
            if (this.refs.news) {
                this.refs.news.update();
            }
            else {
                this.resolve(this.state.group_id);
            }
        })
        .catch(errorAlerter);
    }}}
    toggleNewNewsPost = () => {{{
        this.setState({show_new_news_post: !this.state.show_new_news_post});
        setTimeout(() => {
            if (this.refs.new_news_title) {
                this.refs.new_news_title.focus();
            }
        }, 1);
    }}}
    deleteNewsPost(entry) {{{
        swal({
            "text": _("Delete this news post?"),
            "showCancelButton": true,
            "focusCancel": true,
        })
        .then(() => {
            post("group/%%/news/", this.state.group_id, {
                'id': entry.id,
                'delete': true
            })
            .then(() => {
                if (this.refs.news) {
                    this.refs.news.update();
                }
                else {
                    this.resolve(this.state.group_id);
                }
            })
            .catch(errorAlerter);
        })
        .catch(ignore);
    }}}
    editNewsPost(entry) {{{
        this.setState({editing_news: entry});
        this.refs.news.forceUpdate();
    }}}
    updateNewsPost = () => {{{
        put(`group/${this.state.group_id}/news/`, this.state.editing_news)
        .then(() => {
            this.setState({editing_news: null});
            if (this.refs.news) {
                this.refs.news.update();
            }
            else {
                this.resolve(this.state.group_id);
            }
        })
        .catch(errorAlerter);
    }}}
    updateNewsContent = (ev) => {{{
        this.setState({
            editing_news: Object.assign(
                {},
                this.state.editing_news,
                {content: ev.target.value}
            )
        });
        this.refs.news.forceUpdate();
    }}}
    updateNewsTitle = (ev) => {{{
        this.setState({
            editing_news: Object.assign(
                {},
                this.state.editing_news,
                {title: ev.target.value}
            )
        });
        this.refs.news.forceUpdate();
    }}}

    inviteUser = (ev) => {{{
        post("group/%%/members", this.state.group_id, {"username": this.state.user_to_invite.username })
        .then((res) => {
            console.log(res);
            _("Player invited"); /* for translations */
            this.setState({invite_result: _(res.success)});
        })
        .catch((res) => {
            try {
                _("Player has already been invited to this group"); /* for translations */
                _("Player is already in this group"); /* for translations */
                this.setState({invite_result: _(JSON.parse(res.responseText).error)});
            } catch (e) {
                console.error(res);
                console.error(e);
            }
        });

    }}}
    setUserToInvite = (user) => {{{
        this.setState({user_to_invite: user});
    }}}


    render() {{{
        let user = data.get("user");
        let group = this.state.group;
        let news = this.state.news;
        let editing = this.state.editing;


        return (
        <div className="Group container">
            <UIPush event="players-updated" channel={`group-${group.id}`} action={this.refreshPlayerList} />
            <UIPush event="reload-group" channel={`group-${group.id}`} action={this.refreshGroup}/>

            {(editing || group.has_banner || null) &&
                <div className="banner">
                  {editing
                    ? <Dropzone className="Dropzone" onDrop={this.updateBanner} multiple={false}>
                       {this.state.new_banner
                           ? <img src={this.state.new_banner.preview}/>
                           : (group.banner ? <img src={group.banner}/> : <i className="fa fa-picture-o"/>)
                       }
                      </Dropzone>
                    : (group.banner ? <img src={group.banner}/> : <i className="fa fa-picture-o"/>)
                  }
                </div>
            }
            <div className="row">
                <div className="col-sm-9">
                    <Card style={{minHeight: "10rem", position: "relative"}}>{/* Main card {{{ */}
                        {(this.state.is_admin || user.is.moderator || null) &&
                            <i className={editing ? "fa fa-save" : "fa fa-pencil"} onClick={this.toggleEdit}/>
                        }

                        <div className="row">
                            <div className="col-sm-2" style={{minWidth: "128px"}}>
                                {editing
                                    ? <Dropzone className="Dropzone Dropzone-128" onDrop={this.updateIcon} multiple={false}>
                                       {this.state.new_icon
                                           ? <img src={this.state.new_icon.preview} style={{maxHeight: "128px", maxWidth: "128px"}}/>
                                           : <img src={group.icon} style={{maxHeight: "128px", maxWidth: "128px"}}/>
                                       }
                                      </Dropzone>
                                    : <img src={group.icon} style={{maxHeight: "128px", maxWidth: "128px"}}/>
                                }
                            </div>
                            <div className="col-sm-10">
                                {!editing
                                    ? <h2>{group.name}</h2>
                                    : <input type="text" placeholder={_("Group name")} value={group.name} onChange={this.setGroupName} />
                                }

                                <div className="admins">
                                    <b style={{marginRight: "1rem"}}>{_("Admins")}</b> { group.admins.map((u, idx) => <Player key={idx} icon user={u} using_cache/>) }
                                </div>

                                {(this.state.group_loaded || null) &&
                                    (group.is_member
                                        ? this.state.is_admin
                                            ? (editing
                                                ? (
                                                    (((user.id === (group.founder && group.founder.id)) || user.is.moderator) || null) &&
                                                        <div>
                                                            <button className="reject" onClick={this.deleteGroup}>{_("Delete Group")}</button>
                                                        </div>
                                                  )
                                                : <div>
                                                     <button className="primary xs" disabled={this.state.show_new_news_post} onClick={this.toggleNewNewsPost}>
                                                         {_("Create news post")}
                                                     </button>
                                                     <button className="primary xs" onClick={this.createTournament}>
                                                         {_("Create Tournament")}
                                                     </button>
                                                  </div>
                                              )
                                            : <div>
                                                 <button className="xs" disabled={this.state.is_admin} onClick={this.leaveGroup}>
                                                    {_("Leave Group")}
                                                 </button>
                                                 <button className="primary xs" onClick={this.createTournament}>
                                                     {_("Create Tournament")}
                                                 </button>
                                              </div>
                                        : group.is_public
                                            ? <button className="primary xs" disabled={!(user instanceof RegisteredPlayer)} onClick={this.joinGroup}>{_("Join Group")}</button>
                                            : group.require_invitation
                                                ? <i>{_("This is a private group, you must be invited to join")}</i>
                                                : this.state.invitation_request_pending
                                                    ? <i>{_("A request to join this group has been sent to the group administrators")}</i>
                                                    : <button className="primary xs" disabled={!(user instanceof RegisteredPlayer)} onClick={this.joinGroup}>{_("Request to join this group")}</button>
                                    )
                                }


                                <div className="pad">
                                    {(editing || group.website || null) && <b>{_("Website")}: </b>}
                                    {((!editing && group.website) || null) && <span>{
                                        <a target="_blank" href={
                                            /^https?:\/\/[A-Za-z0-9.-]{2,256}(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/.test(group.website) ? group.website : ""
                                        }>{group.website}</a>
                                    }</span>}
                                    {(editing || null) && <span>
                                        <input type="url" value={group.website} onChange={this.setWebsite} />
                                    </span>}
                                </div>

                                <div className="pad">
                                    {(editing || group.location || null) && <b>{_("Location")}: </b>}
                                    {((!editing && group.location) || null) && <span>{group.location}</span>}
                                    {(editing || null) &&
                                        <span><input value={group.location} onChange={this.setLocation}/></span>
                                    }
                                </div>

                                <div className="pad">
                                    {((editing ) || null) &&
                                        <div>
                                            <input type="checkbox" id="public-group" checked={group.is_public} onChange={this.setOpenToThePublic}/>
                                            <label htmlFor="public-group">{_("Public group")}</label>
                                        </div>
                                    }
                                </div>
                                <div className="pad">
                                    {((editing ) || null) &&
                                        <div>
                                            <input type="checkbox" id="require-invitation" checked={group.require_invitation} onChange={this.setDisableInvitationRequests}/>
                                            <label htmlFor="require-invitation">{_("Disable invitation requests")}</label>
                                        </div>
                                    }
                                </div>
                                <div className="pad">
                                    {((!editing && group.hide_details) || null) && <i>{_("Group details are hidden")}</i>}
                                    {((editing ) || null) &&
                                        <div>
                                            <input type="checkbox" id="hide-details" checked={group.hide_details} onChange={this.setHideDetails}/>
                                            <label htmlFor="hide-details">{_("Hide group details")}</label>
                                        </div>
                                    }
                                </div>


                            </div>
                        </div>

                        {!editing
                            ? <Markdown source={group.description}/>
                            : <textarea rows={7} value={group.description} onChange={this.setDescription} placeholder={_("Description") /* translators: Description of the group */} />
                        }
                        {(editing || null) &&
                            <div>
                                <b>{_("Short Description") /* translators: Short description of the group */}: </b>
                                <i>{_("This will be visible on the group list and search page")}</i>
                                <textarea value={group.short_description} onChange={this.setShortDescription} placeholder={_("Short Description")} />
                            </div>
                        }
                    </Card>
                    {/* }}} */}

                    {((!editing && group.bulletin) || null) && <Card><Markdown source={group.bulletin}/></Card>}
                    {(editing || null) &&
                        <Card>
                            <textarea rows={7} placeholder={_("Bulletin")} value={group.bulletin} onChange={this.setBulletin} />
                        </Card>
                    }

                    {(this.state.news.length > 0 || null) &&
                        <Card style={{minHeight: "12rem"}}>
                            <PaginatedTable
                                ref="news"
                                className="news"
                                name="news"
                                source={`groups/${group.id}/news`}
                                pageSize={1}
                                columns={[
                                    {header: _("News"), className: "none", render: (entry) =>
                                        <div>
                                            {this.state.editing_news && this.state.editing_news.id === entry.id
                                                ? <h2><input ref='editing_news_title' value={this.state.editing_news.title}  onChange={this.updateNewsTitle}/></h2>
                                                : <h2>{entry.title}</h2>
                                            }

                                            <i>{moment(entry.posted).format("llll")} - <Player icon user={entry.author} using_cache/></i>
                                            {this.state.is_admin &&
                                                <div>
                                                    {this.state.editing_news && this.state.editing_news.id === entry.id
                                                        ?  <button className='xs' onClick={this.updateNewsPost} >{_("Save")}</button>
                                                        :  <button className='xs' onClick={this.editNewsPost.bind(this, entry)} >{_("Edit")}</button>
                                                    }
                                                    <button className='xs reject' onClick={this.deleteNewsPost.bind(this, entry)} >{_("Delete")}</button>
                                                </div>
                                            }
                                            {this.state.editing_news && this.state.editing_news.id === entry.id
                                                ? <textarea rows={7} ref='editing_news_body' value={this.state.editing_news.content} onChange={this.updateNewsContent} />
                                                : <Markdown source={entry.content} />
                                            }
                                        </div>
                                    },
                                ]}
                            />
                        </Card>
                    }

                    <div className="new-news">
                        {(this.state.show_new_news_post || null) &&
                            <div>
                                <input ref="new_news_title" type="text" placeholder={_("Title")} value={this.state.new_news_title} onChange={this.setNewNewsTitle}/>
                                <textarea ref="new_news_body" rows={7} placeholder={_("News")} value={this.state.new_news_body} onChange={this.setNewNewsBody}/>
                                <button className="reject" onClick={this.toggleNewNewsPost}>{_("Cancel")}</button>
                                <button className="primary" onClick={this.postNewNews}>{_("Post!")}</button>
                            </div>
                        }
                    </div>

                    <Card>
                        <h3>{_("Open Tournaments")}</h3>
                        <TournamentList filter={{
                            started__isnull: true,
                            ended__isnull: true,
                            group: this.props.params.group_id,
                        }}/>

                        <h3>{_("Active Tournaments")}</h3>
                        <TournamentList filter={{
                            started__isnull: false,
                            ended__isnull: true,
                            group: this.props.params.group_id,
                        }}/>

                        <h3>{_("Finished Tournaments")}</h3>
                        <TournamentList filter={{
                            started__isnull: false,
                            ended__isnull: false,
                            group: this.props.params.group_id,
                        }}/>
                    </Card>

                </div>
                <div className="col-sm-3">{/* Right column {{{ */}
                    <Card style={{minHeight: "12rem"}}>
                        {this.state.is_admin &&
                            <div className="invite-input">
                                <div className="input-group" id="tournament-invite-user-container" >
                                    <PlayerAutocomplete onComplete={this.setUserToInvite} />
                                    <button className="btn primary xs" type="button"
                                        disabled={this.state.user_to_invite == null} onClick={this.inviteUser}>{_("Invite")}</button>
                                </div>
                                <div className="bold">{this.state.invite_result}</div>
                                <div id="tournament-invite-result"></div>
                            </div>
                        }

                        <PaginatedTable
                            ref="members"
                            className="members"
                            name="members"
                            source={`groups/${group.id}/members`}
                            groom={(u_arr) => u_arr.map((u) => player_cache.update(u.user))}
                            columns={[
                                {header: _("Members"), className: "", render: (X) => <Player icon user={X} using_cache/>},
                            ]}
                        />
                    </Card>

                    {group.ladder_ids.map((ladder_id, idx) => (
                        <Card key={idx}>
                            <LadderComponent
                                pageSize={10}
                                ladderId={ladder_id}
                                showTitle={true}
                                showLinkToFullView={true}
                                hidePageControls={true}
                                dontStartOnPlayersPage={true}
                                />
                        </Card>
                    ))}
                </div>
                {/* }}} */}


            </div>

        </div>
        );
    }}}
    renderExtraPlayerActions = (player_id: number, user: any) => {{{
        if (!this.state.is_admin && !data.get("user").is.moderator) {
            return null;
        }

        if (data.get("user").id === player_id) {
            return null;
        }

        if (this.isAdmin(player_id)) {
            return (
                <div className="actions">
                    <button className="reject xs" onClick={() => this.unAdmin(player_id)}>{_("Un-Admin")}</button>
                </div>
            );
        } else {
            return (
                <div className="actions">
                    <button className="danger xs" onClick={() => this.kick(player_id)}>{_("Kick")}</button>
                    <button className="reject xs" onClick={() => this.makeAdmin(player_id)}>{_("Make Admin")}</button>
                </div>
            );
        }
    }}}

    deleteGroup = () => {
        swal({
            "text": _("Are you SURE you want to delete this group? This action is irreversible."),
            "showCancelButton": true,
            "focusCancel": true,
        })
        .then(() => {
            del("groups/%%", this.state.group.id)
            .then(() => {
                browserHistory.push("/groups/");
            })
            .catch(errorAlerter);
        })
        .catch(ignore);
    }

    makeAdmin(player_id: number) {{{
        swal({text: _("Are you sure you wish to make this user an administrator of the group?"), showCancelButton: true, focusCancel: true})
        .then(() => {
            put("groups/%%/members", this.state.group_id, {
                player_id: player_id,
                is_admin: true
            })
            .then(() => this.resolve(this.state.group_id))
            .catch(errorAlerter);
        })
        .catch(() => 0);
        close_all_popovers();
    }}}
    unAdmin(player_id: number) {{{
        swal({text: _("Are you sure you wish to remove administrator privileges from this user?"), showCancelButton: true, focusCancel: true})
        .then(() => {
            put("groups/%%/members", this.state.group_id, {
                player_id: player_id,
                is_admin: false
            })
            .then(() => this.resolve(this.state.group_id))
            .catch(errorAlerter);
        })
        .catch(() => 0);
        close_all_popovers();
    }}}
    kick(player_id: number) {{{
        swal({text: _("Are you sure you wish to remove this user from the group?"), showCancelButton: true, focusCancel: true})
        .then(() => {
            post("groups/%%/members", this.state.group_id, {"delete": true, player_id: player_id})
            .then((res) => { this.resolve(this.state.group_id); })
            .catch(errorAlerter);
        })
        .catch(() => 0);
        close_all_popovers();
    }}}


}
