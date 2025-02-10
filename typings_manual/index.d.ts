/// <reference path="js-noise.d.ts" />

interface Window {
    global_goban?: import("goban").GobanRenderer | null;
    // TODO: dedupe with global_goban
    goban?: import("goban").GobanRenderer | null;

    // Set in index.html
    cdn_service: string;
    default_theme: string;
    ogs_release: string;
    ogs_current_language: string;

    // Set by translation files
    ogs_locales: Record<string, Record<string, Array<string>>>;
    ogs_countries: Record<string, Record<string, string>>;

    // Set by gulp
    websocket_host: string;

    // set in main.tsx
    user: unknown;
    data: unknown;
    preferences: unknown;
    player_cache: unknown;
    requests: unknown;

    debug: unknown; // debug.ts
    socket: unknown; // socket.ts

    // These seem to be part of some very specific debugging.  Can any be removed?
    mini_goban?: import("goban").GobanRenderer; // MiniGoban
    dup: Function; // TournamentRecord.tsx
    rounds?: unknown; // Tournament.tsx
    players?: unknown; // Tournament.tsx
    tournament?: unknown; // Tournament.tsx
    file?: unknown; // image_resizer.ts
    browserHistory: unknown; // ogsHistory.ts
    report_manager: unknown; // report_manager.ts
    sfx: unknown; // sfx.ts
    sprite_packs: unknown; // sfx.ts
    swal: unknown; // swal.ts
    toast: (element: import("react").ReactElement<any>, timeout?: number) => import("../src/lib/toast").Toast; // toast.tsx
    aireview?: unknown; // AIReview.tsx
    stripe?: unknown; // Supporter.tsx
    Md5: unknown; // SignIn.tsx
    Game?: null; // Game.tsx
    GobanThemes: unknown; // configure-goban.ts
    GobanEngine: unknown; // configure-goban.ts
    skew_clock: Function; // misc.ts
    notification_manager?: unknown; // NotificationManager.tsx
    test_sentry: Function; // ErrorBoundary.tsx
    proxy?: unknown; // ChatUserList.tsx

    safari?: unknown;

    available_human_matches_list: { [uuid: string]: any };
}
