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
import { Howl, Howler } from 'howler';
import { sprite_packs, SpritePack } from './sfx_sprites';
import { current_language } from './translate';

Howler.autoUnlock = true;

const GameVoiceSounds = [
    "period",
    "5_periods_left",
    "4_periods_left",
    "3_periods_left",
    "2_periods_left",
    "last_period",
    "byoyomi",
    "overtime",
    "start_counting",

    "you_have_won",
    "black_wins",
    "white_wins",
    "tie",

    "game_started",
    "disconnected",
    "reconnected",
    "your_opponent_has_disconnected",
    "your_opponent_has_reconnected",
    "player_disconnected",
    "player_reconnected",
    "undo_requested",
    "undo_granted",
    "game_paused",
    "game_resumed",

    "remove_the_dead_stones",
    "pass",

    "challenge_received",
    "review_started",
] as const;

const UnusedSounds = [
    /* ------- ignored and unused ------ */
    "you_have_lost",
    "game_found",
    "match_found",
    "game_accepted",
    "challenge_accepted",
    "your_partner_has_disconnected",
    "your_parnter_has_reconnected",
    "your_opponent_has_passed",
    "confirm_the_score",

    "last_byoyomi",
    "main_time",
    "entering_byoyomi",
    "entering_overtime",
    "1_period_left",                   // we say "last period" instead

    "your_partner_has_disconnected",   // will use when we do rengo
    "your_partner_has_reconnected",    // will use when we do rengo

    "draw",
    "time",
    "stone_removal",
    "begin",
    "game_over",
    "tournament_starting",

    "press_the_submit_button_to_place_the_stone",
    "timeout",
    "your_move",
];



const CountdownSounds = [
    "0" , "1" , "2" , "3" , "4" , "5" , "6" , "7" , "8" , "9" ,
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
    "20", "21", "22", "23", "24", "25", "26", "27", "28", "29",
    "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
    "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
    "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
    "60",
] as const;

const StoneSounds = [
    "black-1",
    "black-2",
    "black-3",
    "black-4",
    "black-5",

    "white-1",
    "white-2",
    "white-3",
    "white-4",
    "white-5",
] as const;

const EffectsSounds = [
    "capture-1",
    "capture-2",
    "capture-3",
    "capture-4",
    "capture-5",
    "capture-1-pile",
    "capture-2-pile",
    "capture-3-pile",
    "capture-4-pile",
    "capture-handful",

    "setup-bowl",
    "put-lid-on",

    "error",
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

export type ValidSound = (typeof GameVoiceSounds | typeof UnusedSounds |typeof CountdownSounds | typeof StoneSounds | typeof EffectsSounds)[number];

export type ValidSoundGroup = 'master' | 'game_voice' | 'countdown' | 'effects' | 'stones';
export const SpriteGroups:{[id in ValidSoundGroup]: Array<SpritePack>} = {
    'master': [],

    'game_voice': Object.keys(sprite_packs).filter(pack_id => {
        if (pack_id.indexOf('effects-2012') > 0) {
            return false;
        }

        for (let key in sprite_packs[pack_id].definitions) {
            if (GameVoiceSounds.filter(s => s === key).length > 0) {
                return true;
            }

            if (UnusedSounds.filter(s => s === key).length > 0) {
                return true;
            }
        }
        return false;
    }).map(pack_id => sprite_packs[pack_id]),

    'countdown': Object.keys(sprite_packs).filter(pack_id => {
        if (pack_id.indexOf('effects-2012') > 0) {
            return false;
        }

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

    'stones': Object.keys(sprite_packs).filter(pack_id => {
        for (let key in sprite_packs[pack_id].definitions) {
            if (StoneSounds.filter(s => s === key).length > 0) {
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
        let master_volume = sfx.getVolume('master');

        if (sfx.volume_override >= 0) {
            master_volume = sfx.volume_override;
        }

        return this._volume * master_volume;
    }

    set volume(v:number) {
        this._volume = v;
        if (this.id) {
            this.howl.volume(this.volume, this.id);
        }
    }

    public play():void {
        if (this.volume >= 0.01) {
            console.log('Playing sound bite: ', this.name, ' at volume: ', this.volume);
            let id = this.howl.play(this.name);
            this.howl.volume(this.volume, id);
            this.id = id;
            this.then(() => delete this.id);
        } else {
            console.log('*NOT* Playing sound bite: ', this.name, ', volume was ', this.volume);
        }
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
    public stereo(pan:number):void {
        if (this.id) {
            this.howl.stereo(pan, this.id);
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
    // our sound effects pack covers all possible sounds, we have them here
    // so we can easily fall back to them based on settings or if there's
    // a missing sound
    public effectSprites:{
        [id:string]: SFXSprite;
    } = {};

    constructor() {
    }
    public enable():void {
        this.enabled = true;
        this.sync();
    }
    public sync():boolean {
        if (!this.enabled || this.synced) {
            return this.enabled && this.synced;
        }

        let vol = this.getVolume('master');
        if (this.volume_override >= 0) {
            vol = this.volume_override;
        }

        if (vol) {
            this.synced = true;
            this.load('stones');
            this.load('countdown');
            this.load('game_voice');
            this.load('effects');
        }

        return this.synced;
    }
    public hasSoundSample(sound_name: ValidSound):boolean {
        try {
            let pack_id = this.getPackId('game_voice');
            let sprite_pack = sprite_packs[pack_id];
            if (sprite_pack && sound_name in sprite_pack.definitions) {
                return true;
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    }
    public play(sound_name: ValidSound):SFXSprite | null {
        try {
            if (!this.getSpriteEnabled(sound_name)) {
                return null;
            }

            if (!this.sync()) {
                return null;
            }

            if (this.getSpriteVoiceEnabled(sound_name) && sound_name in this.sprites) {
                let ret = this.sprites[sound_name];
                ret.play();
                return ret;
            }
            else if (sound_name in this.effectSprites) {
                let ret = this.effectSprites[sound_name];
                ret.play();
                return ret;
            }
            else {
                try {
                    console.trace("Unknown sound to play: ", sound_name);
                    if (sound_name !== 'error') {
                        this.play('error');
                    }
                } catch (e) {
                    //
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    public stop(group_name?: string):void {
        try {
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
        } catch (e) {
            console.error(e);
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
            group_name === 'game_voice' ? ((GameVoiceSounds as any).concat(UnusedSounds as any)) as unknown as Array<ValidSound> :
            group_name === 'countdown' ? CountdownSounds as unknown as Array<ValidSound> :
            group_name === 'stones' ? StoneSounds as unknown as Array<ValidSound> :
            EffectsSounds as unknown as Array<ValidSound>;
        for (let sprite_name in sprite_pack.definitions) {
            if (sound_list.indexOf(sprite_name as ValidSound) >= 0) {
                this.sprites[sprite_name] = new SFXSprite(howl, group_name, sprite_name);
                this.sprites[sprite_name].volume = this.getVolume(group_name);
            }
        }

        // For effects, everything also goes into effectSprites so we can fall back to them on demand or error
        if (group_name === 'effects') {
            for (let sprite_name in sprite_pack.definitions) {
                this.effectSprites[sprite_name] = new SFXSprite(howl, group_name, sprite_name);
                this.effectSprites[sprite_name].volume = this.getVolume(group_name);
            }
        }

        try {
            howl.on('unlock', () => {
                console.info("Audio group ", group_name, " unlocked successfully, sounds should now work");
            });
            let silence = new SFXSprite(howl, group_name, 'silence');
            silence.play();
            silence.then(() => {
                console.log("Successfully played silence from ", group_name);
            });
        } catch (e) {
            console.warn(e);
        }
    }
    public getPackId(group_name: ValidSoundGroup):string {
        let pack_id = data.get(`sound.pack.${group_name}`) || 'auto';

        if (pack_id in sprite_packs) {
            return pack_id;
        }

        if (group_name === 'stones') {
            return 'zz-un-floor-goban';
        }

        if (group_name === 'effects') {
            return 'zz-un-effects';
        }

        // Otherwise, we're dealing with game voice or clock countdown - select
        // a good default sprite pack based on the language being used for the site
        let lang = current_language;
        let to_check:Array<string> = [];

        lang = lang.replace(/-[a-zA-Z].*/, '');

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
            if (l.indexOf('en') === 0) {
                /* Default to Claire, our old "Amy" is a valid option but we shouldn't be using
                 * it by default even for US players because it doesn't have most numbers available */
                if (group_name === 'countdown' && 'en-gb-claire-numbers' in sprite_packs) {
                    return 'en-gb-claire-numbers';
                }

                if (group_name === 'game_voice' && 'en-gb-claire-phrases' in sprite_packs) {
                    return 'en-gb-claire-phrases';
                }
            }

            for (let pack of SpriteGroups[group_name]) {
                let lang_code = pack.language + '-' + pack.country;
                console.log(lang_code, l);
                if (lang_code.indexOf(l) >= 0) {
                    return pack.pack_id;
                }
            }
        }

        return 'zz-un-effects';
    }
    public setPackId(group_name: ValidSoundGroup, pack_id: string):void {
        data.set(`sound.pack.${group_name}`, pack_id);
        sfx.load(group_name);
    }
    public getVolume(group_name: ValidSoundGroup):number {
        return data.get(`sound.volume.${group_name}`, 0.8);
    }
    public setVolume(group_name: ValidSoundGroup, volume: number) {
        data.set(`sound.volume.${group_name}`, volume);
        for (let sprite_name in this.sprites) {
            if (this.sprites[sprite_name].group_name === group_name) {
                this.sprites[sprite_name].volume = volume;
            }
        }

        if (group_name === 'effects') {
            for (let sprite_name in this.effectSprites) {
                this.effectSprites[sprite_name].volume = volume;
            }
        }
    }

    public setSpriteEnabled(sprite_name: ValidSound, enabled: boolean):void {
        data.set(`sound.enabled.${sprite_name}`, enabled);
    }
    public getSpriteEnabled(sprite_name: ValidSound):boolean {
        return data.get(`sound.enabled.${sprite_name}`, true);
    }
    public setSpriteVoiceEnabled(sprite_name: ValidSound, enabled: boolean):void {
        data.set(`sound.voice-enabled.${sprite_name}`, enabled);
    }
    public getSpriteVoiceEnabled(sprite_name: ValidSound):boolean {
        return data.get(`sound.voice-enabled.${sprite_name}`, true);
    }

    public setVolumeOverride(volume:number) {
        this.volume_override = volume;
    }
    public clearVolumeOverride() {
        delete this.volume_override;
    }
    public getVolumeOverride():number {
        return this.volume_override;
    }
    public playStonePlacementSound(x: number, y: number, width: number, height: number, color: 'black' | 'white'):void {
        try {
            let pan = ((x / Math.max(1, (width - 1))) - 0.5) * 0.3;
            let rnum = (Math.round(Math.random() * 100000) % 5) + 1;
            let stone_sound:ValidSound = (color + '-' + rnum) as ValidSound;

            if (!preferences.get('sound.positional-stone-placement-effect')) {
                pan = 0;
            }

            let sprite = this.play(stone_sound);

            if (sprite && pan) {
                sprite.stereo(pan);
            }
        } catch (e) {
            console.error(e);
        }

        try {
            if (preferences.get('sound.vibrate-on-stone-placement') && navigator.vibrate) {
                navigator.vibrate(30);
            }
        } catch (e) {
            console.error(e);
        }
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


/* Check and warn if we don't have an effect mapping for every sound voice sound */
window['sprite_packs'] = sprite_packs;
const effects = sprite_packs['zz-un-effects'];
for (let pack of [GameVoiceSounds, CountdownSounds, StoneSounds, EffectsSounds]) {
    for (let name of pack) {
        if (!(name in effects.definitions)) {
            console.error("Non vocal sound effect not defined for ", name);
        }
    }
}

navigator.vibrate = navigator.vibrate || (navigator as any).webkitVibrate || (navigator as any).mozVibrate || (navigator as any).msVibrate;

data.setDefault('sound.enabled.disconnected', false);
data.setDefault('sound.enabled.reconnected', false);
data.setDefault('sound.enabled.player_disconnected', false);
data.setDefault('sound.enabled.player_reconnected', false);
data.setDefault('sound.enabled.your_opponent_has_disconnected', false);
data.setDefault('sound.enabled.your_opponent_has_reconnected', false);
