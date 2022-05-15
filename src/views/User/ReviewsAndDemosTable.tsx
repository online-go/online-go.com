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
import { PlayerAutocomplete } from "PlayerAutocomplete";
import { PaginatedTable } from "PaginatedTable";
import { _ } from "translate";
import { Card } from "material";
import { Link } from "react-router-dom";
import { openUrlIfALinkWasNotClicked } from "./common";
import * as moment from "moment";
import { Player } from "Player";

interface ReviewsAndDemosProps {
    user_id: number;
}

export function ReviewsAndDemosTable(props: ReviewsAndDemosProps): JSX.Element {
    const [alt_player, setAltPlayer] = React.useState<number>(null);

    const review_history_groomer = (results) => {
        const ret = [];

        for (let i = 0; i < results.length; ++i) {
            const r = results[i];
            const item: any = {
                id: r.id,
            };

            item.width = r.width;
            item.height = r.height;
            item.date = r.created ? new Date(r.created) : null;
            item.black = r.players.black;
            item.black_won = !r.black_lost && r.white_lost;
            item.black_class = item.black_won
                ? item.black.id === props.user_id
                    ? "library-won"
                    : "library-lost"
                : "";
            item.white = r.players.white;
            item.white_won = !r.white_lost && r.black_lost;
            item.white_class = item.white_won
                ? item.white.id === props.user_id
                    ? "library-won"
                    : "library-lost"
                : "";
            item.name = r.name;
            item.href = "/review/" + item.id;
            item.historical = r.game.historical_ratings || {
                black: item.black,
                white: item.white,
            };

            if (!item.name || item.name.trim() === "") {
                item.name = item.href;
            }

            ret.push(item);
        }
        return ret;
    };

    return (
        <div className="col-sm-12">
            <h2>{_("Reviews and Demos")}</h2>
            <Card>
                <div>
                    {/* loading-container="game_history.settings().$loading" */}
                    <div className="search">
                        <i className="fa fa-search"></i>
                        <PlayerAutocomplete
                            onComplete={(player) => {
                                // happily, and importantly, if there isn't a player, then we get null
                                setAltPlayer(player?.id);
                            }}
                        />
                    </div>

                    <PaginatedTable
                        className="review-history-table"
                        name="review-history"
                        method="GET"
                        source={`reviews/`}
                        filter={{
                            owner_id: props.user_id,
                            ...(alt_player !== null && {
                                alt_player: alt_player,
                            }),
                        }}
                        orderBy={["-created"]}
                        groom={review_history_groomer}
                        pageSizeOptions={[10, 15, 25, 50]}
                        onRowClick={(ref, ev) => openUrlIfALinkWasNotClicked(ev, ref.href)}
                        columns={[
                            {
                                header: _("Date"),
                                className: () => "date",
                                render: (X) => moment(X.date).format("YYYY-MM-DD"),
                            },
                            {
                                header: _("Name"),
                                className: () => "game_name",
                                render: (X) => <Link to={X.href}>{X.name}</Link>,
                            },
                            {
                                header: _("Black"),
                                className: (X) => "player " + (X ? X.black_class : ""),
                                render: (X) => (
                                    <Player user={X.historical.black} disableCacheUpdate />
                                ),
                            },
                            {
                                header: _("White"),
                                className: (X) => "player " + (X ? X.white_class : ""),
                                render: (X) => (
                                    <Player user={X.historical.white} disableCacheUpdate />
                                ),
                            },
                        ]}
                    />
                </div>
            </Card>
        </div>
    );
}
