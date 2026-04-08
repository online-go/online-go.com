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
import { Link } from "react-router-dom";
import { Resizable } from "@/components/Resizable";
import { GobanController } from "@/lib/GobanController";
import { get } from "@/lib/requests";
import { interpolate, pgettext } from "@/lib/translate";
import type {
    KibitzMode,
    KibitzProposal,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzVariationSummary,
} from "@/models/kibitz";
import { KibitzBoard } from "./KibitzBoard";
import { KibitzBoardControls } from "./KibitzBoardControls";
import { KibitzDividerHandle } from "./KibitzDividerHandle";
import "./KibitzRoomStage.css";

interface KibitzRoomStageProps {
    mode: KibitzMode;
    room: KibitzRoomSummary;
    rooms: KibitzRoomSummary[];
    proposals: KibitzProposal[];
    variations: KibitzVariationSummary[];
    secondaryPane: KibitzSecondaryPaneState;
    onPreviewGame: (gameId: number) => void;
    onClearPreview: () => void;
    onProposePreview: () => void;
    onOpenVariation: (variationId: string) => void;
    onSetSecondaryPaneMode: (mode: "hidden" | "small" | "equal") => void;
}

function getPlayerRankText(player: unknown): string | null {
    if (!player || typeof player !== "object") {
        return null;
    }

    const candidate = player as Record<string, unknown>;
    const rankValue =
        candidate.rank_label ?? candidate.rank ?? candidate.rank_text ?? candidate.display_rank;

    return typeof rankValue === "string" && rankValue.trim().length > 0 ? rankValue.trim() : null;
}

function formatPlayerNameWithRank(username: string | undefined, ...players: unknown[]): string {
    const resolvedUsername = username ?? "";
    const rankText = players.map(getPlayerRankText).find((value) => Boolean(value));

    return rankText ? `${resolvedUsername} ${rankText}` : resolvedUsername;
}

function useSquareFitSize<T extends HTMLElement>() {
    const [element, setElement] = React.useState<T | null>(null);
    const [size, setSize] = React.useState(0);
    const ref = React.useCallback((node: T | null) => {
        setElement(node);
    }, []);

    React.useLayoutEffect(() => {
        if (!element) {
            setSize(0);
            return;
        }

        let raf = 0;

        const measure = () => {
            const nextSize = Math.max(
                0,
                Math.floor(Math.min(element.clientWidth, element.clientHeight)),
            );
            setSize((previousSize) => (previousSize === nextSize ? previousSize : nextSize));
        };

        const scheduleMeasure = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(measure);
        };

        const resizeObserver = new ResizeObserver(scheduleMeasure);
        resizeObserver.observe(element);
        scheduleMeasure();

        return () => {
            cancelAnimationFrame(raf);
            resizeObserver.disconnect();
        };
    }, [element]);

    return [ref, size] as const;
}

export function KibitzRoomStage({
    mode,
    room,
    rooms,
    proposals,
    variations,
    secondaryPane,
    onPreviewGame,
    onClearPreview,
    onProposePreview,
    onOpenVariation,
    onSetSecondaryPaneMode,
}: KibitzRoomStageProps): React.ReactElement {
    const mainGame = room.current_game;
    const secondaryGameId = secondaryPane.preview_game_id;
    const secondaryPaneSize = secondaryPane.collapsed ? "hidden" : (secondaryPane.size ?? "small");
    const selectedVariation = variations.find(
        (variation) => variation.id === secondaryPane.variation_id,
    );
    const [mainGameDetails, setMainGameDetails] = React.useState<rest_api.GameDetails | null>(null);
    const previewCandidates = rooms.filter(
        (candidate) => candidate.id !== room.id && candidate.current_game?.game_id,
    );
    const smallModeQuickVariations = variations
        .filter((variation) => variation.id !== secondaryPane.variation_id)
        .slice(0, 4);
    const smallModeProposalPreviews = proposals
        .filter(
            (proposal) =>
                proposal.proposed_game.game_id &&
                proposal.proposed_game.game_id !== secondaryGameId &&
                (proposal.status === "queued" || proposal.status === "active"),
        )
        .slice(0, 3);
    const smallModeRoomPreviews = previewCandidates
        .filter((candidate) => candidate.current_game?.game_id !== secondaryGameId)
        .slice(0, 3);
    const previewGame =
        rooms.find((candidate) => candidate.current_game?.game_id === secondaryGameId)
            ?.current_game ??
        proposals.find((proposal) => proposal.proposed_game.game_id === secondaryGameId)
            ?.proposed_game;
    const previewDisplayedMoveNumber = previewGame?.move_number;
    const [mainBoardController, setMainBoardController] = React.useState<GobanController | null>(
        null,
    );
    const [secondaryBoardController, setSecondaryBoardController] =
        React.useState<GobanController | null>(null);
    const setSecondaryMoveTreeContainer = React.useCallback(
        (instance: Resizable | null) => {
            if (secondaryBoardController && instance) {
                secondaryBoardController.setMoveTreeContainer(instance);
            }
        },
        [secondaryBoardController],
    );
    const [mainBoardSlotRef, mainBoardSize] = useSquareFitSize<HTMLDivElement>();
    const [secondaryBoardSlotRef, secondaryBoardSize] = useSquareFitSize<HTMLDivElement>();
    const [mainCurrentMoveNumber, setMainCurrentMoveNumber] = React.useState<number | null>(null);
    const [secondaryCurrentMoveNumber, setSecondaryCurrentMoveNumber] = React.useState<
        number | null
    >(null);

    React.useEffect(() => {
        if (!mainGame?.game_id || mainGame.mock_game_data || mode === "demo") {
            setMainGameDetails(null);
            return;
        }

        let canceled = false;

        get(`games/${mainGame.game_id}`)
            .then((details: rest_api.GameDetails) => {
                if (!canceled) {
                    setMainGameDetails(details);
                }
            })
            .catch(() => {
                if (!canceled) {
                    setMainGameDetails(null);
                }
            });

        return () => {
            canceled = true;
        };
    }, [mainGame?.game_id, mainGame?.mock_game_data, mode]);

    const displayedTitle = mainGameDetails?.name || mainGame?.title;
    const displayedBlack = mainGameDetails?.players?.black?.username || mainGame?.black.username;
    const displayedWhite = mainGameDetails?.players?.white?.username || mainGame?.white.username;
    const displayedBoardSize =
        mainGameDetails && mainGameDetails.width && mainGameDetails.height
            ? `${mainGameDetails.width}x${mainGameDetails.height}`
            : mainGame?.board_size;
    const displayedMoveNumber =
        mainGameDetails?.gamedata?.moves?.length ??
        mainGameDetails?.gamedata?.clock?.last_move ??
        mainGame?.move_number;
    const displayedTournament =
        typeof mainGameDetails?.tournament === "number" && mainGameDetails.tournament > 0
            ? interpolate(
                  pgettext(
                      "Fallback label when only a tournament id is known in the kibitz stage",
                      "Tournament {{tournament_id}}",
                  ),
                  { tournament_id: mainGameDetails.tournament },
              )
            : mainGame?.tournament_name;

    const displayedBlackWithRank = formatPlayerNameWithRank(
        displayedBlack,
        mainGameDetails?.players?.black,
        mainGame?.black,
    );
    const displayedWhiteWithRank = formatPlayerNameWithRank(
        displayedWhite,
        mainGameDetails?.players?.white,
        mainGame?.white,
    );
    const mainIsLive =
        typeof displayedMoveNumber === "number"
            ? (mainCurrentMoveNumber ?? displayedMoveNumber) >= displayedMoveNumber
            : true;
    const mainMoveSummary =
        typeof displayedMoveNumber === "number"
            ? mainIsLive
                ? interpolate(
                      pgettext(
                          "Move summary chip shown in the kibitz main board header when the board is live",
                          "Move {{move_number}}",
                      ),
                      { move_number: displayedMoveNumber },
                  )
                : interpolate(
                      pgettext(
                          "Move summary chip shown in the kibitz main board header when the board is out of sync",
                          "Move {{current_move}} / {{latest_move}}",
                      ),
                      {
                          current_move: mainCurrentMoveNumber ?? 0,
                          latest_move: displayedMoveNumber,
                      },
                  )
            : null;
    const secondaryDisplayedMoveCount =
        typeof previewDisplayedMoveNumber === "number"
            ? previewDisplayedMoveNumber
            : typeof selectedVariation?.move_count === "number"
              ? selectedVariation.move_count
              : null;
    const secondaryMoveSummary =
        typeof secondaryDisplayedMoveCount === "number"
            ? interpolate(
                  pgettext(
                      "Move summary chip shown in the kibitz secondary header",
                      "Move {{move_number}}",
                  ),
                  {
                      move_number: secondaryCurrentMoveNumber ?? secondaryDisplayedMoveCount,
                  },
              )
            : null;
    const previewBlackWithRank = formatPlayerNameWithRank(
        previewGame?.black.username,
        previewGame?.black,
    );
    const previewWhiteWithRank = formatPlayerNameWithRank(
        previewGame?.white.username,
        previewGame?.white,
    );
    const secondaryHeaderLabel = selectedVariation
        ? secondaryPaneSize === "small"
            ? pgettext("Label for the variation tray in kibitz", "Variation tray")
            : pgettext("Label for the variation board in kibitz", "Variation board")
        : secondaryPaneSize === "small"
          ? pgettext("Label for the preview tray in kibitz", "Preview tray")
          : pgettext("Label for the preview board in kibitz", "Preview board");
    const secondaryHeaderStatus = selectedVariation
        ? pgettext("Status pill shown on a kibitz variation header", "Variation")
        : pgettext("Status pill shown on a kibitz preview header", "Private preview");
    const secondarySubtitle = selectedVariation
        ? secondaryPaneSize === "small"
            ? null
            : (selectedVariation.title ??
              pgettext("Fallback title for an untitled kibitz variation", "Variation preview"))
        : secondaryPaneSize === "small"
          ? null
          : (previewGame?.title ?? null);

    React.useEffect(() => {
        setMainCurrentMoveNumber(
            typeof displayedMoveNumber === "number" ? displayedMoveNumber : null,
        );
    }, [displayedMoveNumber, mainGame?.game_id]);

    React.useEffect(() => {
        if (!mainBoardController) {
            return;
        }

        const goban = mainBoardController.goban as any;
        const sync = () => {
            const nextMoveNumber = goban?.engine?.cur_move?.move_number;
            setMainCurrentMoveNumber(typeof nextMoveNumber === "number" ? nextMoveNumber : null);
        };

        sync();
        goban?.on?.("cur_move", sync);

        return () => {
            goban?.off?.("cur_move", sync);
        };
    }, [mainBoardController]);

    React.useEffect(() => {
        const nextDisplayedMoveNumber =
            typeof previewDisplayedMoveNumber === "number"
                ? previewDisplayedMoveNumber
                : typeof selectedVariation?.move_count === "number"
                  ? selectedVariation.move_count
                  : null;

        setSecondaryCurrentMoveNumber(nextDisplayedMoveNumber);
    }, [
        previewDisplayedMoveNumber,
        secondaryGameId,
        selectedVariation?.id,
        selectedVariation?.move_count,
    ]);

    React.useEffect(() => {
        if (!secondaryBoardController) {
            return;
        }

        const goban = secondaryBoardController.goban as any;
        const sync = () => {
            const nextMoveNumber = goban?.engine?.cur_move?.move_number;
            setSecondaryCurrentMoveNumber(
                typeof nextMoveNumber === "number" ? nextMoveNumber : null,
            );
        };

        sync();
        goban?.on?.("cur_move", sync);

        return () => {
            goban?.off?.("cur_move", sync);
        };
    }, [secondaryBoardController]);

    const renderSecondaryTray = () => {
        if (secondaryPaneSize !== "small") {
            return null;
        }

        const quickLinksAvailable =
            smallModeQuickVariations.length > 0 ||
            smallModeProposalPreviews.length > 0 ||
            smallModeRoomPreviews.length > 0;

        if (secondaryGameId && previewGame) {
            return (
                <div className="secondary-tray secondary-tray-preview">
                    <div className="secondary-tray-card primary">
                        <div className="tray-eyebrow">
                            {pgettext(
                                "Eyebrow for the secondary tray when previewing a game in kibitz",
                                "Previewing privately",
                            )}
                        </div>
                        <div className="tray-title">
                            {previewGame.title ??
                                pgettext(
                                    "Fallback title for a game preview in the kibitz side tray",
                                    "Previewed game",
                                )}
                        </div>
                        <div className="tray-copy">
                            {pgettext(
                                "Helper copy shown in the kibitz side tray when previewing another game",
                                "This board is just for you until you propose it to the room.",
                            )}
                        </div>
                        <div className="tray-actions">
                            <button
                                type="button"
                                className="preview-action-button tray-button primary"
                                onClick={onProposePreview}
                            >
                                {pgettext(
                                    "Primary button in the kibitz side tray for proposing a previewed game",
                                    "Propose to room",
                                )}
                            </button>
                            <button
                                type="button"
                                className="preview-action-button tray-button subtle"
                                onClick={onClearPreview}
                            >
                                {pgettext(
                                    "Secondary button in the kibitz side tray for closing the preview",
                                    "Close preview",
                                )}
                            </button>
                        </div>
                    </div>
                    {quickLinksAvailable ? (
                        <div className="secondary-tray-sections">
                            {smallModeQuickVariations.length > 0 ? (
                                <div className="secondary-tray-section">
                                    <div className="section-title">
                                        {pgettext(
                                            "Section heading for quick variation shortcuts in the kibitz side tray",
                                            "Hot variations",
                                        )}
                                    </div>
                                    <div className="tray-chip-list">
                                        {smallModeQuickVariations.map((variation) => (
                                            <button
                                                key={variation.id}
                                                type="button"
                                                className="tray-chip"
                                                onClick={() => onOpenVariation(variation.id)}
                                            >
                                                <span className="chip-title">
                                                    {variation.title ||
                                                        pgettext(
                                                            "Fallback title for an untitled variation in the kibitz side tray",
                                                            "Untitled variation",
                                                        )}
                                                </span>
                                                <span className="chip-meta">
                                                    {variation.creator.username}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {smallModeProposalPreviews.length > 0 ? (
                                <div className="secondary-tray-section">
                                    <div className="section-title">
                                        {pgettext(
                                            "Section heading for queued board proposals in the kibitz side tray",
                                            "Watch next",
                                        )}
                                    </div>
                                    <div className="tray-link-list">
                                        {smallModeProposalPreviews.map((proposal) => (
                                            <button
                                                key={proposal.id}
                                                type="button"
                                                className="tray-link"
                                                onClick={() =>
                                                    onPreviewGame(
                                                        proposal.proposed_game.game_id as number,
                                                    )
                                                }
                                            >
                                                <span className="link-title">
                                                    {proposal.proposed_game.title}
                                                </span>
                                                <span className="link-meta">{proposal.status}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            );
        }

        if (selectedVariation) {
            return (
                <div className="secondary-tray secondary-tray-variation">
                    <div className="secondary-tray-card primary">
                        <div className="tray-eyebrow">
                            {pgettext(
                                "Eyebrow for the secondary tray when viewing a variation in kibitz",
                                "Variation discussion",
                            )}
                        </div>
                        <div className="tray-title">
                            {selectedVariation.title ??
                                pgettext(
                                    "Fallback title for a variation in the kibitz side tray",
                                    "Variation preview",
                                )}
                        </div>
                        <div className="tray-copy">
                            {interpolate(
                                pgettext(
                                    "Helper copy shown in the kibitz side tray when viewing a variation",
                                    "Created by {{username}}. Follow the line here without disturbing the room board.",
                                ),
                                { username: selectedVariation.creator.username },
                            )}
                        </div>
                        <div className="tray-actions">
                            <button
                                type="button"
                                className="preview-action-button tray-button subtle"
                                onClick={onClearPreview}
                            >
                                {pgettext(
                                    "Button for closing a variation in the kibitz side tray",
                                    "Close variation",
                                )}
                            </button>
                        </div>
                    </div>
                    {smallModeQuickVariations.length > 0 ? (
                        <div className="secondary-tray-section">
                            <div className="section-title">
                                {pgettext(
                                    "Section heading for more variations in the kibitz side tray",
                                    "More variations",
                                )}
                            </div>
                            <div className="tray-chip-list">
                                {smallModeQuickVariations.map((variation) => (
                                    <button
                                        key={variation.id}
                                        type="button"
                                        className="tray-chip"
                                        onClick={() => onOpenVariation(variation.id)}
                                    >
                                        <span className="chip-title">
                                            {variation.title ||
                                                pgettext(
                                                    "Fallback title for an untitled variation in the kibitz side tray",
                                                    "Untitled variation",
                                                )}
                                        </span>
                                        <span className="chip-meta">
                                            {variation.creator.username}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            );
        }

        return (
            <div className="secondary-tray secondary-tray-empty">
                <div className="secondary-tray-card primary empty">
                    <div className="tray-eyebrow">
                        {pgettext("Eyebrow for the idle kibitz side tray", "Secondary tray")}
                    </div>
                    <div className="tray-title">
                        {pgettext(
                            "Title for the idle kibitz side tray",
                            "Open a preview or variation",
                        )}
                    </div>
                    <div className="tray-copy">
                        {pgettext(
                            "Helper copy for the idle kibitz side tray",
                            "Use this space to inspect another game, or follow a room variation without leaving the shared board.",
                        )}
                    </div>
                </div>
                {smallModeQuickVariations.length > 0 ? (
                    <div className="secondary-tray-section">
                        <div className="section-title">
                            {pgettext(
                                "Section heading for room variations in the idle kibitz side tray",
                                "Hot variations",
                            )}
                        </div>
                        <div className="tray-chip-list">
                            {smallModeQuickVariations.map((variation) => (
                                <button
                                    key={variation.id}
                                    type="button"
                                    className="tray-chip"
                                    onClick={() => onOpenVariation(variation.id)}
                                >
                                    <span className="chip-title">
                                        {variation.title ||
                                            pgettext(
                                                "Fallback title for an untitled variation in the kibitz side tray",
                                                "Untitled variation",
                                            )}
                                    </span>
                                    <span className="chip-meta">{variation.creator.username}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
                {smallModeProposalPreviews.length > 0 || smallModeRoomPreviews.length > 0 ? (
                    <div className="secondary-tray-section">
                        <div className="section-title">
                            {pgettext(
                                "Section heading for room previews in the idle kibitz side tray",
                                "Quick previews",
                            )}
                        </div>
                        <div className="tray-link-list">
                            {smallModeProposalPreviews.map((proposal) => (
                                <button
                                    key={proposal.id}
                                    type="button"
                                    className="tray-link"
                                    onClick={() =>
                                        onPreviewGame(proposal.proposed_game.game_id as number)
                                    }
                                >
                                    <span className="link-title">
                                        {proposal.proposed_game.title}
                                    </span>
                                    <span className="link-meta">{proposal.status}</span>
                                </button>
                            ))}
                            {smallModeRoomPreviews.map((candidate) => (
                                <button
                                    key={candidate.id}
                                    type="button"
                                    className="tray-link"
                                    onClick={() =>
                                        onPreviewGame(candidate.current_game?.game_id as number)
                                    }
                                >
                                    <span className="link-title">{candidate.title}</span>
                                    <span className="link-meta">
                                        {interpolate(
                                            pgettext(
                                                "Viewer count summary for a preview shortcut in the kibitz side tray",
                                                "{{count}} watching",
                                            ),
                                            { count: candidate.viewer_count },
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };

    return (
        <div className="KibitzRoomStage">
            <div className="KibitzRoomStage-header">
                <div className="stage-header-copy">
                    <div className="room-title">{room.title}</div>
                    <div className="room-subtitle">
                        {displayedTitle ??
                            pgettext(
                                "Placeholder when no main game is loaded in a kibitz room",
                                "No main board selected yet",
                            )}
                    </div>
                </div>
                {mainGame && (!mainGame.mock_game_data || previewCandidates.length > 0) ? (
                    <div className="stage-header-actions">
                        {!mainGame.mock_game_data ? (
                            <Link to={`/game/${mainGame.game_id}`} className="view-game-link">
                                {pgettext(
                                    "Link text for opening the current game from the kibitz stage",
                                    "Open game page",
                                )}
                            </Link>
                        ) : null}
                        {previewCandidates.map((candidate) => (
                            <button
                                key={candidate.id}
                                type="button"
                                className="preview-action-button compact"
                                onClick={() =>
                                    onPreviewGame(candidate.current_game?.game_id as number)
                                }
                            >
                                {candidate.title}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
            <div className={`KibitzRoomStage-boards secondary-pane-${secondaryPaneSize}`}>
                <div className="board-panel main-board">
                    <div className="panel-body">
                        {mainGame ? (
                            <div className="board-content">
                                <div className="board-meta board-meta-rich main-board-meta">
                                    <div className="board-meta-top">
                                        <div className="board-title-block">
                                            <div className="board-kicker-row">
                                                <div className="board-label">
                                                    {pgettext(
                                                        "Label for the shared board in kibitz",
                                                        "Main board",
                                                    )}
                                                </div>
                                                <span
                                                    className={
                                                        "board-status-pill " +
                                                        (mainIsLive ? "live" : "reviewing")
                                                    }
                                                >
                                                    {mainIsLive
                                                        ? pgettext(
                                                              "Status pill shown when the kibitz main board is at the latest move",
                                                              "Live",
                                                          )
                                                        : pgettext(
                                                              "Status pill shown when the kibitz main board is privately rewound",
                                                              "Reviewing",
                                                          )}
                                                </span>
                                                {!mainGame.mock_game_data && mainGame.game_id ? (
                                                    <span className="board-id-chip">
                                                        {interpolate(
                                                            pgettext(
                                                                "Game id chip shown in the kibitz main board header",
                                                                "Game {{game_id}}",
                                                            ),
                                                            { game_id: mainGame.game_id },
                                                        )}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="players">
                                                {interpolate(
                                                    pgettext(
                                                        "Player names shown above the main board in kibitz",
                                                        "{{black}} vs {{white}}",
                                                    ),
                                                    {
                                                        black: displayedBlackWithRank,
                                                        white: displayedWhiteWithRank,
                                                    },
                                                )}
                                            </div>
                                            {displayedTitle ? (
                                                <div className="board-subtitle">
                                                    {displayedTitle}
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="board-header-actions">
                                            {!mainIsLive ? (
                                                <button
                                                    type="button"
                                                    className="board-header-button return-live"
                                                    onClick={mainBoardController?.gotoLastMove}
                                                >
                                                    {pgettext(
                                                        "Button shown in the kibitz main board header for returning to the latest move",
                                                        "Return to live",
                                                    )}
                                                </button>
                                            ) : null}
                                            {!mainGame.mock_game_data ? (
                                                <Link
                                                    to={`/game/${mainGame.game_id}`}
                                                    className="board-header-link"
                                                >
                                                    {pgettext(
                                                        "Link text for opening the current game from the kibitz main board header",
                                                        "Open game",
                                                    )}
                                                </Link>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="board-meta-chips">
                                        {displayedBoardSize ? (
                                            <span className="board-meta-chip">
                                                {interpolate(
                                                    pgettext(
                                                        "Board size chip shown in the kibitz stage",
                                                        "Board {{size}}",
                                                    ),
                                                    { size: displayedBoardSize },
                                                )}
                                            </span>
                                        ) : null}
                                        {mainMoveSummary ? (
                                            <span className="board-meta-chip highlight">
                                                {mainMoveSummary}
                                            </span>
                                        ) : null}
                                        {displayedTournament ? (
                                            <span className="board-meta-chip ellipsis-chip">
                                                {displayedTournament}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="board-fit-slot" ref={mainBoardSlotRef}>
                                    <KibitzBoard
                                        gameId={
                                            mainGame.mock_game_data ? undefined : mainGame.game_id
                                        }
                                        json={mainGame.mock_game_data}
                                        className="main-board-surface"
                                        size={mainBoardSize}
                                        onReady={setMainBoardController}
                                    />
                                </div>
                                <div className="main-board-transport-row">
                                    <KibitzBoardControls
                                        controller={mainBoardController}
                                        variant="minimal"
                                        totalMoves={displayedMoveNumber}
                                    />
                                </div>
                                {secondaryPaneSize === "equal" ? (
                                    <div
                                        className="main-board-variation-spacer"
                                        aria-hidden="true"
                                    />
                                ) : null}
                            </div>
                        ) : (
                            pgettext(
                                "Placeholder for the primary kibitz goban area before the board is wired up",
                                "Shared board will render here",
                            )
                        )}
                    </div>
                </div>
                <KibitzDividerHandle
                    secondaryPane={secondaryPane}
                    onSetMode={onSetSecondaryPaneMode}
                />
                <div
                    className={
                        "board-panel secondary-board" +
                        (secondaryPane.collapsed ? " collapsed" : "")
                    }
                >
                    <div className="panel-body">
                        {secondaryPane.collapsed ? (
                            pgettext(
                                "Placeholder when the secondary board is collapsed in kibitz",
                                "Secondary pane is collapsed",
                            )
                        ) : secondaryGameId ? (
                            <div className="board-content">
                                <div className="board-meta board-meta-rich secondary-board-meta">
                                    <div className="board-meta-top">
                                        <div className="board-title-block">
                                            <div className="board-kicker-row">
                                                <div className="board-label">
                                                    {secondaryHeaderLabel}
                                                </div>
                                                <span className="board-status-pill preview">
                                                    {secondaryHeaderStatus}
                                                </span>
                                                {previewGame?.game_id ? (
                                                    <span className="board-id-chip">
                                                        {interpolate(
                                                            pgettext(
                                                                "Game id chip shown in the kibitz secondary board header",
                                                                "Game {{game_id}}",
                                                            ),
                                                            { game_id: previewGame.game_id },
                                                        )}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="players">
                                                {interpolate(
                                                    pgettext(
                                                        "Player names shown above the secondary board in kibitz",
                                                        "{{black}} vs {{white}}",
                                                    ),
                                                    {
                                                        black: previewBlackWithRank,
                                                        white: previewWhiteWithRank,
                                                    },
                                                )}
                                            </div>
                                            {secondarySubtitle ? (
                                                <div className="board-subtitle">
                                                    {secondarySubtitle}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="board-meta-chips">
                                        {previewGame?.board_size ? (
                                            <span className="board-meta-chip">
                                                {interpolate(
                                                    pgettext(
                                                        "Board size chip shown in the kibitz secondary header",
                                                        "Board {{size}}",
                                                    ),
                                                    { size: previewGame.board_size },
                                                )}
                                            </span>
                                        ) : null}
                                        {secondaryMoveSummary ? (
                                            <span className="board-meta-chip highlight">
                                                {secondaryMoveSummary}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="board-fit-slot" ref={secondaryBoardSlotRef}>
                                    <KibitzBoard
                                        gameId={
                                            previewGame?.mock_game_data
                                                ? undefined
                                                : secondaryGameId
                                        }
                                        json={previewGame?.mock_game_data}
                                        className="secondary-board-surface"
                                        size={secondaryBoardSize}
                                        onReady={setSecondaryBoardController}
                                    />
                                </div>
                                <div className="secondary-board-transport-row">
                                    <div className="transport-controls">
                                        <KibitzBoardControls
                                            controller={secondaryBoardController}
                                            variant="full"
                                            showMoveTree={false}
                                            totalMoves={previewDisplayedMoveNumber}
                                        />
                                    </div>
                                    {secondaryPaneSize === "equal" ? (
                                        <div className="board-actions board-actions-inline">
                                            <button
                                                type="button"
                                                className="preview-action-button symbol-button"
                                                onClick={onProposePreview}
                                                aria-label={pgettext(
                                                    "Aria label for proposing the current previewed game in kibitz",
                                                    "Propose",
                                                )}
                                                title={pgettext(
                                                    "Tooltip label for proposing the current previewed game in kibitz",
                                                    "Propose",
                                                )}
                                            >
                                                +
                                            </button>
                                            <button
                                                type="button"
                                                className="preview-action-button clear-preview symbol-button"
                                                onClick={onClearPreview}
                                                aria-label={pgettext(
                                                    "Aria label for closing the preview game in the secondary kibitz pane",
                                                    "Clear",
                                                )}
                                                title={pgettext(
                                                    "Tooltip label for closing the preview game in the secondary kibitz pane",
                                                    "Clear",
                                                )}
                                            >
                                                X
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                                {secondaryPaneSize === "equal" ? (
                                    <Resizable
                                        id="kibitz-secondary-move-tree-container"
                                        className="kibitz-move-tree-container"
                                        ref={setSecondaryMoveTreeContainer}
                                    />
                                ) : (
                                    renderSecondaryTray()
                                )}
                            </div>
                        ) : selectedVariation ? (
                            <div className="board-content">
                                <div className="board-meta board-meta-rich secondary-board-meta variation-header">
                                    <div className="board-meta-top">
                                        <div className="board-title-block">
                                            <div className="board-kicker-row">
                                                <div className="board-label">
                                                    {secondaryHeaderLabel}
                                                </div>
                                                <span className="board-status-pill variation">
                                                    {secondaryHeaderStatus}
                                                </span>
                                            </div>
                                            <div className="players">
                                                {selectedVariation.creator.username}
                                            </div>
                                            {secondarySubtitle ? (
                                                <div className="board-subtitle">
                                                    {secondarySubtitle}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="board-meta-chips">
                                        {secondaryMoveSummary ? (
                                            <span className="board-meta-chip highlight">
                                                {secondaryMoveSummary}
                                            </span>
                                        ) : null}
                                        <span className="board-meta-chip ellipsis-chip">
                                            {interpolate(
                                                pgettext(
                                                    "Creator chip shown in the kibitz variation header",
                                                    "By {{username}}",
                                                ),
                                                { username: selectedVariation.creator.username },
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="board-fit-slot" ref={secondaryBoardSlotRef}>
                                    <KibitzBoard
                                        json={selectedVariation.mock_game_data}
                                        className="secondary-board-surface"
                                        size={secondaryBoardSize}
                                        onReady={setSecondaryBoardController}
                                    />
                                </div>
                                <div className="secondary-board-transport-row">
                                    <div className="transport-controls">
                                        <KibitzBoardControls
                                            controller={secondaryBoardController}
                                            variant="full"
                                            showMoveTree={false}
                                            totalMoves={selectedVariation.move_count}
                                        />
                                    </div>
                                    {secondaryPaneSize === "equal" ? (
                                        <div className="board-actions board-actions-inline">
                                            <button
                                                type="button"
                                                className="preview-action-button clear-preview symbol-button"
                                                onClick={onClearPreview}
                                                aria-label={pgettext(
                                                    "Aria label for closing a variation preview in the secondary kibitz pane",
                                                    "Clear",
                                                )}
                                                title={pgettext(
                                                    "Tooltip label for closing a variation preview in the secondary kibitz pane",
                                                    "Clear",
                                                )}
                                            >
                                                X
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                                {secondaryPaneSize === "equal" ? (
                                    <Resizable
                                        id="kibitz-secondary-move-tree-container"
                                        className="kibitz-move-tree-container"
                                        ref={setSecondaryMoveTreeContainer}
                                    />
                                ) : (
                                    renderSecondaryTray()
                                )}
                            </div>
                        ) : secondaryPaneSize === "small" ? (
                            renderSecondaryTray()
                        ) : (
                            pgettext(
                                "Placeholder for the secondary kibitz goban area before the board is wired up",
                                "Preview or variation board will render here",
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
