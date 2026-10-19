#!/usr/bin/env bash
# Fails when a pull request puts images into the repository history only to
# show them in review. Screenshots belong in the pull request body as pasted
# attachments or external links.
#
# Usage: check-pr-images.sh <base> <head> < pr-body
#
# The body may not reference an image that any commit in <base>..<head> adds.
# An image that a later commit deletes still counts: merge commits keep it in
# history.
set -euo pipefail

base=$1
head=$2
body=$(cat)
ext_re='\.(png|jpe?g|gif|webp)'
failed=0

added=$(git -c core.quotepath=off log --diff-filter=A --name-only --format= "$base..$head" \
    | grep -iE "$ext_re\$" | sort -u || true)

refs=$(grep -oiE "[^][[:space:]()<>\"'\`]+$ext_re([?#][^][[:space:]()<>\"'\`]*)?" <<< "$body" || true)

while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    ref=${ref%%[?#]*}
    ref=$(printf '%b' "${ref//%/\\x}")
    while IFS= read -r path; do
        [ -n "$path" ] || continue
        if [[ "$ref" == "$path" || "$ref" == */"$path" ]]; then
            echo "::error::The pull request body references an image that this pull request commits: $path"
            failed=1
        fi
    done <<< "$added"
done <<< "$refs"

if [ "$failed" = 1 ]; then
    echo "Remove these images from the branch history and paste screenshots into the pull request body instead."
fi
exit "$failed"
