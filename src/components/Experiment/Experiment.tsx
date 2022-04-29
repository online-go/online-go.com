/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import * as data from "data";
import { Default } from "./Default";

interface ExperimentProps {
    name: string;
    children: React.ReactElement[];
}

export function Experiment({ name, children }: ExperimentProps): JSX.Element {
    if (children.filter((x) => x.type === Default).length !== 1) {
        throw new Error("Experiment must have exactly one Default child");
    }

    const [selected, setSelected] = React.useState(data.get(`experiments.${name}`));

    React.useEffect(() => {
        const onChange = (value: string) => {
            setSelected(value);
        };

        data.watch(`experiments.${name}`, onChange);

        return () => {
            data.unwatch(`experiments.${name}`, onChange);
        };
    }, [name]);

    const matching_child =
        children.find((x) => x.props?.value === selected) ||
        children.find((x) => x.type === Default);

    if (matching_child.type === Default && selected) {
        console.warn("Experiment", name, "has no matching child for value", selected);
    }

    React.useEffect(() => {
        const body_class = matching_child?.props?.bodyclass;
        if (body_class) {
            document.body.classList.add(body_class);
            return () => {
                document.body.classList.remove(body_class);
            };
        }
    }, [matching_child]);

    return matching_child;
}
