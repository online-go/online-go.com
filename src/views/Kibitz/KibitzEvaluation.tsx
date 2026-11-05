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
import { translate, type JGOFAIReview } from "goban";
import type { GobanController } from "@/lib/GobanController";
import { generateGobanHook } from "@/components/GobanView";
import { useAIReviewData } from "@/components/AIReview/hooks";
import { get } from "@/lib/requests";
import { pgettext, interpolate } from "@/lib/translate";
import { kibitzEvaluation } from "./kibitzEvaluationScale";
import "./KibitzEvaluation.css";

const usePosition = generateGobanHook(
    (goban) => ({ move: goban?.engine.cur_move }),
    ["update", "phase"],
);

const useEstimatedScore = generateGobanHook(
    (goban) => {
        const estimator = goban?.score_estimator;
        if (!estimator || !Number.isFinite(estimator.amount)) {
            return undefined;
        }
        // `winner` and `amount` hold the AI score when the server sends one,
        // so the bar shows the same number as the score estimate banner.
        return estimator.winner === translate._("Black") ? estimator.amount : -estimator.amount;
    },
    ["score_estimate"],
);

function useEstimating(controller: GobanController): boolean {
    const [estimating, setEstimating] = React.useState(controller.estimating_score);
    React.useEffect(() => {
        setEstimating(controller.estimating_score);
        controller.on("estimating_score", setEstimating);
        return () => {
            controller.off("estimating_score", setEstimating);
        };
    }, [controller]);
    return estimating;
}

export function KibitzEvaluation({
    controller,
    source,
    gameId,
}: {
    controller: GobanController;
    source: GobanController;
    gameId: number;
}): React.ReactElement | null {
    const goban = controller.goban;
    const { move } = usePosition(goban);
    const estimating = useEstimating(controller);
    const allowed = estimating && controller.canEstimateScore(source);
    const { reviewData, setSelectedAIReview } = useAIReviewData({
        gameId,
        moveTree: goban.engine.move_tree,
        currentMove: move,
    });
    React.useEffect(() => {
        let active = true;
        setSelectedAIReview(undefined);
        if (allowed && gameId > 0) {
            void get(`games/${gameId}/ai_reviews`)
                .then((reviews: JGOFAIReview[]) => {
                    if (active) {
                        setSelectedAIReview(
                            reviews
                                .filter((review) => review.type === "full")
                                .sort((a, b) => b.strength - a.strength)[0],
                        );
                    }
                })
                .catch(() => {});
        }
        return () => {
            active = false;
        };
    }, [gameId, allowed, setSelectedAIReview]);
    const branch = move?.getBranchPoint();
    const variation =
        move && branch && move !== branch
            ? `${branch.move_number}-${move.getMoveStringToThisPoint().slice(branch.getMoveStringToThisPoint().length)}`
            : null;
    const reviewedScore =
        allowed && move
            ? variation
                ? reviewData?.analyzed_variations?.[variation]?.score
                : (reviewData?.moves[move.move_number]?.score ??
                  reviewData?.scores?.[move.move_number])
            : undefined;
    const currentEstimate = useEstimatedScore(goban);
    // Keep the previous estimate while a new one is calculated, so the label
    // does not flicker when live moves arrive.
    const lastEstimate = React.useRef<number | undefined>(undefined);
    if (!estimating) {
        lastEstimate.current = undefined;
    } else if (currentEstimate !== undefined) {
        lastEstimate.current = currentEstimate;
    }
    const estimatedScore = currentEstimate ?? lastEstimate.current;
    const score = Number.isFinite(reviewedScore) ? reviewedScore : estimatedScore;
    const available = allowed && typeof score === "number" && Number.isFinite(score);
    React.useEffect(() => {
        const bar = goban.evaluation_bar_container;
        if (!bar) {
            return;
        }
        if (!estimating) {
            bar.style.visibility = "hidden";
            return;
        }
        const previousTransform = bar.style.transform;
        bar.style.transform = "translateX(-8px)";
        bar.style.visibility = "";
        const size = Math.max(goban.width, goban.height);
        const limit = size <= 9 ? 20 : size <= 13 ? 40 : 60;
        const labels = [limit, limit / 2, 0, -limit / 2, -limit].map((points) => {
            const label = document.createElement("span");
            label.textContent = points > 0 ? `+${points}` : `${points}`;
            label.title =
                points === 0
                    ? pgettext("Kibitz score scale", "Even score")
                    : interpolate(pgettext("Kibitz score scale", "{{color}} +{{score}}"), {
                          color:
                              points > 0
                                  ? pgettext("Go color", "Black")
                                  : pgettext("Go color", "White"),
                          score: Math.abs(points),
                      });
            Object.assign(label.style, {
                position: "absolute",
                left: "0",
                right: "0",
                zIndex: "1001",
                top: `${(1 - kibitzEvaluation(points, size)) * 100}%`,
                transform:
                    points === limit
                        ? ""
                        : points === -limit
                          ? "translateY(-100%)"
                          : "translateY(-50%)",
                font: "9px/12px sans-serif",
                textAlign: "center",
                color: "white",
                background: "rgba(70, 70, 70, 0.85)",
                pointerEvents: "none",
            });
            bar.appendChild(label);
            return label;
        });
        return () => {
            labels.forEach((label) => label.remove());
            bar.style.transform = previousTransform;
            bar.style.visibility = "hidden";
        };
    }, [goban, estimating]);
    React.useEffect(() => {
        if (available) {
            goban.evaluation = kibitzEvaluation(score!, Math.max(goban.width, goban.height));
        }
    }, [goban, available, score]);
    const label = available
        ? interpolate(pgettext("Kibitz estimated point lead", "{{color}} +{{score}}"), {
              color: score! >= 0 ? pgettext("Go color", "Black") : pgettext("Go color", "White"),
              score: Math.abs(score!).toFixed(1),
          })
        : pgettext("Kibitz evaluation", "Score unavailable");
    if (!estimating) {
        return null;
    }
    return (
        <div className="KibitzEvaluation" role="status">
            {label}
            {available &&
                ` · ${
                    Number.isFinite(reviewedScore)
                        ? pgettext("Kibitz score source", "AI review")
                        : pgettext("Kibitz score source", "Estimate")
                }`}
        </div>
    );
}
