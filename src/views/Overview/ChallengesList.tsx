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
import { _ } from "translate";
import { Card } from "material";
import { del, post, get } from "requests";
import { browserHistory } from "ogsHistory";
import * as data from "data";
import { UIPush } from "UIPush";
import { Player } from "Player";
import { PlayerIcon } from "PlayerIcon";
import * as player_cache from "player_cache";
import { profanity_filter } from "profanity_filter";
import { challenge_text_description } from "ChallengeModal";
import { FabX, FabCheck } from "material";
import { ignore } from "misc";
import cached from "cached";

export class ChallengesList extends React.PureComponent<
    { onAccept: () => void },
    any
> {
    constructor(props) {
        super(props);
        this.state = {
            challenges: [],
        };
    }

    componentDidMount() {
        data.watch(cached.challenge_list, this.update);
    }
    componentWillUnmount() {
        data.unwatch(cached.challenge_list, this.update);
    }
    update = (challenge_list) => {
        this.setState({ challenges: challenge_list });
    };

    deleteChallenge(challenge) {
        del("me/challenges/%%", challenge.id).then(ignore).catch(ignore);
        this.setState({
            challenges: this.state.challenges.filter(
                (c) => c.id !== challenge.id,
            ),
        });
    }
    acceptChallenge(challenge) {
        post("me/challenges/%%/accept", challenge.id, {})
            .then((res) => {
                if (res.time_per_move > 0 && res.time_per_move < 1800) {
                    browserHistory.push(`/game/${res.game}`);
                } else {
                    if (this.props.onAccept) {
                        this.props.onAccept();
                    }
                }
            })
            .catch(ignore);
        this.setState({
            challenges: this.state.challenges.filter(
                (c) => c.id !== challenge.id,
            ),
        });
    }

    render() {
        const user = data.get("user");

        return (
            <div className="ChallengesList">
                {this.state.challenges.length > 0 && <h2>{_("Challenges")}</h2>}
                <div className="challenge-cards">
                    {this.state.challenges.map((challenge) => {
                        const opponent =
                            challenge.challenger.id === user.id
                                ? challenge.challenged
                                : challenge.challenger;

                        return (
                            <Card key={challenge.id}>
                                <div className="icon-name">
                                    <PlayerIcon id={opponent.id} size={64} />
                                    <div className="name">
                                        {challenge.challenged.id ===
                                            user.id && (
                                            <FabCheck
                                                onClick={this.acceptChallenge.bind(
                                                    this,
                                                    challenge,
                                                )}
                                            />
                                        )}
                                        <FabX
                                            onClick={this.deleteChallenge.bind(
                                                this,
                                                challenge,
                                            )}
                                        />
                                        <h4>
                                            {profanity_filter(
                                                challenge.game.name,
                                            )}
                                        </h4>
                                        <Player user={opponent} />
                                    </div>
                                </div>
                                <div>
                                    {challenge_text_description(challenge)}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }
}
