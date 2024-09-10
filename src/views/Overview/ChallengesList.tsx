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
import { _ } from "@/lib/translate";
import { Card } from "@/components/material";
import { del, post } from "@/lib/requests";
import { browserHistory } from "@/lib/ogsHistory";
import * as data from "@/lib/data";
import { Player } from "@/components/Player";
import { PlayerIcon } from "@/components/PlayerIcon";
import { profanity_filter } from "@/lib/profanity_filter";
import { challenge_text_description } from "@/components/ChallengeModal";
import { FabX, FabCheck } from "@/components/material";
import { ignore } from "@/lib/misc";
import cached from "@/lib/cached";

interface ChallengeListProps {
    onAccept: () => void;
}

interface ChallengeListState {
    challenges: any[];
}

export class ChallengesList extends React.PureComponent<ChallengeListProps, ChallengeListState> {
    constructor(props: ChallengeListProps) {
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
    update = (challenge_list: ChallengeListState["challenges"]) => {
        this.setState({ challenges: challenge_list });
    };

    deleteChallenge(challenge: ChallengeListState["challenges"][0]) {
        del(`me/challenges/${challenge.id}`).then(ignore).catch(ignore);
        this.setState({ challenges: this.state.challenges.filter((c) => c.id !== challenge.id) });
    }
    acceptChallenge(challenge: ChallengeListState["challenges"][0]) {
        post(`me/challenges/${challenge.id}/accept`, {})
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
        this.setState({ challenges: this.state.challenges.filter((c) => c.id !== challenge.id) });
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
                                        {challenge.challenged.id === user.id && (
                                            <FabCheck
                                                onClick={this.acceptChallenge.bind(this, challenge)}
                                            />
                                        )}

                                        <h4 title={profanity_filter(challenge.game.name)}>
                                            "{profanity_filter(challenge.game.name)}"
                                        </h4>
                                        <Player user={opponent} />
                                    </div>
                                    <FabX onClick={this.deleteChallenge.bind(this, challenge)} />
                                </div>
                                <div>{challenge_text_description(challenge)}</div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }
}
