import { totalmem } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function getE2EWorkers({
    totalMemory = totalmem(),
    memoryLimit = process.constrainedMemory?.() ?? 0,
    override = process.env.E2E_WORKERS,
} = {}) {
    if (override) {
        const workers = Number(override);
        if (!Number.isInteger(workers) || workers < 1) {
            throw new Error("E2E_WORKERS must be a positive integer");
        }
        return workers;
    }

    // The OS reports slightly less than installed RAM. Round host capacity up
    // to whole GiB, but apply a container's explicit limit without rounding.
    const gib = 1024 ** 3;
    const hostGiB = Math.ceil(totalMemory / gib);
    const ramGiB = memoryLimit > 0 ? Math.min(hostGiB, memoryLimit / gib) : hostGiB;
    if (ramGiB <= 16) return 2;
    if (ramGiB < 32) return 6;
    if (ramGiB < 48) return 8;
    return 16;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    console.log(getE2EWorkers());
}
