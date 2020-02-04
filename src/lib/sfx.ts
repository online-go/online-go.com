/*
 * Copyright 2012-2020 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Howl, Howler} from 'howler';
import * as preferences from './preferences';
import * as data from './data';
import { sprite_packs } from './sfx_sprites';



console.log('sprite_packs', sprite_packs);

const GameSounds = [
    "1_period_left",
    "2_periods_left",
    "3_periods_left",
    "4_periods_left",
    "5_periods_left",
    "begin",
    "black_wins",
    "byoyomi",
    "disconnected",
    "draw",
    "entering_byoyomi",
    "entering_overtime",
    "game_over",
    "game_paused",
    "game_resumed",
    "game_started",
    "last_byoyomi",
    "last_period",
    "main_time",
    "overtime",
    "press_the_submit_button_to_place_the_stone",
    "reconnected",
    "remove_the_dead_stones",
    "stone_removal",
    "tie",
    "time",
    "timeout",
    "undo_granted",
    "undo_requested",
    "white_wins",
    "your_move",
    "your_opponent_has_disconnected",
    "your_opponent_has_reconnected",
    "you_have_lost",
    "you_have_won",
    "pass",
];

const CountdownSounds = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
    "20", "21", "22", "23", "24", "25", "26", "27", "28", "29",
    "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
    "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
    "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
    "60",
];

const MiscSounds = [
    "stone-place-1",
    "stone-place-2",
    "stone-place-3",
    "stone-place-4",
    "stone-place-5",
];



export class SFXSprite {
    public readonly howl: Howl;
    public readonly name: string;
    public volume: number;

    constructor(howl: Howl, sprite_name: string) {
        this.howl = howl;
        this.name = sprite_name;
        this.volume = 1.0;
    }

    public play():void {
        let id = this.howl.play(this.name);
        this.howl.volume(this.volume, id);
    }
}


export class SFXManager {
    private enabled:boolean = false;
    private synced:boolean = false;
    public volume_override?:number;
    public howls:{
        [group_name:string]: Howl;
    } = {};
    public sprites:{
        [id:string]: SFXSprite;
    } = {};

    constructor() {
    }

    public enable():void {
        this.enabled = true;
        this.sync();
    }

    public sync():void {
        if (!this.enabled || this.synced) {
            return;
        }

        if (!!preferences.get('sound-enabled') || this.volume_override) {
            this.synced = true;
            let release_base:string = data.get('config.cdn_release');

            for (let k in sprite_packs) {
                this.load(k);
            }
        }
    }


    public load(group_name: string) {
        if (group_name in this.howls) {
            return;
        }

        let sprite_pack = sprite_packs[group_name];
        let release_base:string = data.get('config.cdn_release');
        let howl = new Howl({
            src: [
                `${release_base}/sound/${sprite_pack.filename_prefix}.webm`,
                `${release_base}/sound/${sprite_pack.filename_prefix}.mp3`,
            ],
            autoplay: false,
            sprite: sprite_pack.definitions,
        });
        this.howls[group_name] = howl;

        for (let sprite_name in sprite_pack.definitions) {
            this.sprites[sprite_name] = new SFXSprite(howl, sprite_name);
        }
    }
}


export const sfx = new SFXManager();
//(window as any)['sfx'] = sfx;
(window as any)['S'] = sfx;

let I = setInterval(() => {
    /* postpone downloading stuff till more important things have begun loading */
    let release_base:string = data.get('config.cdn_release');

    if (release_base) {
        clearInterval(I);
        sfx.enable();
    }
}, 100);
