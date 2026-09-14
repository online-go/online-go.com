# React data subscriptions

`useData(key, defaultValue)` reads the shared `data` store through React's
external-store subscription contract. Mounting, rendering, and receiving a store
notification do not write back a render snapshot. This preserves updates that
arrive between render and subscription, including account suspension messages.

The returned setter writes to the store explicitly. Functional updates read the
current store value, so consecutive updates from different mounted consumers
compose in call order. Readers observe changes and removals; a provided default
is the read fallback when no value exists. It is stored only when explicitly set.
Changing the key changes the subscription, and unmounting removes it.

`hooks.test.ts` uses the real data store and React layout effects to deliver an
update before passive effects subscribe. It also covers updates during commit,
multiple consumers, functional setters, removal, default values, key changes,
and StrictMode cleanup. These tests require no network or real-time delays.
