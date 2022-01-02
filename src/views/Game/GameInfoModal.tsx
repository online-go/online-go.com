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
import * as moment from "moment";
import * as data from "data";
import { _ } from "translate";
import { post, patch, del } from "requests";
import { openModal, Modal, ModalConstructorInput } from "Modal";
import { timeControlDescription } from "TimeControl";
import { Player } from "Player";
import { handicapText } from "GameAcceptModal";
import { errorAlerter, ignore, rulesText, yesno } from "misc";
import { rankString } from "rank_utils";
import { browserHistory } from "ogsHistory";
import swal from "sweetalert2";
import { GobanConfig, GoEnginePlayerEntry } from "goban";

interface Events {}

interface GameInfoModalProperties {
    config: GobanConfig;
    black: GoEnginePlayerEntry;
    white: GoEnginePlayerEntry;
    annulled: boolean;
    creatorId: number;
}
export class GameInfoModal extends Modal<Events, GameInfoModalProperties, {}> {
    constructor(props: ModalConstructorInput<GameInfoModalProperties>) {
        super(props);
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
            const settings = {
                name: config.game_name,
                outcome: config.outcome,
            };
            if (config.black_player_id === 0 || !config.players?.black?.id) {
                settings["black_player_name"] = config.players.black.name;
                settings["black_player_rank"] = config.players.black.rank;
                settings["black_player_pro"] = !!config.players.black.pro;
            }
            if (config.white_player_id === 0 || !config.players?.white?.id) {
                settings["white_player_name"] = config.players.white.name;
                settings["white_player_rank"] = config.players.white.rank;
                settings["white_player_pro"] = !!config.players.white.pro;
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
            swal({
                text: _("Are you sure you wish to delete this board?"),
                showCancelButton: true,
            })
                .then(() => {
                    console.log("Should be deleting");

                    del(`reviews/${review_id}`)
                        .then(() => {
                            this.close();
                            console.log(browserHistory.goBack());
                        })
                        .catch(errorAlerter);
                })
                .catch(ignore);
        }
    };

    updateName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.props.config.game_name = ev.target.value;
        this.forceUpdate();
    };
    updateBlackName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.props.config.players.black.name = ev.target.value;
        this.forceUpdate();
    };
    updateBlackRank = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(ev.target.value);
        const rank = parseInt(ev.target.value);
        const pro = ev.target.value.indexOf(".1") > 0;
        console.log(rank, pro);
        this.props.config.players.black.rank = rank;
        this.props.config.players.black.pro = pro;
        this.props.black.rank = rank;
        this.props.black.pro = pro;
        this.forceUpdate();
    };
    updateWhiteName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.props.config.players.white.name = ev.target.value;
        this.forceUpdate();
    };
    updateWhiteRank = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(ev.target.value);
        const rank = parseInt(ev.target.value);
        const pro = ev.target.value.indexOf(".1") > 0;
        this.props.config.players.white.rank = rank;
        this.props.config.players.white.pro = pro;
        this.props.white.rank = rank;
        this.props.white.pro = pro;
        this.forceUpdate();
    };
    updateOutcome = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.props.config.outcome = ev.target.value;
        this.forceUpdate();
    };

    render() {
        const config = this.props.config;
        const user = data.get("user");
        const review_id = config.review_id;
        const editable =
            (review_id && this.props.creatorId === user.id) ||
            user.is_moderator ||
            null;

        const time_control_description = timeControlDescription(
            config.time_control,
        );

        const ranks = [];
        for (let i = 0; i < 39; ++i) {
            ranks.push({
                value: i + ".0",
                label: rankString({ ranking: i, professional: false }),
            });
        }
        for (let i = 37; i < 46; ++i) {
            ranks.push({
                value: i + ".1",
                label: rankString({ ranking: i, professional: true }),
            });
        }

        const black_editable =
            editable &&
            (config.black_player_id === 0 || !config.players?.black?.id);
        const white_editable =
            editable &&
            (config.white_player_id === 0 || !config.players?.white?.id);

        return (
            <div className="Modal GameInfoModal" ref="modal">
                <div className="header">
                    <div>
                        <h2>{config.game_name}</h2>
                        <h3>
                            <Player
                                disableCacheUpdate
                                icon
                                rank
                                user={this.props.black}
                            />{" "}
                            {_("vs.")}{" "}
                            <Player
                                disableCacheUpdate
                                icon
                                rank
                                user={this.props.white}
                            />
                        </h3>
                    </div>
                </div>
                <div className="body">
                    <dl className="horizontal">
                        <dt>{_("Game")}</dt>
                        <dd>
                            {editable ? (
                                <input
                                    value={config.game_name}
                                    onChange={this.updateName}
                                />
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
                        <dt>{_("Black")}</dt>
                        <dd>
                            {black_editable ? (
                                <span>
                                    <input
                                        value={config.players.black.name}
                                        onChange={this.updateBlackName}
                                    />
                                    <select
                                        value={
                                            config.players.black.rank +
                                            "." +
                                            (config.players.black.pro ? 1 : 0)
                                        }
                                        onChange={this.updateBlackRank}
                                    >
                                        {ranks.map((rank, idx) => (
                                            <option
                                                key={rank.value}
                                                value={rank.value}
                                            >
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
                                        value={config.players.white.name}
                                        onChange={this.updateWhiteName}
                                    />
                                    <select
                                        value={
                                            config.players.white.rank +
                                            "." +
                                            (config.players.white.pro ? 1 : 0)
                                        }
                                        onChange={this.updateWhiteRank}
                                    >
                                        {ranks.map((rank, idx) => (
                                            <option
                                                key={rank.value}
                                                value={rank.value}
                                            >
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
                        <dt>{_("Time")}</dt>
                        <dd>
                            {config.start_time
                                ? moment(
                                      new Date(config.start_time * 1000),
                                  ).format("LLL")
                                : ""}
                            {config.end_time
                                ? " - " +
                                  moment(
                                      new Date(config.end_time * 1000),
                                  ).format("LLL")
                                : ""}
                        </dd>
                        <dt>{_("Rules")}</dt>
                        <dd>{rulesText(config.rules)}</dd>
                        <dt>{_("Ranked")}</dt>
                        <dd>{yesno(config.ranked)}</dd>
                        <dt>{_("Annulled")}</dt>
                        <dd>{yesno(this.props.annulled)}</dd>
                        <dt>{_("Board Size")}</dt>
                        <dd>
                            {config.width}x{config.height}
                        </dd>
                        <dt>{_("Handicap")}</dt>
                        <dd>{handicapText(config.handicap)}</dd>
                        <dt>{_("Result")}</dt>
                        <dd>
                            {editable && config.review_id && !config.game_id ? (
                                <input
                                    value={config.outcome}
                                    onChange={this.updateOutcome}
                                />
                            ) : (
                                <span>{config.outcome}</span>
                            )}
                        </dd>
                        <dt>{_("Komi")}</dt>
                        <dd>{config.komi.toFixed(1)}</dd>
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
                                <button
                                    className="danger"
                                    onClick={this.deleteReview}
                                >
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
    black: GoEnginePlayerEntry,
    white: GoEnginePlayerEntry,
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
