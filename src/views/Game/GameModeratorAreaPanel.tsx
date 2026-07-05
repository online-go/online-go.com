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
import { usePreference } from "@/lib/preferences";
import { useGobanController } from "./goban_context";
import { usePhase } from "./GameHooks";
import { PlayerModSection } from "./PlayerModSection";
import "./GameModeratorAreaPanel.css";

type PlayerType = rest_api.games.Player;

interface GameModeratorAreaPanelProps {
    historical_black: PlayerType | null;
    historical_white: PlayerType | null;
    black_flags: rest_api.GamePlayerFlags | null;
    white_flags: rest_api.GamePlayerFlags | null;
    bot_detection_results: rest_api.BotDetectionResults | null;
}

/**
 * Per-player moderator panel: navigation/annul controls and flag
 * indicators (AI Suspected, blur rate, slow_moving) for each color. Sits
 * inside the gavel toggle tab alongside GameModToolsPanel.
 *
 * Renders `null` for non-moderators (or games without an id), so it can
 * be dropped into the toggle tab unconditionally — non-mods just see the
 * GameModToolsPanel content (e.g. AI-detector inspect tools) below.
 */
export function GameModeratorAreaPanel({
    historical_black,
    historical_white,
    black_flags,
    white_flags,
    bot_detection_results,
}: GameModeratorAreaPanelProps): React.ReactElement | null {
    const goban_controller = useGobanController();
    const goban = goban_controller.goban;
    const engine = goban.engine;
    const user = useUser();
    const phase = usePhase(goban);
    const [hide_flags] = usePreference("moderator.hide-flags");
    const [hide_controls] = usePreference("moderator.hide-player-card-mod-controls");
    const game_id = goban.config.game_id ? Number(goban.config.game_id) : 0;

    if (!user?.is_moderator || !game_id) {
        return null;
    }

    const black_ai_suspected =
        historical_black?.id != null &&
        !!bot_detection_results?.ai_suspected?.includes(historical_black.id);
    const white_ai_suspected =
        historical_white?.id != null &&
        !!bot_detection_results?.ai_suspected?.includes(historical_white.id);

    return (
        <div className="GameModeratorAreaPanel">
            <PlayerModSection
                color="black"
                player_id={engine.players.black?.id}
                historical={historical_black}
                ai_suspected={black_ai_suspected}
                flags={black_flags}
                hide_flags={hide_flags}
                hide_controls={hide_controls}
                phase={phase}
                game_id={game_id}
            />
            <PlayerModSection
                color="white"
                player_id={engine.players.white?.id}
                historical={historical_white}
                ai_suspected={white_ai_suspected}
                flags={white_flags}
                hide_flags={hide_flags}
                hide_controls={hide_controls}
                phase={phase}
                game_id={game_id}
            />
        </div>
    );
}
