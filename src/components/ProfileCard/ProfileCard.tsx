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
import { Link } from "react-router-dom";
import { getUserRating, is_novice, is_provisional, humble_rating } from "rank_utils";
import { Player } from "Player";
import { PlayerIcon } from "PlayerIcon";
import * as preferences from "preferences";

interface ProfileCardInterface {
    user: any;
}

export class ProfileCard extends React.Component<ProfileCardInterface> {
    constructor(props) {
        super(props);
        // TODO: Remove this
        this.state = {};
    }

    render() {
        const user = this.props.user;
        const rating =
            !preferences.get("hide-ranks") && user ? getUserRating(user, "overall", 0) : null;

        return (
            <div className="ProfileCard">
                <PlayerIcon id={user.id} size={80} />

                <div className="profile-right">
                    <div style={{ fontSize: "1.2em" }}>
                        <Player user={user} nodetails rank={false} />
                    </div>
                    {rating && rating.professional && (
                        <div>
                            <span className="rank">{rating.rank_label}</span>
                        </div>
                    )}
                    {rating && !rating.professional && (
                        <div>
                            <span className="rating">
                                {Math.round(humble_rating(rating.rating, rating.deviation))}{" "}
                                &plusmn; {Math.round(rating.deviation)}
                            </span>
                        </div>
                    )}
                    {rating && !rating.professional && !is_novice(user) && !is_provisional(user) && (
                        <div>
                            <span className="rank">
                                {rating.partial_bounded_rank_label} &plusmn;{" "}
                                {rating.rank_deviation.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
