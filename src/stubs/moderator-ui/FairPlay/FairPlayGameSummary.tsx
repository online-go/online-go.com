/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";

export interface FairPlayGameSummaryProps {
    game_id: number;
    black_player_id: number;
    white_player_id: number;
    currentMoveNumber?: number;
}

export function FairPlayGameSummary(_props: FairPlayGameSummaryProps): React.ReactElement | null {
    return (
        <div className="FairPlayGameSummary">
            <p>This feature is not available in the stub implementation.</p>
        </div>
    );
}
