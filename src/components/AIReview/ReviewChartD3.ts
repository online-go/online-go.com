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

import * as d3 from "d3";
import * as JSNoise from "js-noise";
import * as data from "@/lib/data";
import { AIReviewEntry } from "./AIReview";
import { JGOFAIReview } from "goban";

const MARGIN = { top: 15, right: 5, bottom: 30, left: 5 };
const INITIAL_WIDTH = 600 - MARGIN.left - MARGIN.right;
const INITIAL_HEIGHT = 100 - MARGIN.top - MARGIN.bottom;

const bisector = d3.bisector((d: AIReviewEntry) => d.move_number).left;
const simplex = new JSNoise.Module.Simplex();

interface ChartCallbacks {
    setMove: (move_number: number) => void;
}

interface ChartData {
    entries: Array<AIReviewEntry>;
    ai_review: JGOFAIReview;
    move_number: number;
    variation_move_number: number;
    variation_entries: Array<AIReviewEntry>;
    use_score: boolean;
    highlighted_moves?: number[];
}

/**
 * AIReviewChartManager handles all D3.js chart rendering logic for the AI Review chart.
 * This class encapsulates the chart creation, updates, and event handling,
 * keeping the React component layer clean and focused on React-specific concerns.
 */
export class ReviewChartD3 {
    private container: HTMLDivElement;
    private svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private destroyed = false;
    private width = INITIAL_WIDTH;
    private height = INITIAL_HEIGHT;
    private replot_timeout?: any;

    // D3 selections and scales
    private prediction_graph!: d3.Selection<SVGGElement, unknown, null, undefined>;
    private win_rate_area_container?: d3.Selection<SVGPathElement, unknown, null, undefined>;
    private variation_win_rate_line_container?: d3.Selection<
        SVGPathElement,
        unknown,
        null,
        undefined
    >;
    private win_rate_line!: d3.Line<AIReviewEntry>;
    private win_rate_area!: d3.Area<AIReviewEntry>;
    private x_axis!: d3.Selection<SVGGElement, unknown, null, undefined>;
    private y_axis!: d3.Selection<SVGGElement, unknown, null, undefined>;
    private mouse_rect?: d3.Selection<SVGRectElement, unknown, null, undefined>;
    private move_crosshair?: d3.Selection<SVGLineElement, unknown, null, undefined>;
    private variation_move_crosshair?: d3.Selection<SVGLineElement, unknown, null, undefined>;
    private cursor_crosshair?: d3.Selection<SVGLineElement, unknown, null, undefined>;
    private full_crosshair?: d3.Selection<SVGLineElement, unknown, null, undefined>;
    private x: d3.ScaleLinear<number, number> = d3.scaleLinear().rangeRound([0, 0]);
    private y: d3.ScaleLinear<number, number> = d3.scaleLinear().rangeRound([0, 0]);
    private highlighted_move_circle_container!: d3.Selection<SVGGElement, unknown, null, undefined>;
    private highlighted_move_circles!: d3.Selection<
        SVGCircleElement,
        AIReviewEntry,
        SVGGElement,
        unknown
    >;

    // Chart state
    private callbacks: ChartCallbacks;
    private data: ChartData;

    constructor(container: HTMLDivElement, callbacks: ChartCallbacks, initialData: ChartData) {
        this.container = container;
        this.callbacks = callbacks;
        this.data = initialData;
        this.initialize();
    }

    private initialize(): void {
        this.destroyed = false;
        this.width = INITIAL_WIDTH;
        this.height = INITIAL_HEIGHT;

        this.svg = d3
            .select(this.container)
            .append("svg")
            .attr("class", "chart")
            .attr("width", this.width + MARGIN.left + MARGIN.right)
            .attr("height", this.height + MARGIN.top + MARGIN.bottom);

        this.prediction_graph = this.svg
            .append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

        this.setupChartElements();
        this.setupEventHandlers();
        this.plot();
        this.resize();
    }

    private setupChartElements(): void {
        // Create chart elements
        this.win_rate_area_container = this.prediction_graph
            .append("path")
            .attr("class", "win-rate-area");

        this.variation_win_rate_line_container = this.prediction_graph
            .append("path")
            .attr("class", "variation-win-rate-line");

        this.x = d3.scaleLinear().rangeRound([0, this.width]);
        this.y = d3.scaleLinear().rangeRound([this.height, 0]);

        this.x_axis = this.prediction_graph.append("g");
        this.y_axis = this.prediction_graph.append("g");

        this.highlighted_move_circle_container = this.prediction_graph.append("g");

        // Create crosshairs
        this.move_crosshair = this.prediction_graph
            .append("g")
            .attr("class", "move crosshairs")
            .append("line")
            .attr("x0", 0)
            .attr("y0", 0)
            .attr("x1", 0)
            .attr("y1", this.height);

        this.variation_move_crosshair = this.prediction_graph
            .append("g")
            .attr("class", "variation move crosshairs")
            .append("line")
            .attr("x0", 0)
            .attr("y0", 0)
            .attr("x1", 0)
            .attr("y1", this.height);

        this.move_crosshair.attr("transform", `translate(${this.x(this.data.move_number)}, 0)`);
        this.variation_move_crosshair.attr(
            "transform",
            `translate(${this.x(this.data.variation_move_number)}, 0)`,
        );

        this.cursor_crosshair = this.prediction_graph
            .append("g")
            .attr("class", "cursor crosshairs")
            .append("line")
            .style("display", "none")
            .attr("x0", 0)
            .attr("y0", 0)
            .attr("x1", 0)
            .attr("y1", this.height);

        this.full_crosshair = this.prediction_graph
            .append("g")
            .attr("class", "full crosshairs")
            .append("line")
            .style("display", "none")
            .attr("x0", 0)
            .attr("y0", 0)
            .attr("y1", 0)
            .attr("x1", this.width);
    }

    private setupEventHandlers(): void {
        // Track mouse state for drag selection
        const mouseState = {
            isDown: false,
            lastMove: -1,
        };

        this.mouse_rect = this.svg?.append("g").append("rect");
        this.mouse_rect
            ?.attr("class", "overlay")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)
            .attr("width", this.width)
            .attr("height", this.height)
            .on("mouseover", () => this.showCrosshairs())
            .on("mouseout", () => {
                mouseState.isDown = false;
                this.hideCrosshairs();
            })
            .on("mousemove", (event) => {
                this.handleMouseMove(
                    event,
                    mouseState.isDown,
                    () => mouseState.lastMove,
                    (move) => {
                        mouseState.lastMove = move;
                    },
                );
            })
            .on("mousedown", (event) => {
                mouseState.isDown = true;
                mouseState.lastMove = -1;
                this.handleMouseDown(event);
            })
            .on("mouseup", () => {
                mouseState.isDown = false;
            });
    }

    private showCrosshairs(): void {
        this.cursor_crosshair?.style("display", null);
        this.full_crosshair?.style("display", null);
    }

    private hideCrosshairs(): void {
        this.cursor_crosshair?.style("display", "none");
        this.full_crosshair?.style("display", "none");
    }

    /**
     * Get the AIReviewEntry at the current mouse position.
     * Returns the entry, and whether it's from a variation.
     */
    private getEntryAtMousePosition(
        event: MouseEvent,
    ): { entry: AIReviewEntry; isVariation: boolean } | null {
        const x0 = this.x.invert(
            d3.pointer(event, this.mouse_rect!.node() as d3.ContainerElement)[0],
        );

        // First try to find in main entries
        let i = bisector(this.data.entries, x0, 1);
        let d0 = this.data.entries[i - 1];
        let d1 = this.data.entries[i];

        if (d0 && d1) {
            const entry = x0 - d0.move_number > d1.move_number - x0 ? d1 : d0;
            return { entry, isVariation: false };
        }

        // If not found in main entries, try variation entries
        i = bisector(this.data.variation_entries, x0, 1);
        d0 = this.data.variation_entries[i - 1];
        d1 = this.data.variation_entries[i];

        if (d0 && d1) {
            const entry = x0 - d0.move_number > d1.move_number - x0 ? d1 : d0;
            return { entry, isVariation: true };
        }

        return null;
    }

    private handleMouseMove(
        event: MouseEvent,
        mouse_down: boolean,
        getLastMove: () => number,
        updateLastMove: (move: number) => void,
    ): void {
        const result = this.getEntryAtMousePosition(event);
        if (!result) {
            return;
        }

        const { entry, isVariation } = result;

        // Update crosshairs
        this.cursor_crosshair?.attr("transform", `translate(${this.x(entry.move_number)}, 0)`);
        this.full_crosshair?.attr(
            "transform",
            `translate(0, ${this.y(this.data.use_score ? entry.score : entry.win_rate * 100.0)})`,
        );

        // Handle drag to select move
        if (mouse_down && !isVariation) {
            const lastMove = getLastMove();
            if (entry.move_number !== lastMove) {
                updateLastMove(entry.move_number);
                this.callbacks.setMove(entry.move_number);
            }
        }
    }

    private handleMouseDown(event: MouseEvent): void {
        const result = this.getEntryAtMousePosition(event);
        if (!result) {
            return;
        }

        const { entry, isVariation } = result;
        this.callbacks.setMove(entry.move_number);
        if (isVariation) {
            this.resize();
        }
    }

    private plot(): void {
        if (this.destroyed) {
            return;
        }

        const use_score_safe = this.data.use_score && this.data.ai_review.scores != null;
        const entries = this.prepareMainEntries(use_score_safe);
        const variation_entries = this.prepareVariationEntries(entries);

        this.updateScales(entries, variation_entries, use_score_safe);
        this.updateLines(entries, variation_entries, use_score_safe);
        this.updateGradient(use_score_safe);
        this.updateAxes(use_score_safe);
        this.updateHighlightedMoves(entries, use_score_safe);
        this.updateCrosshairs();
    }

    private prepareMainEntries(use_score_safe: boolean): Array<AIReviewEntry> {
        if (this.data.entries.length > 0) {
            const entries = this.data.entries.map((x, i) => ({
                win_rate: x.win_rate,
                score:
                    x.score === 0 && use_score_safe
                        ? (this.data.ai_review.scores as number[])[i]
                        : x.score,
                move_number: x.move_number,
                num_variations: x.num_variations,
            }));
            entries.unshift({ win_rate: 0.5, score: 0.0, move_number: 0, num_variations: 0 });
            entries.push({
                win_rate: 0.5,
                score: 0.0,
                move_number: entries[entries.length - 1].move_number,
                num_variations: 0,
            });
            return entries;
        } else {
            // No entries - generate animation wave and schedule replot
            const entries = this.generateAnimationWave();
            this.replot_timeout = setTimeout(() => this.plot(), 50);
            return entries;
        }
    }

    private generateAnimationWave(): Array<AIReviewEntry> {
        const entries: Array<AIReviewEntry> = [];
        const n_moves_to_render = 100;
        const sine_step = (Math.PI / n_moves_to_render) * 4;
        for (let i = 0; i < n_moves_to_render; ++i) {
            const unitNoiseLine = simplex.getValue(Date.now() * 0.001, i * sine_step, 0.5) * 0.4;
            entries.push({
                win_rate: unitNoiseLine + 0.5,
                score: unitNoiseLine * 50,
                move_number: i,
                num_variations: 0,
            });
        }
        return entries;
    }

    private prepareVariationEntries(entries: Array<AIReviewEntry>): Array<AIReviewEntry> {
        if (this.data.variation_entries.length > 0 && entries.length > this.data.move_number + 1) {
            const variation_entries = this.data.variation_entries.map((x) => ({
                win_rate: x.win_rate,
                score: x.score,
                move_number: x.move_number,
                num_variations: x.num_variations,
            }));
            variation_entries.unshift(entries[this.data.move_number + 1]);
            variation_entries.push({
                win_rate: 0.5,
                score: 0.0,
                move_number: variation_entries[variation_entries.length - 1].move_number,
                num_variations: 0,
            });
            return variation_entries;
        }
        return [];
    }

    private updateScales(
        entries: AIReviewEntry[],
        variation_entries: AIReviewEntry[],
        use_score_safe: boolean,
    ): void {
        this.x.domain([
            0,
            Math.max(
                entries[entries.length - 1].move_number,
                this.data.entries.length > 0 ? this.data.variation_move_number : 0,
            ),
        ]);

        if (use_score_safe) {
            const mergedEntries = [...entries, ...variation_entries];
            const extent = d3.extent(mergedEntries, (e) => e.score);
            if (extent[0] !== undefined && extent[1] !== undefined) {
                this.y.domain(extent as [number, number]);
            }
        } else {
            this.y.domain([0, 100]);
        }
    }

    private updateLines(
        entries: AIReviewEntry[],
        variation_entries: AIReviewEntry[],
        use_score_safe: boolean,
    ): void {
        this.win_rate_area = d3
            .area<AIReviewEntry>()
            .curve(d3.curveMonotoneX)
            .x1((d) => this.x(d.move_number))
            .y1((d) => this.y(use_score_safe ? d.score * 1.0 : d.win_rate * 100.0))
            .x0((d) => this.x(d.move_number))
            .y0(() => this.y(use_score_safe ? 0 : 50));

        this.win_rate_line = d3
            .line<AIReviewEntry>()
            .curve(d3.curveMonotoneX)
            .x((d) => this.x(d.move_number))
            .y((d) => this.y(use_score_safe ? d.score : d.win_rate * 100.0));

        this.win_rate_area_container?.datum(entries).attr("d", this.win_rate_area);
        this.variation_win_rate_line_container
            ?.datum(variation_entries)
            .attr("d", this.win_rate_line);
    }

    private updateGradient(use_score_safe: boolean): void {
        let gradient_transition_point = 50;
        if (use_score_safe) {
            const [min_score, max_score] = this.y.domain();
            const yRange = max_score - min_score;
            if (yRange !== 0) {
                gradient_transition_point = (max_score / yRange) * 100;
            }
        }

        this.svg?.select("linearGradient").remove();
        this.svg
            ?.append("linearGradient")
            .attr("id", "win-rate-area-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", this.height)
            .selectAll("stop")
            .data(
                data.get("theme") === "light"
                    ? [
                          { offset: "0%", color: "#222222" },
                          {
                              offset: `${(gradient_transition_point - 1).toFixed(0)}%`,
                              color: "#444444",
                          },
                          { offset: `${gradient_transition_point.toFixed(0)}%`, color: "#888888" },
                          {
                              offset: `${(gradient_transition_point + 1).toFixed(0)}%`,
                              color: "#cccccc",
                          },
                          { offset: "100%", color: "#eeeeee" },
                      ]
                    : [
                          { offset: "0%", color: "#000000" },
                          {
                              offset: `${(gradient_transition_point - 1).toFixed(0)}%`,
                              color: "#333333",
                          },
                          { offset: `${gradient_transition_point.toFixed(0)}%`, color: "#888888" },
                          {
                              offset: `${(gradient_transition_point + 1).toFixed(0)}%`,
                              color: "#909090",
                          },
                          { offset: "100%", color: "#999999" },
                      ],
            )
            .enter()
            .append("stop")
            .attr("offset", (d) => d.offset)
            .attr("stop-color", (d) => d.color);
    }

    private updateAxes(use_score_safe: boolean): void {
        this.x_axis.remove();
        this.x_axis = this.prediction_graph.append("g");
        this.x_axis
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.x))
            .select(".domain")
            .remove();

        this.y_axis.remove();
        this.y_axis = this.prediction_graph.append("g");
        if (use_score_safe) {
            this.y_axis.attr("transform", "translate(0,0)").call(d3.axisRight(this.y).ticks(7));
            // Remove the zero tick label
            this.y_axis
                .selectAll(".tick")
                .filter((d) => d === 0)
                .remove();
        }
    }

    private updateHighlightedMoves(entries: AIReviewEntry[], use_score_safe: boolean): void {
        const show_all = Object.keys(this.data.ai_review.moves).length <= 3;
        const circle_coords = entries.filter((entry) => {
            if (!this.data.ai_review.moves[entry.move_number]) {
                return false;
            }

            // Show all moves if there are 3 or fewer
            if (show_all) {
                return true;
            }

            // Show if it's the last move in a sequence
            const isLastInSequence =
                !this.data.ai_review.moves[entry.move_number + 1] &&
                entry.move_number !== (this.data.ai_review.win_rates as number[]).length - 1;

            // Show if explicitly highlighted
            const isHighlighted = this.data.highlighted_moves?.includes(entry.move_number);

            return isLastInSequence || isHighlighted;
        });

        this.highlighted_move_circles = this.highlighted_move_circle_container
            .selectAll<SVGCircleElement, AIReviewEntry>("circle")
            .data(circle_coords);

        const removes = this.highlighted_move_circles.exit().remove();
        const adds = this.highlighted_move_circles.enter().append("circle");

        this.highlighted_move_circles
            .transition()
            .duration(200)
            .attr("cx", (d) => this.x(d.move_number))
            .attr("cy", (d) => this.y(use_score_safe ? d.score : d.win_rate * 100))
            .attr("r", () => 3)
            .attr("fill", () => "#FF0000");

        // Workaround for first pass rendering issue
        try {
            if ((removes as any)._groups[0].length !== (adds as any)._groups[0].length) {
                setTimeout(() => this.plot(), 50);
            }
        } catch {
            // ignore
        }
    }

    private updateCrosshairs(): void {
        this.move_crosshair?.attr("transform", `translate(${this.x(this.data.move_number)}, 0)`);
        this.variation_move_crosshair?.attr(
            "transform",
            `translate(${this.x(this.data.variation_move_number)}, 0)`,
        );
    }

    public updateData(newData: ChartData): void {
        this.data = newData;
        this.resize();
    }

    public resize(): void {
        if (this.destroyed) {
            return;
        }

        const containerWidth = this.container.clientWidth;
        this.width = Math.max(100, containerWidth - MARGIN.left - MARGIN.right);

        this.svg?.attr("width", this.width + MARGIN.left + MARGIN.right);
        this.x.range([0, this.width]);

        const entries = [...this.data.entries];
        entries.unshift({ win_rate: 0.5, score: 0.0, move_number: 0, num_variations: 0 });
        entries.push({
            win_rate: 0.5,
            score: 0.0,
            move_number:
                this.data.entries?.length >= 1
                    ? this.data.entries[this.data.entries.length - 1].move_number
                    : 0,
            num_variations: 0,
        });

        const variation_entries = [...this.data.variation_entries];
        variation_entries.unshift({ win_rate: 0.5, score: 0.0, move_number: 0, num_variations: 0 });
        variation_entries.push({
            win_rate: 0.5,
            score: 0.0,
            move_number:
                this.data.variation_entries?.length >= 1
                    ? this.data.variation_entries[this.data.variation_entries.length - 1]
                          .move_number
                    : 0,
            num_variations: 0,
        });

        this.win_rate_area_container?.datum(entries).attr("d", this.win_rate_area);
        this.variation_win_rate_line_container
            ?.datum(variation_entries)
            .attr("d", this.win_rate_line);

        this.mouse_rect
            ?.attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)
            .attr("width", this.width);

        this.full_crosshair?.attr("x1", this.width);
        this.plot();
    }

    public destroy(): void {
        this.destroyed = true;
        if (this.replot_timeout) {
            clearTimeout(this.replot_timeout);
            this.replot_timeout = undefined;
        }
        this.svg?.remove();
    }
}
