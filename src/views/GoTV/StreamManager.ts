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

import { get } from "requests";
import { Stream } from "GoTV";
import * as preferences from "preferences";
import { EventEmitter } from "eventemitter3";
import { socket } from "sockets";

interface StreamEvents {
    update: (streams: Stream[]) => void;
}

class StreamManager extends EventEmitter<StreamEvents> {
    private static instance: StreamManager;
    private streams: Stream[] = [];
    private allowMatureStreams: boolean;
    private selectedLanguages: string[];

    private constructor() {
        super();
        this.allowMatureStreams = preferences.get("gotv.allow-mature-streams");
        this.selectedLanguages = preferences.get("gotv.selected-languages");
        this.fetchStreams();
        preferences.watch("gotv.allow-mature-streams", this.updatePreferences.bind(this));
        preferences.watch("gotv.selected-languages", this.updatePreferences.bind(this));
        this.setupWebSocket();
    }

    public static getInstance(): StreamManager {
        if (!StreamManager.instance) {
            StreamManager.instance = new StreamManager();
        }
        return StreamManager.instance;
    }

    private updatePreferences() {
        this.allowMatureStreams = preferences.get("gotv.allow-mature-streams");
        this.selectedLanguages = preferences.get("gotv.selected-languages");
        this.fetchStreams();
    }

    private filterStreams(streams: Stream[]): Stream[] {
        let filteredStreams = streams;
        if (!this.allowMatureStreams) {
            filteredStreams = filteredStreams.filter((stream) => !stream.is_mature);
        }
        if (this.selectedLanguages.length > 0 && this.selectedLanguages[0] !== "") {
            filteredStreams = filteredStreams.filter((stream) =>
                this.selectedLanguages.includes(stream.language),
            );
        }
        return filteredStreams;
    }

    public fetchStreams() {
        get("gotv/streams")
            .then((streams: Stream[]) => {
                this.streams = this.filterStreams(streams);
                this.emit("update", this.streams);
            })
            .catch((error) => {
                console.error("Error fetching streams:", error);
            });
    }

    private setupWebSocket() {
        socket.on("ui-push", (msg) => {
            if (msg.event === "update_streams") {
                const updatedStreams = JSON.parse(msg.data);
                this.streams = this.filterStreams(updatedStreams);
                this.emit("update", this.streams);
            }
        });

        const subscribeToChannel = () => {
            socket.send("ui-pushes/subscribe", { channel: "gotv" });
        };

        socket.on("connect", subscribeToChannel);

        if (socket.connected) {
            subscribeToChannel();
        }
    }
    public getStreams(): Stream[] {
        return this.streams;
    }
}

export const streamManager = StreamManager.getInstance();
