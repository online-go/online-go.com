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

import * as ChallengeModal from "./ChallengeModal";
import { fireEvent, render, screen } from "@testing-library/react";
import { ModalProvider } from "../ModalProvider/ModalProvider";
import { ModalContext, ModalTypes } from "@/components/ModalProvider";
import * as DynamicHelp from "react-dynamic-help";

jest.mock("./../Modal", () => {
    return {
        ...jest.requireActual("./../Modal"),
    };
});

describe("ChallengeModal", () => {
    it("should do a computer challenge via provider", () => {
        const challengeModalSpy = jest
            .spyOn(ChallengeModal, "ChallengeModal")
            .mockImplementation(jest.fn());

        render(
            <ModalProvider>
                <ModalContext.Consumer>
                    {({ showModal }) => {
                        showModal(ModalTypes.Challenge);
                        return null;
                    }}
                </ModalContext.Consumer>
            </ModalProvider>,
        );

        expect(challengeModalSpy.mock.calls[0][0]).toStrictEqual({
            mode: "computer",
            initialState: null,
            playerId: undefined,
        });

        challengeModalSpy.mockRestore();
    });

    it("should close", () => {
        const DynamicHelpProviderValue = {
            registerTargetItem: jest.fn().mockReturnValue({ ref: jest.fn() }),
            triggerFlow: jest.fn(),
            enableHelp: jest.fn(),
            getFlowInfo: jest.fn(),
            enableFlow: jest.fn(),
            reloadUserState: jest.fn(),
            signalUsed: jest.fn(),
            getSystemStatus: jest.fn(),
            resetHelp: jest.fn(),
        };

        render(
            <DynamicHelp.Api.Provider value={DynamicHelpProviderValue}>
                <ModalProvider>
                    <ModalContext.Consumer>
                        {({ showModal }) => {
                            showModal(ModalTypes.Challenge);
                            return null;
                        }}
                    </ModalContext.Consumer>
                </ModalProvider>
            </DynamicHelp.Api.Provider>,
        );
        const closeButton = screen.getByText("Close");
        expect(closeButton).toBeInTheDocument();
        fireEvent.click(closeButton);
        expect(closeButton).not.toBeInTheDocument();
    });
});
