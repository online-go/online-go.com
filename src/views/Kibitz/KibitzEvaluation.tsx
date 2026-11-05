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
import { ScoreEstimator, translate, type JGOFAIReview, type MoveTree } from "goban";
import type { GobanController } from "@/lib/GobanController";
import { generateGobanHook } from "@/components/GobanView";
import { useAIReviewData } from "@/components/AIReview/hooks";
import { get } from "@/lib/requests";
import { _, pgettext, interpolate } from "@/lib/translate";
import { kibitzEvaluation } from "./kibitzEvaluationScale";
import "./KibitzEvaluation.css";

const usePosition = generateGobanHook(
    (goban) => ({ move: goban?.engine.cur_move }),
    ["update", "phase"],
);

/** The signed estimate (positive for Black), as the score estimate banner shows it. */
function estimatorScore(estimator: ScoreEstimator | null | undefined): number | undefined {
    if (!estimator || !Number.isFinite(estimator.amount)) {
        return undefined;
    }
    // `winner` and `amount` hold the AI score when the server sends one.
    return estimator.winner === translate._("Black") ? estimator.amount : -estimator.amount;
}

const useEstimatedScore = generateGobanHook(
    (goban) => estimatorScore(goban?.score_estimator),
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
    enabled,
    onLabelChange,
}: {
    controller: GobanController;
    source: GobanController;
    gameId: number;
    enabled: boolean;
    /** Receives the score text to show beside the board, or null when the bar is off. */
    onLabelChange: (label: string | null) => void;
}): null {
    const goban = controller.goban;
    const { move } = usePosition(goban);
    const estimating = useEstimating(controller);
    const allowed = enabled && controller.canEstimateScore(source);
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
    const scoreEstimatorScore = useEstimatedScore(goban);
    const [barEstimate, setBarEstimate] = React.useState<{
        move: typeof move;
        score: number;
    } | null>(null);
    const needsBarEstimate = allowed && !estimating && !Number.isFinite(reviewedScore);
    const preferRemote = controller.prefersRemoteScoreEstimate(source);
    // Positions already estimated in this game, so going back and forth does
    // not request the same estimate again.
    const estimateCache = React.useRef(new WeakMap<MoveTree, number>());
    React.useEffect(() => {
        let active = true;
        if (!needsBarEstimate || !move) {
            return;
        }
        const cached = estimateCache.current.get(move);
        if (cached !== undefined) {
            setBarEstimate({ move, score: cached });
            return;
        }
        const timer = window.setTimeout(() => {
            // A detached estimate does not show ownership on the board. It
            // asks the AI server under the same rule as score estimation.
            const estimator = new ScoreEstimator(goban.engine, undefined, 1000, 0.25, preferRemote);
            void estimator.when_ready
                .then(() => {
                    const score = estimatorScore(estimator);
                    if (score === undefined) {
                        return;
                    }
                    estimateCache.current.set(move, score);
                    if (active && goban.engine.cur_move === move) {
                        setBarEstimate({ move, score });
                    }
                })
                .catch(() => {});
        }, 250);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [goban, move, needsBarEstimate, preferRemote]);
    // While score estimation is on, use its estimate so the bar and the
    // banner agree.
    const currentEstimate = estimating
        ? scoreEstimatorScore
        : barEstimate?.move === move
          ? barEstimate?.score
          : undefined;
    // Keep the previous estimate while a new one is calculated, so the label
    // does not flicker when the position changes.
    const lastEstimate = React.useRef<number | undefined>(undefined);
    if (!enabled) {
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
        if (!enabled) {
            bar.style.visibility = "hidden";
            return;
        }
        // Goban places the bar 8px outside the space it reserves for it, so
        // the bar can be cut off when the board fills its container.
        const previousTransform = bar.style.transform;
        const previousBoxSizing = bar.style.boxSizing;
        bar.style.transform = "translateX(8px)";
        bar.style.boxSizing = "border-box";
        bar.style.visibility = "";
        const size = Math.max(goban.width, goban.height);
        const limit = size <= 9 ? 20 : size <= 13 ? 40 : 60;
        const marks = [...new Set([limit, limit / 2, 10, 0, -10, -limit / 2, -limit])];
        const labels = marks.map((points) => {
            const label = document.createElement("span");
            label.dataset.points = `${points}`;
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
        // A narrow bar (on phones) cannot hold "+60" at 9px. Drop the signs
        // first, then shrink the font until every label fits.
        const fitLabels = () => {
            const width = bar.clientWidth;
            if (!width) {
                return;
            }
            const fits = () => labels.every((label) => label.scrollWidth <= width);
            const attempts = [
                { signed: true, font: 9 },
                ...[9, 8, 7, 6].map((font) => ({ signed: false, font })),
            ];
            for (const { signed, font } of attempts) {
                labels.forEach((label) => {
                    const points = Number(label.dataset.points);
                    label.textContent = signed
                        ? `${points > 0 ? "+" : ""}${points}`
                        : `${Math.abs(points)}`;
                    label.style.fontSize = `${font}px`;
                });
                if (fits()) {
                    return;
                }
            }
        };
        fitLabels();
        const resizeObserver =
            typeof ResizeObserver === "function" ? new ResizeObserver(fitLabels) : null;
        resizeObserver?.observe(bar);
        return () => {
            resizeObserver?.disconnect();
            labels.forEach((label) => label.remove());
            bar.style.transform = previousTransform;
            bar.style.boxSizing = previousBoxSizing;
            bar.style.visibility = "hidden";
        };
    }, [goban, enabled]);
    React.useEffect(() => {
        if (available) {
            goban.evaluation = kibitzEvaluation(score!, Math.max(goban.width, goban.height));
        }
    }, [goban, available, score]);
    const leadText = available
        ? interpolate(_("{{winner}} by {{score}}"), {
              winner: score! >= 0 ? _("Black") : _("White"),
              score: Math.abs(score!).toFixed(1),
          })
        : null;
    const label = !enabled
        ? null
        : leadText
          ? Number.isFinite(reviewedScore)
              ? `${leadText} · ${pgettext("Kibitz score source", "AI review")}`
              : leadText
          : pgettext("Kibitz evaluation", "Score unavailable");
    React.useEffect(() => {
        onLabelChange(label);
    }, [label, onLabelChange]);
    React.useEffect(() => () => onLabelChange(null), [onLabelChange]);
    return null;
}
