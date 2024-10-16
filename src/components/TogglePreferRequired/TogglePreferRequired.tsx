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

/* This is a toggle switch with three positions that is used in our Automatch system
 * to indicate whether the user prefers or requires a certain setting, or doesn't
 * care. There are five possible states:
 *
 *  o--x--o     don't care
 *  x--x--o     prefer left
 *  x--o--o     require left
 *  o--x--x     prefer right
 *  o--o--x     require right
 */

import * as React from "react";
import { pgettext } from "@/lib/translate";

export type PreferRequireIndifferent = "prefer" | "require" | "indifferent";

interface TogglePreferRequiredProps {
    left: string;
    right: string;
    priority: PreferRequireIndifferent;
    value: string;
    onChange: (priority: PreferRequireIndifferent, value: string) => void;
    children: React.ReactNode[];
}

export function TogglePreferRequired({
    left,
    right,
    priority,
    value,
    onChange,
    children,
}: TogglePreferRequiredProps): JSX.Element {
    if (children.length !== 2) {
        console.warn("TogglePreferRequired expects exactly two children");
    }

    const onChangeIfChanged = (_priority: PreferRequireIndifferent, _value: string) => {
        if (_priority !== priority || _value !== value) {
            onChange(_priority, _value);
        }
    };

    const onLeftMidClick = () => {
        if (priority === "prefer" && value === left) {
            onChangeIfChanged("require", left);
        } else {
            onChangeIfChanged("prefer", left);
        }
    };
    const onRightMidClick = () => {
        if (priority === "prefer" && value === right) {
            onChangeIfChanged("require", right);
        } else {
            onChangeIfChanged("prefer", right);
        }
    };

    const onHandleClick = (ev: React.MouseEvent<HTMLSpanElement>) => {
        ev.preventDefault();
        ev.stopPropagation();
        let target = ev.target as HTMLElement;
        while (target.className.indexOf("handle") < 0 && target.parentElement) {
            target = target.parentElement;
        }
        const cls = target.className;
        console.log("onHandleClick", cls);

        if (cls.indexOf("indifferent") >= 0) {
            if (priority === "indifferent") {
                onChangeIfChanged("prefer", value);
            } else {
                onChangeIfChanged("indifferent", value);
            }

            return;
        }

        if (cls.indexOf("left") >= 0) {
            if (priority === "prefer" && value === left) {
                onChangeIfChanged("require", left);
            } else {
                onChangeIfChanged("prefer", left);
            }
        }

        if (cls.indexOf("right") >= 0) {
            if (priority === "prefer" && value === right) {
                onChangeIfChanged("require", right);
            } else {
                onChangeIfChanged("prefer", right);
            }
        }
    };

    return (
        <span className="TogglePreferRequired-outer">
            <span
                className={
                    "handle left" +
                    (priority === "indifferent"
                        ? " indifferent"
                        : priority === "require" && value === left
                          ? " require"
                          : priority === "require" && value === right
                            ? " exclude"
                            : priority === "prefer" && value === left
                              ? " prefer"
                              : "")
                }
                onClick={onHandleClick}
            >
                {children[0]}
            </span>
            <span className={"TogglePreferRequired-container"}>
                <span className={"TogglePreferRequired"}>
                    <span
                        className={
                            priority +
                            " mid left " +
                            (priority !== "indifferent" && value === left ? "active" : "")
                        }
                        onClick={onLeftMidClick}
                    />
                    <span
                        className={
                            priority +
                            " mid right " +
                            (priority !== "indifferent" && value === right ? "active" : "")
                        }
                        onClick={onRightMidClick}
                    />

                    <span
                        key="one"
                        className={
                            "handle " +
                            (priority === "require" ? "require " : "") +
                            (priority === "indifferent"
                                ? "indifferent priority-indifferent"
                                : priority === "require"
                                  ? value === left
                                      ? "left"
                                      : "right"
                                  : value === left
                                    ? "left"
                                    : "indifferent")
                        }
                        onClick={onHandleClick}
                    />
                    <span
                        key="two"
                        className={
                            "handle " +
                            (priority === "require" ? "require " : "") +
                            (priority === "indifferent"
                                ? "indifferent priority-indifferent"
                                : priority === "require"
                                  ? value === left
                                      ? "left"
                                      : "right"
                                  : value === left
                                    ? "indifferent"
                                    : "right")
                        }
                        onClick={onHandleClick}
                    />
                </span>
                {priority === "indifferent" ? (
                    <span className="priority indifferent">
                        {pgettext(
                            "Preference priority: indifferent, prefer, or require",
                            "Indifferent",
                        )}
                    </span>
                ) : priority === "prefer" ? (
                    <span className="priority preferred">
                        {pgettext("Preference priority: indifferent, prefer, or require", "Prefer")}
                    </span>
                ) : (
                    <span className="priority required">
                        {pgettext(
                            "Preference priority: indifferent, prefer, or require",
                            "Require",
                        )}
                    </span>
                )}
            </span>
            <span
                className={
                    "handle right" +
                    (priority === "indifferent"
                        ? " indifferent"
                        : priority === "require" && value === right
                          ? " require"
                          : priority === "require" && value === left
                            ? " exclude"
                            : priority === "prefer" && value === right
                              ? " prefer"
                              : "")
                }
                onClick={onHandleClick}
            >
                {children[1]}
            </span>
        </span>
    );
}
