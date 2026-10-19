/**
 * Copyright 2026 Franja (Frank) Povazanj
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Deterministic serialization for the cross-repo command catalog contract.
 *
 * The hash covers the canonical `commands` array, not the pretty-printed file.
 * The MCP package recomputes the same hash from its generated module, and a
 * scheduled upstream check compares it with the committed contract.
 */

import { createHash } from 'node:crypto'
import type { CommandCatalogEntry } from './commandCatalog'

export const COMMAND_CATALOG_SCHEMA_VERSION = 1

export interface CommandCatalogContract {
  schemaVersion: number
  catalogHash: string
  commands: CommandCatalogEntry[]
}

/** Pick fields in a fixed order so the hash and the committed file are stable. */
function toContractEntry(entry: CommandCatalogEntry): CommandCatalogEntry {
  return {
    id: entry.id,
    labelKey: entry.labelKey,
    label: entry.label,
    group: entry.group,
    keywords: [...entry.keywords],
    ...(entry.shortcut !== undefined ? { shortcut: entry.shortcut } : {}),
    effect: entry.effect,
  }
}

export function canonicalCommandCatalog(
  entries: readonly CommandCatalogEntry[],
): CommandCatalogEntry[] {
  return entries.map(toContractEntry)
}

/** sha256 over the canonical command array, including a `sha256:` prefix. */
export function computeCatalogHash(entries: readonly CommandCatalogEntry[]): string {
  const canonical = JSON.stringify(canonicalCommandCatalog(entries))
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`
}

/** Pretty, newline-terminated contract for `contracts/command-catalog.json`. */
export function serializeCommandCatalog(
  entries: readonly CommandCatalogEntry[],
): string {
  const contract: CommandCatalogContract = {
    schemaVersion: COMMAND_CATALOG_SCHEMA_VERSION,
    catalogHash: computeCatalogHash(entries),
    commands: canonicalCommandCatalog(entries),
  }
  return `${JSON.stringify(contract, null, 2)}\n`
}
