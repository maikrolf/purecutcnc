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
 * Ornament generator tests.
 *
 * The load-bearing property: every name outline lands inside the disc, so the
 * nesting rule reads them as cuts in the material rather than as floating
 * islands outside it.
 *
 * Run with: npx tsx src/cannedShapes/generators/ornament.test.ts
 */

import { sampleProfilePoints } from '../../types/project'
import {
  ORNAMENT_CANNED_KIND,
  normalizeOrnamentCannedParams,
  ornamentCannedShape,
  ornamentProfiles,
} from './ornament'
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

const params = { text: 'Emma', size: 6, radius: 30 }

test('normalizes a usable ornament', () => {
  const normalized = normalizeOrnamentCannedParams(params)
  assert(normalized, 'a complete parameter set is accepted')
})

test('refuses a name that would reach past the rim', () => {
  assert(normalizeOrnamentCannedParams({ ...params, size: 60 }) === null, 'oversized text is refused')
})

test('refuses a blank name', () => {
  assert(normalizeOrnamentCannedParams({ ...params, text: '' }) === null, 'empty text is refused')
})

test('draws the disc first and the name on the arc, inside the disc', () => {
  const profiles = ornamentProfiles(params)
  assert(profiles.length > 1, 'a disc plus at least one letter outline')
  const discPoints = sampleProfilePoints(profiles[0])
  const radius = Math.max(...discPoints.map((point) => Math.hypot(point.x, point.y)))
  for (const profile of profiles.slice(1)) {
    for (const point of sampleProfilePoints(profile)) {
      const distance = Math.hypot(point.x, point.y)
      assert(distance <= radius + 1e-6, 'every name point stays inside the disc')
      // Half the disc radius is well inside the text arc: a name re-centred on
      // its own bounding box lands across the middle instead of on the arc.
      assert(distance >= radius * 0.5, 'the name sits on the arc, not on the disc centre')
    }
  }
})

test('nests the name as a cut in the disc', () => {
  const shapes = resolveCannedShapeShapes({ operation: 'add', canned: { kind: ORNAMENT_CANNED_KIND, params } })
  assert(shapes[0].depth === 0 && shapes[0].operation === 'add', 'the disc is the material')
  assert(shapes.slice(1).some((shape) => shape.operation === 'subtract'), 'the name is a cut')
})

test('regenerates the same outlines from stored parameters', () => {
  assert(
    JSON.stringify(ornamentProfiles(params)) === JSON.stringify(ornamentProfiles(params)),
    'generation is deterministic',
  )
})

test('the registered generator names the same kind', () => {
  assert(ornamentCannedShape.kind === ORNAMENT_CANNED_KIND, 'registry key matches')
})

if (failCount > 0) {
  console.error(`\n${failCount} test(s) failed, ${passCount} passed`)
  process.exit(1)
}
console.log(`\n${passCount} ornament test(s) passed`)
