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
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Use process.cwd() which is the ogs-ui root when running playwright
const PROJECT_ROOT = process.cwd();
const INIT_E2E_SCRIPT_PATH = join(
    PROJECT_ROOT,
    "../ogs/ogs/joseki/management/commands/init_e2e.py",
);
const HASH_FILE_PATH = join(PROJECT_ROOT, ".init_e2e_hash");

/**
 * Checks if the init_e2e.py script has changed since last run.
 * If changed, runs the script to update seed data and saves the new hash.
 */
async function checkAndUpdateSeedData() {
    console.log("=== Global Setup: Checking seed data ===");

    try {
        // Check if the init_e2e script exists
        if (!existsSync(INIT_E2E_SCRIPT_PATH)) {
            console.log(
                `init_e2e.py not found at ${INIT_E2E_SCRIPT_PATH} - skipping seed data check`,
            );
            return;
        }

        // Calculate current hash of init_e2e.py
        const scriptContent = readFileSync(INIT_E2E_SCRIPT_PATH, "utf-8");
        const currentHash = createHash("md5").update(scriptContent).digest("hex");

        // Read previous hash if it exists
        let previousHash = "";
        if (existsSync(HASH_FILE_PATH)) {
            previousHash = readFileSync(HASH_FILE_PATH, "utf-8").trim();
        }

        if (currentHash === previousHash) {
            console.log("init_e2e.py unchanged - seed data is up to date");
            return;
        }

        console.log("init_e2e.py has changed - updating seed data...");
        console.log(`  Previous hash: ${previousHash || "(none)"}`);
        console.log(`  Current hash:  ${currentHash}`);

        // Run init_e2e via docker
        try {
            execSync("docker exec ogs_django_1 ogs-manage init_e2e", {
                stdio: "inherit",
                timeout: 60000, // 60 second timeout
            });
            console.log("Seed data updated successfully");

            // Save the new hash
            writeFileSync(HASH_FILE_PATH, currentHash);
            console.log("Hash file updated");
        } catch (error) {
            console.error("Failed to run init_e2e:", error);
            console.log("Continuing with tests anyway - seed data may be stale");
        }
    } catch (error) {
        console.log("Seed data check failed (this is non-fatal):", error);
    }
}

async function globalSetup() {
    await checkAndUpdateSeedData();

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
