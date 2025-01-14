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
import * as preferences from "@/lib/preferences";
import { usePreference } from "@/lib/preferences";
import { report_categories } from "@/components/Report";
import { Toggle } from "@/components/Toggle";

const categories = ([] as any[]).concat(report_categories).concat([
    {
        type: "appeal",
        title: "Appeals",
        description: "",
    },
]);

export function getReportSettings(): { [key: string]: { priority: number; visible: boolean } } {
    const stored = preferences.get("moderator.report-settings");
    const ret: { [key: string]: { priority: number; visible: boolean } } = {};
    for (const category of categories) {
        if (category.type in stored) {
            ret[category.type] = {
                priority: stored[category.type].priority ?? 1,
                visible: stored[category.type].visible !== false,
            };
        } else {
            ret[category.type] = { priority: 1, visible: true };
        }
    }

    return ret;
}

export function ReportsCenterSettings(): React.ReactElement {
    const [state, setState] = React.useState(getReportSettings());
    const [sortOrder, setSortOrder] = usePreference("moderator.report-sort-order");

    const setPriority = React.useCallback((type: string, priority: number) => {
        const new_state = Object.assign({}, state);
        new_state[type].priority = priority;
        preferences.set("moderator.report-settings", new_state);
        setState(new_state);
    }, []);

    const setVisible = React.useCallback((type: string, visible: boolean) => {
        const new_state = Object.assign({}, state);
        new_state[type].visible = visible;
        preferences.set("moderator.report-settings", new_state);
        setState(new_state);
    }, []);

    return (
        <div className="ReportsCenterSettings">
            <h3>Reports Center Settings</h3>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Visible</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => {
                        const priority = state[category.type].priority;
                        const visible = state[category.type].visible;
                        return (
                            <tr className="category" key={category.type}>
                                <th>{category.title}</th>
                                <td>
                                    <input
                                        type="number"
                                        value={priority}
                                        onChange={(ev) =>
                                            setPriority(
                                                category.type,
                                                parseInt(ev.target.value, 10),
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <div className="center">
                                        <Toggle
                                            checked={visible}
                                            onChange={() => setVisible(category.type, !visible)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <footer>
                * Priority is used to sort the reports, lower numbers are higher priority.
            </footer>

            <h3>Report Ordering</h3>
            <select onChange={(ev) => setSortOrder(ev.target.value as any)} value={sortOrder}>
                <option value="newest-first">Newest First</option>
                <option value="oldest-first">Oldest First</option>
            </select>
        </div>
    );
}
