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
import { deepEqual } from "@/lib/misc";

type ModalProviderType = {
    showModal: (types: ModalTypes) => void;
    hideModal: () => void;
};

export enum ModalTypes {
    Challenge = "challenge",
}

interface Modals {
    challenge: {
        mode: ChallengeModes;
        playerId?: number;
        initialState: any;
    };
}

type Property<T, K extends keyof T> = T[K];

export const ModalContext = React.createContext({} as ModalProviderType);
const { Provider, Consumer } = ModalContext;

export const ModalConsumer = Consumer;

export const ModalProvider = ({ children }: React.PropsWithChildren): JSX.Element => {
    const [modal, setModal] = React.useState(false);
    const [props, setProps] = React.useState({} as Property<Modals, ModalTypes>);

    function showModal() {
        setModal(true);

        const payload = {
            mode: "computer" as ChallengeModes,
            initialState: null,
            playerId: undefined,
        };

        if (!deepEqual(props, payload)) {
            setProps(payload);
        }
    }

    function hideModal() {
        setModal(false);
    }
    return (
        <Provider value={{ showModal, hideModal }}>
            {modal &&
                createPortal(
                    <div className="Modal-container">
                        <ChallengeModal {...props} />
                    </div>,
                    document.body,
                )}
            {children}
        </Provider>
    );
};
