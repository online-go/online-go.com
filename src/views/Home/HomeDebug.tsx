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
import { useUser } from "@/lib/hooks";
import "./HomeDebug.css";

export type DebugOverride = "default" | "on" | "off";

export interface HomeDebugOverrides {
    [key: string]: DebugOverride;
}

const STORAGE_KEY = "home-debug-overrides";

const COMPONENT_NAMES = [
    "SupporterProblems",
    "PriceIncreaseMessage",
    "FreeTrialBanner",
    "FreeTrialSurvey",
    "DismissableMessages",
    "EmailBanner",
    "PaymentProblemBanner",
    "ActiveAnnouncements",
    "ModerationOffer",
    "ChallengesList",
    "InviteList",
    "ActiveDroppedGameList",
    "ProfileCard",
    "TournamentList",
    "LadderList",
    "GroupList",
    "HomeFriendList",
] as const;

function loadOverrides(): HomeDebugOverrides {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as HomeDebugOverrides;
        }
    } catch (e) {
        console.error(e);
    }
    return {};
}

function saveOverrides(overrides: HomeDebugOverrides): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

interface HomeDebugProps {
    overrides: HomeDebugOverrides;
    setOverrides: (overrides: HomeDebugOverrides) => void;
}

export function HomeDebug({ overrides, setOverrides }: HomeDebugProps): React.ReactElement | null {
    const [open, setOpen] = React.useState(false);
    const user = useUser();

    if (process.env.NODE_ENV !== "development" || !user || user.id !== 1) {
        return null;
    }

    const hasOverrides = Object.values(overrides).some((v) => v !== "default");

    const cycleOverride = (name: string) => {
        const current = overrides[name] || "default";
        let next: DebugOverride;
        if (current === "default") {
            next = "on";
        } else if (current === "on") {
            next = "off";
        } else {
            next = "default";
        }

        const updated = { ...overrides, [name]: next };
        setOverrides(updated);
        saveOverrides(updated);
    };

    const resetAll = () => {
        setOverrides({});
        saveOverrides({});
    };

    return (
        <div className="HomeDebug">
            {open && (
                <div className="HomeDebug-dropdown">
                    {hasOverrides && (
                        <div className="HomeDebug-reset" onClick={resetAll}>
                            Reset All
                        </div>
                    )}
                    {COMPONENT_NAMES.map((name) => {
                        const state = overrides[name] || "default";
                        return (
                            <div
                                key={name}
                                className={`HomeDebug-item ${state}`}
                                onClick={() => cycleOverride(name)}
                            >
                                <span className={`HomeDebug-state ${state}`}>
                                    {state === "on" ? "ON" : state === "off" ? "OFF" : "--"}
                                </span>
                                <span className="HomeDebug-name">{name}</span>
                            </div>
                        );
                    })}
                </div>
            )}
            <button className="HomeDebug-toggle" onClick={() => setOpen(!open)}>
                DBG
            </button>
        </div>
    );
}

export function useHomeDebugOverrides(): [HomeDebugOverrides, (o: HomeDebugOverrides) => void] {
    const [overrides, setOverrides] = React.useState<HomeDebugOverrides>(loadOverrides);
    return [overrides, setOverrides];
}

// Returns true if the component should be rendered
export function shouldRender(
    overrides: HomeDebugOverrides,
    name: string,
    defaultValue: boolean = true,
): boolean {
    const override = overrides[name];
    if (override === "on") {
        return true;
    }
    if (override === "off") {
        return false;
    }
    return defaultValue;
}

// Returns true if the component is being forced on via debug panel
export function isForced(overrides: HomeDebugOverrides, name: string): boolean {
    return overrides[name] === "on";
}
