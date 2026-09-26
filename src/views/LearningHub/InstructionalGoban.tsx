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
import * as preferences from "@/lib/preferences";
import "./InstructionalGoban.css";
import { createGoban, GobanRenderer } from "goban";
import { sfx } from "@/lib/sfx";
import { PersistentElement } from "@/components/PersistentElement";
import {
    FALLBACK_VERTICAL_CHROME,
    instructionalGobanDisplayWidth,
    visibleIntersectionSpan,
} from "./instructionalGobanSize";

interface InstructionalGobanProps {
    width?: number;
    height?: number;
    displayWidth?: number;
    onUpdate?: () => void;
    onSetStoneRemoval?: (obj: any) => void;
    config: any;
}

export class InstructionalGoban extends React.Component<InstructionalGobanProps> {
    goban_div: HTMLDivElement;
    container_div: HTMLDivElement | null = null;
    goban?: GobanRenderer;

    constructor(props: InstructionalGobanProps) {
        super(props);
        // TODO: Remove this (state unused)
        this.state = {};

        this.goban_div = document.createElement("div");
        this.goban_div.className = "Goban";
    }

    componentDidMount() {
        this.initialize();
    }
    componentWillUnmount() {
        this.destroy();
    }
    componentDidUpdate(prev_props: InstructionalGobanProps) {
        if (prev_props.config !== this.props.config) {
            this.destroy();
            this.initialize();
        }
    }

    reset() {
        this.destroy();
        this.initialize();
    }

    initialize() {
        this.goban = createGoban(
            {
                board_div: this.goban_div,
                initial_player: "black",
                player_id: 0,
                interactive: true,
                draw_top_labels: this.props.config.draw_top_labels ?? false,
                draw_bottom_labels: this.props.config.draw_bottom_labels ?? false,
                draw_left_labels: this.props.config.draw_left_labels ?? false,
                draw_right_labels: this.props.config.draw_right_labels ?? false,
                bounds: this.props.config.bounds,
                display_width: this.boardDisplayWidth(),
                square_size: "auto",

                puzzle_opponent_move_mode: "automatic",
                puzzle_player_move_mode: "free",
                stone_font_scale: preferences.get("stone-font-scale"),

                getPuzzlePlacementSetting: () => {
                    return { mode: "play" };
                },

                width: this.props.config ? this.props.config.width : 9,
                height: this.props.config ? this.props.config.height : 9,
            },
            this.props.config,
        );
        window.goban = this.goban;

        this.goban.setMode(this.props.config.mode || "puzzle");
        if (this.props.config.engine_phase) {
            this.goban.engine.phase = this.props.config.engine_phase;
        }
        this.goban.on("update", () => {
            if (this.props.onUpdate) {
                this.props.onUpdate();
            }
        });

        this.goban.on(
            "puzzle-place",
            (o: {
                x: number;
                y: number;
                width: number;
                height: number;
                color: "black" | "white";
            }) => {
                sfx.playStonePlacementSound(o.x, o.y, o.width, o.height, o.color);
            },
        );
        this.goban.on("set-for-removal", (obj: any) => {
            if (this.props.config.onSetStoneRemoval) {
                this.props.config.onSetStoneRemoval(obj);
            }
        });
        if (this.props.config["onCorrectAnswer"]) {
            this.goban.on("puzzle-correct-answer", this.props.config.onCorrectAnswer);
        }
        if (this.props.config["onWrongAnswer"]) {
            this.goban.on("puzzle-wrong-answer", this.props.config.onWrongAnswer);
        }
        if (this.props.config["onError"]) {
            this.goban.on("error", this.props.config.onError);
        }
    }

    private boardDisplayWidth(): number {
        const anchor = this.container_div ?? this.goban_div;
        const page = anchor.closest(".LearningPage");
        const hub = document.getElementById("LearningHub");
        const nav = hub?.querySelector(".LearningHub-section-nav");
        const text = page?.querySelector(".LearningPage-pages");
        let measuredBesideColumns: number | undefined;
        if (hub && nav instanceof HTMLElement && text instanceof HTMLElement && page) {
            const sameRow =
                Math.abs(page.getBoundingClientRect().top - nav.getBoundingClientRect().top) < 8;
            if (sameRow) {
                measuredBesideColumns = hub.clientWidth - outerWidth(nav) - outerWidth(text);
            }
        }

        let verticalChrome = FALLBACK_VERTICAL_CHROME;
        const container = document.getElementById("LearningHub-container");
        if (container && page instanceof HTMLElement && container.clientHeight > 0) {
            const style = getComputedStyle(page);
            const pad =
                (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
            const chrome = window.innerHeight - container.clientHeight + pad;
            if (chrome > 0) {
                verticalChrome = chrome;
            }
        }

        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

        return instructionalGobanDisplayWidth({
            visibleSpan: visibleIntersectionSpan(this.props.config),
            explicitDisplayWidth: this.props.displayWidth,
            em10Width: document.getElementById("em10")?.offsetWidth ?? 0,
            viewportWidth: document.body.offsetWidth,
            viewportHeight: window.innerHeight,
            verticalChrome,
            rootFontSize,
            measuredBesideColumns,
        });
    }

    destroy() {
        if (this.goban) {
            this.goban.destroy();
        }
    }
    render() {
        return (
            <div
                className="InstructionalGoban"
                ref={(el) => {
                    this.container_div = el;
                }}
            >
                <div className="goban-container">
                    <PersistentElement elt={this.goban_div} />
                </div>
            </div>
        );
    }
}

function outerWidth(el: HTMLElement): number {
    const style = getComputedStyle(el);
    return (
        el.getBoundingClientRect().width +
        (parseFloat(style.marginLeft) || 0) +
        (parseFloat(style.marginRight) || 0)
    );
}
