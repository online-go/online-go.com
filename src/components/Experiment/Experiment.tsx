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

import * as React from "react";
import { useData } from "@/lib/hooks";
import { Default } from "./Default";

interface ExperimentProps {
    name: string;
    children: React.ReactElement[];
}

export function Experiment({ name, children }: ExperimentProps): React.ReactElement | undefined {
    if (children.filter((x) => x.type === Default).length !== 1) {
        throw new Error("Experiment must have exactly one Default child");
    }

    const [selected] = useData(`experiments.${name}`);

    const matching_child =
        children.find((x) => (x.props as any)?.value === selected) ||
        children.find((x) => x.type === Default);

    if (matching_child?.type === Default && selected) {
        console.warn("Experiment", name, "has no matching child for value", selected);
    }

    React.useEffect((): (() => void) | void => {
        const body_class = (matching_child?.props as any)?.bodyclass; // cspell: disable-line
        if (body_class) {
            document.body.classList.add(body_class);
            return () => {
                document.body.classList.remove(body_class);
            };
        }
    }, [matching_child]);

    return matching_child;
}
