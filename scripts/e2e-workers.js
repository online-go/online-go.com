import { availableParallelism, totalmem } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function getE2EWorkers({
    totalMemory = totalmem(),
    memoryLimit = process.constrainedMemory?.() ?? 0,
    cpuCount = availableParallelism(),
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
    let workers;
    if (ramGiB <= 16) workers = 2;
    else if (ramGiB < 32) workers = 6;
    else if (ramGiB < 48) workers = 8;
    else workers = 16;

    // RAM does not measure CPU. The backend stack usually shares the machine
    // and each worker drives several browser contexts, so cap by cores:
    // measured on a 10-core/32GiB host running the full Docker stack, the
    // RAM tier of 8 collapsed the suite, 4 left load at 59 with failures,
    // and 3 (cores/3) ran 72/72 fastest.
    const cpuCap = Math.max(2, Math.floor(cpuCount / 3));
    return Math.min(workers, cpuCap);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    console.log(getE2EWorkers());
}
