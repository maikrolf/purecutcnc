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

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  COMMAND_CATALOG,
  getCommandCatalogEntry,
  type CommandCatalogEntry,
} from './commandCatalog'
import {
  COMMAND_CATALOG_SCHEMA_VERSION,
  computeCatalogHash,
  serializeCommandCatalog,
} from './serializeCommandCatalog'

const contractPath = fileURLToPath(
  new URL('../../contracts/command-catalog.json', import.meta.url),
)
const contractText = readFileSync(contractPath, 'utf8')
const contract = JSON.parse(contractText) as {
  schemaVersion: number
  catalogHash: string
  commands: Array<Record<string, unknown>>
}

assert.equal(
  contractText,
  serializeCommandCatalog(COMMAND_CATALOG),
  'contracts/command-catalog.json is stale; run npx tsx scripts/generate-command-catalog.mts',
)
assert.equal(contract.schemaVersion, COMMAND_CATALOG_SCHEMA_VERSION)
assert.equal(contract.catalogHash, computeCatalogHash(COMMAND_CATALOG))
assert.equal(contract.commands.length, COMMAND_CATALOG.length)

const ids = new Set<string>()
const shortcuts = new Map<string, string>()
const catalog: readonly CommandCatalogEntry[] = COMMAND_CATALOG

for (const command of catalog) {
  assert.ok(command.id.length > 0, 'command id must not be empty')
  assert.ok(command.label.length > 0, `${command.id} must have a label`)
  assert.ok(command.labelKey.length > 0, `${command.id} must have a label key`)
  assert.ok(
    ['file', 'sketch', 'create', 'view'].includes(command.group),
    `${command.id} has an unsupported group`,
  )
  assert.ok(
    ['read', 'edit', 'destructive'].includes(command.effect),
    `${command.id} has an unsupported effect`,
  )
  assert.ok(!ids.has(command.id), `duplicate command id: ${command.id}`)
  ids.add(command.id)
  assert.equal(getCommandCatalogEntry(command.id), command)

  if (command.shortcut) {
    const previous = shortcuts.get(command.shortcut)
    assert.equal(previous, undefined, `${command.shortcut} is assigned to ${previous} and ${command.id}`)
    shortcuts.set(command.shortcut, command.id)
  }
}

assert.throws(() => getCommandCatalogEntry('missing.command'))

for (const command of contract.commands) {
  assert.equal('run' in command, false, `${String(command.id)} must not serialize a handler`)
  assert.equal('enabled' in command, false, `${String(command.id)} must not serialize runtime state`)
  assert.equal('active' in command, false, `${String(command.id)} must not serialize runtime state`)
}
