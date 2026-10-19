# INDEX — src/commands/

Shared command-model hooks and pure derivation helpers used by desktop and tablet command surfaces.

## Files
- `commandRegistry.ts` — framework-free `CommandSpec` contract, token search, serializable `listCommands` projection, duplicate-id guard, and guarded `run` results. Shared by the palette today and a future bridge.
- `commandCatalog.ts` — pure metadata source for the palette and the generated MCP contract: ids, label keys, representative English labels, groups, keywords, shortcuts and effects. No React, i18n runtime or store.
- `serializeCommandCatalog.ts` — deterministic contract serialization and sha256 hash over the canonical command array.
- `useAppCommands.ts` — adapter that joins the existing file, sketch and creation descriptors with `commandCatalog` metadata by id; also exposes the view command. It does not own command semantics.
- `sketchCommands.ts` — unified store-backed predicates and command descriptors for feature transforms (including one-shot feature distribution), boolean actions, arrange tools, sketch-edit tools, constraints, and measure/dimension tools.
- `creationShapes.ts` — single creation shape option list plus placement/text command descriptors.
- `fileCommands.ts` — shared file/history command descriptors for new/open/import/export/print/save/undo/redo.

## Tests
- `commandCatalog.test.ts` — contract byte-equality, hash, unique ids/shortcuts, enum validity and serialization safety.
- `commandRegistry.test.ts` — search ordering, metadata projection, duplicate ids, and guarded run outcomes.
- `sketchCommands.test.ts` — DOM-free predicate and active/disabled derivation coverage.
