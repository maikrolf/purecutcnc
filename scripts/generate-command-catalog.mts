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

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMMAND_CATALOG } from '../src/commands/commandCatalog'
import { serializeCommandCatalog } from '../src/commands/serializeCommandCatalog'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const defaultOut = resolve(repoRoot, 'contracts/command-catalog.json')
const args = process.argv.slice(2)
const check = args.includes('--check')
const outIndex = args.indexOf('--out')
const out = outIndex >= 0 && args[outIndex + 1]
  ? resolve(process.cwd(), args[outIndex + 1])
  : defaultOut

const expected = serializeCommandCatalog(COMMAND_CATALOG)

if (check) {
  let actual = ''
  try {
    actual = readFileSync(out, 'utf8')
  } catch {
    console.error(`Command catalog is missing: ${out}`)
    process.exit(1)
  }
  if (actual !== expected) {
    console.error(
      `Command catalog is stale: ${out}\n`
      + 'Run `npx tsx scripts/generate-command-catalog.mts` and commit the result.',
    )
    process.exit(1)
  }
  console.log(`Command catalog is up to date: ${out}`)
} else {
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, expected)
  console.log(`Wrote ${out}`)
}
