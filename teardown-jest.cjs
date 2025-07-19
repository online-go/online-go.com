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

module.exports = async () => {
    // Force garbage collection to clean up any remaining references
    if (global.gc) {
        global.gc();
    }

    // Clean up any remaining socket connections
    if (global.window && global.window.socket) {
        try {
            global.window.socket.disconnect();
        } catch (e) {
            // Ignore errors during cleanup
        }
    }

    // Clean up any remaining WebSocket connections
    if (global.window && global.window.WebSocket) {
        // Close any remaining WebSocket connections
        const openSockets = global.window.WebSocket.prototype.constructor;
        if (openSockets && openSockets.readyState !== 3) {
            // 3 = CLOSED
            try {
                openSockets.close();
            } catch (e) {
                // Ignore errors during cleanup
            }
        }
    }
};
