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
    private loaded: any = {};
    private sfx: any = {};
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
        }
    }
    public play(name, play_even_if_window_doesnt_have_focus?) {
        if (!this.enabled && (this.volume_override == null || this.volume_override === 0)) { return; }
        this.sync();
        //console.log("Playing ", name, new Error().stack);
        /*
        if (!window.has_focus) {
            if (!play_even_if_window_doesnt_have_focus) {
                return;
            }
        }
        */

        if (Goban.getSoundEnabled() || (this.volume_override != null && this.volume_override > 0)) {
            if (this.volume_override != null && this.volume_override === 0)  {
                return;
            }
            try {
                //console.log("Playing ", name);
                let volume = Goban.getSoundVolume();
                if (this.volume_override != null) {
                    volume = this.volume_override;
                }
                this.sfx[name][0].volume = volume;
                this.sfx[name][0].play();
            } catch (e) {
                console.log("Error playing ", name);
                console.log(e);
                console.log(e.stack);
            }
        }
    }
    private addAudio(name, pathname) {
        if (!this.enabled && (this.volume_override == null || this.volume_override === 0)) { return; }

        if (pathname in this.loaded) {
            this.sfx[name] = this.loaded[pathname];
            return;
        }

        //console.log("Loading " + name + " -> " + cdn_release + '/sound/' + pathname + '.ogg');
        let audio = $("<audio>");
        audio
            .attr("preload", "auto")
            .append($("<source>").attr("type", "audio/ogg").attr("src", Goban.getCDNReleaseBase() + "/sound/" + pathname + ".ogg"))
            .append($("<source>").attr("type", "audio/mpeg").attr("src", Goban.getCDNReleaseBase() + "/sound/" + pathname + ".mp3"))
            .append($("<source>").attr("type", "audio/wav").attr("src", Goban.getCDNReleaseBase() + "/sound/" + pathname + ".wav"))
            ;
        $("body").append(audio);

        this.sfx[name] = this.loaded[pathname] = audio;
    }
}


export const sfx = new SFXManager();

let I = setInterval(() => {
    /* postpone downloading stuff till more important things have begun loading */
    if (Goban.getCDNReleaseBase()) {
        clearInterval(I);
        sfx.enable();
    }
}, 100);
