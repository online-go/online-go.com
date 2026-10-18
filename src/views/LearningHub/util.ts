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

import * as data from "@/lib/data";
import { sections, all_sections } from "./sections";
import { LearningHubSection } from "./LearningHubSection";

interface SectionCompletion {
    first: boolean /* if this is the first section in a category */;
    started: boolean /* if this has been started */;
    completed: boolean /* if we've completed this section */;
    finished: number /* number of pages completed in the section */;
    total: number /* total number of pages in the section */;
}

export function getSectionCompletion(section_name: string): SectionCompletion {
    let first = false;
    let started = false;
    let completed = false;
    let finished = 0;
    let total = 0;

    for (const arr of sections) {
        if (arr[1][0].section() === section_name) {
            first = true;
        }
    }

    let section: any = null;
    for (const S of all_sections) {
        if (S.section() === section_name) {
            section = S;
            break;
        }
    }

    const completion = getCompletion(section_name);
    total = section.pages().length;
    for (let i = 0; i < total; ++i) {
        if (i in completion) {
            finished++;
        }
    }

    completed = finished === total;
    started = finished > 0;

    return {
        first,
        started,
        completed,
        finished,
        total,
    };
}

export function getSectionByName(section_name: string): typeof LearningHubSection | null {
    for (const S of all_sections) {
        if (S.section() === section_name) {
            return S;
        }
    }

    return null;
}

export function getFirstUncompletedPage(section_name: string): number {
    const completion = getCompletion(section_name);
    let section: any = null;
    for (const S of all_sections) {
        if (S.section() === section_name) {
            section = S;
            break;
        }
    }

    for (let i = 0; i < section.pages().length; ++i) {
        if (!(i in completion)) {
            return i;
        }
    }

    return 0;
}

type Completion = { [page_number: number]: true };

function completionKey(section_name: string): `learning-hub.${string}` {
    return `learning-hub.${section_name}`;
}

/**
 * Pages completed in a section: the union of this device's copy and the
 * server's copy. A device can hold pages the server has never seen (completed
 * while logged out, or before progress was replicated), and the server can
 * hold pages completed on other devices. Neither side is allowed to hide the
 * other's pages.
 */
function getCompletion(section_name: string): Completion {
    const key = completionKey(section_name);
    return { ...(data.getRemote(key) ?? {}), ...(data.get(key) ?? {}) };
}

export function setSectionPageCompleted(section_name: string, page_number: number): void {
    const completion: Completion = { ...getCompletion(section_name) };
    completion[page_number] = true;
    // LOCAL_OVERWRITES_REMOTE keeps the server's copy separate from this
    // device's copy, so the union above survives a sync. A replicated reset
    // (see resetProgress) still clears this device.
    data.set(completionKey(section_name), completion, data.Replication.LOCAL_OVERWRITES_REMOTE);
}

export function getSectionPageCompleted(section_name: string, page_number: number): boolean {
    return page_number in getCompletion(section_name);
}

/** Clears lesson progress on this device, on the server, and on every other device. */
export function resetProgress(): void {
    for (const S of all_sections) {
        data.remove(completionKey(S.section()), data.Replication.REMOTE_OVERWRITES_LOCAL);
    }
}
