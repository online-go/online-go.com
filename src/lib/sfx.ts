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

import * as data from './data';
import * as preferences from './preferences';
import { Howl } from 'howler';
import { sprite_packs, SpritePack } from './sfx_sprites';
import { current_language } from './translate';


console.log('sprite_packs', sprite_packs);

const GameVoiceSounds = [
    "1_period_left",      //
    "2_periods_left",     //
    "3_periods_left",     //
    "4_periods_left",     //
    "5_periods_left",     //
    "period",             //
    "byoyomi",            //
    "entering_byoyomi",   //
    "entering_overtime",  //
    "last_byoyomi",       //
    "last_period",        //
    "main_time",          //
    "overtime",           //


    "you_have_lost",       // DONE
    "you_have_won",        // DONE
    "black_wins",          // DONE
    "white_wins",          // DONE
    "tie",                 // DONE

    "disconnected",        // DONE
    "reconnected",         // DONE
    "your_opponent_has_disconnected",  // DONE
    "your_opponent_has_reconnected",   // DONE
    "player_disconnected", // DONE
    "player_reconnected",  // DONE
    "undo_granted",        // DONE
    "undo_requested",      // DONE
    "game_paused",         // DONE
    "game_resumed",        // DONE
    "game_started",        // DONE

    "remove_the_dead_stones", // DONE
    "pass",               // DONE

    "match_found",        // DONE
    "game_accepted",      // DONE

    /* ------- ignored and unused ------ */

    "your_partner_has_disconnected",   // IGNORED
    "your_partner_has_reconnected",    // IGNORED

    "draw",               //
    "time",               //
    "stone_removal",      //
    "begin",              //
    "game_over",          //

    "press_the_submit_button_to_place_the_stone", // ?
    "timeout", // ?
    "your_move", // ?
] as const;

const CountdownSounds = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
    "20", "21", "22", "23", "24", "25", "26", "27", "28", "29",
    "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
    "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
    "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
    "60",
] as const;

const EffectsSounds = [
    "stone-place-1",
    "stone-place-2",
    "stone-place-3",
    "stone-place-4",
    "stone-place-5",
    "error",
    "beep",
    "beepbeep",
    "boop",
    "tick",
    "tock",
    "tick-2left",
    "tock-1left",
    "tock-3left",
    "tutorial-bling",
    "tutorial-fail",
    "tutorial-pass",
    "tutorial-ping",
] as const;

export type ValidSound = (typeof GameVoiceSounds | typeof CountdownSounds | typeof EffectsSounds)[number];

export type ValidSoundGroup = 'game_voice' | 'countdown' | 'effects';
export const SpriteGroups:{[id in ValidSoundGroup]: Array<SpritePack>} = {
    'game_voice': Object.keys(sprite_packs).filter(pack_id => {
        for (let key in sprite_packs[pack_id].definitions) {
            if (GameVoiceSounds.filter(s => s === key).length > 0) {
                return true;
            }
        }
        return false;
    }).map(pack_id => sprite_packs[pack_id]),
    'countdown': Object.keys(sprite_packs).filter(pack_id => {
        for (let key in sprite_packs[pack_id].definitions) {
            if (CountdownSounds.filter(s => s === key).length > 0) {
                return true;
            }
        }
        return false;
    }).map(pack_id => sprite_packs[pack_id]),
    'effects': Object.keys(sprite_packs).filter(pack_id => {
        for (let key in sprite_packs[pack_id].definitions) {
            if (EffectsSounds.filter(s => s === key).length > 0) {
                return true;
            }
        }
        return false;
    }).map(pack_id => sprite_packs[pack_id]),
};

export class SFXSprite {
    private id?:number;
    public readonly howl: Howl;
    public readonly name: string;
    public readonly group_name: string;
    private _volume: number;

    constructor(howl: Howl, group_name: string, sprite_name: string) {
        this.howl = howl;
        this.group_name = group_name;
        this.name = sprite_name;
        this._volume = 1.0;
    }

    get volume():number {
        return this._volume;
    }

    set volume(v:number) {
        this._volume = v;
        if (this.id) {
            this.howl.volume(this._volume, this.id);
        }
    }

    public play():void {
        console.log('Playing sound bite: ', this.name, ' at volume: ', this._volume);
        let id = this.howl.play(this.name);
        this.howl.volume(this._volume, id);
        this.id = id;
        this.then(() => delete this.id);
    }
    public then(fn: () => void): void {
        if (this.id) {
            this.howl.once('end', fn, this.id);
        }
    }
    public stop():void {
        if (this.id) {
            this.howl.stop(this.id);
        }
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

            this.load('game_voice');
            this.load('countdown');
            this.load('effects');
        }
    }
    public play(sound_name: ValidSound):SFXSprite {
        if (sound_name in this.sprites) {
            let ret = this.sprites[sound_name];
            ret.play();
            return ret;
        } else {
            console.error("Unknown sound to play: ", sound_name);
            if (sound_name !== 'error') {
                this.play('error');
            }
            throw new Error(`Unknown sound to play: ${sound_name}`);
        }
    }
    public stop(group_name?: string):void {
        if (group_name) {
            if (group_name in this.howls) {
                this.howls[group_name].stop();
            } else {
                throw new Error(`Called sfx.stop with invalid group name: ${group_name}`);
            }
        } else {
            for (let k in this.howls) {
                this.howls[k].stop();
            }
        }
    }
    public load(group_name: ValidSoundGroup):void {
        let pack_id = this.getPackId(group_name);

        /*
        if (group_name in this.howls) {
            return;
        }
        */

        let sprite_pack = sprite_packs[pack_id];
        let release_base:string = data.get('config.cdn_release');
        let howl = new Howl({
            src: [
                `${release_base}/sound/${sprite_pack.filename_prefix}.webm`,
                `${release_base}/sound/${sprite_pack.filename_prefix}.mp3`,
            ],
            autoplay: false,
            sprite: sprite_pack.definitions as {[id:string]: [number, number]},
        });
        this.howls[group_name] = howl;

        let sound_list:Array<ValidSound> =
            group_name === 'game_voice' ? GameVoiceSounds as unknown as Array<ValidSound> :
            group_name === 'countdown' ? CountdownSounds as unknown as Array<ValidSound> :
            EffectsSounds as unknown as Array<ValidSound>;
        for (let sprite_name in sprite_pack.definitions) {
            if (sound_list.indexOf(sprite_name as ValidSound) >= 0) {
                this.sprites[sprite_name] = new SFXSprite(howl, group_name, sprite_name);
                this.sprites[sprite_name].volume = this.getVolume(group_name);
            }
        }
    }
    public getPackId(group_name: ValidSoundGroup):string {
        let pack_id = data.get(`sound.pack.${group_name}`) || 'auto';

        if (pack_id in sprite_packs) {
            return pack_id;
        }

        // else, auto or our sprite packs changed, so auto
        let lang = current_language;
        let to_check:Array<string> = [];

        try {
            for (let navlang of navigator.languages) {
                navlang = navlang.toLowerCase();
                if (navlang.indexOf(lang) >= 0) {
                    to_check.push(navlang);
                }
            }
        } catch (e) {
        }

        to_check.push(lang);

        for (let l of to_check) {
            for (let pack of SpriteGroups[group_name]) {
                let lang_code = pack.language + '-' + pack.country;
                if (lang_code.indexOf(l) >= 0) {
                    return pack.pack_id;
                }
            }
        }

        return SpriteGroups.effects[0].pack_id;
    }
    public setPackId(group_name: ValidSoundGroup, pack_id: string):void {
        data.set(`sound.pack.${group_name}`, pack_id);
        sfx.load(group_name);
    }
    public getVolume(group_name: ValidSoundGroup):number {
        return data.get(`sound.volume.${group_name}`, 1.0);
    }
    public setVolume(group_name: ValidSoundGroup, volume: number) {
        data.set(`sound.volume.${group_name}`, volume);
        for (let sprite_name in this.sprites) {
            if (this.sprites[sprite_name].group_name === group_name) {
                this.sprites[sprite_name].volume = volume;
            }
        }
    }

    public setVolumeOverride(volume:number) {
        this.volume_override = volume;
        // TODO
    }
    public clearVolumeOverride() {
        delete this.volume_override;
    }
    public getVolumeOverride():number {
        return this.volume_override;
    }
    public playStonePlacementSound(x: number, y: number, width: number, height: number):void {
        // TODO
        this.play('stone-place-1');
    }
}


export { sprite_packs, SpritePack } from './sfx_sprites';
export const sfx = new SFXManager();
(window as any)['sfx'] = sfx;

let I = setInterval(() => {
    /* postpone downloading stuff till more important things have begun loading */
    let release_base:string = data.get('config.cdn_release');

    if (release_base) {
        clearInterval(I);
        sfx.enable();
    }
}, 100);
