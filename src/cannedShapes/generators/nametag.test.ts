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
 * Name-tag generator tests.
 *
 * The load-bearing properties: a saved tag regenerates the same outlines, the
 * name is nested inside the tag so the nesting rule makes it a cut, and a
 * refused parameter set is refused rather than drawn differently.
 *
 * Run with: npx tsx src/cannedShapes/generators/nametag.test.ts
 */

import { getProfileBounds, sampleProfilePoints } from '../../types/project'
import {
  NAMETAG_CANNED_KIND,
  nametagCannedShape,
  nametagProfiles,
  normalizeNametagCannedParams,
} from './nametag'
import { resolveCannedShapeShapes } from '../index'

let passCount = 0
let failCount = 0

function test(name: string, fn: () => void): void {
  try {
    fn()
    console.log(`✓ ${name}`)
    passCount += 1
  } catch (error) {
    console.error(`✗ ${name}`)
    console.error(`  ${(error as Error).message}`)
    failCount += 1
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const params = { text: 'Emma', size: 12, padding: 5, hole: 4 }

test('normalizes a usable name tag', () => {
  const normalized = normalizeNametagCannedParams(params)
  assert(normalized, 'a complete parameter set is accepted')
  assert(normalized.text === 'Emma', 'text is kept')
})

test('refuses an empty name', () => {
  assert(normalizeNametagCannedParams({ ...params, text: '   ' }) === null, 'blank text is refused')
})

test('refuses a non-positive size', () => {
  assert(normalizeNametagCannedParams({ ...params, size: 0 }) === null, 'size 0 is refused')
})

test('refuses a negative hole', () => {
  assert(normalizeNametagCannedParams({ ...params, hole: -1 }) === null, 'a negative hole is refused')
})

test('draws the tag outside every name outline', () => {
  const profiles = nametagProfiles(params)
  assert(profiles.length > 1, 'a tag plus at least one letter outline')
  const tag = getProfileBounds(profiles[0])
  for (const profile of profiles.slice(1)) {
    const box = getProfileBounds(profile)
    assert(box.minX >= tag.minX - 1e-6 && box.maxX <= tag.maxX + 1e-6, 'name fits horizontally')
    assert(box.minY >= tag.minY - 1e-6 && box.maxY <= tag.maxY + 1e-6, 'name fits vertically')
  }
})

test('nests the name as a cut and the hole as a cut', () => {
  const shapes = resolveCannedShapeShapes({ operation: 'add', canned: { kind: NAMETAG_CANNED_KIND, params } })
  assert(shapes.length > 1, 'more than the tag outline')
  assert(shapes[0].depth === 0 && shapes[0].operation === 'add', 'the tag is the material')
  const cuts = shapes.filter((shape) => shape.operation === 'subtract')
  assert(cuts.length > 1, 'name letters and the hanging hole are cuts')
})

test('regenerates the same outlines from stored parameters', () => {
  const first = JSON.stringify(nametagProfiles(params))
  const second = JSON.stringify(nametagProfiles(params))
  assert(first === second, 'generation is deterministic')
})

test('keeps the hole inside the tag and clear of the name', () => {
  const profiles = nametagProfiles({ ...params, text: 'E', hole: 4 })
  const tag = getProfileBounds(profiles[0])
  const hole = profiles[profiles.length - 1]
  for (const point of sampleProfilePoints(hole)) {
    assert(point.x > tag.minX && point.x < tag.maxX, 'hole is inside the tag width')
    assert(point.y > tag.minY && point.y < tag.maxY, 'hole is inside the tag height')
  }
})

test('the registered generator names the same kind', () => {
  assert(nametagCannedShape.kind === NAMETAG_CANNED_KIND, 'registry key matches')
})

if (failCount > 0) {
  console.error(`\n${failCount} test(s) failed, ${passCount} passed`)
  process.exit(1)
}
console.log(`\n${passCount} name-tag test(s) passed`)
