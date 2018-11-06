/*
 * Copyright (C) 2012-2017  Online-Go.com
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

import * as data from "data";
import {sections, allsections} from './sections';
import {LearningHubSection} from './LearningHubSection';

interface SectionCompletion {
    first:boolean;      /* if this is the first section in a category */
    started:boolean;    /* if this has been started */
    completed:boolean;  /* if we've completed this section */
    finished:number;    /* number of pages completed in the section */
    total:number;       /* total number of pages in the section */
}

export function getSectionCompletion(section_name:string):SectionCompletion {
    let first = false;
    let started = false;
    let completed = false;
    let finished = 0;
    let total = 0;

    for (let arr of sections) {
        if (arr[1][0].section() === section_name) {
            first = true;
        }
    }

    let section = null;
    for (let S of allsections) {
        if (S.section() === section_name) {
            section = S;
            break;
        }
    }

    let completion = data.get(`learning-hub.${section_name}`, {});
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
        total
    };
}

export function getSectionByName(section_name:string):typeof LearningHubSection {
    for (let S of allsections) {
        if (S.section() === section_name) {
            return S;
        }
    }

    return null;
}

export function getFirstUncompletedPage(section_name:string):number {
    let completion = data.get(`learning-hub.${section_name}`, {});
    let section = null;
    for (let S of allsections) {
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

export function setSectionPageCompleted(section_name:string, page_number:number):void {
    let completion = data.get(`learning-hub.${section_name}`, {});
    completion[page_number] = true;
    data.set(`learning-hub.${section_name}`, completion);
}

export function getSectionPageCompleted(section_name:string, page_number:number):boolean {
    let completion = data.get(`learning-hub.${section_name}`, {});
    return page_number in completion;
}
