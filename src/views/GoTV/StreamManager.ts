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

import { get } from "@/lib/requests";
import * as preferences from "@/lib/preferences";
import { EventEmitter } from "eventemitter3";
import { socket } from "@/lib/sockets";

interface StreamEvents {
    update: (streams: Stream[]) => void;
}

export interface Stream {
    stream_id: string;
    title: string;
    channel: string;
    username: string;
    viewer_count: number;
    language: string;
    thumbnail_url: string;
    source: string;
    is_mature: boolean;
    profile_image_url: string;
}

// StreamManager is a singleton class that manages the fetching, filtering, and updating of live streams
class StreamManager extends EventEmitter<StreamEvents> {
    private static instance: StreamManager;
    private streams: Stream[] = [];
    private allowMatureStreams: boolean;
    private selectedLanguages: string[];

    // Private constructor to enforce singleton pattern
    private constructor() {
        super();
        this.allowMatureStreams = preferences.get("gotv.allow-mature-streams");
        this.selectedLanguages = preferences.get("gotv.selected-languages");
        this.fetchStreams();

        // Watch for changes in user preferences
        preferences.watch("gotv.allow-mature-streams", this.updatePreferences.bind(this));
        preferences.watch("gotv.selected-languages", this.updatePreferences.bind(this));

        // Set up WebSocket connection for real-time updates
        this.setupWebSocket();
    }

    // Static method to get the singleton instance
    public static getInstance(): StreamManager {
        if (!StreamManager.instance) {
            StreamManager.instance = new StreamManager();
        }
        return StreamManager.instance;
    }

    // Update preferences and refetch streams
    private updatePreferences() {
        this.allowMatureStreams = preferences.get("gotv.allow-mature-streams");
        this.selectedLanguages = preferences.get("gotv.selected-languages");
        this.fetchStreams();
    }

    // Filter streams based on user preferences
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

    // Fetch streams from the server
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

    // Set up WebSocket connection to receive real-time updates
    private setupWebSocket() {
        socket.on("ui-push", (msg) => {
            if (msg.event === "update_streams") {
                const updatedStreams = JSON.parse(msg.data);
                this.streams = this.filterStreams(updatedStreams);
                this.emit("update", this.streams);
            }
        });

        // Subscribe to the GoTV channel for updates
        const subscribeToChannel = () => {
            socket.send("ui-pushes/subscribe", { channel: "gotv" });
        };

        socket.on("connect", subscribeToChannel);

        if (socket.connected) {
            subscribeToChannel();
        }
    }

    // Get the current list of streams
    public getStreams(): Stream[] {
        return this.streams;
    }
}

// Export the singleton instance of StreamManager
export const streamManager = StreamManager.getInstance();
