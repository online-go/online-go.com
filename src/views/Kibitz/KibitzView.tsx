/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
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
import { _, interpolate, pgettext } from "@/lib/translate";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import { popover, PopOver } from "@/lib/popover";
import { GobanView, generateGobanHook } from "@/components/GobanView";
import { KBShortcut } from "@/components/KBShortcut";
import type { KibitzRoomSummary } from "@/models/kibitz";
import type { KibitzGobans } from "./useKibitzGobans";
import { KibitzLeftAside, KibitzLeftAsideProps } from "./KibitzLeftAside";
import { KibitzChatPanel, KibitzChatPanelProps } from "./KibitzChatPanel";
import { KibitzPortraitPanes } from "./KibitzPortraitPanes";
import {
    KIBITZ_DEFAULT_PORTRAIT_PANE,
    KibitzPortraitPane,
    readPortraitPane,
    writePortraitPane,
} from "./kibitzPortraitPane";
import { KibitzVariationPanel } from "./KibitzVariationPanel";
import { KibitzVariationChip } from "./KibitzVariationChip";
import { KibitzProposalPanel, KibitzProposalPanelProps } from "./KibitzProposalPanel";
import {
    KibitzRoomSettingsPopover,
    KibitzRoomSettingsPopoverView,
} from "./KibitzRoomSettingsPopover";
import { KibitzKeyboardShortcuts } from "./KibitzKeyboardShortcuts";
import { KibitzMoreActionsRoomActions, openKibitzMoreActions } from "./KibitzMoreActionsPopover";
import "./KibitzView.css";

export interface KibitzViewProps {
    room: KibitzRoomSummary;
    gobans: KibitzGobans;
    isPortrait: boolean;
    leftAside: Omit<KibitzLeftAsideProps, "miniBoardController" | "onExitVariation">;
    chat: Omit<
        KibitzChatPanelProps,
        "gameController" | "showPeople" | "mode" | "visible" | "onUnreadChange"
    >;
    proposals: KibitzProposalPanelProps;
    onPostVariation: (controller: GobanController) => void;
    /** Starts a new draft from the live board; renders as the analysis
     *  action in the tab bar, as on the Game page. */
    onCreateVariation?: () => void;
    /** Starts a draft from the posted variation in the center. */
    onBranchFromVariation?: () => void;
    onExitVariation: () => void;
    onReturnToLive: () => void;
    /** Portrait only: the Rooms pane was selected. */
    onRoomsOpened?: () => void;
    roomSettings: {
        /** False while the room's details and permissions are still
         *  loading; the room actions wait for them. */
        ready: boolean;
        canEditRoom: boolean;
        canDeleteRoom: boolean;
        onChangeBoard?: () => void;
        onSaveRoomDetails: (title: string, description: string) => Promise<boolean>;
        onDeleteRoom: () => Promise<boolean>;
    };
    /** Rendered above the sidebar panels, e.g. the preset change banner. */
    banner?: React.ReactNode;
}

// The branch icon, not the tree: the tree is the New variation action, which
// shares this bar, and tooltips do not appear on touch.
const PANE_ICONS: Record<KibitzPortraitPane, string> = {
    "game-chat": "comment",
    "room-chat": "comments",
    people: "users",
    variations: "code-fork",
    rooms: "list",
    analysis: "sitemap",
};

// The bar's two portrait groups, in the order they are shown. Rooms and
// Variations navigate; the three on the right of the split switch what the
// pane area shows, and the analysis action follows them.
const PORTRAIT_LEFT_PANES: readonly KibitzPortraitPane[] = ["rooms", "variations"];
const PORTRAIT_CENTER_PANES: readonly KibitzPortraitPane[] = ["game-chat", "room-chat", "people"];

// The people label names the same list in both orientations: the pane in
// portrait, the column the action tab switches on in landscape.
const peopleLabel = () =>
    pgettext("Kibitz people list, as a panel heading and as the action that shows it", "People");

// Functions, not values: the strings are read after the language is set. The
// two chat contexts match the chat panel's own tab strip, so both share one
// translation.
const PANE_TITLES: Record<KibitzPortraitPane, () => string> = {
    "game-chat": () => pgettext("Kibitz chat tab for the watched game's chat", "Game chat"),
    "room-chat": () => pgettext("Kibitz chat tab for the kibitz room's chat", "Kibitz chat"),
    people: peopleLabel,
    variations: () => pgettext("Heading for the Kibitz variation list", "Variations"),
    rooms: () => pgettext("Heading of the room list in the Kibitz left aside", "Rooms"),
    analysis: () => pgettext("Action that starts a new Kibitz variation", "New variation"),
};

const useBehindLive = generateGobanHook(
    (goban: GobanController["goban"] | null) =>
        !!goban && goban.engine.cur_move.move_number < goban.engine.last_official_move.move_number,
    ["cur_move", "last_official_move"],
);

/**
 * The Kibitz page laid out on GobanView: rooms and variations on the left,
 * the board with player bars in the center, proposals, variation controls
 * and chat on the right.
 */
export function KibitzView(props: KibitzViewProps): React.ReactElement | null {
    const { room, gobans, isPortrait } = props;
    const settingsPopoverRef = React.useRef<PopOver | null>(null);
    const moreActionsPopoverRef = React.useRef<PopOver | null>(null);
    const behindLive = useBehindLive(
        gobans.centerMode === "main" ? (gobans.main?.goban ?? null) : null,
    );

    const { onExitVariation, onRoomsOpened, roomSettings } = props;

    // Portrait only: which of the five panels below the board is on screen,
    // and the unread state the two chat panes report for their tab dots.
    const [pane, setPane] = React.useState(readPortraitPane);
    const [chatUnread, setChatUnread] = React.useState({ room: false, game: false });
    // Posting ends the composing session, and the post itself lands in the
    // Kibitz chat, so that is where the reader is sent. The flag carries that
    // through the render where the posted variation arrives as a controller
    // of its own, which would otherwise pull the analysis pane forward again.
    const chatAfterPost = React.useRef(false);
    // What was on screen before the pane that is on it now, so a list that
    // opens over the reader's reading can put it back.
    const paneBefore = React.useRef<KibitzPortraitPane | null>(null);
    const selectPane = React.useCallback((next: KibitzPortraitPane) => {
        setPane((current) => {
            if (current !== next) {
                paneBefore.current = current;
            }
            return next;
        });
        writePortraitPane(next);
        // The reader is steering again, so a post that never produced a
        // variation to open leaves no intent behind.
        chatAfterPost.current = false;
    }, []);

    // The analysis pane holds the variation panel, so it comes forward
    // whenever the centre stops showing the live game and steps back when it
    // returns — to whichever pane the reader was on, not to a default.
    //
    // The secondary controller is in the dependencies because each draft and
    // each posted variation gets one of its own: starting a second variation
    // while the first is still open never changes `centerShowsVariation`, and
    // without this the pane would stay wherever the reader was.
    const paneBeforeAnalysis = React.useRef<KibitzPortraitPane | null>(null);
    const centerShowsVariation = gobans.centerMode !== "main";
    const secondaryController = gobans.secondary;
    React.useEffect(() => {
        if (!isPortrait) {
            return;
        }
        const posted = chatAfterPost.current;
        // Posting tears the draft down a render before the posted variation
        // arrives with a controller of its own. The intent has to outlive
        // that gap, so it is spent on the controller that lands, not on the
        // render that clears the old one.
        if (posted && centerShowsVariation && !secondaryController) {
            paneBeforeAnalysis.current = null;
            return;
        }
        chatAfterPost.current = false;
        if (centerShowsVariation) {
            if (posted) {
                // The reader is on the chat and left no pane behind.
                paneBeforeAnalysis.current = null;
                return;
            }
            setPane((current) => {
                if (current === "analysis") {
                    return current;
                }
                paneBeforeAnalysis.current = current;
                return "analysis";
            });
            return;
        }
        setPane((current) => {
            if (current !== "analysis") {
                return current;
            }
            const previous = paneBeforeAnalysis.current;
            paneBeforeAnalysis.current = null;
            return previous ?? readPortraitPane();
        });
    }, [isPortrait, centerShowsVariation, secondaryController]);

    const propsOnPostVariation = props.onPostVariation;
    const onPostVariation = React.useCallback(
        (boardController: GobanController) => {
            if (isPortrait) {
                // After the pane call, which clears the flag as a reader's
                // own navigation would.
                selectPane("room-chat");
                chatAfterPost.current = true;
            }
            propsOnPostVariation(boardController);
        },
        [isPortrait, propsOnPostVariation, selectPane],
    );

    // Opening a variation by hand is the reader steering, so the analysis
    // pane comes forward as usual. Only the open the app performs itself
    // after a post — which goes through neither of these — leaves the reader
    // where the post put them.
    const chatOnOpenVariation = props.chat.onOpenVariation;
    const onOpenVariationByReader = React.useCallback(
        (variationId: string, focusVariation?: boolean) => {
            chatAfterPost.current = false;
            chatOnOpenVariation(variationId, focusVariation);
        },
        [chatOnOpenVariation],
    );
    const asideOnRecallVariation = props.leftAside.onRecallVariation;
    const onRecallVariationByReader = React.useCallback(
        (variationId: string) => {
            chatAfterPost.current = false;
            asideOnRecallVariation(variationId);
        },
        [asideOnRecallVariation],
    );

    // The room and variation lists open over whatever the reader was reading,
    // so pressing their action again puts that back rather than stranding
    // them on a list — the way pressing the analysis action again leaves the
    // draft it opened. Analysis is only worth returning to while the centre
    // still holds something to analyze.
    const centerHoldsVariation = gobans.centerMode !== "main";
    const togglePane = React.useCallback(
        (id: KibitzPortraitPane) => {
            if (pane !== id) {
                selectPane(id);
                return;
            }
            const previous = paneBefore.current;
            const usable = previous && (previous !== "analysis" || centerHoldsVariation);
            selectPane(usable ? previous : KIBITZ_DEFAULT_PORTRAIT_PANE);
        },
        [centerHoldsVariation, pane, selectPane],
    );

    // Refresh the room directory whenever the Rooms pane comes on screen,
    // including the first render, where a stored `rooms` pane is already
    // active and never goes through selectPane.
    React.useEffect(() => {
        if (isPortrait && pane === "rooms") {
            onRoomsOpened?.();
        }
    }, [isPortrait, pane, onRoomsOpened]);

    const [showPeople, setShowPeople] = React.useState(() =>
        data.get("kibitz.people_column", true),
    );
    const togglePeople = React.useCallback(() => {
        setShowPeople((previous) => {
            const next = !previous;
            data.set("kibitz.people_column", next);
            return next;
        });
    }, []);

    React.useEffect(
        () => () => {
            settingsPopoverRef.current?.close();
            settingsPopoverRef.current = null;
            moreActionsPopoverRef.current?.close();
            moreActionsPopoverRef.current = null;
        },
        [],
    );

    const openSettings = React.useCallback(
        (anchor: HTMLElement, initialView: KibitzRoomSettingsPopoverView = "menu") => {
            settingsPopoverRef.current?.close();
            const close = () => {
                settingsPopoverRef.current?.close();
                settingsPopoverRef.current = null;
            };
            settingsPopoverRef.current = popover({
                elt: (
                    <KibitzRoomSettingsPopover
                        room={room}
                        canEditRoom={roomSettings.canEditRoom}
                        canDeleteRoom={roomSettings.canDeleteRoom}
                        canChangeBoard={!!roomSettings.onChangeBoard}
                        onClose={close}
                        onRequestChangeBoard={() => {
                            close();
                            roomSettings.onChangeBoard?.();
                        }}
                        onDeleteRoom={roomSettings.onDeleteRoom}
                        onSaveRoomDetails={roomSettings.onSaveRoomDetails}
                        initialView={initialView}
                    />
                ),
                below: anchor,
                minWidth: 280,
            });
        },
        [room, roomSettings],
    );

    // The room-management entries the More menu shows. They are anchored to
    // the More button, because that is what the user pressed to reach them.
    const roomActions = React.useCallback(
        (anchor: HTMLElement): KibitzMoreActionsRoomActions | undefined =>
            roomSettings.ready
                ? {
                      canEditRoom: roomSettings.canEditRoom,
                      canChangeBoard: !!roomSettings.onChangeBoard,
                      canDeleteRoom: roomSettings.canDeleteRoom,
                      onEditDetails: () => openSettings(anchor, "edit-details"),
                      onChangeBoard: () => roomSettings.onChangeBoard?.(),
                      onRoomInformation: () => openSettings(anchor, "menu"),
                  }
                : undefined,
        [openSettings, roomSettings],
    );

    // KBShortcut lets Escape through from inputs so dialogs can close; here
    // Escape in the chat or the variation name field must not close the
    // variation under the user.
    const onEscape = React.useCallback(() => {
        const active = document.activeElement as HTMLElement | null;
        if (
            active &&
            (active.tagName === "INPUT" ||
                active.tagName === "TEXTAREA" ||
                active.isContentEditable)
        ) {
            return;
        }
        onExitVariation();
    }, [onExitVariation]);

    if (!gobans.center && room.current_game?.game_id) {
        // The live controller is created after the first commit. Render
        // nothing for that one commit, so the chat and panels mount once.
        return null;
    }

    // A room between games has no controller at all. It renders the same tree
    // as everything else — the action bar included — with this message where
    // the board would be.
    const waitingMessage = (
        <div className="KibitzView-waiting-message">
            {pgettext(
                "Shown in a kibitz preset room when no eligible live game is currently being watched",
                "Looking for a suitable live game.",
            )}
        </div>
    );

    const viewingOther = gobans.centerMode !== "main";
    // Landscape only: the thumbnail keeps the live game in view beside a
    // variation, and portrait has no width to spare for it — the analysis
    // pane's Back to game button is the way back there.
    //
    // By identity, not mode: as a variation opens there is one commit where
    // the mode has changed but the secondary controller does not exist yet.
    // Mounting one board div in both places breaks the next unmount.
    const miniBoardController = !isPortrait && gobans.center !== gobans.main ? gobans.main : null;
    const panelVariationId =
        gobans.centerMode === "variation" ? props.leftAside.selectedVariationId : null;
    const panelColorIndex = panelVariationId
        ? (props.leftAside.variationColorIndexes[panelVariationId] ?? null)
        : null;

    const selectedVariation = panelVariationId
        ? (props.leftAside.variations.find((v) => v.id === panelVariationId) ?? null)
        : null;
    const chipGameId = selectedVariation?.game_id ?? null;
    const chipOtherGame =
        chipGameId != null && chipGameId !== room.current_game?.game_id
            ? (props.leftAside.variationGameById.get(chipGameId) ?? null)
            : null;
    const variationPanel =
        viewingOther && gobans.secondary ? (
            <KibitzVariationPanel
                controller={gobans.secondary}
                mode={gobans.centerMode === "draft" ? "draft" : "variation"}
                onPost={onPostVariation}
                onBackToGame={onExitVariation}
                onBranch={
                    gobans.centerMode === "variation" ? props.onBranchFromVariation : undefined
                }
                colorIndex={panelColorIndex}
            />
        ) : null;

    // The game's result sits on the title's own line, pulled to the right;
    // the game's settings are in the More actions menu.
    const resultEngine = gobans.main?.goban.engine ?? null;
    const outcome =
        resultEngine && resultEngine.phase === "finished" ? (resultEngine.outcome ?? "") : "";
    const resultWinner =
        resultEngine && resultEngine.winner != null
            ? resultEngine.players.black.id === Number(resultEngine.winner)
                ? resultEngine.players.black
                : resultEngine.players.white.id === Number(resultEngine.winner)
                  ? resultEngine.players.white
                  : null
            : null;
    const resultLine = outcome
        ? resultWinner
            ? interpolate(
                  pgettext(
                      "Result of the watched game, shown beside the Kibitz room title",
                      "{{winner}} won by {{outcome}}",
                  ),
                  { winner: resultWinner.username, outcome },
              )
            : outcome
        : null;

    const variationChip =
        gobans.centerMode === "main" ? null : (
            <KibitzVariationChip
                mode={gobans.centerMode === "draft" ? "draft" : "variation"}
                variation={selectedVariation}
                colorIndex={panelColorIndex}
                otherGame={chipOtherGame}
                onClose={onExitVariation}
            />
        );

    // Landscape only. Portrait reaches the same lists through the panes, and
    // the mini board must be mounted in one place at a time.
    const leftAside = isPortrait ? null : (
        <KibitzLeftAside
            {...props.leftAside}
            onRecallVariation={onRecallVariationByReader}
            miniBoardController={miniBoardController}
            createVariationDisabled={!gobans.main}
            onExitVariation={onExitVariation}
        />
    );

    return (
        <GobanView
            controller={gobans.center}
            className="Kibitz"
            header={
                // The header says what the centre is showing. Watching the
                // game that is the room and its result; showing a variation,
                // the variation alone, since the room is what the reader
                // closes back to rather than what they are looking at.
                <div className="Kibitz-header">
                    {variationChip ?? (
                        <div className="Kibitz-header-titleRow">
                            <span
                                className="Kibitz-room-title"
                                data-game-id={room.current_game?.game_id}
                            >
                                {room.title}
                            </span>
                            {resultLine ? (
                                <span className="Kibitz-header-result">{resultLine}</span>
                            ) : null}
                        </div>
                    )}
                </div>
            }
            leftAside={leftAside}
            centerPlaceholder={waitingMessage}
            playerBars={gobans.playerBars ?? !!gobans.center}
            portraitSplit
        >
            {gobans.center && <KibitzKeyboardShortcuts />}
            {viewingOther && <KBShortcut shortcut="esc" action={onEscape} />}

            <GobanView.Tab id="kibitz-main" type="always">
                {props.banner}
                <KibitzProposalPanel {...props.proposals} />
                {!isPortrait && variationPanel}
                {isPortrait ? (
                    <KibitzPortraitPanes
                        active={pane}
                        chat={{
                            ...props.chat,
                            onOpenVariation: onOpenVariationByReader,
                            gameController: gobans.main,
                            showPeople: false,
                            onUnreadChange: setChatUnread,
                        }}
                        leftAside={{
                            ...props.leftAside,
                            onRecallVariation: onRecallVariationByReader,
                            miniBoardController: null,
                            // Same condition as the analysis action in the
                            // tab bar: nothing to make a variation of.
                            createVariationDisabled: !gobans.main,
                            onExitVariation,
                        }}
                        roomChannel={room.channel}
                        analysis={variationPanel}
                        analysisPending={viewingOther && !gobans.secondary}
                    />
                ) : (
                    <KibitzChatPanel
                        {...props.chat}
                        onOpenVariation={onOpenVariationByReader}
                        gameController={gobans.main}
                        showPeople={showPeople}
                    />
                )}
            </GobanView.Tab>

            {isPortrait &&
                PORTRAIT_LEFT_PANES.map((id) => (
                    <GobanView.Tab
                        key={id}
                        id={`kibitz-pane-${id}`}
                        type="action"
                        align="left"
                        icon={PANE_ICONS[id]}
                        title={PANE_TITLES[id]()}
                        active={pane === id}
                        onClick={() => togglePane(id)}
                    />
                ))}

            {isPortrait &&
                PORTRAIT_CENTER_PANES.map((id) => (
                    <GobanView.Tab
                        key={id}
                        id={`kibitz-pane-${id}`}
                        type="action"
                        align="center"
                        icon={
                            <span className="Kibitz-pane-icon">
                                <i className={`fa fa-${PANE_ICONS[id]}`} />
                                {((id === "game-chat" && chatUnread.game) ||
                                    (id === "room-chat" && chatUnread.room)) &&
                                pane !== id ? (
                                    <span className="Kibitz-pane-unread" />
                                ) : null}
                            </span>
                        }
                        title={PANE_TITLES[id]()}
                        active={pane === id}
                        onClick={() => selectPane(id)}
                    />
                ))}

            {!isPortrait && (
                <GobanView.Tab
                    id="kibitz-people"
                    type="action"
                    align="center"
                    icon="users"
                    title={peopleLabel()}
                    active={showPeople}
                    onClick={togglePeople}
                />
            )}

            {props.onCreateVariation && (
                <GobanView.Tab
                    id="kibitz-new-variation"
                    type="action"
                    align="center"
                    icon="sitemap"
                    title={pgettext("Action that starts a new Kibitz variation", "New variation")}
                    active={isPortrait ? pane === "analysis" : gobans.centerMode === "draft"}
                    disabled={!gobans.main}
                    onClick={() => {
                        // Pressing it again on the pane it opened leaves the draft.
                        // Reaching the pane from elsewhere only switches: a draft
                        // is not discarded by navigation.
                        if (gobans.centerMode === "draft") {
                            if (!isPortrait || pane === "analysis") {
                                onExitVariation();
                            } else {
                                selectPane("analysis");
                            }
                            return;
                        }
                        if (isPortrait && viewingOther) {
                            selectPane("analysis");
                            return;
                        }
                        props.onCreateVariation?.();
                    }}
                />
            )}

            {!viewingOther && behindLive && (
                <GobanView.Tab
                    id="kibitz-return-to-live"
                    type="action"
                    align="right"
                    icon="forward"
                    title={pgettext(
                        "Action that jumps a Kibitz board to the latest move",
                        "Return to live",
                    )}
                    onClick={props.onReturnToLive}
                />
            )}

            <GobanView.Tab
                id="kibitz-more"
                type="action"
                align="right"
                icon="ellipsis-h"
                title={_("More actions")}
                onClick={(event) => {
                    if (!event) {
                        return;
                    }
                    const anchor = event.currentTarget;
                    moreActionsPopoverRef.current?.close();
                    moreActionsPopoverRef.current = openKibitzMoreActions(
                        anchor,
                        gobans.main,
                        roomActions(anchor),
                    );
                }}
            />
        </GobanView>
    );
}
