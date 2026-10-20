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

/* A minimal Web Audio stand-in for Howler. The context starts suspended and
 * resume() does not settle until the test calls resumeAudio(), like Safari
 * when it waits for a user gesture. */
const pending_resumes: Array<() => void> = [];

class FakeAudioParam {
    setValueAtTime(): void {}
}

class FakeAudioNode {
    gain = new FakeAudioParam();
    playbackRate = new FakeAudioParam();
    buffer: unknown = null;
    connect(): void {}
    disconnect(): void {}
    start(): void {}
    stop(): void {}
}

class FakeAudioContext {
    state = "suspended";
    currentTime = 0;
    destination = {};
    createGain(): FakeAudioNode {
        return new FakeAudioNode();
    }
    createBufferSource(): FakeAudioNode {
        return new FakeAudioNode();
    }
    createBuffer(): object {
        return {};
    }
    decodeAudioData(_data: ArrayBuffer, success: (buffer: { duration: number }) => void): void {
        success({ duration: 10 });
    }
    resume(): Promise<void> {
        return new Promise((resolve) => {
            pending_resumes.push(() => {
                this.state = "running";
                resolve();
            });
        });
    }
    suspend(): Promise<void> {
        return Promise.resolve();
    }
}

function resumeAudio(): void {
    for (const resolve of pending_resumes.splice(0)) {
        resolve();
    }
}

beforeAll(() => {
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    HTMLMediaElement.prototype.canPlayType = () => "probably";
});

describe("SFXSprite", () => {
    test("many plays while the audio context waits to resume do not overflow the stack", async () => {
        /* Imported here so that Howler sees the fake AudioContext. */
        const { Howl } = await import("howler");
        const { SFXSprite, sfx } = await import("./sfx");

        const howl = new Howl({
            src: ["data:audio/mp3;base64,AAAA"],
            sprite: { "black-1": [0, 500] },
        });
        const sprite = new SFXSprite(howl, "stones", "black-1");
        sprite.volume = 0.5;

        const errors: unknown[] = [];
        const onError = (ev: ErrorEvent) => {
            errors.push(ev.error ?? ev.message);
        };
        window.addEventListener("error", onError);

        for (let i = 0; i < 5000; ++i) {
            sprite.play();
        }

        resumeAudio();
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.removeEventListener("error", onError);

        expect(errors).toEqual([]);
        expect(howl.volume()).toBeCloseTo(0.5 * sfx.getVolume("master"));
    });
});
