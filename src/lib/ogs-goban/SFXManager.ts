/*
 * Copyright 2012-2017 Online-Go.com
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

import {Goban} from './Goban';

export class SFXManager {
    private enabled = false;
    private loaded: {[id:string]: HTMLAudioElement} = {};
    private sfx: {[id:string]: HTMLAudioElement} = {};
    public volume_override:number = null;

    constructor() {
        this.sync();
    }

    public enable() {
        this.enabled = true;
        this.sync();
    }

    public sync() {
        if (!this.enabled && (this.volume_override == null || this.volume_override === 0)) { return; }

        if (Goban.getSoundEnabled() || (this.volume_override != null && this.volume_override > 0)) {
            for (let i = 10; i >= 1; i--) {
                this.addAudio(i, "female-en-" + i);
            }
            for (let i = 1; i <= 5; ++i) {
                this.addAudio("stone-" + i, "stone" + i);
            }
            this.addAudio("beep", "beep");
            this.addAudio("beep1", "beep");
            this.addAudio("beep2", "beep");
            this.addAudio("beep3", "beep");
            this.addAudio("beepbeep", "beepbeep");
            this.addAudio("pass", "pass");
            this.addAudio("dingdingding", "dingdingding");
            this.addAudio("tutorial-bling", "tutorial-bling");
            this.addAudio("tutorial-pass", "tutorial-pass");
            this.addAudio("tutorial-fail", "tutorial-fail");
            this.addAudio("tutorial-ping", "tutorial-ping");
        }
    }
    public play(name, play_even_if_window_doesnt_have_focus?) {
        if (!this.enabled && (this.volume_override == null || this.volume_override === 0)) { return; }
        this.sync();

        if (Goban.getSoundEnabled() || (this.volume_override != null && this.volume_override > 0)) {
            if (this.volume_override != null && this.volume_override === 0)  {
                return;
            }
            try {
                let volume = Goban.getSoundVolume();
                if (this.volume_override != null) {
                    volume = this.volume_override;
                }
                this.sfx[name].volume = volume;
                try {
                    if ((this.sfx[name] as any).active) {
                        this.sfx[name].pause();
                    }
                } catch (e) {
                    try {
                        this.sfx[name].pause();
                    } catch (e) {
                        /* ignore */
                    }
                }

                try {
                    this.sfx[name].currentTime = 0;
                    this.sfx[name].play();
                } catch (e) {
                    console.warn(e);
                }
            } catch (e) {
                console.log("Error playing ", name);
                console.log(e);
                console.log(e.stack);
            }
        }
    }

    public stopAll() {
        for (let n in this.sfx) {
            try {
                if ((this.sfx[name] as any).active) {
                    this.sfx[name].pause();
                }
            } catch (e) {
                try {
                    this.sfx[name].pause();
                } catch (e) {
                    /* ignore */
                }
            }
        }
    }
    private addAudio(name, pathname) {
        if (!this.enabled && (this.volume_override == null || this.volume_override === 0)) { return; }

        if (pathname in this.loaded) {
            this.sfx[name] = this.loaded[pathname];
            return;
        }

        let audio = document.createElement('audio');
        audio.setAttribute('preload', 'auto');

        for (let attrs of [
            {'type': 'audio/ogg', 'src': Goban.getCDNReleaseBase() + "/sound/" + pathname + ".ogg"},
            {'type': 'audio/mpeg', 'src': Goban.getCDNReleaseBase() + "/sound/" + pathname + ".mp3"},
            {'type': 'audio/wav', 'src': Goban.getCDNReleaseBase() + "/sound/" + pathname + ".wav"}
        ]) {
            let source = document.createElement('source');
            source.setAttribute('type', attrs['type']);
            source.setAttribute('src', attrs['src']);
            audio.appendChild(source);
        }

        document.getElementsByTagName('BODY')[0].appendChild(audio);

        this.sfx[name] = this.loaded[pathname] = audio;
    }

}


export const sfx = new SFXManager();
window['sfx'] = sfx;

let I = setInterval(() => {
    /* postpone downloading stuff till more important things have begun loading */
    if (Goban.getCDNReleaseBase()) {
        clearInterval(I);
        sfx.enable();
    }
}, 100);
