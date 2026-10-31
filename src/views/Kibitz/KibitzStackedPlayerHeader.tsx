/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 */

import * as React from "react";
import { useGobanViewLayout } from "@/components/GobanView";
import { CompactPlayerHeader } from "@/views/Game/CompactPlayerHeader";
import type { GobanController } from "@/lib/GobanController";
import { pgettext } from "@/lib/translate";
import { KibitzThinPlayer } from "./KibitzThinPlayer";
import { setKibitzHeaderOverride, useKibitzThinHeader } from "./kibitzThinHeader";
import "./KibitzStackedPlayerHeader.css";

export function KibitzStackedPlayerHeader({
    controller,
    estimatingScore,
}: {
    controller: GobanController | null;
    estimatingScore: boolean;
}): React.ReactElement | null {
    const { mode } = useGobanViewLayout();
    const thin = useKibitzThinHeader();
    if (mode !== "stacked" || !controller) {
        return null;
    }
    const fullHeader = (
        <CompactPlayerHeader
            historical_black={null}
            historical_white={null}
            estimating_score={estimatingScore}
            show_cached_avatar_fallback
            controller={controller}
        />
    );
    return (
        <div
            className={`KibitzStackedPlayerHeader${thin ? "" : " KibitzStackedPlayerHeader-full"}`}
        >
            {thin ? (
                <div className="KibitzStackedPlayerHeader-strip">
                    <KibitzThinPlayer
                        key={`black-${controller.goban.game_id}`}
                        controller={controller}
                        color="black"
                    />
                    <KibitzThinPlayer
                        key={`white-${controller.goban.game_id}`}
                        controller={controller}
                        color="white"
                    />
                </div>
            ) : (
                fullHeader
            )}
            <button
                type="button"
                className="KibitzStackedPlayerHeader-toggle"
                aria-label={
                    thin
                        ? pgettext("Kibitz header", "Use original header")
                        : pgettext("Kibitz header", "Use compact header")
                }
                onClick={() => setKibitzHeaderOverride(!thin)}
            />
        </div>
    );
}
