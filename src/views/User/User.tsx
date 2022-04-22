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
import { useLocation, useParams } from "react-router-dom";
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
import { VersusCard } from "./VersusCard";
import { AvatarCard, AvatarCardEditableFields } from "./AvatarCard";
import { ActivityCard } from "./ActivityCard";

type RatingsSpeed = "overall" | "blitz" | "live" | "correspondence";
type RatingsSize = 0 | 9 | 13 | 19;

export function User(props: { user_id?: number }): JSX.Element {
    const params = useParams();
    const user_id =
        props.user_id || ("user_id" in params ? parseInt(params.user_id) : data.get("user").id);
    const location = useLocation();
    const show_mod_log = parse(location.search)["show_mod_log"] === "1";

    const [user, setUser] = React.useState<rest_api.FullPlayerDetail["user"]>();
    const [editing, setEditing] = React.useState(/edit/.test(location.hash));
    const [selected_speed, setSelectedSpeed] = React.useState<RatingsSpeed>("overall");
    const [selected_size, setSelectedSize] = React.useState<RatingsSize>(0);
    const [resolved, setResolved] = React.useState(false);
    const [temporary_show_ratings, setTemporaryShowRatings] = React.useState(false);
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
    const [tournaments, setTournaments] =
        React.useState<rest_api.FullPlayerDetail["tournaments"]>();
    const [titles, setTitles] = React.useState<rest_api.FullPlayerDetail["titles"]>();
    const [trophies, setTrophies] = React.useState<rest_api.FullPlayerDetail["trophies"]>();
    const [vs, setVs] = React.useState<rest_api.FullPlayerDetail["vs"]>();

    const show_graph_type_toggle = !preferences.get("rating-graph-always-use");

    const resolve = (user_id: number) => {
        setUser(undefined);
        setEditing(/edit/.test(location.hash));

        if (user_id === undefined) {
            console.error("invalid user id: ", user_id);
            setUser(undefined);
            setResolved(true);
            return;
        }

        // Cheaper API calls provide partial profile data before players/%%/full
        Promise.all([get("players/%%", user_id), get("/termination-api/player/%%", user_id)])
            .then((responses: [rest_api.PlayerDetail, rest_api.termination_api.Player]) => {
                if (resolved) {
                    return;
                }
                const user: rest_api.FullPlayerDetail["user"] = {
                    ...responses[0],
                    professional: responses[0].ui_class.indexOf("professional") >= 0,
                    is_moderator: responses[0].ui_class.indexOf("moderator") >= 0,
                    is_superuser: responses[0].ui_class.indexOf("admin") >= 0,
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

        get("players/%%/full", user_id)
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
            put("players/%%", user.id, {
                ...profile_card_changes,
                about: user.about,
            })
                .then(console.log)
                .catch(errorAlerter);
        }
    };

    const openModerateUser = () => {
        const modal = openModerateUserModal(user);
        modal.on("close", () => {
            // reload after moderator changes something
            resolve((user_id && parseInt(user_id)) || data.get("user")?.id);
        });
    };

    const updateTogglePosition = (_height: number, width: number) => {
        setRatingChartTypeToggleLeft(width + 30);
    };

    const renderInvalidUser = () => {
        if (resolved) {
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
        resolve((user_id && parseInt(user_id)) || data.get("user")?.id);

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

    return (
        <div className="User container">
            <div>
                <div className="profile-card">
                    <div className="avatar-and-ratings-row">
                        <AvatarCard
                            user={user}
                            force_show_ratings={temporary_show_ratings}
                            editing={editing}
                            openModerateUser={openModerateUser}
                            onEdit={() => setEditing(true)}
                            onSave={saveEditChanges.bind(this)}
                        />

                        {(!preferences.get("hide-ranks") || temporary_show_ratings) &&
                            (!user.professional || global_user.id === user.id) && (
                                <div className="ratings-container">
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
                                </div>
                            )}
                    </div>
                </div>
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

                    {active_games && active_games.length > 0 && (
                        <>
                            <h2>
                                {_("Active Games")} ({active_games.length})
                            </h2>
                            <GameList list={active_games} player={user} />
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
                                (titles.length > 0 || trophies.length > 0) && (
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
                    />
                </div>
                {/* end right col  */}
            </div>
        </div>
    );
}

function SelfReportedAccountLinkages({ links }: { links: rest_api.AccountLinks }): JSX.Element {
    const has_association = links.org1 || links.org2 || links.org3;
    let has_other_server = false;
    for (const key in links) {
        if (
            key !== "hidden" &&
            key !== "hidden_ids" &&
            key !== "last_updated" &&
            !(key.indexOf("org") === 0) &&
            links[key as keyof rest_api.AccountLinks]
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
