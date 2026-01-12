/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";
import { GobanMovesArray } from "goban";

export interface FairPlayGameSummaryProps {
    game_id: number;
    black_player_id: number;
    white_player_id: number;
    currentMoveNumber?: number;
    /** When provided, filters results to this specific AI review UUID instead of showing the strongest */
    ai_review_uuid?: string;
    /** GameTimings props - when provided, renders GameTimings with fair play labels */
    moves?: GobanMovesArray;
    start_time?: number;
    end_time?: number;
    free_handicap_placement?: boolean;
    handicap?: number;
    simul_black?: boolean | null;
    simul_white?: boolean | null;
}

export function FairPlayGameSummary(_props: FairPlayGameSummaryProps): React.ReactElement | null {
    return (
        <div className="FairPlayGameSummary">
            <p>This feature is not available in the stub implementation.</p>
        </div>
    );
}
