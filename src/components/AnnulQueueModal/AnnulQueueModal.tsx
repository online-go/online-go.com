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
import { _ } from "translate";
import { openModal } from "Modal";
import { MiniGoban } from "MiniGoban";
import { Goban } from "goban";
import { AIReview, GameTimings, ChatMode, GameChat, GobanContext } from "Game";
import { Player } from "Player";
import { Resizable } from "Resizable";
// import { post } from "requests";

interface AnnulQueueModalProps {
    annulQueue: any[];
    setSelectModeActive: React.Dispatch<boolean>;
    setAnnulQueue: React.Dispatch<any[]>;
}

export function AnnulQueueModal({
    annulQueue,
    setSelectModeActive,
    setAnnulQueue,
}: AnnulQueueModalProps) {
    const [selectedGameIndex, setSelectedGameIndex] = React.useState(0);
    const [goban, setGoban] = React.useState<Goban | null>(null);
    const [selectedChatLog, setSelectedChatLog] = React.useState<ChatMode>("main");
    const onGobanCreated = React.useCallback((goban: Goban) => {
        setGoban(goban);
    }, []);
    const [, setAiReviewUuid] = React.useState<string | null>(null);
    const [dequeueRequested, setDequeueRequested] = React.useState(false);
    const [queue, setQueue] = React.useState<any[]>(annulQueue);
    const [debounceTimer, setDebounceTimer] = React.useState<number | null>(null);

    const currentGame = queue[selectedGameIndex];

    const container = document.getElementsByClassName("Modal-container")[0];

    const DEBOUNCE_DURATION = 300;

    const winner =
        goban?.engine?.winner &&
        (goban.engine.winner === goban.engine.config.black_player_id ? "Black" : "White");

    const closeModal = () => {
        container.parentNode?.removeChild(container);
    };

    const onClose = () => {
        setAnnulQueue([]);
        setSelectModeActive(false);
        closeModal();
    };

    const goToPreviousGame = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        setDebounceTimer(
            window.setTimeout(() => {
                if (selectedGameIndex > 0) {
                    setSelectedGameIndex(selectedGameIndex - 1);
                }
            }, DEBOUNCE_DURATION),
        );
    };

    const goToNextGame = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        setDebounceTimer(
            window.setTimeout(() => {
                if (selectedGameIndex < queue.length - 1) {
                    setSelectedGameIndex(selectedGameIndex + 1);
                }
            }, DEBOUNCE_DURATION),
        );
    };

    const dequeueGame = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        setDebounceTimer(
            window.setTimeout(() => {
                setDequeueRequested(true);
            }, DEBOUNCE_DURATION),
        );
    };

    // Close modal if no games left after dequeue
    React.useEffect(() => {
        if (queue.length === 0) {
            onClose();
        }
    }, [queue]);

    React.useEffect(() => {
        setQueue(annulQueue);
    }, [annulQueue]);

    React.useEffect(() => {
        if (dequeueRequested) {
            // Remove the selected game from the queue
            const newQueue = queue.filter((_, index) => index !== selectedGameIndex);
            setQueue(newQueue);
            setDequeueRequested(false); // Reset the dequeue request

            // Update the selected game index after dequeuing the highest indexed game
            if (selectedGameIndex === newQueue.length) {
                setSelectedGameIndex(selectedGameIndex - 1);
            }
        }
    }, [queue, dequeueRequested, selectedGameIndex]);

    function getSanitizedGameIds(games) {
        return games
            .filter((game) => game.ranked === true && game.annulled === false)
            .map((game) => game.id);
    }

    const sanitizedGameIds = getSanitizedGameIds(queue);

    const promptForModerationNote = () => {
        let moderation_note: string | null = null;
        do {
            moderation_note = prompt(
                `Annulling ${sanitizedGameIds.length} of ${currentGame.player.username}'s games. \n\n$PLAYER will include link for ${currentGame.player.username}. \n\nModerator note:`,
            );

            if (moderation_note == null) {
                return null;
            }
            moderation_note = moderation_note
                .trim()
                .replace(/\$PLAYER/i, `player ${currentGame.player.id}`);
        } while (moderation_note === "");
        return moderation_note;
    };

    const annul = (sanitizedGameIds: number[], moderation_note: string) => {
        console.log("/moderation/mass_annul", {
            games: sanitizedGameIds,
            annul: true,
            moderation_note: moderation_note,
        });
    };

    return (
        <div className="Modal AnnulQueueModal">
            <div className="header">
                <h3>Mass Annulment Queue </h3>
                <span className="count">{queue.length} Games in Queue</span>
            </div>
            <div className="body">
                <div className="game-list">
                    <ul>
                        {queue.map((game, index) => (
                            <li
                                className={`${selectedGameIndex === index ? "selected" : ""} ${
                                    !game.ranked || game.annulled ? "strikethrough" : ""
                                }`}
                                key={game.id}
                                onClick={() => setSelectedGameIndex(index)}
                            >
                                {game.id}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="game-container">
                    <div className="game">
                        {queue[selectedGameIndex] && (
                            <MiniGoban
                                key={selectedGameIndex}
                                id={queue[selectedGameIndex].id}
                                noLink={true}
                                onGobanCreated={onGobanCreated}
                                chat={true}
                            />
                        )}

                        {goban && goban.engine && currentGame && (
                            <GobanContext.Provider value={goban}>
                                <div className="col">
                                    <div>
                                        Black: <Player user={queue[selectedGameIndex]?.black} />
                                    </div>
                                    <div>
                                        White: <Player user={queue[selectedGameIndex]?.white} />
                                    </div>
                                    <div>
                                        Game Outcome: {winner} (
                                        <Player user={goban?.engine?.winner as number} />) by{" "}
                                        {goban.engine.outcome}{" "}
                                    </div>

                                    <AIReview
                                        onAIReviewSelected={(r) => setAiReviewUuid(r?.uuid)}
                                        game_id={currentGame.id}
                                        move={goban.engine.cur_move}
                                        hidden={false}
                                    />

                                    {goban && (
                                        <Resizable
                                            id="move-tree-container"
                                            className="vertically-resizable"
                                            ref={(ref) =>
                                                goban && goban.setMoveTreeContainer(ref?.div)
                                            }
                                        />
                                    )}
                                </div>

                                <div className="col">
                                    <GameTimings
                                        moves={goban.engine.config.moves}
                                        start_time={goban.engine.config.start_time}
                                        end_time={goban.engine.config.end_time}
                                        free_handicap_placement={
                                            goban.engine.config.free_handicap_placement
                                        }
                                        handicap={goban.engine.config.handicap}
                                        black_id={goban.engine.config.black_player_id}
                                        white_id={goban.engine.config.white_player_id}
                                    />
                                </div>

                                <div className="col">
                                    <GameChat
                                        selected_chat_log={selectedChatLog}
                                        onSelectedChatModeChange={setSelectedChatLog}
                                        channel={`game-${currentGame.id}`}
                                        game_id={currentGame.id}
                                    />
                                </div>
                            </GobanContext.Provider>
                        )}
                    </div>
                </div>

                <div className="button-bar">
                    <div className="actions">
                        <button className="dequeue-btn" onClick={dequeueGame}>
                            Dequeue
                        </button>
                        <button
                            className="annul-btn"
                            disabled={sanitizedGameIds.length === 0}
                            onClick={() => {
                                const note = promptForModerationNote();
                                if (note) {
                                    annul(getSanitizedGameIds(queue), note);
                                }
                            }}
                        >{`Annul Games(${sanitizedGameIds.length})`}</button>
                    </div>
                    <div className="gamelist-nav">
                        <button onClick={goToPreviousGame}>Previous</button>
                        <span>{`${selectedGameIndex + 1} of ${queue.length}`}</span>
                        <button onClick={goToNextGame}>Next</button>
                    </div>
                    <div className="close">
                        <button className="close-btn" onClick={() => onClose()}>
                            {_("Close")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function openAnnulQueueModal(annulQueue, setSelectModeActive, setAnnulQueue) {
    return openModal(
        <AnnulQueueModal
            setSelectModeActive={setSelectModeActive}
            annulQueue={annulQueue}
            setAnnulQueue={setAnnulQueue}
        />,
    );
}
