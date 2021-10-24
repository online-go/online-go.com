/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {post, get} from "requests";
import {Goban} from "goban";
import {sfx} from "sfx";
import {PersistentElement} from "PersistentElement";

interface InstructionalGobanProps {
    width?: number;
    height?: number;
    displayWidth?: number;
    onUpdate?: () => void;
    onSetStoneRemoval?: (obj: any) => void;
    config: any;
}

export class InstructionalGoban extends React.Component<InstructionalGobanProps, any> {
    goban_div: HTMLDivElement;
    goban;

    constructor(props) {
        super(props);
        this.state = {
        };

        this.goban_div = document.createElement('div');
        this.goban_div.className = 'Goban';
    }

    componentDidMount() {
        this.initialize();
    }
    componentWillUnmount() {
        this.destroy();
    }
    componentDidUpdate(prev_props) {
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
        this.goban = new Goban({
            "board_div": this.goban_div,
            "initial_player": "black",
            "player_id": 0,
            "interactive": true,
            "draw_top_labels": true,
            "draw_bottom_labels": true,
            "draw_left_labels": true,
            "draw_right_labels": true,
            "display_width": this.props.displayWidth || (Math.min($("body").width() - 50, $("#em10").width() * 2)),
            "square_size": "auto",

            "puzzle_opponent_move_mode": "automatic",
            "puzzle_player_move_mode": "free",
            "getPuzzlePlacementSetting": () => {
                return {"mode": "play"};
            },

            "width" : (this.props.config ? this.props.config.width : 9),
            "height" : (this.props.config ? this.props.config.height : 9)
        }, this.props.config);
        window['goban'] = this.goban;
        this.goban.play_movement_sounds = true;

        this.goban.setMode(this.props.config.mode || "puzzle");
        if (this.props.config.engine_phase) {
            this.goban.engine.phase = this.props.config.engine_phase;
        }
        this.goban.on("update", () => {
            if (this.props.onUpdate) {
                this.props.onUpdate();
            }
        });

        this.goban.on("puzzle-place", (o: {x: number; y: number; width: number; height: number; color: 'black' | 'white'}) => {
            sfx.playStonePlacementSound(o.x, o.y, o.width, o.height, o.color);
        });
        this.goban.on("set-for-removal", (obj: any) => {
            if (this.props.config.onSetStoneRemoval) {
                this.props.config.onSetStoneRemoval(obj);
            }
        });
        if (this.props.config['onCorrectAnswer']) {
            this.goban.on("puzzle-correct-answer", this.props.config.onCorrectAnswer);
        }
        if (this.props.config['onWrongAnswer']) {
            this.goban.on("puzzle-wrong-answer", this.props.config.onWrongAnswer);
        }
        if (this.props.config['onError']) {
            this.goban.on("error", this.props.config.onError);
        }
    }
    destroy() {
        if (this.goban) {
            this.goban.destroy();
        }
    }
    render() {
        return (
            <div className='InstructionalGoban'>
                <div ref="goban_container" className="goban-container">
                    <PersistentElement elt={this.goban_div} />
                </div>
            </div>
        );
    }
}
