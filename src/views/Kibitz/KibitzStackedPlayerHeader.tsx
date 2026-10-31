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
import { KibitzThinPlayer } from "./KibitzThinPlayer";
import { useKibitzThinHeader } from "./kibitzThinHeader";
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
    if (!thin) {
        return fullHeader;
    }
    return (
        <div className="KibitzStackedPlayerHeader">
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
        </div>
    );
}
