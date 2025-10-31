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
import { post, get } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { GobanController } from "@/lib/GobanController";

import "./GoodSportRating.styl";

interface GoodSportRatingProps {
    goban_controller: GobanController;
}

export function GoodSportRating({
    goban_controller,
}: GoodSportRatingProps): React.ReactElement | null {
    const user = useUser();
    const goban = goban_controller.goban;
    const engine = goban?.engine;
    const [hasRated, setHasRated] = React.useState<boolean | null>(null);
    const [rating, setRating] = React.useState<boolean | null>(null);
    const [submitting, setSubmitting] = React.useState(false);

    const game_id = engine?.config?.game_id;
    const user_is_player = [engine?.players.black.id, engine?.players.white.id].includes(user.id);

    // Check if user has already rated this game
    React.useEffect(() => {
        if (!game_id || !user_is_player) {
            return;
        }

        let cancelled = false;

        get(`/api/v1/games/${game_id}/good_sport_rating/`)
            .then((response) => {
                if (cancelled) {
                    return;
                }
                if (response.rated) {
                    setHasRated(true);
                    setRating(response.is_good_sport);
                } else {
                    setHasRated(false);
                }
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                console.error("Error fetching good sport rating:", error);
                // Set hasRated to false on error so user can still rate
                setHasRated(false);
            });

        return () => {
            cancelled = true;
        };
    }, [game_id, user_is_player]);

    const submitRating = React.useCallback(
        (is_good_sport: boolean) => {
            if (!game_id || submitting) {
                return;
            }

            setSubmitting(true);

            post(`/api/v1/games/${game_id}/good_sport_rating/`, {
                is_good_sport: is_good_sport,
            })
                .then(() => {
                    setHasRated(true);
                    setRating(is_good_sport);
                    setSubmitting(false);
                })
                .catch((error) => {
                    console.error("Error submitting good sport rating:", error);
                    setSubmitting(false);
                });
        },
        [game_id, submitting],
    );

    const handleKeyDown = React.useCallback(
        (is_good_sport: boolean, event: React.KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                submitRating(is_good_sport);
            }
        },
        [submitRating],
    );

    if (!user_is_player || hasRated === null) {
        return null;
    }

    return (
        <div className="good-sport-rating">
            <span className="rating-prompt">{_("Was your opponent a good sport?")}</span>
            <span
                className={`thumbs-icon ${
                    rating === true ? "selected" : rating === false ? "unselected" : ""
                }`}
                onClick={() => !submitting && submitRating(true)}
                onKeyDown={(e) => handleKeyDown(true, e)}
                role="button"
                tabIndex={0}
                aria-pressed={rating === true}
                aria-disabled={submitting}
                title={_("Good sport")}
            >
                <i className={rating === true ? "fa fa-thumbs-up" : "fa fa-thumbs-o-up"} />
            </span>
            <span
                className={`thumbs-icon ${
                    rating === false ? "selected" : rating === true ? "unselected" : ""
                }`}
                onClick={() => !submitting && submitRating(false)}
                onKeyDown={(e) => handleKeyDown(false, e)}
                role="button"
                tabIndex={0}
                aria-pressed={rating === false}
                aria-disabled={submitting}
                title={_("Not a good sport")}
            >
                <i className={rating === false ? "fa fa-thumbs-down" : "fa fa-thumbs-o-down"} />
            </span>
        </div>
    );
}
