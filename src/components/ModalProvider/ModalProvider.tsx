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

import { ChallengeModes } from "../ChallengeModal";
import { createPortal } from "react-dom";
import { GobanRenderer } from "goban";
import { ModalContext } from "./ModalContext";
import { ModalTypes } from "./ModalTypes";
import { modalRegistry } from "./ModalRegistry";

interface Modals {
    challenge: {
        mode: ChallengeModes;
        playerId?: number;
        initialState: any;
    };
    fork: {
        goban: GobanRenderer;
    };
}

type ModalTypesProps = {
    [key: string]: any;
};

export const ModalProvider = ({ children }: React.PropsWithChildren): JSX.Element => {
    const [modalType, setModalType] = React.useState(null as ModalTypes | null);
    const [modalProps, setModalProps] = React.useState({} as ModalTypesProps);

    const showModal = (type: ModalTypes, props?: any) => {
        setModalType(type);

        switch (type) {
            case ModalTypes.Challenge:
                setModalProps({
                    mode: "computer" as ChallengeModes,
                    initialState: null,
                    playerId: undefined,
                });
                break;
            case ModalTypes.Fork:
                setModalProps({
                    goban: (props as Modals["fork"]).goban,
                });
                break;
            case ModalTypes.GameLog:
                setModalProps({
                    config: props.config,
                    markCoords: props.markCoords,
                    black: props.black,
                    white: props.white,
                });
                break;
            default:
                break;
        }
    };

    const hideModal = () => {
        setModalType(null);
    };

    React.useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && modalType) {
                hideModal();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [modalType, hideModal]);

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {modalType &&
                createPortal(
                    <div className="Modal-container">
                        {React.createElement(modalRegistry[modalType], {
                            ...modalProps,
                            onClose: hideModal,
                        })}
                    </div>,
                    document.body,
                )}
            {children}
        </ModalContext.Provider>
    );
};
