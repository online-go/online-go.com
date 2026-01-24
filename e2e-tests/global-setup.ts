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

import { execSync } from "child_process";

async function globalSetup() {
    console.log("=== Global Setup: Cleaning up leftover browser processes ===");

    try {
        // Check for leftover chromium renderer processes
        const result = execSync(
            "ps aux | grep 'chromium.*--type=renderer' | grep -v grep | wc -l",
            { encoding: "utf-8" },
        );
        const rendererCount = parseInt(result.trim(), 10);

        if (rendererCount > 0) {
            console.log(`Found ${rendererCount} leftover renderer processes from previous runs`);
            console.log("Cleaning up leftover renderers...");

            // Kill leftover chromium processes
            try {
                execSync("pkill -f chromium", { stdio: "inherit" });
                console.log("Leftover processes cleaned up successfully");
            } catch (error) {
                // pkill returns non-zero if no processes found, which is fine
                console.log("No processes to clean up or already cleaned", error);
            }

            // Wait a moment for processes to terminate
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
            console.log("No leftover renderer processes found - clean start!");
        }
    } catch (error) {
        console.log("Process cleanup check failed (this is non-fatal):", error);
    }

    console.log("=== Global Setup Complete ===");
}

export default globalSetup;
