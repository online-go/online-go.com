# Kibitz annotation-only implementation

1. Add shared analysis-content validation and cover empty and annotated payloads.
2. Use it for outgoing posts, incoming room messages and variation rendering.
3. Open zero-move posts at their official anchor and apply selected marks only.
4. Extend draft change tracking to annotations on existing nodes.
5. Add regression tests and document the contract in `docs/kibitz.md`.
6. Format modified files, run focused tests, type checking, lint and one build.

Do not open a pull request. No backend source is present in this workspace;
report the live server round-trip check as unverified if no session is available.
