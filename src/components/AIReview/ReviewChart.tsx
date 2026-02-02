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
import { OgsResizeDetector } from "@/components/OgsResizeDetector";
import { AIReviewEntry } from "./AIReview";
import { PersistentElement } from "@/components/PersistentElement";
import { JGOFAIReview } from "goban";
import { ReviewChartD3 } from "./ReviewChartD3";
import "./ReviewChart.css";

interface ReviewChartProperties {
    entries: Array<AIReviewEntry>;
    ai_review: JGOFAIReview;
    update_count: number;
    move_number: number;
    variation_move_number: number;
    variation_entries: Array<AIReviewEntry>;
    set_move: (move_number: number) => void;
    use_score: boolean;
    highlighted_moves?: number[];
}

/**
 * AIReviewChart is a lightweight React functional component that manages
 * the lifecycle of an AIReviewChartManager instance. It handles React-specific
 * concerns while delegating all D3.js chart logic to the manager class.
 */
export function ReviewChart(props: ReviewChartProperties) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const chartManagerRef = React.useRef<ReviewChartD3 | null>(null);
    // Create chart div element once and store in ref
    const chartDivRef = React.useRef<HTMLDivElement>(
        React.useMemo(() => document.createElement("div"), []),
    );

    // Initialize chart manager on mount
    React.useEffect(() => {
        const chartManager = new ReviewChartD3(
            chartDivRef.current,
            {
                setMove: props.set_move,
            },
            {
                entries: props.entries,
                ai_review: props.ai_review,
                move_number: props.move_number,
                variation_move_number: props.variation_move_number,
                variation_entries: props.variation_entries,
                use_score: props.use_score,
                highlighted_moves: props.highlighted_moves,
            },
        );

        chartManagerRef.current = chartManager;

        // Cleanup on unmount
        return () => {
            chartManager.destroy();
            chartManagerRef.current = null;
        };
    }, []); // Only run on mount/unmount

    // Update chart when props change
    React.useEffect(() => {
        chartManagerRef.current?.updateData({
            entries: props.entries,
            ai_review: props.ai_review,
            move_number: props.move_number,
            variation_move_number: props.variation_move_number,
            variation_entries: props.variation_entries,
            use_score: props.use_score,
            highlighted_moves: props.highlighted_moves,
        });
    }, [
        props.entries,
        props.ai_review,
        props.move_number,
        props.variation_move_number,
        props.variation_entries,
        props.use_score,
        props.highlighted_moves,
        props.update_count,
    ]);

    // Handle resize with built-in debouncing
    const handleResize = React.useMemo(() => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                chartManagerRef.current?.resize();
                timeoutId = null;
            }, 10);
        };
    }, []);

    return (
        <div ref={containerRef} className="AIReviewChart">
            <OgsResizeDetector onResize={handleResize} targetRef={containerRef} />
            <PersistentElement elt={chartDivRef.current} />
        </div>
    );
}
