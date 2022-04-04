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
import { _, pgettext } from "translate";
import { get, put } from "requests";
import { parse } from "query-string";
import * as data from "data";
import * as moment from "moment";
import { Card } from "material";
import { GameList } from "GameList";
import * as preferences from "preferences";
import { ModTools } from "./ModTools";
import { GameHistoryTable } from "./GameHistoryTable";
import { ReviewsAndDemosTable } from "./ReviewsAndDemosTable";
import { BotControls } from "./BotControls";
import {
    rankString,
    getUserRating,
    humble_rating,
    rating_to_rank,
    boundedRankString,
    rank_deviation,
} from "rank_utils";
import { openModerateUserModal } from "ModerateUser";
import { errorAlerter } from "misc";
import * as player_cache from "player_cache";
import { Flag } from "Flag";
import { Markdown } from "Markdown";
import { RatingsChart } from "RatingsChart";
import { RatingsChartByGame } from "RatingsChartByGame";
import { associations } from "associations";
import { Toggle } from "Toggle";
import { AchievementList } from "Achievements";
import * as History from "history";
import { VersusCard } from "./VersusCard";
import { AvatarCard, AvatarCardEditableFields } from "./AvatarCard";
import { ActivityCard } from "./ActivityCard";

interface UserProperties {
    match: {
        params: { user_id: string };
    };
    location: History.Location;
}

type RatingsSpeed = "overall" | "blitz" | "live" | "correspondence";
type RatingsSize = 0 | 9 | 13 | 19;

interface UserState extends Partial<rest_api.PlayerDetails> {
    editing: boolean;
    selected_speed: RatingsSpeed;
    selected_size: RatingsSize;
    resolved: boolean;
    temporary_show_ratings: boolean;
    show_ratings_in_rating_grid: boolean;
    rating_graph_plot_by_games: boolean;
    show_graph_type_toggle: boolean;
    rating_chart_type_toggle_left?: number;
    // These properties also exist on the UserState.user.  These are pulled out to the top level in
    // order to trigger a re-render when changed individually.
    bot_apikey?: string;
    bot_ai?: string;
}

export class User extends React.PureComponent<UserProperties, UserState> {
    show_mod_log: boolean; // BPJ: This is used, but could also be grabbed directly from props

    constructor(props: UserProperties) {
        super(props);
        this.state = {
            editing: /edit/.test(window.location.hash),
            selected_speed: "overall",
            selected_size: 0,
            resolved: false,
            temporary_show_ratings: false,
            show_ratings_in_rating_grid: preferences.get("show-ratings-in-rating-grid"),
            rating_graph_plot_by_games: preferences.get("rating-graph-plot-by-games"),
            show_graph_type_toggle: !preferences.get("rating-graph-always-use"),
        };

        try {
            this.show_mod_log = parse(this.props.location.search)["show_mod_log"] === "1";
        } catch (e) {
            this.show_mod_log = false;
        }
    }

    componentDidMount() {
        window.document.title = _("Player");
        this.resolve(this.props);
    }

    componentDidUpdate(prevProps: UserProperties) {
        if (prevProps.match.params.user_id !== this.props.match.params.user_id) {
            this.setState({ user: undefined, resolved: false });
            this.resolve(this.props);
        }
    }
    resolve(props: UserProperties) {
        this.setState({ user: undefined, editing: /edit/.test(window.location.hash) });
        const user_id = parseInt(props.match.params.user_id) || data.get("user")?.id;
        if (user_id === undefined) {
            console.error("invalid user id: ", props.match.params.user_id);
            this.setState({ user: undefined, resolved: true });
            return;
        }
        get("players/%%/full", user_id)
            .then((response: rest_api.PlayerDetails) => {
                this.setState({ resolved: true });
                try {
                    player_cache.update(response.user);
                    this.setState({
                        bot_apikey: response.user.bot_apikey,
                        bot_ai: response.user.bot_ai,
                        ...response,
                    });
                    window.document.title = response.user.username;
                } catch (err) {
                    console.error(err.stack);
                }
            })
            .catch((err) => {
                console.error(err);
                this.setState({ user: undefined, resolved: true });
            });
    }
    toggleRatings = () => {
        this.setState((state) => ({ temporary_show_ratings: !state.temporary_show_ratings }));
    };
    saveAbout = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ user: Object.assign({}, this.state.user, { about: ev.target.value }) });
    };
    saveEditChanges(profile_card_changes: AvatarCardEditableFields) {
        this.setState({
            editing: false,
            user: Object.assign({}, this.state.user, profile_card_changes, {
                name: `${profile_card_changes.first_name} ${profile_card_changes.last_name}`,
            }),
        });
        if (this.state.user) {
            put("players/%%", this.state.user.id, {
                ...profile_card_changes,
                about: this.state.user.about,
            })
                .then(console.log)
                .catch(errorAlerter);
        }
    }
    openModerateUser = () => {
        const modal = openModerateUserModal(this.state.user);
        modal.on("close", () => {
            this.resolve(this.props);
        });
    };

    updateTogglePosition = (_height: number, width: number) => {
        this.setState({ rating_chart_type_toggle_left: width + 30 }); // eyeball enough extra left pad
    };

    render() {
        const user = this.state.user;
        if (!user) {
            return this.renderInvalidUser();
        }
        const editing = this.state.editing;
        const showRatings = this.state.temporary_show_ratings;

        const global_user = data.get("config.user");
        const cdn_release = data.get("config.cdn_release");
        const account_links = user.self_reported_account_linkages;

        return (
            <div className="User container">
                <div>
                    <div className="profile-card">
                        <div className="avatar-and-ratings-row">
                            <AvatarCard
                                user={user}
                                force_show_ratings={this.state.temporary_show_ratings}
                                editing={this.state.editing}
                                openModerateUser={this.openModerateUser}
                                onEdit={() => this.setState({ editing: true })}
                                onSave={this.saveEditChanges.bind(this)}
                            />

                            {(!preferences.get("hide-ranks") ||
                                this.state.temporary_show_ratings) &&
                                (!user.professional || global_user.id === user.id) && (
                                    <div className="ratings-container">
                                        {/* Ratings  */}
                                        <h3 className="ratings-title">
                                            {_("Ratings")}
                                            <Toggle
                                                height={14}
                                                width={30}
                                                checked={this.state.show_ratings_in_rating_grid}
                                                id="show-ratings-or-ranks"
                                                onChange={(checked) => {
                                                    this.setState({
                                                        show_ratings_in_rating_grid: checked,
                                                    });
                                                    preferences.set(
                                                        "show-ratings-in-rating-grid",
                                                        checked,
                                                    );
                                                }}
                                            />
                                        </h3>
                                        {this.renderRatingGrid(
                                            this.state.show_ratings_in_rating_grid,
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {(!preferences.get("hide-ranks") || this.state.temporary_show_ratings) &&
                    (!user.professional || global_user.id === user.id) && (
                        <div className="ratings-row">
                            <div className="ratings-chart">
                                {this.state.rating_graph_plot_by_games ? (
                                    <RatingsChartByGame
                                        playerId={user.id}
                                        speed={this.state.selected_speed}
                                        size={this.state.selected_size}
                                        updateChartSize={this.updateTogglePosition}
                                    />
                                ) : (
                                    <RatingsChart
                                        playerId={user.id}
                                        speed={this.state.selected_speed}
                                        size={this.state.selected_size}
                                        updateChartSize={this.updateTogglePosition}
                                    />
                                )}
                            </div>
                            {this.state.show_graph_type_toggle && (
                                <div
                                    className="graph-type-toggle"
                                    style={{
                                        left: this.state.rating_chart_type_toggle_left,
                                    }}
                                >
                                    <Toggle
                                        height={10}
                                        width={20}
                                        checked={this.state.rating_graph_plot_by_games}
                                        id="show-ratings-in-days"
                                        onChange={(checked) => {
                                            this.setState({ rating_graph_plot_by_games: checked });
                                            preferences.set("rating-graph-plot-by-games", checked);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                {preferences.get("hide-ranks") && (
                    <button className="danger toggle-ratings" onClick={this.toggleRatings}>
                        {showRatings ? _("Hide ratings") : _("Show ratings")}
                    </button>
                )}

                {(data.get("user")?.is_moderator || null) && (
                    <ModTools user_id={user.id} show_mod_log={this.show_mod_log} />
                )}

                <div className="row">
                    <div className="col-sm-8">
                        {(user.about || editing || null) && (
                            <Card>
                                <div className="about-container">
                                    {!editing && user.about && (
                                        <div className="about-markdown">
                                            <Markdown source={user.about} />
                                        </div>
                                    )}
                                    {(editing || null) && (
                                        <textarea
                                            className="about-editor"
                                            rows={15}
                                            onChange={this.saveAbout}
                                            placeholder={_("About yourself")}
                                            value={user.about}
                                        />
                                    )}
                                </div>
                            </Card>
                        )}

                        {this.state.active_games != null && this.state.active_games.length > 0 && (
                            <>
                                <h2>
                                    {_("Active Games")} ({this.state.active_games.length})
                                </h2>
                                <GameList list={this.state.active_games} player={user} />
                            </>
                        )}

                        <div className="row">
                            <GameHistoryTable user_id={user.id} />
                        </div>

                        <div className="row">
                            <ReviewsAndDemosTable user_id={user.id} />
                        </div>
                    </div>

                    <div className="col-sm-4">
                        {!user.professional && (
                            <div>
                                {(!preferences.get("hide-ranks") ||
                                    this.state.temporary_show_ratings) &&
                                    (!user.professional || global_user.id === user.id) &&
                                    account_links && (
                                        <Card>
                                            <SelfReportedAccountLinkages links={account_links} />
                                        </Card>
                                    )}

                                {this.state.achievements != null &&
                                    this.state.achievements.length > 0 && (
                                        <Card>
                                            <h3>{_("Achievements")}</h3>
                                            <AchievementList list={this.state.achievements} />
                                        </Card>
                                    )}

                                {this.state.titles != null &&
                                    this.state.trophies != null &&
                                    (this.state.titles.length > 0 ||
                                        this.state.trophies.length > 0) && (
                                        <Card>
                                            <h3>{_("Trophies")}</h3>

                                            {this.state.titles.length > 0 && (
                                                <div className="trophies">
                                                    {this.state.titles.map((title, idx) => (
                                                        <img
                                                            key={idx}
                                                            className="trophy"
                                                            src={`${cdn_release}/img/trophies/${title.icon}`}
                                                            title={title.title}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {this.state.trophies.length > 0 && (
                                                <div className="trophies">
                                                    {this.state.trophies.map((trophy, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={
                                                                trophy.tournament_id
                                                                    ? "/tournament/" +
                                                                      trophy.tournament_id
                                                                    : "#"
                                                            }
                                                        >
                                                            <img
                                                                className="trophy"
                                                                src={`${cdn_release}/img/trophies/${trophy.icon}`}
                                                                title={trophy.title}
                                                            />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {(user.id === 519197 || null) && (
                                                <React.Fragment>
                                                    <hr />
                                                    <div className="SpicyDragon-trophy">
                                                        <img
                                                            src="https://cdn.online-go.com/spicydragon/spicydragon400.jpg"
                                                            width={400}
                                                            height={340}
                                                        />
                                                        <div>
                                                            {pgettext(
                                                                "Special trophy for a professional go player",
                                                                "1004 simultaneous correspondence games",
                                                            )}
                                                        </div>
                                                        <div>
                                                            {moment("2020-07-20T14:38:37").format(
                                                                "LLLL",
                                                            )}
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            )}
                                        </Card>
                                    )}
                            </div>
                        )}

                        {this.state.vs != null &&
                            this.state.vs.wins + this.state.vs.losses + this.state.vs.draws > 0 && (
                                <div>
                                    <VersusCard {...this.state.vs} username={user.username} />
                                </div>
                            )}

                        {user.is_bot &&
                            user.bot_owner &&
                            user.bot_owner.id === data.get("user")?.id && (
                                <BotControls
                                    bot_ai={this.state.bot_ai ?? ""}
                                    bot_apikey={this.state.bot_apikey ?? ""}
                                    bot_id={user.id}
                                    onBotAiChanged={(bot_ai) => this.setState({ bot_ai: bot_ai })}
                                    onBotApiKeyChanged={(bot_apikey) =>
                                        this.setState({ bot_apikey: bot_apikey })
                                    }
                                />
                            )}

                        <h2>{_("Activity")}</h2>
                        <ActivityCard
                            user={user}
                            ladders={this.state.ladders}
                            tournaments={this.state.tournaments}
                            groups={this.state.groups}
                        />
                    </div>
                    {/* end right col  */}
                </div>
            </div>
        );
    }
    renderInvalidUser() {
        if (this.state.resolved) {
            return (
                <div className="User flex stetch">
                    <div className="container flex fill center-both">
                        <h3>{_("User not found")}</h3>
                    </div>
                </div>
            );
        }
        return (
            <div className="User flex stetch">
                <div className="container flex fill center-both"></div>
            </div>
        );
    }

    renderRatingGrid(show_ratings: boolean) {
        return (
            <div className="ratings-grid">
                <div className="title-row">
                    <span className="title" />
                    <span className="title">
                        <i className="speed-icon fa fa-circle-o" title={_("Overall")} />
                    </span>
                    <span className="title">
                        <i className="speed-icon fa fa-bolt" title={_("Blitz")} />
                    </span>
                    <span className="title">
                        <i className="speed-icon fa fa-clock-o" title={_("Live")} />
                    </span>
                    <span className="title">
                        <i className="speed-icon ogs-turtle" title={_("Correspondence")} />
                    </span>
                </div>
                {([0, 9, 13, 19] as const).map((size: RatingsSize) => (
                    <div key={size} className="speed">
                        {size > 0 ? (
                            <span className="title">
                                {size}x{size}
                            </span>
                        ) : (
                            <span className="title">
                                <i className="speed-icon fa fa-circle-o" title={_("Overall")} />
                            </span>
                        )}

                        {(["overall", "blitz", "live", "correspondence"] as const).map(
                            (speed: RatingsSpeed) => (
                                <span key={speed} className="cell">
                                    {this.renderRatingOrRank(speed, size, show_ratings)}
                                </span>
                            ),
                        )}
                    </div>
                ))}
            </div>
        );
    }
    renderRatingOrRank(speed: RatingsSpeed, size: RatingsSize, show_rating: boolean): JSX.Element {
        const r = getUserRating(this.state.user, speed, size);

        return (
            <div
                className={
                    `rating-entry ${speed}-${size}x${size} ` +
                    (r.unset ? "unset " : "") +
                    (speed === this.state.selected_speed && size === this.state.selected_size
                        ? "active"
                        : "")
                }
                onClick={() => this.setState({ selected_size: size, selected_speed: speed })}
            >
                <div className="rating">
                    <span className="left">
                        {show_rating
                            ? humble_rating(r.rating, r.deviation).toFixed(0)
                            : boundedRankString(
                                  rating_to_rank(humble_rating(r.rating, r.deviation)),
                                  true,
                              )}
                    </span>
                    &plusmn;
                    <span className="right">
                        {show_rating
                            ? r.deviation.toFixed(0)
                            : rank_deviation(r.rating, r.deviation).toFixed(1)}
                    </span>
                </div>
            </div>
        );
    }
}

type Server = "kgs" | "igs" | "dgs" | "golem" | "wbaduk" | "tygem" | "fox" | "yike" | "goquest";

type AccountLinks = {
    [org in `org${1 | 2 | 3}`]?: string;
} & {
    [org_id in `org${1 | 2 | 3}_id`]?: string;
} & {
    [org_rank in `org${1 | 2 | 3}_rank`]?: string;
} & {
    [server_username in `${Server}_username`]?: string;
} & {
    [server_rank in `${Server}_rank`]?: string;
};

function SelfReportedAccountLinkages({ links }: { links: AccountLinks }): JSX.Element {
    const has_association = links.org1 || links.org2 || links.org3;
    let has_other_server = false;
    for (const key in links) {
        if (
            key !== "hidden" &&
            key !== "hidden_ids" &&
            key !== "last_updated" &&
            !(key.indexOf("org") === 0) &&
            links[key as keyof AccountLinks]
        ) {
            has_other_server = true;
        }
    }

    return (
        <div className="SelfReportedAccountLinkages">
            {has_association && <h3>{_("Associations")}</h3>}
            <AssociationLink country={links.org1} id={links.org1_id} rank={links.org1_rank} />
            <AssociationLink country={links.org2} id={links.org2_id} rank={links.org2_rank} />
            <AssociationLink country={links.org3} id={links.org3_id} rank={links.org3_rank} />

            {has_other_server && <h3>{_("Servers")}</h3>}
            <ServerLink name={_("KGS")} id={links.kgs_username} rank={links.kgs_rank} />
            <ServerLink name={_("IGS / PandaNet")} id={links.igs_username} rank={links.igs_rank} />
            <ServerLink name={_("DGS")} id={links.dgs_username} rank={links.dgs_rank} />
            <ServerLink
                name={_("Little Golem")}
                id={links.golem_username}
                rank={links.golem_rank}
            />
            <ServerLink name={_("WBaduk")} id={links.wbaduk_username} rank={links.wbaduk_rank} />
            <ServerLink name={_("Tygem")} id={links.tygem_username} rank={links.tygem_rank} />
            <ServerLink name={_("Fox")} id={links.fox_username} rank={links.fox_rank} />
            <ServerLink name={_("Yike Weiqi")} id={links.yike_username} rank={links.yike_rank} />
            <ServerLink name={_("GoQuest")} id={links.goquest_username} rank={links.goquest_rank} />
        </div>
    );
}
function AssociationLink({
    country,
    id,
    rank,
}: {
    country?: string;
    id?: string;
    rank?: string;
}): JSX.Element | null {
    try {
        if (!country) {
            return null;
        }

        const association = associations.filter((a) => a.country === country)[0];
        let linker: ((id: string) => string) | undefined;

        if (country === "us") {
            linker = (id: string) => `https://agagd.usgo.org/player/${id}/`;
        }

        if (country === "eu") {
            linker = (id: string) =>
                `https://www.europeangodatabase.eu/EGD/Player_Card.php?&key=${id}`;
        }

        if (country === "ru") {
            linker = (id: string) => `https://gofederation.ru/players/${id}`;
        }

        return (
            <div className="association-link">
                <Flag country={country} />
                <span className="name">{association.acronym || association.name}</span>
                {linker && id ? (
                    <a className="id" href={linker(id)} rel="noopener">
                        {id}
                    </a>
                ) : (
                    <span className="id">{id || ""}</span>
                )}
                <span className="rank">{rank ? rankString(rank) : ""}</span>
            </div>
        );
    } catch (e) {
        return <div>[invalid association]</div>;
    }
}

function ServerLink({
    name,
    id,
    rank,
}: {
    name: string;
    id?: string;
    rank?: string;
}): JSX.Element | null {
    if (!id && !rank) {
        return null;
    }

    return (
        <div className="server-link">
            <span className="name">{name}</span>
            <span className="id">{id || ""}</span>
            <span className="rank">{rank ? rankString(rank) : ""}</span>
        </div>
    );
}
