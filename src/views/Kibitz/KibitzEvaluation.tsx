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
import { usePreference } from "@/lib/preferences";
import { _, pgettext, interpolate } from "@/lib/translate";
import { kibitzEvaluation } from "./kibitzEvaluationScale";

const usePosition = generateGobanHook(
    (goban) => ({ move: goban?.engine.cur_move }),
    ["update", "phase"],
);

/** A position's assessment: the signed score (positive for Black) and
 *  Black's win rate, each when known. */
interface Assessment {
    score?: number;
    win_rate?: number;
}

/** The estimator's assessment, as the score estimate banner shows it. */
function estimatorAssessment(estimator: ScoreEstimator | null | undefined): Assessment {
    if (!estimator || !Number.isFinite(estimator.amount)) {
        return {};
    }
    // `winner` and `amount` hold the AI score when the server sends one.
    const score = estimator.winner === translate._("Black") ? estimator.amount : -estimator.amount;
    return { score, win_rate: estimator.win_rate };
}

const useEstimatorAssessment = generateGobanHook(
    (goban) => estimatorAssessment(goban?.score_estimator),
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

/** A detached estimate of one position, or that its request failed. */
type BarEstimate = { move: MoveTree; assessment: Assessment } | { move: MoveTree; failed: true };

/** A mark on the bar: where it sits (Black's share, 0 to 1) and its text. */
interface BarMark {
    position: number;
    label: string;
    /** The text once the bar is too narrow for `label` */
    shortLabel: string;
    title: string;
}

/** Pointer events goban handles on the board; a click on the bar must not
 *  reach them. */
const BOARD_POINTER_EVENTS = [
    "mousedown",
    "mouseup",
    "mousemove",
    "click",
    "dblclick",
    "touchstart",
    "touchend",
];

function scoreMarks(size: number): BarMark[] {
    const limit = size <= 9 ? 20 : size <= 13 ? 40 : 60;
    const points = [...new Set([limit, limit / 2, 10, 0, -10, -limit / 2, -limit])];
    return points.map((value) => ({
        position: kibitzEvaluation(value, size),
        label: value > 0 ? `+${value}` : `${value}`,
        shortLabel: `${Math.abs(value)}`,
        title:
            value === 0
                ? pgettext("Kibitz score scale", "Even score")
                : interpolate(pgettext("Kibitz score scale", "{{color}} +{{score}}"), {
                      color:
                          value > 0 ? pgettext("Go color", "Black") : pgettext("Go color", "White"),
                      score: Math.abs(value),
                  }),
    }));
}

function winRateMarks(): BarMark[] {
    return [0.75, 0.5, 0.25].map((position) => ({
        position,
        label: `${Math.round(Math.max(position, 1 - position) * 100)}%`,
        shortLabel: `${Math.round(Math.max(position, 1 - position) * 100)}`,
        title:
            position === 0.5
                ? pgettext("Kibitz win rate scale", "Even")
                : interpolate(pgettext("Kibitz win rate scale", "{{color}} {{percent}}%"), {
                      color:
                          position > 0.5
                              ? pgettext("Go color", "Black")
                              : pgettext("Go color", "White"),
                      percent: Math.round(Math.max(position, 1 - position) * 100),
                  }),
    }));
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
    const [mode, setMode] = usePreference("kibitz-score-bar-mode");
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
    const reviewed: Assessment | undefined =
        allowed && move
            ? variation
                ? reviewData?.analyzed_variations?.[variation]
                : (reviewData?.moves[move.move_number] ?? {
                      score: reviewData?.scores?.[move.move_number],
                      win_rate: reviewData?.win_rates?.[move.move_number],
                  })
            : undefined;
    const hasReview = Number.isFinite(reviewed?.score);
    const estimatorScore = useEstimatorAssessment(goban);
    const [barEstimate, setBarEstimate] = React.useState<BarEstimate | null>(null);
    const needsBarEstimate = allowed && !estimating && !hasReview;
    const preferRemote = controller.prefersRemoteScoreEstimate(source);
    // Positions already estimated in this game, so going back and forth does
    // not request the same estimate again. AI and local estimates are kept
    // apart, so a game that finishes does not reuse local estimates.
    const estimateCaches = React.useRef({
        remote: new WeakMap<MoveTree, Assessment>(),
        local: new WeakMap<MoveTree, Assessment>(),
    });
    const estimateCache = preferRemote
        ? estimateCaches.current.remote
        : estimateCaches.current.local;
    React.useEffect(() => {
        let active = true;
        if (!needsBarEstimate || !move) {
            return;
        }
        const cached = estimateCache.get(move);
        if (cached !== undefined) {
            setBarEstimate({ move, assessment: cached });
            return;
        }
        const timer = window.setTimeout(() => {
            // A detached estimate does not show ownership on the board. It
            // asks the AI server under the same rule as score estimation.
            const estimator = new ScoreEstimator(goban.engine, undefined, 1000, 0.25, preferRemote);
            void estimator.when_ready
                .then(() => {
                    const assessment = estimatorAssessment(estimator);
                    if (assessment.score === undefined) {
                        throw new Error("The estimate has no score");
                    }
                    estimateCache.set(move, assessment);
                    return assessment;
                })
                .then(
                    (assessment) => {
                        if (active && goban.engine.cur_move === move) {
                            setBarEstimate({ move, assessment });
                        }
                    },
                    () => {
                        if (active && goban.engine.cur_move === move) {
                            setBarEstimate({ move, failed: true });
                        }
                    },
                );
        }, 250);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [goban, move, needsBarEstimate, preferRemote, estimateCache]);
    const estimateForMove = barEstimate && barEstimate.move === move ? barEstimate : null;
    const failed = needsBarEstimate && estimateForMove !== null && "failed" in estimateForMove;
    // While score estimation is on, use its estimate so the bar and the
    // banner agree.
    const currentEstimate: Assessment | undefined = estimating
        ? estimatorScore
        : estimateForMove && "assessment" in estimateForMove
          ? estimateForMove.assessment
          : undefined;
    // Keep the previous estimate while a new one is calculated, so the label
    // does not flicker when the position changes.
    const lastEstimate = React.useRef<Assessment | undefined>(undefined);
    if (!enabled || failed) {
        lastEstimate.current = undefined;
    } else if (currentEstimate?.score !== undefined) {
        lastEstimate.current = currentEstimate;
    }
    const assessment: Assessment | undefined = hasReview
        ? reviewed
        : ((currentEstimate?.score !== undefined ? currentEstimate : undefined) ??
          lastEstimate.current);
    const winRate = mode === "win-rate";
    const value = winRate ? assessment?.win_rate : assessment?.score;
    const available = allowed && !failed && typeof value === "number" && Number.isFinite(value);
    // A score without a win rate comes from the local estimator, which has
    // none; a newer estimate will not bring one either.
    const winRateUnavailable =
        winRate && !available && assessment !== undefined && Number.isFinite(assessment.score);
    React.useEffect(() => {
        if (goban.destroyed) {
            return;
        }
        goban.setEvaluationBar(enabled);
        return () => {
            if (!goban.destroyed) {
                goban.setEvaluationBar(false);
            }
        };
    }, [goban, enabled]);
    React.useEffect(() => {
        const bar = goban.evaluation_bar_container;
        if (!enabled || !bar) {
            return;
        }
        const size = Math.max(goban.width, goban.height);
        const marks = winRate ? winRateMarks() : scoreMarks(size);
        const labels = marks.map((mark) => {
            const label = document.createElement("span");
            label.textContent = mark.label;
            label.title = mark.title;
            Object.assign(label.style, {
                position: "absolute",
                left: "0",
                right: "0",
                zIndex: "1001",
                // Black fills the bar from the top, so a Black lead marks
                // lower down.
                top: `${mark.position * 100}%`,
                transform:
                    mark.position <= 0
                        ? ""
                        : mark.position >= 1
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
        // A narrow bar (on phones) cannot hold "+60" at 9px. Use the short
        // text first, then shrink the font until every label fits.
        const fitLabels = () => {
            const width = bar.clientWidth;
            if (!width) {
                return;
            }
            const fits = () => labels.every((label) => label.scrollWidth <= width);
            const attempts = [
                { short: false, font: 9 },
                ...[9, 8, 7, 6].map((font) => ({ short: true, font })),
            ];
            for (const { short, font } of attempts) {
                labels.forEach((label, index) => {
                    label.textContent = short ? marks[index].shortLabel : marks[index].label;
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
        // Clicking the bar switches between the score and the win rate.
        bar.style.cursor = "pointer";
        bar.title = winRate
            ? pgettext("Tooltip on the Kibitz score bar", "Win rate. Click to show the score.")
            : pgettext("Tooltip on the Kibitz score bar", "Score. Click to show the win rate.");
        const stop = (event: Event) => event.stopPropagation();
        const toggle = (event: Event) => {
            event.stopPropagation();
            setMode(winRate ? "score" : "win-rate");
        };
        BOARD_POINTER_EVENTS.forEach((type) => bar.addEventListener(type, stop));
        bar.addEventListener("click", toggle);
        return () => {
            resizeObserver?.disconnect();
            labels.forEach((label) => label.remove());
            BOARD_POINTER_EVENTS.forEach((type) => bar.removeEventListener(type, stop));
            bar.removeEventListener("click", toggle);
            bar.style.cursor = "";
            bar.title = "";
        };
    }, [goban, enabled, winRate, setMode]);
    React.useEffect(() => {
        // Without a value the bar returns to even, so it does not show the
        // previous position. While a new estimate is calculated the previous
        // one is still available and stays shown.
        goban.evaluation = available
            ? winRate
                ? value!
                : kibitzEvaluation(value!, Math.max(goban.width, goban.height))
            : 0.5;
    }, [goban, available, value, winRate]);
    const leadText = !available
        ? null
        : winRate
          ? interpolate(pgettext("Kibitz score bar win rate", "{{color}} {{percent}}%"), {
                color: value! >= 0.5 ? _("Black") : _("White"),
                percent: Math.round(Math.max(value!, 1 - value!) * 100),
            })
          : interpolate(_("{{winner}} by {{score}}"), {
                winner: value! >= 0 ? _("Black") : _("White"),
                score: Math.abs(value!).toFixed(1),
            });
    const label = !enabled
        ? null
        : leadText
          ? hasReview
              ? `${leadText} · ${pgettext("Kibitz score source", "AI review")}`
              : leadText
          : !allowed
            ? pgettext("Kibitz evaluation", "Score unavailable")
            : failed
              ? pgettext("Kibitz evaluation", "Estimate failed")
              : winRateUnavailable
                ? pgettext("Kibitz evaluation", "Win rate unavailable")
                : _("Estimating...");
    React.useEffect(() => {
        onLabelChange(label);
    }, [label, onLabelChange]);
    React.useEffect(() => () => onLabelChange(null), [onLabelChange]);
    return null;
}
