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
import { RouteComponentProps, rr6ClassShim } from "@/lib/ogs-rr6-shims";
import { browserHistory } from "@/lib/ogsHistory";
import { _, interpolate, pgettext } from "@/lib/translate";
import { post, del, put, get } from "@/lib/requests";
import { errorAlerter, slugify, rulesText } from "@/lib/misc";
import * as data from "@/lib/data";
import { Card } from "@/components/material";
import { Player, setExtraActionCallback } from "@/components/Player";
import { PaginatedTable, PaginatedTableRef } from "@/components/PaginatedTable";
import { Markdown } from "@/components/Markdown";
import { UIPush } from "@/components/UIPush";
import { TournamentList } from "@/views/TournamentList";
import { close_all_popovers } from "@/lib/popover";
import * as player_cache from "@/lib/player_cache";
import Dropzone from "react-dropzone";
import { image_resizer } from "@/lib/image_resizer";
import moment from "moment";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { EmbeddedChatCard } from "@/components/Chat";
import { localize_time_strings } from "@/lib/localize-time";
import { alert } from "@/lib/swal_config";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { is_valid_url } from "@/lib/url_validation";

type GroupProperties = RouteComponentProps<{
    group_id: string;
}>;

// API: group/%id%/
interface GroupInfo {
    id: number;
    admins: PlayerCacheEntry[];
    ladder_ids: number[];
    name: string;
    has_banner: boolean;
    website: string;
    location: string;
    is_public: boolean;
    admin_only_tournaments: boolean;
    require_invitation: boolean;
    hide_details: boolean;
    invitation_requests: InvitationRequest[];
    banner?: string;
    icon?: string;
    is_member?: boolean;
    founder?: PlayerCacheEntry;
    description?: string;
    short_description?: string;
    bulletin?: string;
    has_tournament_records?: boolean;
    has_open_tournaments?: boolean;
    has_active_tournaments?: boolean;
    has_finished_tournaments?: boolean;
    rules?: string;
    handicap?: number;
}

// API: group/%id%/news
interface GroupNews {
    id: number;
    group: Partial<GroupInfo>;
    author: PlayerCacheEntry;
    posted: Date;
    title: string;
    content: string;
}

interface InvitationRequest {
    id: number;
    user: PlayerCacheEntry;
}

interface GroupState {
    group: GroupInfo;
    group_loaded: boolean;
    is_admin: boolean;
    invitation_request_pending: boolean;
    news: GroupNews[];
    members: Array<{ user: PlayerCacheEntry }>;
    group_id: number;
    editing: boolean;
    show_new_news_post: boolean;
    new_icon?: { preview: string };
    new_banner?: { preview: string };
    new_news_title: string;
    new_news_body: string;
    invite_result?: string;
    editing_news?: GroupNews;
    refresh: number;
    user_to_invite?: PlayerCacheEntry;
}

class _Group extends React.PureComponent<GroupProperties, GroupState> {
    ref_new_news_title = React.createRef<HTMLInputElement>();
    ref_new_news_body = React.createRef<HTMLTextAreaElement>();

    news_ref = React.createRef<PaginatedTableRef>();

    tournament_records_ref = React.createRef<PaginatedTableRef>();

    constructor(props: GroupProperties) {
        super(props);
        this.state = {
            group: {
                id: parseInt(props.match.params.group_id),
                admins: [],
                ladder_ids: [],
                name: "",
                has_banner: false,
                website: "",
                location: "",
                is_public: false,
                admin_only_tournaments: false,
                require_invitation: false,
                hide_details: false,
                invitation_requests: [],
            },
            group_loaded: false,
            is_admin: false,
            invitation_request_pending: false,
            news: [],
            members: [],
            group_id: parseInt(props.match.params.group_id),
            editing: false,
            show_new_news_post: false,
            new_icon: undefined,
            new_banner: undefined,
            new_news_title: "",
            new_news_body: "",
            invite_result: undefined,
            editing_news: undefined,
            refresh: 0,
        };
    }

    componentDidMount() {
        window.document.title = _("Group");
        this.resolve(parseInt(this.props.match.params.group_id));
        setExtraActionCallback(this.renderExtraPlayerActions);
    }
    componentWillUnmount() {
        setExtraActionCallback(null);
    }
    componentDidUpdate() {
        const group_id = parseInt(this.props.match.params.group_id);
        if (group_id !== this.state.group_id) {
            this.resolve(group_id);
            this.setState({ group_id: group_id });
        }
    }
    resolve(group_id: number) {
        const user = data.get("user");

        get(`groups/${group_id}`)
            .then((group: GroupInfo) => {
                window.document.title = group.name;

                let is_admin = false;

                for (const admin of group.admins) {
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
            })
            .catch(errorAlerter);
        get(`groups/${group_id}/news/`)
            .then((news) => {
                this.setState({ news: news.results });
            })
            .catch(errorAlerter);
    }
    isAdmin(player_id: number): boolean {
        if (!this.state.group) {
            return false;
        }

        for (const admin of this.state.group.admins) {
            if (player_id === admin.id) {
                return true;
            }
        }

        return false;
    }

    leaveGroup = () => {
        post(`groups/${this.state.group_id}/members`, { delete: true })
            .then(() => {
                this.resolve(this.state.group_id);
            })
            .catch(errorAlerter);
    };
    joinGroup = () => {
        post(`groups/${this.state.group_id}/members`, {})
            .then((res) => {
                if (res.success) {
                    this.resolve(this.state.group_id);
                } else if (res.pending) {
                    this.setState({ invitation_request_pending: true });
                }
            })
            .catch(errorAlerter);
    };

    refreshGroup = () => {
        this.resolve(this.state.group_id);
    };

    toggleEdit = () => {
        if (this.state.editing) {
            this.saveEditChanges();
            this.setState({ editing: false });
        } else {
            this.setState({ editing: true });
        }
    };
    saveEditChanges() {
        put(`groups/${this.state.group_id}`, this.state.group)
            .then(() => {
                this.refreshGroup();
            })
            .catch(errorAlerter);
    }
    updateIcon = (files: File[]) => {
        this.setState({
            new_icon: Object.assign(files[0], { preview: URL.createObjectURL(files[0]) }),
        });
        image_resizer(files[0], 512, 512, 65535)
            .then((file: Blob) => {
                put(`group/${this.state.group_id}/icon`, file)
                    .then((res) => {
                        console.log("Upload successful", res);
                    })
                    .catch(errorAlerter);
            })
            .catch(errorAlerter);
    };
    updateBanner = (files: File[]) => {
        this.setState({
            new_banner: Object.assign(files[0], { preview: URL.createObjectURL(files[0]) }),
        });
        image_resizer(files[0], 2560, 512, 65535)
            .then((file: Blob) => {
                put(`group/${this.state.group_id}/banner`, file)
                    .then((res) => {
                        console.log("Upload successful", res);
                    })
                    .catch(errorAlerter);
            })
            .catch(errorAlerter);
    };

    createTournament = () => {
        browserHistory.push(`/tournament/new/${this.state.group_id}`);
    };
    createTournamentRecord = () => {
        void alert
            .fire({
                text: _("Tournament Name"),
                input: "text",
                showCancelButton: true,
                inputValidator: (value): string | void => {
                    if (!value) {
                        return pgettext(
                            "They have to supply a name for a tournament they want to create",
                            "Please fill in the name!",
                        );
                    }
                },
            })
            .then(({ value: name, isConfirmed }) => {
                if (!isConfirmed) {
                    return;
                }

                post("tournament_records/", {
                    group: this.state.group_id,
                    name: name,
                })
                    .then((res) => {
                        browserHistory.push(`/tournament-record/${res.id}/${slugify(name)}`);
                    })
                    .catch(errorAlerter);
            });
    };
    setGroupName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ group: Object.assign({}, this.state.group, { name: ev.target.value }) });
    };
    setRules = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ group: Object.assign({}, this.state.group, { rules: ev.target.value }) });
    };
    setHandicap = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, { handicap: Number(ev.target.value) }),
        });
    };
    setShortDescription = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, { short_description: ev.target.value }),
        });
    };
    setDescription = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, { description: ev.target.value }),
        });
    };
    setWebsite = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ group: Object.assign({}, this.state.group, { website: ev.target.value }) });
    };
    setLocation = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, { location: ev.target.value }),
        });
    };
    setBulletin = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, { bulletin: ev.target.value }),
        });
    };
    setOpenToThePublic = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, { is_public: ev.target.checked }),
        });
    };
    setHideDetails = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, { hide_details: ev.target.checked }),
        });
    };
    setDisableInvitationRequests = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, { require_invitation: ev.target.checked }),
        });
    };
    setAdminOnlyTournaments = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            group: Object.assign({}, this.state.group, {
                admin_only_tournaments: ev.target.checked,
            }),
        });
    };
    setNewNewsTitle = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ new_news_title: ev.target.value });
    };
    setNewNewsBody = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ new_news_body: ev.target.value });
    };
    postNewNews = () => {
        if (this.state.new_news_title.trim().length < 5) {
            alert
                .fire({ title: _("Please provide a title") })
                .then(() => this.ref_new_news_title.current?.focus())
                .catch(errorAlerter);
            this.ref_new_news_title.current?.focus();
            return;
        }
        if (this.state.new_news_body.trim().length < 16) {
            alert
                .fire({ title: _("Please provide more content for your news") })
                .then(() => this.ref_new_news_body.current?.focus())
                .catch(errorAlerter);
            this.ref_new_news_body.current?.focus();
            return;
        }
        this.toggleNewNewsPost();
        post(`group/${this.state.group_id}/news/`, {
            title: this.state.new_news_title,
            content: this.state.new_news_body,
        })
            .then(() => {
                this.refreshGroup();
                this.news_ref.current?.refresh();
                /* Since the removal of the refs I don't think we need to worry about this? - anoek 2021-12-23
            if (this.refs.news) {
                this.setState({news_refresh: Date.now()});
            } else {
                this.resolve(this.state.group_id);
            }
            */
            })
            .catch(errorAlerter);
    };
    toggleNewNewsPost = () => {
        this.setState({ show_new_news_post: !this.state.show_new_news_post });
        setTimeout(() => {
            if (this.ref_new_news_title.current) {
                this.ref_new_news_title.current.focus();
            }
        }, 1);
    };
    deleteNewsPost(entry: GroupNews) {
        void alert
            .fire({
                text: _("Delete this news post?"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    post(`group/${this.state.group_id}/news/`, {
                        id: entry.id,
                        delete: true,
                    })
                        .then(() => {
                            this.news_ref.current?.refresh();
                            /* Since the removal of the refs I don't think we need to worry about this? - anoek 2021-12-23
                    if (this.refs.news) {
                        this.setState({news_refresh: Date.now()});
                    } else {
                        this.resolve(this.state.group_id);
                    }
                    */
                        })
                        .catch(errorAlerter);
                }
            });
    }
    editNewsPost(entry: GroupNews) {
        this.setState({ editing_news: entry });
        this.news_ref.current?.refresh();
    }
    updateNewsPost = () => {
        put(`group/${this.state.group_id}/news/`, this.state.editing_news)
            .then(() => {
                this.setState({
                    editing_news: undefined,
                });
                this.news_ref.current?.refresh();
                /* Since the removal of the refs I don't think we need to worry about this? - anoek 2021-12-23
            if (this.refs.news) {
                this.setState({news_refresh: Date.now()});
            } else {
                this.resolve(this.state.group_id);
            }
            */
            })
            .catch(errorAlerter);
    };
    updateNewsContent = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            editing_news: Object.assign({}, this.state.editing_news, { content: ev.target.value }),
        });
    };
    updateNewsTitle = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            editing_news: Object.assign({}, this.state.editing_news, { title: ev.target.value }),
        });
    };

    inviteUser = () => {
        const username = this.state.user_to_invite?.username;
        if (!username) {
            return;
        }

        post(`group/${this.state.group_id}/members`, { username })
            .then((res) => {
                console.log(res);
                this.setState({
                    invite_result: interpolate(_("Invited {{username}}"), { username }),
                });
            })
            .catch((res) => {
                try {
                    _("Player has already been invited to this group"); /* for translations */
                    _("Player is already in this group"); /* for translations */
                    this.setState({ invite_result: _(JSON.parse(res.responseText).error) });
                } catch (e) {
                    console.error(res);
                    console.error(e);
                }
            });
    };
    setUserToInvite = (user: PlayerCacheEntry | null) => {
        if (user) {
            this.setState({ user_to_invite: user });
        }
    };

    deleteTournamentRecord = (tournament_id: number) => {
        del(`tournament_records/${tournament_id}`)
            .then(() => {
                this.tournament_records_ref.current?.refresh();
            })
            .catch(errorAlerter);
    };

    tournamentRecordDeleteClicked = (
        click: React.MouseEvent<HTMLElement>,
        tournament_id: number,
    ) => {
        if ((click.ctrlKey || click.metaKey) && click.shiftKey) {
            // For easy deletion when there are many of these created by trolls...
            // ...not exactly "discoverable", but _I_ know it's here :p
            // (I'm not trying to hide it, it's more a "temporary workaround" for PaginatedTable not having multi-select)
            this.deleteTournamentRecord(tournament_id);
        } else {
            void alert
                .fire({
                    text: _("Delete this tournament record?"),
                    showCancelButton: true,
                    focusCancel: true,
                })
                .then(({ value: accept }) => {
                    if (accept) {
                        this.deleteTournamentRecord(tournament_id);
                    }
                });
        }
    };

    deleteGroup = () => {
        void alert
            .fire({
                text: _("Are you SURE you want to delete this group? This action is irreversible."),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    del(`groups/${this.state.group_id}`)
                        .then(() => {
                            browserHistory.push("/groups/");
                        })
                        .catch(errorAlerter);
                }
            });
    };

    makeAdmin(player_id: number) {
        void alert
            .fire({
                text: _("Are you sure you wish to make this user an administrator of the group?"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    put(`groups/${this.state.group_id}/members`, {
                        player_id: player_id,
                        is_admin: true,
                    })
                        .then(() => this.resolve(this.state.group_id))
                        .catch(errorAlerter);
                }
            });
        close_all_popovers();
    }
    unAdmin(player_id: number) {
        void alert
            .fire({
                text: _("Are you sure you wish to remove administrator privileges from this user?"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    put(`groups/${this.state.group_id}/members`, {
                        player_id: player_id,
                        is_admin: false,
                    })
                        .then(() => this.resolve(this.state.group_id))
                        .catch(errorAlerter);
                }
            });
        close_all_popovers();
    }
    kick(player_id: number) {
        void alert
            .fire({
                text: _("Are you sure you wish to remove this user from the group?"),
                showCancelButton: true,
                focusCancel: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    post(`groups/${this.state.group_id}/members`, {
                        delete: true,
                        player_id: player_id,
                    })
                        .then(() => {
                            this.resolve(this.state.group_id);
                        })
                        .catch(errorAlerter);
                }
            });
        close_all_popovers();
    }

    renderRules() {
        if (
            !this.state.group_loaded ||
            !this.state.group.is_member ||
            !this.state.is_admin ||
            !this.state.editing
        ) {
            return rulesText(this.state.group?.rules ?? "japanese");
        }

        const group = this.state.group;
        return (
            <select value={group.rules} onChange={this.setRules}>
                <option value="aga">{_("AGA")}</option>
                <option value="chinese">{_("Chinese")}</option>
                <option value="ing">{_("Ing SST")}</option>
                <option value="japanese">{_("Japanese")}</option>
                <option value="korean">{_("Korean")}</option>
                <option value="nz">{_("New Zealand")}</option>
            </select>
        );
    }

    renderHandicap() {
        if (
            !this.state.group_loaded ||
            !this.state.group.is_member ||
            !this.state.is_admin ||
            !this.state.editing
        ) {
            return this.state.group?.handicap === -1 ? _("Automatic") : _("None");
        }

        const group = this.state.group;
        return (
            <select value={group.handicap} onChange={this.setHandicap}>
                <option value="0">{_("None")}</option>
                <option value="-1">{_("Automatic")}</option>
            </select>
        );
    }

    render() {
        const user = data.get("user");
        const group = this.state.group;
        const editing = this.state.editing;

        let group_website_href: string | null = group.website;
        if (!/[/][/]/.test(group_website_href)) {
            // no protocol? Guess at http
            group_website_href = "http://" + group_website_href;
        }
        if (!is_valid_url(group_website_href)) {
            group_website_href = null;
        }

        return (
            <div className="Group container">
                <UIPush
                    event="reload-group"
                    channel={`group-${group.id}`}
                    action={this.refreshGroup}
                />

                {(editing || group.has_banner || null) && (
                    <div className="banner">
                        {editing ? (
                            <Dropzone onDrop={this.updateBanner} multiple={false}>
                                {({ getRootProps, getInputProps }) => (
                                    <section className="Dropzone">
                                        <div {...getRootProps()}>
                                            <input {...getInputProps()} />
                                            {this.state.new_banner ? (
                                                <img src={this.state.new_banner.preview} />
                                            ) : group.banner ? (
                                                <img src={group.banner} />
                                            ) : (
                                                <i className="fa fa-picture-o" />
                                            )}
                                        </div>
                                    </section>
                                )}
                            </Dropzone>
                        ) : group.banner ? (
                            <img src={group.banner} />
                        ) : (
                            <i className="fa fa-picture-o" />
                        )}
                    </div>
                )}
                <div className="row">
                    <div className="col-sm-9">
                        <Card style={{ minHeight: "10rem", position: "relative" }}>
                            {/* Main card  */}
                            {(this.state.is_admin || user.is_moderator || null) && (
                                <i
                                    className={editing ? "fa fa-lg fa-save" : "fa fa-pencil"}
                                    onClick={this.toggleEdit}
                                />
                            )}

                            <div className="row">
                                <div className="col-sm-2" style={{ minWidth: "128px" }}>
                                    {editing ? (
                                        <Dropzone onDrop={this.updateIcon} multiple={false}>
                                            {({ getRootProps, getInputProps }) => (
                                                <section className="Dropzone Dropzone-128">
                                                    <div {...getRootProps()}>
                                                        <input {...getInputProps()} />
                                                        {this.state.new_icon ? (
                                                            <img
                                                                src={this.state.new_icon.preview}
                                                                style={{
                                                                    maxHeight: "128px",
                                                                    maxWidth: "128px",
                                                                }}
                                                            />
                                                        ) : (
                                                            <img
                                                                src={group.icon}
                                                                style={{
                                                                    maxHeight: "128px",
                                                                    maxWidth: "128px",
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </section>
                                            )}
                                        </Dropzone>
                                    ) : (
                                        <img
                                            src={group.icon}
                                            style={{ maxHeight: "128px", maxWidth: "128px" }}
                                        />
                                    )}
                                </div>
                                <div className="col-sm-10">
                                    {!editing ? (
                                        <h2>{group.name}</h2>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder={_("Group name")}
                                            style={{ width: "calc(100% - 3rem)" }}
                                            value={group.name}
                                            onChange={this.setGroupName}
                                        />
                                    )}

                                    <div className="admins">
                                        <b style={{ marginRight: "1rem" }}>{_("Admins")}:</b>{" "}
                                        {group.admins.map((u, idx) => (
                                            <Player key={idx} icon user={u} />
                                        ))}
                                    </div>

                                    {((this.state.group_loaded && editing && user.is_moderator) ||
                                        null) && (
                                        <div>
                                            <button className="reject" onClick={this.deleteGroup}>
                                                {_("Delete Group")}
                                            </button>
                                        </div>
                                    )}

                                    {(this.state.group_loaded || null) &&
                                        (group.is_member ? (
                                            this.state.is_admin ? (
                                                editing ? (
                                                    (user.id ===
                                                        (group.founder && group.founder.id) ||
                                                        user.is_moderator ||
                                                        null) && (
                                                        <div>
                                                            <button
                                                                className="reject"
                                                                onClick={this.deleteGroup}
                                                            >
                                                                {_("Delete Group")}
                                                            </button>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div>
                                                        <button
                                                            className="primary sm"
                                                            disabled={this.state.show_new_news_post}
                                                            onClick={this.toggleNewNewsPost}
                                                        >
                                                            {_("Create news post")}
                                                        </button>
                                                        <button
                                                            className="primary sm"
                                                            onClick={this.createTournament}
                                                        >
                                                            {_("Create tournament")}
                                                        </button>
                                                        <button
                                                            className="primary sm"
                                                            onClick={this.createTournamentRecord}
                                                        >
                                                            {_("Create tournament record")}
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <div>
                                                    <button
                                                        className="sm"
                                                        disabled={this.state.is_admin}
                                                        onClick={this.leaveGroup}
                                                    >
                                                        {_("Leave Group")}
                                                    </button>
                                                    {(!group.admin_only_tournaments ||
                                                        this.state.is_admin ||
                                                        null) && (
                                                        <span>
                                                            <button
                                                                className="primary sm"
                                                                onClick={this.createTournament}
                                                            >
                                                                {_("Create tournament")}
                                                            </button>
                                                            <button
                                                                className="primary sm"
                                                                onClick={
                                                                    this.createTournamentRecord
                                                                }
                                                            >
                                                                {_("Create tournament record")}
                                                            </button>
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        ) : group.is_public ? (
                                            <button
                                                className="primary sm"
                                                disabled={user.anonymous}
                                                onClick={this.joinGroup}
                                            >
                                                {_("Join Group")}
                                            </button>
                                        ) : group.require_invitation ? (
                                            <i>
                                                {_(
                                                    "This is a private group, you must be invited to join",
                                                )}
                                            </i>
                                        ) : this.state.invitation_request_pending ? (
                                            <i>
                                                {_(
                                                    "A request to join this group has been sent to the group administrators",
                                                )}
                                            </i>
                                        ) : (
                                            <button
                                                className="primary sm"
                                                disabled={user.anonymous}
                                                onClick={this.joinGroup}
                                            >
                                                {_("Request to join this group")}
                                            </button>
                                        ))}

                                    <div className="pad">
                                        {(editing || group_website_href || null) && (
                                            <b>{_("Website")}: </b>
                                        )}
                                        {((!editing && group_website_href) || null) && (
                                            <span>
                                                {
                                                    <a
                                                        target="_blank"
                                                        href={group_website_href as string}
                                                    >
                                                        {group_website_href}
                                                    </a>
                                                }
                                            </span>
                                        )}
                                        {(editing || null) && (
                                            <span>
                                                <input
                                                    type="url"
                                                    value={group.website}
                                                    onChange={this.setWebsite}
                                                />
                                            </span>
                                        )}
                                    </div>

                                    <div className="pad">
                                        {(editing || group.location || null) && (
                                            <b>{_("Location")}: </b>
                                        )}
                                        {((!editing && group.location) || null) && (
                                            <span>{group.location}</span>
                                        )}
                                        {(editing || null) && (
                                            <span>
                                                <input
                                                    value={group.location}
                                                    onChange={this.setLocation}
                                                />
                                            </span>
                                        )}
                                    </div>

                                    <div className="pad">
                                        {(editing || null) && (
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    id="public-group"
                                                    checked={group.is_public}
                                                    onChange={this.setOpenToThePublic}
                                                />
                                                <label htmlFor="public-group">
                                                    {_("Public group")}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pad">
                                        {(editing || null) && (
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    id="admin-only-tournaments"
                                                    checked={group.admin_only_tournaments}
                                                    onChange={this.setAdminOnlyTournaments}
                                                />
                                                <label htmlFor="admin-only-tournaments">
                                                    {_("Only admins can create tournaments")}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pad">
                                        {(editing || null) && (
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    id="require-invitation"
                                                    checked={group.require_invitation}
                                                    onChange={this.setDisableInvitationRequests}
                                                />
                                                <label htmlFor="require-invitation">
                                                    {_("Disable invitation requests")}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pad">
                                        {((!editing && group.hide_details) || null) && (
                                            <i>{_("Group details are hidden")}</i>
                                        )}
                                        {(editing || null) && (
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    id="hide-details"
                                                    checked={group.hide_details}
                                                    onChange={this.setHideDetails}
                                                />
                                                <label htmlFor="hide-details">
                                                    {_("Hide group details")}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!editing ? (
                                <Markdown source={group.description} />
                            ) : (
                                <textarea
                                    rows={7}
                                    value={group.description}
                                    onChange={this.setDescription}
                                    placeholder={
                                        _("Description") /* translators: Description of the group */
                                    }
                                />
                            )}
                            {(editing || null) && (
                                <div>
                                    <b>
                                        {
                                            _(
                                                "Short Description",
                                            ) /* translators: Short description of the group */
                                        }
                                        :{" "}
                                    </b>
                                    <i>
                                        {_(
                                            "This will be visible on the group list and search page",
                                        )}
                                    </i>
                                    <textarea
                                        value={group.short_description}
                                        onChange={this.setShortDescription}
                                        placeholder={_("Short Description")}
                                    />
                                </div>
                            )}
                        </Card>

                        {((!editing && group.bulletin) || null) && (
                            <Card>
                                <Markdown source={group.bulletin} />
                            </Card>
                        )}
                        {(editing || null) && (
                            <Card>
                                <textarea
                                    rows={7}
                                    placeholder={_("Bulletin")}
                                    value={group.bulletin}
                                    onChange={this.setBulletin}
                                />
                            </Card>
                        )}

                        <div className="new-news">
                            {(this.state.show_new_news_post || null) && (
                                <div>
                                    <input
                                        ref={this.ref_new_news_title}
                                        type="text"
                                        placeholder={_("Title")}
                                        value={this.state.new_news_title}
                                        onChange={this.setNewNewsTitle}
                                    />
                                    <textarea
                                        ref={this.ref_new_news_body}
                                        rows={7}
                                        placeholder={_("News")}
                                        value={this.state.new_news_body}
                                        onChange={this.setNewNewsBody}
                                    />
                                    <button className="reject" onClick={this.toggleNewNewsPost}>
                                        {_("Cancel")}
                                    </button>
                                    <button className="primary" onClick={this.postNewNews}>
                                        {_("Post!")}
                                    </button>
                                </div>
                            )}
                        </div>

                        {(this.state.news.length > 0 || null) && (
                            <Card style={{ minHeight: "12rem" }}>
                                <PaginatedTable<GroupNews>
                                    className="news"
                                    name="news"
                                    ref={this.news_ref}
                                    source={`groups/${group.id}/news`}
                                    pageSize={1}
                                    columns={[
                                        {
                                            header: _("News"),
                                            className: "none",
                                            render: (entry) => (
                                                <div>
                                                    {this.state.editing_news &&
                                                    this.state.editing_news.id === entry.id ? (
                                                        <h2>
                                                            <input
                                                                value={
                                                                    this.state.editing_news.title
                                                                }
                                                                style={{ width: "100%" }}
                                                                onChange={this.updateNewsTitle}
                                                            />
                                                        </h2>
                                                    ) : (
                                                        <h2>
                                                            {localize_time_strings(entry.title)}
                                                        </h2>
                                                    )}
                                                    <i>
                                                        {moment(entry.posted).format("llll")} -{" "}
                                                        <Player icon user={entry.author} />
                                                    </i>
                                                    {this.state.is_admin && (
                                                        <div>
                                                            {this.state.editing_news &&
                                                            this.state.editing_news.id ===
                                                                entry.id ? (
                                                                <button
                                                                    className="sm"
                                                                    onClick={this.updateNewsPost}
                                                                >
                                                                    {_("Save")}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="sm"
                                                                    onClick={this.editNewsPost.bind(
                                                                        this,
                                                                        entry,
                                                                    )}
                                                                >
                                                                    {_("Edit")}
                                                                </button>
                                                            )}
                                                            <button
                                                                className="sm reject"
                                                                onClick={this.deleteNewsPost.bind(
                                                                    this,
                                                                    entry,
                                                                )}
                                                            >
                                                                {_("Delete")}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {this.state.editing_news &&
                                                    this.state.editing_news.id === entry.id ? (
                                                        <textarea
                                                            rows={7}
                                                            value={this.state.editing_news.content}
                                                            onChange={this.updateNewsContent}
                                                        />
                                                    ) : (
                                                        <Markdown source={entry.content} />
                                                    )}
                                                </div>
                                            ),
                                        },
                                    ]}
                                />
                            </Card>
                        )}

                        {((group.is_public && !group.hide_details) || group.is_member || null) && (
                            <EmbeddedChatCard
                                channel={`group-${this.state.group.id}`}
                                updateTitle={false}
                            />
                        )}

                        <Card>
                            {(group.has_open_tournaments || null) && (
                                <div>
                                    <h3>{_("Open Tournaments")}</h3>
                                    <TournamentList
                                        phase="open"
                                        group={this.props.match.params.group_id}
                                    />
                                </div>
                            )}

                            {(group.has_active_tournaments || null) && (
                                <div>
                                    <h3>{_("Active Tournaments")}</h3>
                                    <TournamentList
                                        phase="active"
                                        group={this.props.match.params.group_id}
                                    />
                                </div>
                            )}

                            {(group.has_finished_tournaments || null) && (
                                <div>
                                    <h3>{_("Finished Tournaments")}</h3>
                                    <TournamentList
                                        phase="finished"
                                        group={this.props.match.params.group_id}
                                    />
                                </div>
                            )}
                            {(group.has_tournament_records || null) && (
                                <div>
                                    <h3>{_("Tournament Records")}</h3>

                                    <PaginatedTable
                                        ref={this.tournament_records_ref}
                                        className="TournamentRecord-table"
                                        name="tournament-record-table"
                                        source={`tournament_records/?group=${group.id}`}
                                        orderBy={["-created"]}
                                        columns={[
                                            {
                                                header: _("Tournament"),
                                                className: () => "name",
                                                render: (record) => (
                                                    <div className="tournament-name">
                                                        <Link
                                                            to={`/tournament-record/${
                                                                record.id
                                                            }/${slugify(record.name)}`}
                                                        >
                                                            {record.name}
                                                        </Link>
                                                    </div>
                                                ),
                                            },

                                            {
                                                header: _("Creator"),
                                                className: "creator",
                                                render: (record) => (
                                                    <Player icon user={record.creator} />
                                                ),
                                            },
                                            {
                                                header: _("Created"),
                                                className: "created",
                                                render: (record) => (
                                                    <div>
                                                        {moment(new Date(record.created)).format(
                                                            "l",
                                                        )}
                                                    </div>
                                                ),
                                            },
                                            {
                                                header: "",
                                                className: "delete",
                                                render: (record) => (
                                                    <div>
                                                        {(user.is_moderator ||
                                                            user.id === record.creator.id ||
                                                            this.state.is_admin) && (
                                                            <i
                                                                className="fa fa-trash"
                                                                onClick={(ev) =>
                                                                    this.tournamentRecordDeleteClicked(
                                                                        ev,
                                                                        record.id,
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            )}
                        </Card>
                    </div>
                    <div className="col-sm-3">
                        {/* Right column  */}
                        <Card style={{ minHeight: "12rem" }}>
                            {this.state.is_admin && (
                                <div className="invite-input">
                                    <div
                                        className="input-group"
                                        id="tournament-invite-user-container"
                                    >
                                        <PlayerAutocomplete onComplete={this.setUserToInvite} />
                                        <button
                                            className="btn primary sm"
                                            type="button"
                                            disabled={this.state.user_to_invite == null}
                                            onClick={this.inviteUser}
                                        >
                                            {_("Invite")}
                                        </button>
                                    </div>
                                    <div className="bold">{this.state.invite_result}</div>
                                    <div id="tournament-invite-result"></div>
                                </div>
                            )}

                            <PaginatedTable<
                                { user: PlayerCacheEntry },
                                PlayerCacheEntry | undefined
                            >
                                className="members"
                                name="members"
                                uiPushProps={{
                                    event: "players-updated",
                                    channel: `group-${group.id}`,
                                }}
                                source={`groups/${group.id}/members`}
                                groom={(u_arr) => u_arr.map((u) => player_cache.update(u.user))}
                                columns={[
                                    {
                                        header: _("Members"),
                                        className: "",
                                        render: (X) => <Player icon user={X} online />,
                                    },
                                ]}
                            />
                        </Card>

                        {((group.invitation_requests && group.invitation_requests.length > 0) ||
                            null) && (
                            <Card className="invitation-requests">
                                <h4>{_("Invitation requests")}</h4>
                                {group.invitation_requests.map((ir) => {
                                    const accept = () => {
                                        group.invitation_requests =
                                            group.invitation_requests.filter((x) => x.id !== ir.id);
                                        this.setState({ refresh: this.state.refresh + 1 });
                                        post("me/groups/invitations", { request_id: ir.id })
                                            .then(() =>
                                                console.log("Accepted invitation request", ir),
                                            )
                                            .catch((err) => console.error(err));
                                    };
                                    const reject = () => {
                                        group.invitation_requests =
                                            group.invitation_requests.filter((x) => x.id !== ir.id);
                                        this.setState({ refresh: this.state.refresh + 1 });
                                        post("me/groups/invitations", {
                                            delete: true,
                                            request_id: ir.id,
                                        })
                                            .then(() =>
                                                console.log("Deleted invitation request", ir),
                                            )
                                            .catch((err) => console.error(err));
                                    };

                                    return (
                                        <div key={ir.id}>
                                            <i className="fa fa-check" onClick={accept} />
                                            <i className="fa fa-times" onClick={reject} />
                                            <Player user={ir.user} />
                                        </div>
                                    );
                                })}
                            </Card>
                        )}

                        <Card className="ladders">
                            <div className="ladder-configuration">
                                <table>
                                    <tr>
                                        <th>{_("Rules")}</th>
                                        <td>{this.renderRules()}</td>
                                    </tr>
                                    <tr>
                                        <th>{_("Handicap")}</th>
                                        <td>{this.renderHandicap()}</td>
                                    </tr>
                                </table>
                            </div>
                            <div>
                                <Link to={`/ladder/${group.ladder_ids[0]}`}>{_("9x9 Ladder")}</Link>
                            </div>
                            <div>
                                <Link to={`/ladder/${group.ladder_ids[1]}`}>
                                    {_("13x13 Ladder")}
                                </Link>
                            </div>
                            <div>
                                <Link to={`/ladder/${group.ladder_ids[2]}`}>
                                    {_("19x19 Ladder")}
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    renderExtraPlayerActions = (player_id: number) => {
        if (!this.state.is_admin && !data.get("user").is_moderator) {
            return null;
        }

        if (this.isAdmin(player_id)) {
            return (
                <div className="actions">
                    <button className="reject sm" onClick={() => this.unAdmin(player_id)}>
                        {_("Un-Admin")}
                    </button>
                </div>
            );
        } else {
            return (
                <div className="actions">
                    <button className="danger sm" onClick={() => this.kick(player_id)}>
                        {_("Kick")}
                    </button>
                    <button className="reject sm" onClick={() => this.makeAdmin(player_id)}>
                        {_("Make Admin")}
                    </button>
                </div>
            );
        }
    };
}

export const Group = rr6ClassShim(_Group);
