# Architecture — Straight Truth (ChefScript rebuild)

Purpose of this file: record the shape decisions made up front so any future instance (or future-you) reads the plan, not reverse-engineers it.

---

## Stack

- **Framework:** ChefScript (custom, this repo, in `engine/`). JSON atoms → Go engine → HTML in WebView2.
- **Data:** bbolt, single-file, self-contained. No MongoDB dependency for binary data. (Sessions still on mongo as of this writing; future cleanup.)
- **UI vocabulary:** ChefScript atoms (MUI-derived via `tokens.go` + variant CSS). Match the old React app's look through atom composition.
- **JS runtime:** Split into `engine/js/core_*.js`, assembled via `go:embed` into one IIFE in `engine/runtime.go`. App-specific JS is one file per feature.

## Data pipeline

```
source JSON  →  cmd/seed{name}/main.go  →  schemas/binary/{name}.json  →  bbolt  →  action handler  →  client state cache  →  UI
```

- Each catalog / data type gets its own binary schema in `schemas/binary/`.
- Each catalog gets a seed CLI in `cmd/seed{name}/` that reads the source JSON and inserts via `BinaryInsertMany`.
- Each catalog gets an action handler in `app.go` (or `engine/actions_*.go`) that fetches + returns it.

## Retrieval is fast — budget, not bottleneck

Measured on `cmd/binarybench` (32,183 synthetic records, bbolt, local disk):

| Operation | Records | Time |
|---|---|---|
| Indexed find (book+chapter) | 22 | ~650µs |
| Indexed find (single book) | 1,279 | ~1.2ms |
| Full scan + decode all | 32,183 | ~18ms |
| Hot repeat (page cache warm) | 22 | ~0µs |

**Implication:** network round-trip + binary query + render = <20ms. Any user interaction can be server-mediated without feeling slow. Do not build sophisticated JS-side caching/batching to avoid server calls — the server call is fast enough.

## Cache once, reuse free

Client holds a global cache: `window.__bible.{type}`. Lifecycle:

1. First open of a column type → JS checks cache → miss → POST → server returns decoded data → cached + rendered.
2. Close + reopen same type → cache hit → instant.
3. In-column interactions (filter, expand, sort, search within the catalog) operate entirely on cached state. No server touch.
4. State-changing writes (add to notes, future) POST through an action handler.

Over a typical session: one round trip per distinct column type opened (usually single digits), everything else client-only.

## UI pattern: each column type is a Go component

For the ~23 column types in the Add Column dropdown:

- One Go file per column: `engine/components_bible_{type}.go` with a `renderBible{Type}` function.
- Each takes the catalog data as a prop and returns HTML using ChefScript atoms (card, row, col, list, accordion, etc.).
- Scoped CSS per component via a `{type}CSS()` function, appended to the stylesheet.
- Each column type is registered in `RegisterApp()` (app.go) so the engine can compose it into page JSON or render via action.

## Interaction pattern

- **Adding a column:** JS sends `csPost('column/add', {type})`. Handler decides whether data is cached (client announces what it has) or fetches from bbolt, returns a DOM patch. JS inserts the new column node into the workspace.
- **Closing / reordering columns:** pure JS. No server involvement.
- **Clicking a verse / Strong's word / cross-ref indicator:** either a pure state mutation (select a verse → rerender the passage column's selected state via csState) or a POST if new data is needed.
- **csState** used for per-column UI state that re-renders cheaply: selected verse, highlighted Strong's, expanded accordion items.

## Rebuild order

1. **Shell first** — `pages/home.json` with the workspace + header atoms. No data, no columns. Verify styling matches React app's look.
2. **Seed + schema + component for the simplest catalog** — Miracles (~40 entries, flat structure). This establishes the full pattern end-to-end.
3. **Replicate** for each remaining catalog (Parables, Prayers, Names of God, etc.).
4. **Passage column last** — depends on Verses + Strong's + cross-refs; the most interactive piece. Verse render, interlinear toggle, entity icons, cross-ref indicator.
5. **Search / Strong's column** — depend on same data as Passage, built after.

## What NOT to do (learned from previous instance)

- Do not build a 1900-line client-side string-render engine (`bible.js` in the earlier attempt). Atoms + Go components + per-column action handlers is the idiom.
- Do not lazy-load fearfully. The data is small and fast. Cache at the column level; fetch the whole catalog at once.
- Do not bypass atoms. Use `card`, `row`, `col`, `list`, etc. That's how MUI styling comes for free.
- Do not bundle everything into `app.go`. Split registrations per file.

## Open threads (future)

- Sessions on mongo — move to bbolt for fully self-contained `.db`.
- `engine/components.go` had references to deleted ChefScript atoms (`renderFab`, `renderPaper`, etc.) — those registrations were stripped. If the atoms need to come back, re-create them.
- `modernc.org/sqlite` is an unused indirect dep — could be cleaned up.
