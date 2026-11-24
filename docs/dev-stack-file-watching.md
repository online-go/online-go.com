# Dev stack file watching

The local dev stack serves this checkout from the `ogs_ui_1` container, which
bind-mounts it at `/ogs-ui`. Inside the container, `vite-plugin-checker` runs
TypeScript in watch mode and shows its errors in the browser overlay.

## Why the checker goes stale

On Docker Desktop for Mac the bind mount does not pass on every change made on
the host:

- Deletions often produce no event, for the file or for its directory.
- A directory's modification time, seen from the container, does not change
  when a file in it is deleted. Polling the directory therefore sees nothing
  either.
- A watch on a single file stops, silently, once the file is replaced, which
  is how `git checkout` writes a changed file.

TypeScript learns which files belong to the program from directory changes,
and when a file changed from its watch on that file. After a branch switch it
can go on checking files that no longer exist ("File ... not found") and old
copies of files that changed, and show errors that are not in the code. No
TypeScript watch option avoids this. Restarting the checker reads everything
afresh.

## The hook

`.husky/post-checkout` (on a branch switch) and `.husky/post-merge` (on a pull
or merge) run `.husky/restart-dev-ui`. It restarts `ogs_ui_1` in the
background when that container is running and serves this checkout through
Docker Desktop for Mac's file sharing, which reports the mount under
`/host_mnt`. That is the only setup where the problem is confirmed. Native
Docker on Linux shares the host's filesystem directly, so there the hook does
nothing. It also does nothing when Docker is not installed, when the container
serves another checkout such as a worktree, or on the e2e server, whose test
runner switches branches while it owns the stack. The restart takes a few
seconds; the overlay then shows the result of a fresh check.

The hooks run only once husky is set up in the clone (`npx husky`, see
CONTRIBUTING.md). Without it, restart the container by hand after switching
branches: `docker restart ogs_ui_1`.
