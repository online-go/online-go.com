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
import { challenge_text_description, ChallengeDetails } from "@/components/ChallengeModal";
import { FabX, FabCheck } from "@/components/material";
import { ignore } from "@/lib/misc";
import cached from "@/lib/cached";
import "./ChallengesList.css";

interface ChallengeListProps {
    onAccept: () => void;
}

// Shape of items from the /me/challenges endpoint after processing in cached.ts
interface Challenge {
    id: number;
    challenger: rest_api.MinimalPlayerDTO;
    challenged: rest_api.MinimalPlayerDTO;
    game: rest_api.GameDTO;
}

export function ChallengesList({ onAccept }: ChallengeListProps): React.ReactElement {
    const [challenges, setChallenges] = React.useState<Challenge[]>([]);

    React.useEffect(() => {
        const update = (list: Challenge[]) => {
            setChallenges(list);
        };

        data.watch(cached.challenge_list, update);

        return () => {
            data.unwatch(cached.challenge_list, update);
        };
    }, []);

    const deleteChallenge = (challenge: Challenge) => {
        del(`me/challenges/${challenge.id}`).then(ignore).catch(ignore);
        setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
    };

    const acceptChallenge = (challenge: Challenge) => {
        post(`me/challenges/${challenge.id}/accept`, {})
            .then((res) => {
                if (res.time_per_move > 0 && res.time_per_move < 1800) {
                    browserHistory.push(`/game/${res.game}`);
                } else {
                    onAccept();
                }
            })
            .catch(ignore);
        setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
    };

    const user = data.get("user");

    return (
        <div className="ChallengesList">
            {challenges.length > 0 && <h2>{_("Challenges")}</h2>}
            <div className="challenge-cards">
                {challenges.map((challenge) => {
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
                                        <FabCheck onClick={() => acceptChallenge(challenge)} />
                                    )}

                                    <h4 title={profanity_filter(challenge.game.name)}>
                                        "{profanity_filter(challenge.game.name)}"
                                    </h4>
                                    <Player user={opponent} />
                                </div>
                                <FabX onClick={() => deleteChallenge(challenge)} />
                            </div>
                            <div>
                                {challenge_text_description(
                                    challenge as unknown as ChallengeDetails,
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
