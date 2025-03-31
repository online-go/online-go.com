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
import { useLocation, useParams } from "react-router-dom";
import { _, pgettext } from "@/lib/translate";
import { get, put } from "@/lib/requests";
import { parse } from "query-string";
import * as data from "@/lib/data";
import moment from "moment";

import * as preferences from "@/lib/preferences";
import * as player_cache from "@/lib/player_cache";

import { Card } from "@/components/material";

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
} from "@/lib/rank_utils";
import { openModerateUserModal } from "@/components/ModerateUser";
import { errorAlerter } from "@/lib/misc";
import { Flag } from "@/components/Flag";
import { Markdown } from "@/components/Markdown";
import { RatingsChart } from "@/components/RatingsChart";
import { RatingsChartByGame } from "@/components/RatingsChartByGame";
import { RatingsChartDistribution } from "@/components/RatingsChartDistribution";
import { associations } from "@/lib/associations";
import { Toggle } from "@/components/Toggle";
import { AchievementList } from "@/components/Achievements";
import { VersusCard } from "./VersusCard";
import { AvatarCard, AvatarCardEditableFields } from "./AvatarCard";
import { ActivityCard } from "./ActivityCard";
import { ActiveDroppedGameList } from "@/components/ActiveDroppedGameList";
import { NewUserRankChooser } from "@/components/NewUserRankChooser";

type RatingsSpeed = "overall" | "blitz" | "live" | "correspondence";
type RatingsSize = 0 | 9 | 13 | 19;

export function User(props: { user_id?: number }): React.ReactElement {
    const params = useParams();
    const user_id =
        props.user_id ||
        ("user_id" in params ? parseInt(params.user_id as string) : data.get("user").id);
    const location = useLocation();
    const show_mod_log = parse(location.search)["show_mod_log"] === "1";

    const [user, setUser] = React.useState<rest_api.FullPlayerDetail["user"]>();
    const [editing, setEditing] = React.useState(/edit/.test(location.hash));
    const [selected_speed, setSelectedSpeed] = React.useState<RatingsSpeed>("overall");
    const [selected_size, setSelectedSize] = React.useState<RatingsSize>(0);
    const [resolved, setResolved] = React.useState(false);
    const [temporary_show_ratings, setTemporaryShowRatings] = React.useState(false);
    const [showDistributionChart, setShowDistributionChart] = React.useState(false);
    const [bot_ai, setBotAi] = React.useState("");
    const [bot_apikey, setBotApikey] = React.useState("");
    const [rating_chart_type_toggle_left, setRatingChartTypeToggleLeft] = React.useState<
        number | undefined
    >(undefined);
    const [show_ratings_in_rating_grid, setShowRatingsInRatingGrid] = React.useState(
        preferences.get("show-ratings-in-rating-grid"),
    );
    const [rating_graph_plot_by_games, setRatingGraphPlotByGames] = React.useState(
        preferences.get("rating-graph-plot-by-games"),
    );

    const [active_games, setActiveGames] =
        React.useState<rest_api.FullPlayerDetail["active_games"]>();
    const [ladders, setLadders] = React.useState<rest_api.FullPlayerDetail["ladders"]>();
    const [achievements, setAchievements] =
        React.useState<rest_api.FullPlayerDetail["achievements"]>();
    const [groups, setGroups] = React.useState<rest_api.FullPlayerDetail["groups"]>();
    const [online_leagues, setOnlineLeagues] =
        React.useState<rest_api.FullPlayerDetail["online_leagues"]>();
    const [tournaments, setTournaments] =
        React.useState<rest_api.FullPlayerDetail["tournaments"]>();
    const [titles, setTitles] = React.useState<rest_api.FullPlayerDetail["titles"]>();
    const [trophies, setTrophies] = React.useState<rest_api.FullPlayerDetail["trophies"]>();
    const [vs, setVs] = React.useState<rest_api.FullPlayerDetail["vs"]>();

    const resolve = (user_id: number) => {
        setUser(undefined);
        setEditing(/edit/.test(location.hash));

        if (user_id === undefined) {
            console.error("invalid user id: ", user_id);
            setUser(undefined);
            setResolved(true);
            return;
        }

        // Cheaper API calls provide partial profile data before players/{user_id}/full
        Promise.all([get(`players/${user_id}`), get(`/termination-api/player/${user_id}`)])
            .then((responses: [rest_api.PlayerDetail, rest_api.termination_api.Player]) => {
                if (resolved) {
                    return;
                }
                const user: rest_api.FullPlayerDetail["user"] = {
                    ...responses[0],
                    professional: responses[0].ui_class.indexOf("professional") >= 0,
                    is_moderator: responses[0].ui_class.indexOf("moderator") >= 0,
                    is_superuser: responses[0].ui_class.indexOf("admin") >= 0,
                    moderator_powers: 0,
                    is_tournament_moderator: false,
                    is_watched: false,
                    on_vacation: false,
                    vacation_left: 0,
                    deviation: responses[0].ratings.overall.deviation,
                    ranking: responses[1].ranking,
                    rating: responses[1].rating,
                    ratings: responses[1].ratings,
                    first_name: null,
                    last_name: null,
                    real_name_is_private: responses[0] === null,
                    ui_class_extra: null,
                };
                setUser(user);
            })
            .catch(console.log);

        get(`players/${user_id}/full`)
            .then((response: rest_api.FullPlayerDetail) => {
                setResolved(true);
                try {
                    player_cache.update(response.user);
                    setBotApikey(response.user.bot_apikey);
                    setBotAi(response.user.bot_ai);
                    setUser(response.user);
                    setActiveGames(response.active_games);
                    setAchievements(response.achievements);
                    setTitles(response.titles);
                    setTrophies(response.trophies);
                    setLadders(response.ladders);
                    setTournaments(response.tournaments);
                    setGroups(response.groups);
                    setOnlineLeagues(response.online_leagues);
                    setVs(response.vs);

                    window.document.title = response.user.username;
                } catch (err) {
                    console.error(err.stack);
                }
            })
            .catch((err) => {
                console.error(err);
                setUser(undefined);
                setResolved(true);
            });
    };

    const toggleRatings = () => {
        setTemporaryShowRatings(!temporary_show_ratings);
    };

    const saveAbout = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUser(Object.assign({}, user, { about: ev.target.value }));
    };

    const saveEditChanges = (profile_card_changes: AvatarCardEditableFields) => {
        setEditing(false);
        setUser(
            Object.assign({}, user, profile_card_changes, {
                name: `${profile_card_changes.first_name} ${profile_card_changes.last_name}`,
            }),
        );
        if (user) {
            put(`players/${user.id}`, {
                ...profile_card_changes,
                about: user.about,
            })
                .then(console.log)
                .catch(errorAlerter);
        }
    };

    const openModerateUser = () => {
        if (user) {
            const modal = openModerateUserModal(user);

            modal?.on("close", () => {
                // reload after moderator changes something
                resolve(user_id);
            });
        } else {
            console.error("user not set");
        }
    };

    const updateTogglePosition = (_height: number, width: number) => {
        setRatingChartTypeToggleLeft(width + 30);
    };

    const renderInvalidUser = () => {
        if (resolved) {
            return (
                <div className="User flex stretch">
                    <div className="container flex fill center-both">
                        <h3>{_("User not found")}</h3>
                    </div>
                </div>
            );
        }
        return (
            <div className="User flex stretch">
                <div className="container flex fill center-both"></div>
            </div>
        );
    };

    const renderRatingGrid = (show_ratings: boolean) => {
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
                                    {renderRatingOrRank(speed, size, show_ratings)}
                                </span>
                            ),
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderRatingOrRank = (speed: RatingsSpeed, size: RatingsSize, show_rating: boolean) => {
        if (!user) {
            return;
        }

        const r = getUserRating(user, speed, size);

        return (
            <div
                className={
                    `rating-entry ${speed}-${size}x${size} ` +
                    (r.unset ? "unset " : "") +
                    (speed === selected_speed && size === selected_size ? "active" : "")
                }
                onClick={() => {
                    setSelectedSize(size);
                    setSelectedSpeed(speed);
                }}
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
    };

    React.useEffect(() => {
        window.document.title = _("Player");
        resolve(user_id);

        return () => {
            setResolved(false);
        };
    }, [user_id]);

    /* Render */
    if (!user) {
        return renderInvalidUser();
    }
    const showRatings = temporary_show_ratings;

    const global_user = data.get("config.user");
    const cdn_release = data.get("config.cdn_release");
    const account_links = user.self_reported_account_linkages;

    const viewer = data.get("user");

    // The User's own Profile page is where they can choose their starting rank if they
    // skipped it before.
    const show_rank_chooser =
        viewer.id === user.id &&
        user?.need_rank &&
        user?.starting_rank_hint &&
        ["skip", "not provided"].includes(user.starting_rank_hint);

    const show_graph_type_toggle =
        // We don't show the toggle if they have turned it off in prefs, or if they have no ratings to show.
        // This implementation is using `user.need_rank` to infer whether we have any ratings to show,
        // ... done this way because it's handy, we don't have another easy way to find out right here
        // (that lookup is buried in the ratings chart component)
        !preferences.get("rating-graph-always-use") && !user?.need_rank;

    return (
        <div className="User container">
            <div>
                <div className="profile-card">
                    <div className="avatar-and-ratings-row">
                        <AvatarCard
                            user={user as any}
                            force_show_ratings={temporary_show_ratings}
                            editing={editing}
                            openModerateUser={openModerateUser}
                            onEdit={() => setEditing(true)}
                            onSave={saveEditChanges.bind(this)}
                        />

                        {(!preferences.get("hide-ranks") || temporary_show_ratings) &&
                            (!user.professional || global_user.id === user.id) &&
                            // prevent flash while starting_rank_hint is determined, handle case where
                            // if the back end for some reason doesn't send starting_rank_hint
                            (!!user.starting_rank_hint || resolved) && (
                                <div className="ratings-container">
                                    {show_rank_chooser ? (
                                        <Card>
                                            <NewUserRankChooser
                                                show_skip={false}
                                                onChosen={() => {
                                                    resolve(user_id);
                                                }}
                                            />
                                        </Card>
                                    ) : (
                                        <>
                                            {/* Ratings  */}
                                            <h3 className="ratings-title">
                                                {_("Ratings")}
                                                <Toggle
                                                    height={14}
                                                    width={30}
                                                    checked={show_ratings_in_rating_grid}
                                                    id="show-ratings-or-ranks"
                                                    onChange={(checked) => {
                                                        setShowRatingsInRatingGrid(checked);
                                                        preferences.set(
                                                            "show-ratings-in-rating-grid",
                                                            checked,
                                                        );
                                                    }}
                                                />
                                            </h3>
                                            {renderRatingGrid(show_ratings_in_rating_grid)}
                                            <button
                                                className="btn-group sm toggle-chart"
                                                onClick={() =>
                                                    setShowDistributionChart(!showDistributionChart)
                                                }
                                            >
                                                <i
                                                    className="speed-icon fa fa-bar-chart"
                                                    title={_("Global Distribution")}
                                                />
                                                {showDistributionChart
                                                    ? _(" Hide Global Distribution")
                                                    : _(" Compare to Global Distribution")}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            </div>
            <div className="ratings-row">
                {showDistributionChart && (
                    <div className="ratings-chart">
                        <RatingsChartDistribution
                            myRating={
                                viewer.id === user.id
                                    ? (getUserRating(user, "overall", 0).rating || 0) | 0
                                    : undefined
                            }
                            otherRating={
                                viewer.id === user.id
                                    ? undefined
                                    : (getUserRating(user, "overall", 0).rating || 0) | 0
                            }
                            otherPlayerName={viewer.id === user.id ? undefined : user.username}
                            showRatings={show_ratings_in_rating_grid ?? true}
                        />
                    </div>
                )}
            </div>
            {(!preferences.get("hide-ranks") || temporary_show_ratings) &&
                (!user.professional || global_user.id === user.id) && (
                    <div className="ratings-row">
                        <div className="ratings-chart">
                            {rating_graph_plot_by_games ? (
                                <RatingsChartByGame
                                    playerId={user.id}
                                    speed={selected_speed}
                                    size={selected_size}
                                    updateChartSize={updateTogglePosition}
                                />
                            ) : (
                                <RatingsChart
                                    playerId={user.id}
                                    speed={selected_speed}
                                    size={selected_size}
                                    updateChartSize={updateTogglePosition}
                                />
                            )}
                        </div>
                        {show_graph_type_toggle && (
                            <div
                                className="graph-type-toggle"
                                style={{
                                    left: rating_chart_type_toggle_left,
                                }}
                            >
                                <Toggle
                                    height={10}
                                    width={20}
                                    checked={rating_graph_plot_by_games}
                                    id="show-ratings-in-days"
                                    onChange={(checked) => {
                                        setRatingGraphPlotByGames(checked);
                                        preferences.set("rating-graph-plot-by-games", checked);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

            {preferences.get("hide-ranks") && (
                <button className="danger toggle-ratings" onClick={toggleRatings}>
                    {showRatings ? _("Hide ratings") : _("Show ratings")}
                </button>
            )}

            {(data.get("user")?.is_moderator || null) && (
                <ModTools user_id={user.id} show_mod_log={show_mod_log} />
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
                                        onChange={saveAbout}
                                        placeholder={_("About yourself")}
                                        value={user.about}
                                    />
                                )}
                            </div>
                        </Card>
                    )}

                    {active_games && (
                        <ActiveDroppedGameList
                            games={active_games}
                            user={user}
                        ></ActiveDroppedGameList>
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
                            {(!preferences.get("hide-ranks") || temporary_show_ratings) &&
                                (!user.professional || global_user.id === user.id) &&
                                account_links && (
                                    <Card>
                                        <SelfReportedAccountLinkages links={account_links} />
                                    </Card>
                                )}

                            {achievements != null && achievements.length > 0 && (
                                <Card>
                                    <h3>{_("Achievements")}</h3>
                                    <AchievementList list={achievements} />
                                </Card>
                            )}

                            {titles != null &&
                                trophies != null &&
                                (titles.length > 0 ||
                                    trophies.length > 0 ||
                                    user.id === 126739) && (
                                    <Card>
                                        <h3>{_("Trophies")}</h3>

                                        {titles.length > 0 && (
                                            <div className="trophies">
                                                {titles.map((title, idx) => (
                                                    <img
                                                        key={idx}
                                                        className="trophy"
                                                        src={`${cdn_release}/img/trophies/${title.icon}`}
                                                        title={title.title}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {trophies.length > 0 && (
                                            <div className="trophies">
                                                {trophies.map((trophy, idx) => (
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

                                        {(user.id === 126739 || null) && (
                                            <React.Fragment>
                                                <hr />
                                                <div className="Dolphin-trophy">
                                                    <img
                                                        src="https://cdn.online-go.com/achievements/dolphin.png"
                                                        width={300}
                                                        height={300}
                                                    />
                                                    <div>
                                                        <div>
                                                            1513 simultaneous correspondence games
                                                            <div>
                                                                {moment(
                                                                    "2021-11-21T00:00:00",
                                                                ).format("LL")}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            50,000 games played
                                                            <div>
                                                                {moment(
                                                                    "2023-03-25T00:00:00",
                                                                ).format("LL")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div></div>
                                                </div>
                                            </React.Fragment>
                                        )}
                                    </Card>
                                )}
                        </div>
                    )}

                    {vs != null && vs.wins + vs.losses + vs.draws > 0 && (
                        <div>
                            <VersusCard {...vs} username={user.username} />
                        </div>
                    )}

                    {user.is_bot &&
                        user.bot_owner &&
                        user.bot_owner.id === data.get("user")?.id && (
                            <BotControls
                                bot_ai={bot_ai ?? ""}
                                bot_apikey={bot_apikey ?? ""}
                                bot_id={user.id}
                                onBotAiChanged={(bot_ai) => setBotAi(bot_ai)}
                                onBotApiKeyChanged={(bot_apikey) => setBotApikey(bot_apikey)}
                            />
                        )}

                    <h2>{_("Activity")}</h2>
                    <ActivityCard
                        user={user}
                        ladders={ladders}
                        tournaments={tournaments}
                        groups={groups}
                        online_leagues={online_leagues}
                    />
                </div>
                {/* end right col  */}
            </div>
        </div>
    );
}

function SelfReportedAccountLinkages({
    links,
}: {
    links: rest_api.AccountLinks;
}): React.ReactElement {
    const associations = [1, 2, 3] as const;
    const userAssociations = [];
    for (const num of associations) {
        const country = links[`org${num}`];
        const id = links[`org${num}_id`];
        const rank = links[`org${num}_rank`];
        if (country && (id || (rank && rank > 0))) {
            userAssociations.push({
                num,
                country,
                id,
                rank,
            });
        }
    }

    const servers = [
        ["kgs", _("KGS")],
        ["igs", _("IGS / PandaNet")],
        ["dgs", _("DGS")],
        ["golem", _("Little Golem")],
        ["wbaduk", _("WBaduk")],
        ["tygem", _("Tygem")],
        ["fox", _("Fox")],
        ["yike", _("Yike Weiqi")],
        ["goquest", _("GoQuest")],
        ["badukpop", _("BadukPop")],
    ] as const;
    const userServers = [];

    for (const [server, name] of servers) {
        const id = links[`${server}_username`];
        const rank = links[`${server}_rank`];
        if (id || (rank && rank > 0)) {
            userServers.push({
                server,
                name,
                id,
                rank,
            });
        }
    }

    return (
        <div className="SelfReportedAccountLinkages">
            {userAssociations.length > 0 && <h3>{_("Associations")}</h3>}
            {userAssociations.map((props) => (
                <AssociationLink key={props.num} {...props} />
            ))}

            {userServers.length > 0 && <h3>{_("Servers")}</h3>}
            {userServers.map((props) => (
                <ServerLink key={props.server} {...props} />
            ))}
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
    rank?: number;
}): React.ReactElement | null {
    try {
        if (!country) {
            return null;
        }

        const association = associations.filter((a) => a.country === country)[0];
        let linker: ((id: string) => string) | undefined;

        if (country === "us") {
            linker = (id: string) => `https://agagd.usgo-archive.org/player/${id}/`;
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
    } catch {
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
    rank?: number;
}): React.ReactElement | null {
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
