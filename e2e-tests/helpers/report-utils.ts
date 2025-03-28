/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 */

import * as fs from "fs";
import * as path from "path";

class IncidentIndicatorLock {
    private static lockFile = path.join(process.cwd(), ".incident-indicator.lock");
    private static lockHandle: fs.promises.FileHandle | null = null;

    static async acquire(): Promise<void> {
        while (true) {
            try {
                this.lockHandle = await fs.promises.open(this.lockFile, "wx");
                return;
            } catch (err) {
                if ((err as NodeJS.ErrnoException).code === "EEXIST") {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    continue;
                }
                throw err;
            }
        }
    }

    static async release(): Promise<void> {
        if (this.lockHandle) {
            await this.lockHandle.close();
            await fs.promises.unlink(this.lockFile);
            this.lockHandle = null;
        }
    }
}

export async function withIncidentIndicatorLock<T>(
    testInfo: { setTimeout: (timeout: number) => void },
    fn: () => Promise<T>,
): Promise<T> {
    testInfo.setTimeout(0); // Disable timeout while waiting for lock
    await IncidentIndicatorLock.acquire();
    testInfo.setTimeout(120000); // Restore a timeout after acquiring lock (yuk, hardcoded here)

    try {
        return await fn();
    } finally {
        await IncidentIndicatorLock.release();
    }
}
