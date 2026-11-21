# Plan: Kibitz rooms on demo boards

Spec: `docs/superpowers/specs/2026-11-21-kibitz-demo-boards-design.md`.
Issue: online-go/online-go.com#3899.

Two pull requests. Branch `kibitz-demo-boards` in both `ogs` and `ogs-ui`.

## 1. `ogs` (backend)

1. Model: `KibitzRoom.current_review` (nullable FK to `go_app.Review`,
   `related_name="+"`, `SET_NULL`) and a check constraint
   `kibitzroom_one_board`: not both `current_game` and `current_review`.
2. Migration `0009_kibitzroom_current_review` (0009 is free on
   `origin/main` as of 2026-11-21). Apply to the local stack.
3. `views.py`:
    - `_validate_review_for_room`: integer id, exists (404), not private (403).
    - `_board_from_request(data, game_key, review_key)`: exactly one of the
      two keys (400 for none or both), returns `(game, review, error)`.
    - `KibitzRoomList.post`: `source_game_id` or `source_review_id`.
    - `KibitzRoomChangeBoard.post`: `game_id` or `review_id`; a review on a
      broadcast room is a 403; saving one clears the other.
    - `KibitzRoomList.get`: `?review=<id>`; `game` and `review` together is a 400.
    - `KibitzRoomDetail.get`: the active-player block only runs for a game.
    - One shared `_room_queryset()` with the `select_related` list, now
      including the review and its players.
    - Demo boards' sizes come from Scylla: prime them for each list with
      `prime_review_gamedata` before serialising.
4. `serializers.py`: `current_review_id`, `current_review`, `mode`.
   Name-only players for demo boards (`id: 0`).
5. Tests in `ogs/api/views/kibitz_rooms_test.py` (request-level, mocked);
   serializer-block tests beside them.
6. `make lint`, `make pytest` (stack up).

## 2. `ogs-ui` (frontend)

1. Types and `kibitzBoardRef.ts` helpers.
2. Board-ref refactor, no behaviour change: everything grouping by
   `game_id` groups by board ref. Own commit. Jest green.
3. Controller/hydration: read `current_review`, `mode`; variation bodies
   with `review_id` and `from_path`.
4. `useKibitzGobans`: main controller with `review_id`; whole-tree snapshot
   for review rooms; anchor by `from_path`, root replay fallback.
5. Connection keeper for `review/connect`.
6. Room chrome: Board tab, player cards and thin header for name-only
   players, header outcome, More actions entries, thumbnail.
7. Picker: Demo board source (my reviews, id/URL), `parseGameId` review
   parser.
8. Proposals: games only.
9. Room cards and room list labels.
10. Telemetry `mode` (and `ogs/docs/kibitz-telemetry.md`).
11. `docs/kibitz.md`: Demo boards section.
12. Jest tests per the spec; one e2e.
13. `yarn type-check`, `yarn lint`, prettier on changed files, `yarn build`
    before push.

## Status

- [x] Spec
- [x] Plan
- [ ] `ogs` backend
- [ ] `ogs-ui` frontend
