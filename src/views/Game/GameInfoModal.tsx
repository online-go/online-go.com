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
import moment from "moment";
import * as data from "@/lib/data";
import { _ } from "@/lib/translate";
import { post, patch, del } from "@/lib/requests";
import { openModal, Modal, ModalConstructorInput } from "@/components/Modal";
import { timeControlDescription } from "@/components/TimeControl";
import { Player } from "@/components/Player";
import { handicapText } from "@/components/GameAcceptModal";
import { errorAlerter, rulesText, yesno, getGameResultText } from "@/lib/misc";
import { rankString } from "@/lib/rank_utils";
import { browserHistory } from "@/lib/ogsHistory";
import { alert } from "@/lib/swal_config";
import { GobanConfig, GobanEnginePlayerEntry, GobanEngineRules } from "goban";

interface Events {}

interface GameInfoModalProperties {
    config: GobanConfig;
    black: GobanEnginePlayerEntry;
    white: GobanEnginePlayerEntry;
    annulled: boolean;
    creatorId: number;
}

interface GameInfoModalState {
    komi: string;
}
export class GameInfoModal extends Modal<Events, GameInfoModalProperties, GameInfoModalState> {
    constructor(props: ModalConstructorInput<GameInfoModalProperties>) {
        super(props);
        this.state = {
            komi: props.config.komi?.toFixed(1) || "",
        };
    }

    save = () => {
        const config = this.props.config;
        const review_id = config.review_id;
        const game_id = config.game_id;

        if (game_id) {
            const settings = {
                moderation_note: "Update game name",
                name: config.game_name,
            };

            post(`games/${this.props.config.game_id}/moderate`, settings)
                .then(() => {
                    this.close();
                })
                .catch(errorAlerter);
        }

        if (review_id) {
            const settings: { [k: string]: any } = {
                name: config.game_name,
                outcome: config.outcome,
            };
            if (review_id) {
                settings["komi"] = config.komi;
                settings["rules"] = config.rules;
            }
            if (config.black_player_id === 0 || !config.players?.black?.id) {
                settings["black_player_name"] = config.players?.black.name;
                settings["black_player_rank"] = config.players?.black.rank;
                settings["black_player_pro"] = !!config.players?.black.pro;
            }
            if (config.white_player_id === 0 || !config.players?.white?.id) {
                settings["white_player_name"] = config.players?.white.name;
                settings["white_player_rank"] = config.players?.white.rank;
                settings["white_player_pro"] = !!config.players?.white.pro;
            }

            patch(`reviews/${review_id}`, settings)
                .then(() => {
                    this.close();
                })
                .catch(errorAlerter);
        }
    };

    deleteReview = () => {
        const review_id = this.props.config.review_id;

        if (review_id) {
            void alert
                .fire({
                    text: _("Are you sure you wish to delete this board?"),
                    showCancelButton: true,
                })
                .then(({ value: accept }) => {
                    if (accept) {
                        console.log("Should be deleting");

                        del(`reviews/${review_id}`)
                            .then(() => {
                                this.close();
                                console.log(browserHistory.back());
                            })
                            .catch(errorAlerter);
                    }
                });
        }
    };

    updateName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.props.config.game_name = ev.target.value;
        this.forceUpdate();
    };
    updateBlackName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (this.props.config.players) {
            this.props.config.players.black.name = ev.target.value;
        }
        this.forceUpdate();
    };
    updateBlackRank = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(ev.target.value);
        const rank = parseInt(ev.target.value);
        const pro = ev.target.value.indexOf(".1") > 0;
        console.log(rank, pro);
        if (this.props.config.players) {
            this.props.config.players.black.rank = rank;
            this.props.config.players.black.pro = pro;
        }
        this.props.black.rank = rank;
        this.props.black.pro = pro;
        this.forceUpdate();
    };
    updateWhiteName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (this.props.config.players) {
            this.props.config.players.white.name = ev.target.value;
        }
        this.forceUpdate();
    };
    updateWhiteRank = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(ev.target.value);
        const rank = parseInt(ev.target.value);
        const pro = ev.target.value.indexOf(".1") > 0;
        if (this.props.config.players) {
            this.props.config.players.white.rank = rank;
            this.props.config.players.white.pro = pro;
        }
        this.props.white.rank = rank;
        this.props.white.pro = pro;
        this.forceUpdate();
    };
    updateOutcome = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.props.config.outcome = ev.target.value;
        this.forceUpdate();
    };
    updateKomi = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ komi: ev.target.value });
        this.props.config.komi = parseFloat(ev.target.value);
        //this.forceUpdate();
    };
    updateRules = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.config.rules = ev.target.value as GobanEngineRules;
        this.forceUpdate();
    };
    twoPlayerTeamList = () => (
        <h3>
            <Player disableCacheUpdate icon rank user={this.props.black} />
            {_("vs.")}
            <Player disableCacheUpdate icon rank user={this.props.white} />
        </h3>
    );

    rengoTeamList = () => (
        <div className="rengo-teams-container">
            {/* this space intentionally left blank: it doesn't work out to try to show rengo teams in this small modal */}
        </div>
    );

    render() {
        const config = this.props.config;
        const user = data.get("user");
        const review_id = config.review_id;
        const editable =
            (review_id && this.props.creatorId === user.id) || user.is_moderator || null;

        const time_control_description = timeControlDescription(config.time_control);

        const ranks: { value: string; label: string }[] = [];
        for (let i = 0; i < 39; ++i) {
            ranks.push({ value: i + ".0", label: rankString({ ranking: i, professional: false }) });
        }
        for (let i = 37; i < 46; ++i) {
            ranks.push({ value: i + ".1", label: rankString({ ranking: i, professional: true }) });
        }

        const black_editable =
            editable && (config.black_player_id === 0 || !config.players?.black?.id);
        const white_editable =
            editable && (config.white_player_id === 0 || !config.players?.white?.id);

        return (
            <div className="Modal GameInfoModal">
                <div className="header">
                    {(config.rengo || null) && (
                        <div className="rengo-header">
                            {config.rengo_casual_mode ? _("Casual Rengo!") : _("Strict Rengo!")}
                        </div>
                    )}

                    <h2>{config.game_name}</h2>
                    {this.props.config.rengo ? this.rengoTeamList() : this.twoPlayerTeamList()}
                </div>
                <div className="body">
                    <dl className="horizontal">
                        <dt>{_("Game")}</dt>
                        <dd>
                            {editable ? (
                                <input value={config.game_name} onChange={this.updateName} />
                            ) : (
                                <span>{config.game_name}</span>
                            )}
                        </dd>
                        {this.props.creatorId && <dt>{_("Creator")}</dt>}
                        {this.props.creatorId && (
                            <dd>
                                <Player icon rank user={this.props.creatorId} />
                            </dd>
                        )}
                        {(config.rengo || null) && (
                            <>
                                <dt>{_("Participants")}</dt>
                                <dd>
                                    {config.rengo_teams!.black.length +
                                        config.rengo_teams!.white.length}
                                </dd>
                            </>
                        )}
                        {!this.props.config.rengo && (
                            <React.Fragment>
                                <dt>{_("Black")}</dt>
                                <dd>
                                    {black_editable ? (
                                        <span>
                                            <input
                                                value={config.players!.black.name}
                                                onChange={this.updateBlackName}
                                            />
                                            <select
                                                value={
                                                    config.players!.black.rank +
                                                    "." +
                                                    (config.players!.black.pro ? 1 : 0)
                                                }
                                                onChange={this.updateBlackRank}
                                            >
                                                {ranks.map((rank) => (
                                                    <option key={rank.value} value={rank.value}>
                                                        {rank.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </span>
                                    ) : (
                                        <Player
                                            disableCacheUpdate
                                            icon
                                            rank
                                            user={this.props.black}
                                        />
                                    )}
                                </dd>
                                <dt>{_("White")}</dt>
                                <dd>
                                    {white_editable ? (
                                        <span>
                                            <input
                                                value={config.players!.white.name}
                                                onChange={this.updateWhiteName}
                                            />
                                            <select
                                                value={
                                                    config.players!.white.rank +
                                                    "." +
                                                    (config.players!.white.pro ? 1 : 0)
                                                }
                                                onChange={this.updateWhiteRank}
                                            >
                                                {ranks.map((rank) => (
                                                    <option key={rank.value} value={rank.value}>
                                                        {rank.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </span>
                                    ) : (
                                        <Player
                                            disableCacheUpdate
                                            icon
                                            rank
                                            user={this.props.white}
                                        />
                                    )}
                                </dd>
                            </React.Fragment>
                        )}
                        <dt>{_("Time")}</dt>
                        <dd>
                            {config.start_time
                                ? moment(new Date(config.start_time * 1000)).format("LLL")
                                : ""}
                            {config.end_time
                                ? " - " + moment(new Date(config.end_time * 1000)).format("LLL")
                                : ""}
                        </dd>
                        <dt>{_("Rules")}</dt>
                        <dd>
                            {editable && review_id ? (
                                <select value={config.rules} onChange={this.updateRules}>
                                    {["aga", "chinese", "ing", "japanese", "korean", "nz"].map(
                                        (rules) => (
                                            <option key={rules} value={rules}>
                                                {rulesText(rules)}
                                            </option>
                                        ),
                                    )}
                                </select>
                            ) : (
                                <span>{rulesText(config.rules ?? "<error>")}</span>
                            )}
                        </dd>
                        <dt>{_("Ranked")}</dt>
                        <dd>{yesno(config.ranked)}</dd>
                        <dt>{_("Annulled")}</dt>
                        <dd>{yesno(this.props.annulled)}</dd>
                        <dt>{_("Board Size")}</dt>
                        <dd>
                            {config.width}x{config.height}
                        </dd>
                        <dt>{_("Handicap")}</dt>
                        <dd>
                            {handicapText(config.handicap ?? -1)}
                            {(config.handicap_rank_difference || null) &&
                                config.handicap_rank_difference !== config.handicap && (
                                    <span>
                                        {" "}
                                        (
                                        {_("Rank") + ": " + String(config.handicap_rank_difference)}
                                        )
                                    </span>
                                )}
                        </dd>
                        <dt>{_("Result")}</dt>
                        <dd>
                            {editable && config.review_id && !config.game_id ? (
                                <input value={config.outcome} onChange={this.updateOutcome} />
                            ) : (
                                <span>
                                    {getGameResultText(
                                        config.outcome as string,
                                        config.winner !== config.white_player_id,
                                        config.winner !== config.black_player_id,
                                    )}
                                </span>
                            )}
                        </dd>
                        <dt>{_("Komi")}</dt>
                        <dd>
                            {editable && review_id ? (
                                <input value={this.state.komi} onChange={this.updateKomi} />
                            ) : (
                                <span>{config.komi!.toFixed(1)}</span>
                            )}
                        </dd>
                        <dt>{_("Analysis")}</dt>
                        <dd>
                            {config.original_disable_analysis
                                ? _("Analysis and conditional moves disabled")
                                : _("Analysis and conditional moves enabled")}
                        </dd>
                        <dt>{_("Time Control")}</dt>
                        <dd>{time_control_description}</dd>
                    </dl>
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                    {editable && (
                        <span>
                            {(this.props.config.review_id || null) && (
                                <button className="danger" onClick={this.deleteReview}>
                                    {_("Delete")}
                                </button>
                            )}
                            <button onClick={this.save}>{_("Save")}</button>
                        </span>
                    )}
                </div>
            </div>
        );
    }
}

export function openGameInfoModal(
    config: GobanConfig,
    black: GobanEnginePlayerEntry,
    white: GobanEnginePlayerEntry,
    annulled: boolean,
    creator_id: number,
): void {
    openModal(
        <GameInfoModal
            config={config}
            black={black}
            white={white}
            annulled={annulled}
            creatorId={creator_id}
            fastDismiss
        />,
    );
}
