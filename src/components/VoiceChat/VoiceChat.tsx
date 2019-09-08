/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {PersistentElement} from "PersistentElement";
import {errorLogger} from "misc";
import {comm_socket} from "sockets";

interface VoiceChatProperties {
    channel: string;
    hasVoice: boolean;
}


class AudioBuffer {
    player_id: number;
    sample_rate: number;
    buffers: Array<Int16Array> = new Array(3);
    buffer_read_idx = -1;
    buffer_write_idx = -1;
    buffer_idx: number = 0;
    position: number = 0;

    constructor(player_id) {
        //this.sample_rate = sample_rate;
        this.player_id = player_id;
    }

    add(src: Int16Array) {
        this.buffer_write_idx = (this.buffer_write_idx + 1) % this.buffers.length;
        this.buffers[this.buffer_write_idx] = src;
        if (this.buffer_read_idx === this.buffer_write_idx) {
            this.buffer_read_idx = (this.buffer_read_idx + 1) % this.buffers.length;
            this.position = 0;
        }
        if (this.buffer_read_idx === -1) {
            this.buffer_read_idx = this.buffer_write_idx;
            this.position = 0;
        }
    }

    /* Returns true if there is more data in our buffer to be played */
    drain_into(dest: Float32Array): boolean {
        for (let i = 0; i < dest.length; ++i) {
            if (this.buffer_read_idx >= 0) {
                let sample = this.buffers[this.buffer_read_idx][this.position++];
                dest[i] += sample < 0 ? (sample / 0x8000) : (sample / 0x7fff);
                if (this.position >= this.buffers[this.buffer_read_idx].length) {
                    this.position = 0;
                    this.buffers[this.buffer_read_idx] = null;
                    this.buffer_read_idx = (this.buffer_read_idx + 1) % this.buffers.length;
                    if (!this.buffers[this.buffer_read_idx]) {
                        this.buffer_read_idx = -1;
                        return false;
                    }
                }
            }
        }

        return true;
    }
}


export class VoiceChat extends React.PureComponent<VoiceChatProperties, any> {

    buffers: {[id: number]: AudioBuffer} = {};
    ctx;
    recorder;
    recorder_context;
    recorder_input;
    recorder_stream;
    recorder_script;

    constructor(props) {
        super(props);
        this.state = {
            channel: this.props.channel,
            broadcasting: false,
            autoplay: true,
            playing: false,
        };
    }

    componentDidMount() {
        this.join(this.state.channel);
        comm_socket.on("connect", this.join);
    }
    UNSAFE_componentWillReceiveProps(new_props) {
        if (this.state.channel !== new_props.channel) {
            this.part(this.state.channel);
            this.join(new_props.channel);
            this.buffers = {};
        }
        this.setState({channel: new_props.channel});
        if (this.state.broadcasting && !new_props.hasVoice) {
            this.endBroadcasting();
        }
    }
    componentWillUnmount() {
        //this.state.audio.remove();
        comm_socket.off("connect", this.join);
        this.endBroadcasting();
        if (this.ctx) {
            this.ctx.close();
        }
        this.part(this.state.channel);
    }

    join = (channel) => {
        if (!channel) {
            channel = this.state.channel;
        }

        if (comm_socket.connected) {
            comm_socket.send("voice/join", channel);
        }
        comm_socket.on("voice-data", this.handleAudio);
    }
    part = (channel) => {
        if (comm_socket.connected) {
            comm_socket.send("voice/part", channel);
        }
        comm_socket.off("voice-data", this.handleAudio);
    }

    stop(event?) {
        if (this.ctx) {
            this.ctx.close();
            if (event) { /* ie manually clicked */
                this.setState({playing: false, autoplay: false});
            } else {
                this.setState({playing: false});
            }
        }
        this.ctx = null;
    }

    play() {
        if (this.ctx) {
            this.stop();
        }

        let x = 0;
        this.ctx = new AudioContext();
        let node = this.ctx.createScriptProcessor(1024, 1, 1);
        let sample_rate = this.ctx.sampleRate;

        let frequency = 440;

        node.onaudioprocess = (e) => {
            let data = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < data.length; ++i) {
                data[i] = 0;
            }
            let ct = 0;
            for (let player_id in this.buffers) {
                let buffer_empty = !(this.buffers[player_id].drain_into(data));
                if (buffer_empty) {
                    delete this.buffers[player_id];
                }
                ++ct;
            }

            if (Object.keys(this.buffers).length === 0) {
                this.stop();
            }
        };

        let gain = this.ctx.createGain();
        let compressor = this.ctx.createDynamicsCompressor();

        gain.gain.value = 4.0;
        node.connect(gain);
        gain.connect(compressor);
        compressor.connect(this.ctx.destination);

        if (!this.state.playing) {
            this.setState({playing: true});
        }
    }

    playing(): boolean {
        return !!this.ctx;
    }

    autoplay_timeout = null;
    handleAudio = (obj) => {{{
        let channel = obj.channel;
        if (channel !== this.state.channel) {
            return;
        }

        let player_id = obj.player_id;
        let buffer = new Int16Array(obj.buffer);

        if (!(player_id in this.buffers)) {
            this.buffers[player_id] = new AudioBuffer(player_id);
        }

        this.buffers[player_id].add(buffer);
        if (this.state.autoplay && !this.playing()) {
            if (!this.autoplay_timeout) {
                this.autoplay_timeout = setTimeout(() => {
                    this.autoplay_timeout = null;
                    if (this.state.autoplay && !this.playing()) {
                        this.play();
                    }
                }, 100);
            }
        }
    }}}

    beginBroadcasting() {{{
        this.setState({broadcasting: true});

        if (this.recorder == null) {
            this.recorder = navigator.mediaDevices.getUserMedia({audio: true});
        }

        this.recorder.then((stream) => {
            window["stream"] = stream;

            this.recorder_stream = stream;
            let ctx = this.recorder_context = new AudioContext();
            let input = this.recorder_input = ctx.createMediaStreamSource(stream);
            let recorder = this.recorder_script = ctx.createScriptProcessor(4096, 1, 1);

            recorder.onaudioprocess = ((ev) => {
                let left = ev.inputBuffer.getChannelData(0);
                let int16Buffer = new Int16Array(left.length);

                for (let i = 0, len = left.length; i < len; i++) {
                    if (left[i] < 0) {
                        int16Buffer[i] = 0x8000 * left[i];
                    } else {
                        int16Buffer[i] = 0x7FFF * left[i];
                    }
                }

                comm_socket.send("voice/broadcast", {
                    "channel": this.state.channel,
                    "buffer": int16Buffer.buffer
                });
            });
            input.connect(recorder);
            recorder.connect(ctx.destination);
        });

        /* workaround for https://github.com/Microsoft/TypeScript/issues/10242 */
        (this.recorder as any).catch(errorLogger);

    }}}

    endBroadcasting() {{{
        this.setState({broadcasting: false});
        if (this.recorder) {
            this.recorder = null;
        }
        if (this.recorder_stream) {
            this.recorder_stream.getTracks().map((t) => t.stop());
            this.recorder_input.disconnect(this.recorder_script);
            this.recorder_script.disconnect(this.recorder_context.destination);
            this.recorder_context.close();

            this.recorder_stream = null;
            this.recorder_script = null;
            this.recorder_context = null;
        }
        /*
        if (this.recorder) {
            this.recorder = null;
        }
        */
    }}}

    toggleBroadcasting = () => {{{
        if (this.state.broadcasting) {
            this.endBroadcasting();
        } else {
            this.beginBroadcasting();
        }
    }}}

    togglePlay = (event) => {{{
        if (this.playing()) {
            this.stop(event);
        } else {
            this.play();
        }
    }}}


    render() {
        let cls = "fa-microphone";

        return (
            <span className="VoiceChat">
                <i
                    className={`fa fa-phone-square ${this.state.playing ? "active" : ""}`}
                    onClick={this.togglePlay}
                />
                {(this.props.hasVoice || null) &&
                    <i
                        className={`fa fa-microphone ${this.state.broadcasting ? "active" : ""}`}
                        onClick={this.toggleBroadcasting}
                    />
                }
            </span>
        );
    }
}
