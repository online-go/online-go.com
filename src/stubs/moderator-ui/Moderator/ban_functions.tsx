/*
 * Copyright (C)  Online-Go.com
 */

export function ban(_player_id: number): Promise<void> | undefined {
    return undefined;
}

export function shadowban(_player_id: number): Promise<void> {
    return Promise.resolve();
}

export function remove_ban(_player_id: number): Promise<void> {
    return Promise.resolve();
}

export function remove_shadowban(_player_id: number): Promise<void> {
    return Promise.resolve();
}
