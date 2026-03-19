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
import { del, post } from "@/lib/requests";
import { browserHistory } from "@/lib/ogsHistory";
import * as data from "@/lib/data";
import { profanity_filter } from "@/lib/profanity_filter";
import { ignore } from "@/lib/misc";
import { _, interpolate, pgettext } from "@/lib/translate";
import cached from "@/lib/cached";
import "./ChallengesList.css";
import { getEm10Width } from "@/lib/device";
import { ColorIndicator } from "./ColorIndicator";
import { GameCard } from "./GameCard";

interface ChallengeListProps {
    onAccept: () => void;
}

// Shape of items from the /me/challenges endpoint after processing in cached.ts
interface Challenge {
    id: number;
    challenger: rest_api.MinimalPlayerDTO;
    challenged: rest_api.MinimalPlayerDTO;
    challenger_color: rest_api.ColorSelectionOptions;
    game: rest_api.GameDTO;
}

export function ChallengesList({ onAccept }: ChallengeListProps): React.ReactElement {
    const [challenges, setChallenges] = React.useState<Challenge[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        const update = (list: Challenge[]) => {
            const user_id = data.get("user").id;
            const sorted = [...list].sort((a, b) => {
                const a_received = a.challenged.id === user_id ? 0 : 1;
                const b_received = b.challenged.id === user_id ? 0 : 1;
                return a_received - b_received || a.id - b.id;
            });
            setChallenges(sorted);
        };

        data.watch(cached.challenge_list, update);

        return () => {
            data.unwatch(cached.challenge_list, update);
        };
    }, []);

    React.useEffect(() => {
        if (currentIndex >= challenges.length) {
            setCurrentIndex(Math.max(0, challenges.length - 1));
        }
    }, [challenges.length, currentIndex]);

    const next = () => {
        setCurrentIndex((i) => (i < challenges.length - 1 ? i + 1 : 0));
    };

    const deleteChallenge = (challenge: Challenge) => {
        setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
        del(`me/challenges/${challenge.id}`)
            .then(ignore)
            .catch(() => {
                setChallenges((prev) => [...prev, challenge]);
            });
    };

    const acceptChallenge = (challenge: Challenge) => {
        setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
        post(`me/challenges/${challenge.id}/accept`, {})
            .then((res) => {
                if (res.time_per_move > 0 && res.time_per_move < 1800) {
                    browserHistory.push(`/game/${res.game}`);
                } else {
                    onAccept();
                }
            })
            .catch(() => {
                setChallenges((prev) => [...prev, challenge]);
            });
    };

    const user = data.get("user");

    if (challenges.length === 0) {
        return <div className="ChallengesList" />;
    }

    const challenge = challenges[currentIndex];
    if (!challenge) {
        return <div className="ChallengesList" />;
    }

    const tc = challenge.game.time_control;
    const timeControl = tc && tc.system !== "none" ? tc : undefined;

    const weAreChallenger = challenge.challenger.id === user.id;
    const opponent = weAreChallenger ? challenge.challenged : challenge.challenger;

    const colorIsAssigned =
        challenge.challenger_color === "black" || challenge.challenger_color === "white";
    const ourColor = colorIsAssigned
        ? weAreChallenger
            ? (challenge.challenger_color as "black" | "white")
            : challenge.challenger_color === "black"
              ? "white"
              : "black"
        : "auto";
    const opponentColor = ourColor === "auto" ? "auto" : ourColor === "black" ? "white" : "black";

    return (
        <div className="ChallengesList">
            <GameCard
                cardTitle={
                    <>
                        <span>{_("Game Challenge")}</span>
                        {challenges.length > 1 && (
                            <span className="challenge-counter" onClick={next}>
                                {currentIndex + 1}/{challenges.length}{" "}
                                <i className="fa fa-chevron-right" />
                            </span>
                        )}
                        <div style={{ fontWeight: "normal", fontSize: "0.9em" }}>
                            "{limit_text_length(profanity_filter(challenge.game.name), 30)}"
                        </div>
                    </>
                }
                width={challenge.game.width}
                height={challenge.game.height}
                black={opponent}
                white={user}
                blackExtra={<ColorIndicator color={opponentColor} />}
                whiteExtra={<ColorIndicator color={ourColor} />}
                displayWidth={1.7 * getEm10Width()}
                title={true}
                noText={false}
                noLink={true}
                timeControl={timeControl}
                leftLabel={challenge.game.ranked ? _("Ranked") : _("Unranked")}
                rightLabel={
                    challenge.game.handicap < 0
                        ? _("Auto handicap")
                        : challenge.game.handicap === 0
                          ? _("No handicap")
                          : interpolate(_("%s handicap"), [challenge.game.handicap])
                }
            >
                <div className="challenge-actions">
                    {challenge.challenged.id === user.id && (
                        <button
                            className="primary accept-button"
                            onClick={() => acceptChallenge(challenge)}
                        >
                            <i className="fa fa-check" />{" "}
                            {pgettext("Accept game challenge", "Accept")}
                        </button>
                    )}
                    <button className="decline-button" onClick={() => deleteChallenge(challenge)}>
                        <i className="fa fa-times" />{" "}
                        {challenge.challenger.id === user.id
                            ? pgettext("Cancel game challenge", "Cancel")
                            : pgettext("Decline game challenge", "Decline")}
                    </button>
                </div>
            </GameCard>
        </div>
    );
}

function limit_text_length(text: string, length: number): string {
    if (text.length > length) {
        return `${text.substring(0, length)}...`;
    }
    return text;
}
