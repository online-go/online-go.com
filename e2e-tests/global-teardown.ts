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

import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalTeardown() {
    const playwrightDir = path.join(__dirname, "playwright");
    if (!fs.existsSync(playwrightDir)) {
        fs.mkdirSync(playwrightDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    fs.writeFileSync(path.join(playwrightDir, "last_run.txt"), timestamp);
    console.log("Last run time saved:", timestamp);
}

export async function checkLastRunTime() {
    const playwrightDir = path.join(__dirname, "playwright");
    const lastRunFile = path.join(playwrightDir, "last_run.txt");

    if (fs.existsSync(lastRunFile)) {
        const lastRunTime = new Date(fs.readFileSync(lastRunFile, "utf8").trim());
        const now = new Date();
        const diffMs = now.getTime() - lastRunTime.getTime();
        const diffSeconds = diffMs / 1000;
        const minWaitMs = 2000; // Wait minimum 2 seconds for username uniqueness (~1.3s actual)

        if (diffMs < minWaitMs) {
            const waitTime = Math.ceil((minWaitMs - diffMs) / 1000);
            console.log(
                `Waiting ${waitTime} seconds for next unique username, since last run was ${Math.round(
                    diffSeconds,
                )} seconds ago`,
            );
            const sharedArray = new SharedArrayBuffer(4);
            const sharedArrayView = new Int32Array(sharedArray);
            Atomics.wait(sharedArrayView, 0, 0, minWaitMs - diffMs);
        }
    } else {
        console.log("No last run time found");
    }
}
