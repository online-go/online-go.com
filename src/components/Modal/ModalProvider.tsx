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

/* cspell: words groupadmin cotsen */
import * as React from "react";

import { ChallengeModal, ChallengeModes } from "../ChallengeModal";
import { createPortal } from "react-dom";
import { LanguagePickerModal } from "../LanguagePicker";
import { ForkModal } from "../ChallengeModal/ForkModal";
import { GobanRenderer } from "goban";

type ModalProviderType = {
    showModal: (type: ModalTypes, props?: ModalTypesProps) => void;
    hideModal: () => void;
};

export enum ModalTypes {
    Challenge = "challenge",
    LanguagePicker = "languagePicker",
    Fork = "fork",
}

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

export const ModalContext = React.createContext({} as ModalProviderType);
const { Provider, Consumer } = ModalContext;

export const ModalConsumer = Consumer;

export const ModalProvider = ({ children }: React.PropsWithChildren): JSX.Element => {
    const [modalType, setModalType] = React.useState(null as ModalTypes | null);
    const [modalProps, setModalProps] = React.useState({} as ModalTypesProps);

    const showModal = (type: ModalTypes, props?: ModalTypesProps) => {
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
        <Provider value={{ showModal, hideModal }}>
            {modalType &&
                createPortal(
                    <div className="Modal-container">
                        {modalType === ModalTypes.Challenge && (
                            <ChallengeModal
                                {...(modalProps as Modals["challenge"])}
                                onClose={hideModal}
                            />
                        )}
                        {modalType === ModalTypes.LanguagePicker && <LanguagePickerModal />}
                        {modalType === ModalTypes.Fork && (
                            <ForkModal {...(modalProps as Modals["fork"])} />
                        )}
                    </div>,
                    document.body,
                )}
            {children}
        </Provider>
    );
};
